"""Synthetic receipt-pair binding tests, not field verification."""
import unittest
from unittest.mock import patch

from geometry.receipt_pair import evaluate_pair


SHA = "a" * 64
CONFIG_SHA = "b" * 64
CONFIG = {"VERIFY_MAX_OBSERVATION_AGE_MS": 120000,
          "VERIFY_MAX_GEOMETRY_AGE_MS": 1500,
          "VERIFY_MIN_DISTINCT_OBSERVATIONS_COUNT": 2}


def fixture():
    spark = {"input_sha256": SHA, "config_sha256": CONFIG_SHA,
             "requested_model": "meta-models/muse-spark-open-1026",
             "evidence": {"visible_text": ["D10"], "visual_cues": ["wooden door"],
                          "usable_as_destination_evidence": True}}
    sam = {"input_sha256": SHA, "config_sha256": CONFIG_SHA,
           "requested_model": "sam-3.1", "concept": "wooden door",
           "evidence": {"output_text": "synthetic-only"}}
    context = {"image_sha256": SHA, "config_sha256": CONFIG_SHA,
               "frame_id": "kf1", "route_id": "r1", "anchor_id": "a1",
               "captured_at_ms": 1000, "geometry_verified_at_ms": 59950,
               "anchor_valid": True, "tracking_active": True,
               "target_text": "D10", "required_cue": "wooden door",
               "image_size": (768, 1024), "target_pixel": (120, 500),
               "decoy_pixel": (300, 600)}
    return spark, sam, context


class ReceiptPairTests(unittest.TestCase):
    @patch("geometry.receipt_pair.inspect_sam_image", return_value={
        "mask_evaluated": True, "object_count": 1,
        "target_projected_inside_mask": True,
        "decoy_projected_inside_mask": False})
    def test_same_frame_models_and_fresh_geometry_yield_only_candidate(self, decoder):
        result = evaluate_pair(*fixture(), 60000, CONFIG_SHA, CONFIG)
        self.assertEqual(result["status"], "candidate")
        self.assertFalse(result["confirmed"])
        decoder.assert_called_once()

    @patch("geometry.receipt_pair.inspect_sam_image")
    def test_mismatched_image_config_or_model_never_reaches_mask(self, decoder):
        for mutate in (
            lambda s, m, c: s.update(input_sha256="c" * 64),
            lambda s, m, c: m.update(config_sha256="c" * 64),
            lambda s, m, c: c.update(image_sha256="c" * 64),
            lambda s, m, c: m.update(requested_model="other"),
        ):
            spark, sam, context = fixture(); mutate(spark, sam, context)
            self.assertEqual(evaluate_pair(spark, sam, context, 60000, CONFIG_SHA, CONFIG)["status"], "abstain")
        decoder.assert_not_called()


if __name__ == "__main__":
    unittest.main()
