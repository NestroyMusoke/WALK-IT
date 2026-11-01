"""One reviewed-image Muse Spark Open smoke test; never used to enable guidance."""

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


# Sponsor email specifies this alias for the separately issued hackathon key.
MODEL = "meta-models/muse-spark-open-1026"
ENDPOINT = "https://inference.baseten.co/v1/chat/completions"
PROMPT = (
    "Inspect this candidate destination image for a pedestrian wayfinding verifier. "
    "Return only a JSON object with visible_text (array of exactly observed strings), "
    "visual_cues (array of distinctive visible details), uncertainty (string), and "
    "usable_as_destination_evidence (boolean). Do not infer a location or room number "
    "that is not visible. This observation alone never confirms arrival."
)
CONFIG = json.loads(Path("config/vision.yaml").read_text(encoding="utf-8"))


def require_preflight(key: str | None, reviewed: bool, credit_confirmed: bool) -> None:
    if not key:
        raise ValueError("BASETEN_API_KEY must be set locally")
    if not reviewed:
        raise ValueError("Input must be manually reviewed and masked before upload")
    if not credit_confirmed:
        raise ValueError("Active Baseten credit must be confirmed before a request")


def build_payload(image_bytes: bytes, mime: str) -> dict:
    encoded = base64.b64encode(image_bytes).decode("ascii")
    return {
        "model": MODEL,
        "max_tokens": CONFIG["E05_MODEL_OUTPUT_MAX_TOKENS_COUNT"],
        "reasoning_effort": CONFIG["E05_REASONING_EFFORT"],
        "messages": [
            {"role": "system", "content": "Return only valid JSON. Describe visible evidence; never certify a destination."},
            {"role": "user", "content": [
                {"type": "text", "text": PROMPT},
                {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{encoded}"}},
            ]},
        ],
    }


def parse_evidence(response: dict) -> dict:
    choices = response.get("choices")
    if not isinstance(choices, list) or not choices or not isinstance(choices[0], dict):
        raise ValueError("Model response has no completion choice")
    choice = choices[0]
    reason = choice.get("finish_reason", "unknown")
    if reason != "stop":
        raise ValueError(f"Model completion was incomplete (finish_reason={reason})")
    message = choice.get("message", {})
    if message.get("refusal"):
        raise ValueError("Model refused the request")
    try:
        content = message["content"]
        evidence = json.loads(content)
    except (KeyError, IndexError, TypeError, json.JSONDecodeError) as error:
        raise ValueError(f"Model did not return a JSON evidence object (finish_reason={reason})") from error
    for field in ("visible_text", "visual_cues"):
        if not isinstance(evidence.get(field), list) or not all(isinstance(x, str) for x in evidence[field]):
            raise ValueError(f"Invalid evidence field: {field}")
    if not isinstance(evidence.get("uncertainty"), str) or not isinstance(evidence.get("usable_as_destination_evidence"), bool):
        raise ValueError("Invalid evidence uncertainty or usability field")
    return {
        "visible_text": evidence["visible_text"],
        "visual_cues": evidence["visual_cues"],
        "uncertainty": evidence["uncertainty"],
        "usable_as_destination_evidence": evidence["usable_as_destination_evidence"],
        "navigationReady": False,
        "usage": response.get("usage"),
        "provider_response_id": response.get("id"),
        "provider_model": response.get("model"),
    }


def persist_provider_response(response: dict, private_dir: Path) -> Path:
    """Save a successful HTTP response privately before any strict parsing."""
    private_dir.mkdir(parents=True, exist_ok=True)
    path = private_dir / f"e05-muse-response-{time.time_ns()}.json"
    path.write_text(json.dumps(response, indent=2), encoding="utf-8")
    return path


def summarize_http_error(error: urllib.error.HTTPError, key: str) -> dict:
    """Keep a bounded, redacted provider reason in the ignored private folder."""
    headers = error.headers
    content_type = (headers.get("Content-Type") or "").split(";", 1)[0].lower()
    result = {
        "http_status": error.code,
        "content_type": content_type,
        "provider_request_id": headers.get("X-Request-Id") or headers.get("X-Baseten-Request-Id") or headers.get("CF-Ray"),
        "response_kind": "non_json",
    }
    raw = error.read(8192)
    if content_type != "application/json":
        return result
    try:
        body = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError):
        result["response_kind"] = "invalid_json"
        return result
    result["response_kind"] = "json"
    detail = body.get("error", body) if isinstance(body, dict) else {}
    if isinstance(detail, str):
        detail = {"message": detail}
    if not isinstance(detail, dict):
        detail = {}

    def scrub(value: object) -> str | None:
        if not isinstance(value, str):
            return None
        value = value.replace(key, "[REDACTED_KEY]")
        value = re.sub(r"(?i)(bearer|api-key)\s+[A-Za-z0-9._-]+", r"\1 [REDACTED]", value)
        return value[:500]

    result["provider_error_type"] = scrub(detail.get("type"))
    result["provider_error_code"] = scrub(detail.get("code"))
    result["provider_error_message"] = scrub(detail.get("message"))
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True, type=Path)
    parser.add_argument("--reviewed-and-masked", action="store_true")
    parser.add_argument("--credit-confirmed", action="store_true")
    args = parser.parse_args()
    require_preflight(os.environ.get("BASETEN_API_KEY"), args.reviewed_and_masked, args.credit_confirmed)

    if args.image.stat().st_size > CONFIG["E05_IMAGE_MAX_INPUT_BYTES"]:
        raise ValueError("Reviewed image exceeds E05 input size limit")
    raw = args.image.read_bytes()
    image = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Image cannot be decoded")
    height, width = image.shape[:2]
    longest = max(height, width)
    if longest > CONFIG["E05_IMAGE_MAX_EDGE_PX"]:
        factor = CONFIG["E05_IMAGE_MAX_EDGE_PX"] / longest
        image = cv2.resize(image, (max(1, round(width * factor)), max(1, round(height * factor))), interpolation=cv2.INTER_AREA)
    # Re-encode pixels to PNG, dropping source EXIF and ancillary metadata.
    ok, encoded = cv2.imencode(".png", image)
    if not ok:
        raise ValueError("Image cannot be re-encoded")
    image_bytes = encoded.tobytes()
    payload = build_payload(image_bytes, "image/png")
    request = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {os.environ['BASETEN_API_KEY']}", "Content-Type": "application/json"},
        method="POST",
    )
    started = time.monotonic()
    try:
        with urllib.request.urlopen(request, timeout=CONFIG["E05_MODEL_REQUEST_TIMEOUT_SECONDS"]) as result:
            response = json.load(result)
    except urllib.error.HTTPError as error:
        summary = summarize_http_error(error, os.environ["BASETEN_API_KEY"])
        summary.update({
            "provider": "Baseten",
            "requested_model": MODEL,
            "input_sha256": hashlib.sha256(image_bytes).hexdigest(),
            "config_sha256": hashlib.sha256(Path("config/vision.yaml").read_bytes()).hexdigest(),
            "latency_seconds": time.monotonic() - started,
            "navigationReady": False,
        })
        private_dir = Path("eval/sessions")
        private_dir.mkdir(parents=True, exist_ok=True)
        failure_path = private_dir / f"e05-baseten-error-{int(time.time())}.json"
        failure_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
        raise RuntimeError(f"Baseten HTTP {error.code}; private diagnostic saved at {failure_path}") from None
    raw_path = persist_provider_response(response, Path("eval/sessions"))
    print(f"Saved private provider response: {raw_path}")
    try:
        evidence = parse_evidence(response)
    except ValueError as error:
        raise RuntimeError(f"{error}; inspect private provider response at {raw_path}") from None
    private_dir = Path("eval/sessions")
    private_dir.mkdir(parents=True, exist_ok=True)
    record = {
        "provider": "Baseten",
        "raw_provider_receipt": str(raw_path),
        "requested_model": MODEL,
        "model_revision": "unreported_by_provider",
        "input_sha256": hashlib.sha256(image_bytes).hexdigest(),
        "prompt_sha256": hashlib.sha256(PROMPT.encode("utf-8")).hexdigest(),
        "config_sha256": hashlib.sha256(Path("config/vision.yaml").read_bytes()).hexdigest(),
        "latency_seconds": time.monotonic() - started,
        "billing_status": "credit claimed active; verify dashboard before/after separately",
        "decision_branch": "candidate destination appearance evidence only; geometry and independent comparison required",
        "evidence": evidence,
    }
    output = private_dir / f"e05-muse-{int(time.time())}.json"
    output.write_text(json.dumps(record, indent=2), encoding="utf-8")
    print(f"Saved private model receipt: {output}")
    print("E05 remains open until model revision, terms and zero-additional-charge evidence are verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
