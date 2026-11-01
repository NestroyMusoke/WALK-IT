"""E13b synthetic-tested decision contract; no provider or live geometry adapter yet.

The caller must derive mask membership from the actual SAM mask in the same image
coordinate frame as the geometric projections. A box alone is insufficient.
"""

import math
import re


_SHA = re.compile(r"[0-9a-f]{64}\Z")


def _sha(value):
    return isinstance(value, str) and _SHA.fullmatch(value) is not None


def _result(observation, status, reason):
    return {
        "status": status, "reason": reason, "confirmed": False,
        "frame_id": observation.get("frame_id"),
        "image_sha256": observation.get("image_sha256"),
        "route_id": observation.get("route_id"),
        "anchor_id": observation.get("anchor_id"),
        "config_sha256": observation.get("config_sha256"),
        "observed_at_ms": observation.get("observed_at_ms"),
        "geometry_verified_at_ms": observation.get("geometry", {}).get("verified_at_ms") if isinstance(observation.get("geometry"), dict) else None,
        "target_text": observation.get("expected_target_text"),
        "required_cue": observation.get("expected_required_cue"),
    }


def evaluate_observation(observation, target_text, required_cue, now_ms, config):
    """Assess one image. Every failure abstains; one image never confirms."""
    if not isinstance(observation, dict):
        raise ValueError("Observation must be an object")
    observation = {**observation, "expected_target_text": target_text,
                   "expected_required_cue": required_cue}
    if not (_sha(observation.get("image_sha256")) and _sha(observation.get("config_sha256"))):
        return _result(observation, "abstain", "invalid-provenance")
    if not all(isinstance(observation.get(key), str) and observation[key] for key in ("frame_id", "route_id", "anchor_id")):
        return _result(observation, "abstain", "invalid-provenance")
    observed = observation.get("observed_at_ms")
    if not isinstance(observed, (int, float)) or not isinstance(now_ms, (int, float)) or not math.isfinite(observed) or not math.isfinite(now_ms):
        return _result(observation, "abstain", "invalid-time")
    age = now_ms - observed
    if age < 0 or age > config["VERIFY_MAX_OBSERVATION_AGE_MS"]:
        return _result(observation, "abstain", "stale-observation")
    geometry = observation.get("geometry")
    if not isinstance(geometry, dict) or geometry.get("anchor_valid") is not True or geometry.get("tracking_active") is not True:
        return _result(observation, "abstain", "unverified-geometry")
    checked = geometry.get("verified_at_ms")
    if not isinstance(checked, (int, float)) or not math.isfinite(checked) or now_ms - checked < 0 or now_ms - checked > config["VERIFY_MAX_GEOMETRY_AGE_MS"]:
        return _result(observation, "abstain", "stale-geometry")
    if geometry.get("target_projected_inside_mask") is not True:
        return _result(observation, "abstain", "target-outside-mask")
    if geometry.get("decoy_projected_inside_mask") is not False:
        return _result(observation, "abstain", "ambiguous-or-unchecked-decoy")
    spark, sam = observation.get("spark"), observation.get("sam")
    if not isinstance(spark, dict) or not isinstance(sam, dict):
        return _result(observation, "abstain", "model-unavailable")
    if spark.get("input_sha256") != observation["image_sha256"] or sam.get("input_sha256") != observation["image_sha256"]:
        return _result(observation, "abstain", "model-image-mismatch")
    if spark.get("usable_as_destination_evidence") is not True:
        return _result(observation, "abstain", "spark-uncertain")
    visible_text, cues = spark.get("visible_text"), spark.get("visual_cues")
    if not isinstance(visible_text, list) or not all(isinstance(x, str) for x in visible_text) or not isinstance(cues, list) or not all(isinstance(x, str) for x in cues):
        return _result(observation, "abstain", "malformed-spark")
    if not isinstance(target_text, str) or not target_text or target_text.casefold() not in [x.strip().casefold() for x in visible_text]:
        return _result(observation, "abstain", "target-text-unseen")
    if not isinstance(required_cue, str) or not required_cue or required_cue.casefold() not in [x.strip().casefold() for x in cues]:
        return _result(observation, "abstain", "target-cue-unseen")
    if sam.get("concept") != required_cue or sam.get("mask_evaluated") is not True or type(sam.get("object_count")) is not int or sam["object_count"] != 1:
        return _result(observation, "abstain", "sam-mask-unverified-or-ambiguous")
    return _result(observation, "candidate", "geometry-spark-sam-consistent")


def fuse_observations(results, now_ms, config):
    """Confirm only independent compatible frames from one route and anchor."""
    if not isinstance(results, list) or not results:
        return {"confirmed": False, "status": "abstain", "reason": "insufficient-observations"}
    if any(not isinstance(item, dict) or item.get("status") != "candidate" for item in results):
        return {"confirmed": False, "status": "abstain", "reason": "inconsistent-observations"}
    keys = ("route_id", "anchor_id", "config_sha256", "target_text", "required_cue")
    if any(len({item.get(key) for item in results}) != 1 for key in keys):
        return {"confirmed": False, "status": "abstain", "reason": "changed-route-anchor-or-config"}
    times = [item.get("observed_at_ms") for item in results]
    if not isinstance(now_ms, (int, float)) or not math.isfinite(now_ms) or any(not isinstance(t, (int, float)) or not math.isfinite(t) for t in times) or any(now_ms - t < 0 or now_ms - t > config["VERIFY_MAX_OBSERVATION_AGE_MS"] for t in times):
        return {"confirmed": False, "status": "abstain", "reason": "observation-window-expired"}
    checked = [item.get("geometry_verified_at_ms") for item in results]
    if any(not isinstance(t, (int, float)) or not math.isfinite(t) for t in checked) or now_ms - max(checked) < 0 or now_ms - max(checked) > config["VERIFY_MAX_GEOMETRY_AGE_MS"]:
        return {"confirmed": False, "status": "abstain", "reason": "stale-geometry"}
    if len({item.get("frame_id") for item in results}) < config["VERIFY_MIN_DISTINCT_OBSERVATIONS_COUNT"] or len({item.get("image_sha256") for item in results}) < config["VERIFY_MIN_DISTINCT_OBSERVATIONS_COUNT"]:
        return {"confirmed": False, "status": "abstain", "reason": "insufficient-distinct-frames"}
    return {"confirmed": True, "status": "confirmed", "reason": "repeated-geometric-and-model-evidence",
            "route_id": results[0]["route_id"], "anchor_id": results[0]["anchor_id"],
            "config_sha256": results[0]["config_sha256"], "observation_count": len(results)}
