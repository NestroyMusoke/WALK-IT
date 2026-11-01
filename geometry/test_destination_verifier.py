"""Synthetic E13b fixtures; these are not field accuracy evidence."""
import unittest

from geometry.destination_verifier import evaluate_observation, fuse_observations


HASH = "a" * 64
CONFIG = {"VERIFY_MAX_OBSERVATION_AGE_MS": 120000,
          "VERIFY_MAX_GEOMETRY_AGE_MS": 1500,
          "VERIFY_MIN_DISTINCT_OBSERVATIONS_COUNT": 2}


def sample(frame="kf1", at=1000):
    return {
        "frame_id": frame, "image_sha256": HASH[:-1] + frame[-1], "observed_at_ms": at,
        "route_id": "route1", "anchor_id": "anchor1", "config_sha256": "b" * 64,
        "geometry": {"anchor_valid": True, "tracking_active": True,
                     "verified_at_ms": at,
                     "target_projected_inside_mask": True,
                     "decoy_projected_inside_mask": False},
        "spark": {"input_sha256": HASH[:-1] + frame[-1], "usable_as_destination_evidence": True,
                  "visible_text": ["D10"], "visual_cues": ["wooden door"]},
        "sam": {"input_sha256": HASH[:-1] + frame[-1], "concept": "wooden door",
                "mask_evaluated": True, "object_count": 1},
    }


class DestinationVerifierTests(unittest.TestCase):
    def test_single_consistent_observation_is_only_a_candidate(self):
        result = evaluate_observation(sample(), "D10", "wooden door", 1100, CONFIG)
        self.assertEqual(result["status"], "candidate")
        self.assertFalse(result["confirmed"])

    def test_two_independent_consistent_frames_can_confirm_but_one_cannot(self):
        first = evaluate_observation(sample(), "D10", "wooden door", 1100, CONFIG)
        second = evaluate_observation(sample("kf2", 1200), "D10", "wooden door", 1250, CONFIG)
        self.assertTrue(fuse_observations([first, second], 1250, CONFIG)["confirmed"])
        self.assertFalse(fuse_observations([first, first], 1250, CONFIG)["confirmed"])
        self.assertFalse(fuse_observations([first], 1250, CONFIG)["confirmed"])

    def test_decoy_or_stale_geometry_abstains(self):
        for change in (
            lambda x: x["geometry"].update(decoy_projected_inside_mask=True),
            lambda x: x["geometry"].update(anchor_valid=False),
            lambda x: x["geometry"].update(tracking_active=False),
        ):
            item = sample(); change(item)
            self.assertFalse(evaluate_observation(item, "D10", "wooden door", 1100, CONFIG)["confirmed"])
            self.assertNotEqual(evaluate_observation(item, "D10", "wooden door", 1100, CONFIG)["status"], "candidate")
        self.assertEqual(evaluate_observation(sample(), "D10", "wooden door", 121001, CONFIG)["reason"], "stale-observation")
        self.assertEqual(evaluate_observation(sample(), "D10", "wooden door", 2600, CONFIG)["reason"], "stale-geometry")

    def test_model_outage_mismatch_and_unverified_mask_abstain(self):
        variants = [
            lambda x: x.pop("spark"),
            lambda x: x["spark"].update(input_sha256="c" * 64),
            lambda x: x["spark"].update(visible_text=["D9"]),
            lambda x: x["spark"].update(usable_as_destination_evidence=False),
            lambda x: x["sam"].update(mask_evaluated=False),
            lambda x: x["sam"].update(object_count=0),
            lambda x: x["sam"].update(concept="window"),
        ]
        for change in variants:
            item = sample(); change(item)
            self.assertNotEqual(evaluate_observation(item, "D10", "wooden door", 1100, CONFIG)["status"], "candidate")

    def test_repeated_evidence_from_different_anchor_or_route_does_not_confirm(self):
        first = evaluate_observation(sample(), "D10", "wooden door", 1100, CONFIG)
        other = sample("kf2", 1200); other["anchor_id"] = "anchor2"
        second = evaluate_observation(other, "D10", "wooden door", 1250, CONFIG)
        self.assertFalse(fuse_observations([first, second], 1250, CONFIG)["confirmed"])

    def test_frames_for_different_targets_or_outside_one_fresh_window_do_not_combine(self):
        first = evaluate_observation(sample(), "D10", "wooden door", 1100, CONFIG)
        other = sample("kf2", 1200)
        other["spark"]["visible_text"] = ["D9"]
        second = evaluate_observation(other, "D9", "wooden door", 1250, CONFIG)
        self.assertFalse(fuse_observations([first, second], 1250, CONFIG)["confirmed"])
        delayed = sample("kf2", 130000)
        delayed_result = evaluate_observation(delayed, "D10", "wooden door", 130100, CONFIG)
        self.assertFalse(fuse_observations([first, delayed_result], 130100, CONFIG)["confirmed"])

    def test_slow_model_can_return_while_current_geometry_is_refreshed(self):
        item = sample()
        item["geometry"]["verified_at_ms"] = 59950
        self.assertEqual(evaluate_observation(item, "D10", "wooden door", 60000, CONFIG)["status"], "candidate")


if __name__ == "__main__":
    unittest.main()
