"""One reviewed still-image SAM access test; output cannot enable navigation."""

import argparse
import base64
import hashlib
import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

import cv2
import numpy as np


MODEL = "sam-3.1"
ENDPOINT = "https://api.meta.ai/v1/responses"
CONFIG_PATH = Path("config/vision.yaml")
CONFIG = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def require_preflight(key: str | None, reviewed: bool, credit: bool, concept: str) -> None:
    if not key:
        raise ValueError("MODEL_API_KEY must be set locally")
    if not reviewed:
        raise ValueError("Input must be reviewed and masked before upload")
    if not credit:
        raise ValueError("Meta Model API credits and payment status must be checked locally")
    if concept.strip() != "wooden door":
        raise ValueError("E05 concept must be the wood-door cue supported by the saved Spark receipt")
    if len(concept) > CONFIG["E05_SAM_CONCEPT_MAX_CHARS"]:
        raise ValueError("Concept is too long")


def build_payload(image_bytes: bytes, concept: str) -> dict:
    encoded = base64.b64encode(image_bytes).decode("ascii")
    return {"model": MODEL, "stream": True, "input": [{
        "type": "message", "role": "user", "content": [
            {"type": "input_text", "text": concept},
            {"type": "input_image", "image_url": f"data:image/png;base64,{encoded}"},
        ],
    }]}


def parse_events(stream_text: str) -> dict:
    deltas = []
    completed = None
    for line in stream_text.splitlines():
        if not line.startswith("data: ") or line == "data: [DONE]":
            continue
        try:
            event = json.loads(line[6:])
        except json.JSONDecodeError as error:
            raise ValueError("Malformed provider event") from error
        kind = event.get("type")
        if kind in ("response.failed", "error"):
            raise ValueError("Provider response failed")
        if kind == "response.output_text.delta":
            delta = event.get("delta")
            if not isinstance(delta, str):
                raise ValueError("Invalid segmentation delta")
            deltas.append(delta)
        if kind == "response.completed":
            completed = event.get("response")
    if not isinstance(completed, dict):
        raise ValueError("Provider stream never completed")
    if completed.get("model") != MODEL:
        raise ValueError("Provider reported an unexpected model")
    return {
        "provider_model": completed["model"],
        "provider_response_id": completed.get("id"),
        "usage": completed.get("usage"),
        "output_text": "".join(deltas),
        "navigationReady": False,
    }


def parse_image_boxes(output_text: str) -> list[dict]:
    """Validate SAM's still-image records without decoding private mask bytes."""
    output_text = output_text.strip()
    if not output_text:
        return []
    if not output_text.startswith("<0f>"):
        raise ValueError("Expected still-image frame zero")
    cursor = 4
    boxes = []
    pattern = re.compile(
        r"(\d+)<\|box;x1=(\d+);y1=(\d+);x2=(\d+);y2=(\d+);w=(\d+);h=(\d+)(?:;c=[0-9.]+)?\|>"
        r"<\|mask;x=0;y=0(?:;c=[0-9.]+)?;data=\d+,\d+,[~!].*?\|>", re.DOTALL
    )
    while cursor < len(output_text):
        match = pattern.match(output_text, cursor)
        if match is None:
            raise ValueError("Malformed box/mask record or missing paired mask")
        object_id, x1, y1, x2, y2, width, height = map(int, match.groups())
        if not (0 <= x1 < x2 <= width and 0 <= y1 < y2 <= height):
            raise ValueError("SAM box outside image bounds")
        boxes.append({"object_id": object_id, "box_px": [x1, y1, x2, y2], "image_px": [width, height]})
        cursor = match.end()
        if cursor < len(output_text):
            if output_text[cursor] != ",":
                raise ValueError("Unexpected content after mask record")
            cursor += 1
    if len({box["object_id"] for box in boxes}) != len(boxes):
        raise ValueError("Duplicate SAM object ID")
    return boxes


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True, type=Path)
    parser.add_argument("--concept", required=True)
    parser.add_argument("--reviewed-and-masked", action="store_true")
    parser.add_argument("--credit-confirmed", action="store_true")
    args = parser.parse_args()
    key = os.environ.get("MODEL_API_KEY")
    require_preflight(key, args.reviewed_and_masked, args.credit_confirmed, args.concept)
    if args.image.stat().st_size > CONFIG["E05_IMAGE_MAX_INPUT_BYTES"]:
        raise ValueError("Image exceeds input size limit")
    image = cv2.imdecode(np.frombuffer(args.image.read_bytes(), dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Image cannot be decoded")
    height, width = image.shape[:2]
    if max(height, width) > CONFIG["E05_IMAGE_MAX_EDGE_PX"]:
        factor = CONFIG["E05_IMAGE_MAX_EDGE_PX"] / max(height, width)
        image = cv2.resize(image, (max(1, round(width * factor)), max(1, round(height * factor))), interpolation=cv2.INTER_AREA)
    ok, encoded = cv2.imencode(".png", image)
    if not ok:
        raise ValueError("Image cannot be re-encoded")
    image_bytes = encoded.tobytes()  # Strips source metadata; human reviews masking first.
    payload = build_payload(image_bytes, args.concept.strip())
    request = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json", "Accept": "text/event-stream"},
        method="POST",
    )
    started = time.monotonic()
    try:
        with urllib.request.urlopen(request, timeout=CONFIG["E05_SAM_REQUEST_TIMEOUT_SECONDS"]) as result:
            stream_text = result.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        # Keep only status and provider request ID; response body may echo secrets.
        raise RuntimeError(f"Meta Model API HTTP {error.code}; request ID {error.headers.get('X-Request-Id', 'unreported')}") from None
    private_dir = Path("eval/sessions")
    private_dir.mkdir(parents=True, exist_ok=True)
    stamp = time.time_ns()
    raw_path = private_dir / f"e05-sam-response-{stamp}.txt"
    raw_path.write_text(stream_text, encoding="utf-8")
    print(f"Saved private provider response: {raw_path}")
    try:
        evidence = parse_events(stream_text)
        evidence["boxes"] = parse_image_boxes(evidence["output_text"])
    except ValueError as error:
        raise RuntimeError(f"{error}; inspect private provider response at {raw_path}") from None
    receipt = {
        "provider": "Meta Model API", "requested_model": MODEL,
        "model_revision": "unreported_by_provider", "raw_provider_receipt": str(raw_path),
        "input_sha256": hashlib.sha256(image_bytes).hexdigest(),
        "concept": args.concept.strip(),
        "config_sha256": hashlib.sha256(CONFIG_PATH.read_bytes()).hexdigest(),
        "latency_seconds": time.monotonic() - started,
        "billing_status": "unverified; inspect Meta dashboard separately",
        "evidence": evidence,
    }
    receipt_path = private_dir / f"e05-sam-{stamp}.json"
    receipt_path.write_text(json.dumps(receipt, indent=2), encoding="utf-8")
    print(f"Saved private SAM receipt: {receipt_path}")
    print("SAM access smoke only; no destination or navigation decision passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
