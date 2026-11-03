"""Fresh geometric start-anchor candidate. This never authorizes AR arrows."""
import hashlib
import json
import math

from alignment import estimate_gravity_windowed_alignment


def evaluate_start_anchor(poses, session_positions, pose_age_ms, tracking_status,
                          tracker_age_ms, cfg, config_sha256=None):
    identity = {
        "configSha256": config_sha256 or hashlib.sha256(
            json.dumps(cfg, sort_keys=True, separators=(",", ":")).encode()
        ).hexdigest(),
        "configHashEncoding": "raw-file" if config_sha256 else "canonical-json",
        "navigationReady": False,
        "metricScaleVerified": False,
        "arrowAuthorized": False,
    }

    def reject(reason, **evidence):
        return {**identity, "accepted": False, "reason": reason, **evidence}

    if tracking_status != "NORMAL":
        return reject("tracking-unavailable")
    if not isinstance(tracker_age_ms, (int, float)) or not math.isfinite(tracker_age_ms) or not 0 <= tracker_age_ms <= cfg["MARKER_MAX_AGE_MS"]:
        return reject("stale-tracker")
    if not isinstance(pose_age_ms, (int, float)) or not math.isfinite(pose_age_ms) or not 0 <= pose_age_ms <= cfg["MARKER_MAX_AGE_MS"]:
        return reject("stale-pose")
    if not isinstance(poses, list) or not isinstance(session_positions, list) or not poses or len(poses) != len(session_positions):
        return reject("invalid-pose-trace")
    latest = poses[-1]
    if not isinstance(latest, dict) or latest.get("accepted") is not True:
        return reject("latest-pose-rejected", latestPoseReason=latest.get("reason") if isinstance(latest, dict) else None)
    start = len(poses) - 1
    while start >= 0 and isinstance(poses[start], dict) and poses[start].get("accepted") is True:
        start -= 1
    start += 1
    if len(poses) - start < cfg["ALIGNMENT_MIN_PAIRS_COUNT"]:
        return reject("insufficient-contiguous-poses", contiguousAccepted=len(poses)-start)
    window_start = max(start, len(poses) - cfg["ALIGNMENT_WINDOW_MAX_PAIRS_COUNT"])
    centers = [pose.get("cameraCenter") for pose in poses[window_start:]]
    if any(not isinstance(center, list) or len(center) != 3 or
           not all(isinstance(n, (int, float)) and math.isfinite(n) for n in center)
           for center in centers):
        return reject("invalid-pose-centers")
    alignment = estimate_gravity_windowed_alignment(
        centers, session_positions[window_start:], cfg
    )
    if not alignment["accepted"]:
        return reject("alignment-rejected", alignmentReason=alignment["reason"],
                      contiguousAccepted=len(poses)-start)
    return {**identity, "accepted": True, "reason": "fresh-geometric-candidate-only",
            "contiguousAccepted": len(poses)-start, "latestFrameIndex": len(poses)-1,
            "alignment": alignment}
