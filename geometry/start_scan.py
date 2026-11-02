"""Offline, privacy-reviewed start scan against a separate OpenCV 5 start map.

This deliberately cannot certify live freshness, metric scale or AR guidance.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

import cv2
import numpy as np

from map_query import query_frame, validate_map


def _encoded(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()


def evaluate_reviewed_start_scan(model, capture, cfg, config_sha256, query=None,
                                 map_bytes=None, capture_bytes=None):
    landmarks = validate_map(model)
    if model["geometryConfigSha256"] != config_sha256:
        raise ValueError("Start map and query geometry configuration differ")
    manifest = capture.get("manifest")
    purpose = capture.get("purpose", "legacy-unspecified")
    if "purpose" in capture and purpose not in ("author-route", "visitor-start-scan"):
        raise ValueError("Invalid capture purpose")
    if not isinstance(manifest, dict) or manifest.get("privacy") != {"capturePermitted": True, "imagesReviewed": True}:
        raise ValueError("Permission and completed image review required")
    if not re.fullmatch(r"[a-f0-9]{64}", str(manifest.get("configSha256", ""))):
        raise ValueError("Missing capture configuration identity")
    frames, images = manifest.get("keyframes"), capture.get("images")
    if not isinstance(frames, list) or not isinstance(images, list) or len(frames) != len(images):
        raise ValueError("Start-scan frame/image count mismatch")
    if len(frames) < cfg["GEOMETRY_TRACK_MIN_VIEWS_COUNT"]:
        raise ValueError("Too few start-scan views")
    ids = [frame.get("id") for frame in frames if isinstance(frame, dict)]
    if len(ids) != len(frames) or len(set(ids)) != len(ids) or any(
        not isinstance(name, str) or not re.fullmatch(r"[a-zA-Z0-9_-]+", name) or
        not isinstance(image, dict) or image.get("id") != name or not isinstance(image.get("png"), str)
        for name, image in zip(ids, images)
    ):
        raise ValueError("Start-scan image identity mismatch")
    map_sha = hashlib.sha256(map_bytes if map_bytes is not None else _encoded(model)).hexdigest()
    capture_sha = hashlib.sha256(capture_bytes if capture_bytes is not None else _encoded(capture)).hexdigest()
    if capture_sha == model["captureSha256"]:
        raise ValueError("Author map source cannot be its own independent scan")

    if query is None:
        if cv2.__version__.split(".")[0] != "5":
            raise RuntimeError("OpenCV 5 required")
        references = np.asarray([landmark["descriptor"] for landmark in landmarks], dtype=np.float32)
        sift = cv2.SIFT_create(nfeatures=cfg["GEOMETRY_SIFT_FEATURES_COUNT"])

        def query(image, frame, selected_landmarks, config):
            return query_frame(image, frame, selected_landmarks, references, config, sift)

    outcomes = []
    for image, frame in zip(images[:cfg["START_MAP_FRAME_CAPACITY_COUNT"]],
                            frames[:cfg["START_MAP_FRAME_CAPACITY_COUNT"]]):
        try:
            result = query(image, frame, landmarks, cfg)
        except ValueError:
            result = {"accepted": False, "reason": "invalid-query-frame", "descriptorMatches": None}
        if not isinstance(result, dict) or type(result.get("accepted")) is not bool:
            raise ValueError("Invalid per-frame OpenCV query result")
        outcomes.append({"frameId": frame["id"], "accepted": result["accepted"],
                         "reason": result.get("reason", "unspecified"),
                         "descriptorMatches": result.get("descriptorMatches")})
    return {
        "kind": "offline-reviewed-start-scan", "capturePurpose": purpose, "mapSha256": map_sha,
        "captureSha256": capture_sha, "geometryConfigSha256": config_sha256,
        "captureConfigSha256": manifest["configSha256"],
        "attemptedFrames": len(outcomes),
        "acceptedHypotheses": sum(item["accepted"] for item in outcomes),
        "results": outcomes, "reason": "offline-query-only-live-freshness-unknown",
        "livePoseAgeMs": None, "liveTrackerAgeMs": None,
        "metricScaleVerified": False, "navigationReady": False,
        "arrowAuthorized": False,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("map", type=Path)
    parser.add_argument("reviewed_scan", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Refusing to overwrite a scan report")
    map_bytes, capture_bytes = args.map.read_bytes(), args.reviewed_scan.read_bytes()
    config_bytes = (Path(__file__).resolve().parents[1] / "config/vision.yaml").read_bytes()
    report = evaluate_reviewed_start_scan(
        json.loads(map_bytes), json.loads(capture_bytes), json.loads(config_bytes),
        hashlib.sha256(config_bytes).hexdigest(), map_bytes=map_bytes, capture_bytes=capture_bytes)
    args.output.write_text(json.dumps(report, indent=2, allow_nan=False))
    print(json.dumps({key: value for key, value in report.items() if key != "results"}, indent=2))


if __name__ == "__main__":
    main()
