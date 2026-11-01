"""Bind Spark and SAM receipts to one reviewed frame and trusted route geometry.

Inputs are private server-side receipts and geometry, not client-supplied verdicts.
This function makes no network calls and a single pair cannot confirm arrival.
"""

from geometry.destination_verifier import evaluate_observation
from geometry.sam_mask import inspect_sam_image


def evaluate_pair(spark_receipt, sam_receipt, route_context, now_ms, active_config_sha256, config):
    abstain = lambda reason: {"status": "abstain", "reason": reason, "confirmed": False}
    if not all(isinstance(item, dict) for item in (spark_receipt, sam_receipt, route_context)):
        return abstain("missing-receipt-or-context")
    image_sha = route_context.get("image_sha256")
    if not isinstance(image_sha, str) or not isinstance(active_config_sha256, str):
        return abstain("missing-provenance")
    if any(item.get("input_sha256") != image_sha or item.get("config_sha256") != active_config_sha256 for item in (spark_receipt, sam_receipt)) or route_context.get("config_sha256") != active_config_sha256:
        return abstain("image-or-config-mismatch")
    if spark_receipt.get("requested_model") != "meta-models/muse-spark-open-1026" or sam_receipt.get("requested_model") != "sam-3.1":
        return abstain("unexpected-model")
    if sam_receipt.get("concept") != route_context.get("required_cue"):
        return abstain("sam-concept-mismatch")
    spark = spark_receipt.get("evidence")
    sam = sam_receipt.get("evidence")
    if not isinstance(spark, dict) or not isinstance(sam, dict) or not isinstance(sam.get("output_text"), str):
        return abstain("malformed-model-evidence")
    if spark.get("usable_as_destination_evidence") is not True:
        return abstain("spark-uncertain")
    mask = inspect_sam_image(sam["output_text"], route_context.get("image_size"),
                             route_context.get("target_pixel"), route_context.get("decoy_pixel"))
    observation = {
        "frame_id": route_context.get("frame_id"), "image_sha256": image_sha,
        "observed_at_ms": route_context.get("captured_at_ms"),
        "route_id": route_context.get("route_id"),
        "anchor_id": route_context.get("anchor_id"),
        "config_sha256": active_config_sha256,
        "geometry": {
            "anchor_valid": route_context.get("anchor_valid"),
            "tracking_active": route_context.get("tracking_active"),
            "verified_at_ms": route_context.get("geometry_verified_at_ms"),
            "target_projected_inside_mask": mask["target_projected_inside_mask"],
            "decoy_projected_inside_mask": mask["decoy_projected_inside_mask"],
        },
        "spark": {"input_sha256": image_sha,
                  "visible_text": spark.get("visible_text"),
                  "visual_cues": spark.get("visual_cues"),
                  "usable_as_destination_evidence": spark.get("usable_as_destination_evidence")},
        "sam": {"input_sha256": image_sha,
                "concept": sam_receipt.get("concept"),
                "mask_evaluated": mask["mask_evaluated"],
                "object_count": mask["object_count"]},
    }
    return evaluate_observation(observation, route_context.get("target_text"),
                                route_context.get("required_cue"), now_ms, config)
