import json
import unittest
from pathlib import Path

from start_anchor import evaluate_start_anchor


CFG = json.loads((Path(__file__).resolve().parents[1] / "config/vision.yaml").read_text())


def fixture():
    map_centers = [[float(i), 0.0, float(i % 2) * 0.5] for i in range(6)]
    session_centers = [[2 * x + 3, 0.0, 2 * z + 4] for x, _, z in map_centers]
    poses = [{"accepted": True, "cameraCenter": point} for point in map_centers]
    return poses, session_centers


class StartAnchorTests(unittest.TestCase):
    def test_good_recent_geometry_is_only_a_candidate(self):
        poses, session = fixture()
        result = evaluate_start_anchor(poses, session, 0, "NORMAL", 0, CFG)
        self.assertTrue(result["accepted"], result)
        self.assertAlmostEqual(result["alignment"]["scale"], 2)
        self.assertFalse(result["navigationReady"])
        self.assertFalse(result["metricScaleVerified"])
        self.assertFalse(result["arrowAuthorized"])

    def test_newest_bad_pose_revokes_an_older_good_window(self):
        poses, session = fixture()
        self.assertTrue(evaluate_start_anchor(poses[:5], session[:5], 0, "NORMAL", 0, CFG)["accepted"])
        poses[-1] = {"accepted": False, "reason": "planar-ambiguous"}
        result = evaluate_start_anchor(poses, session, 0, "NORMAL", 0, CFG)
        self.assertFalse(result["accepted"])
        self.assertEqual(result["reason"], "latest-pose-rejected")

    def test_stale_or_lost_tracking_never_returns_an_anchor(self):
        poses, session = fixture()
        cases = [
            (CFG["MARKER_MAX_AGE_MS"] + 1, "NORMAL", 0, "stale-pose"),
            (0, "LIMITED", 0, "tracking-unavailable"),
            (0, "NORMAL", CFG["MARKER_MAX_AGE_MS"] + 1, "stale-tracker"),
        ]
        for pose_age, status, tracker_age, reason in cases:
            with self.subTest(reason=reason):
                result = evaluate_start_anchor(poses, session, pose_age, status, tracker_age, CFG)
                self.assertFalse(result["accepted"])
                self.assertEqual(result["reason"], reason)
                self.assertFalse(result["arrowAuthorized"])

    def test_requires_a_contiguous_suffix_of_accepted_poses(self):
        poses, session = fixture()
        poses[-3] = {"accepted": False, "reason": "insufficient-image-coverage"}
        result = evaluate_start_anchor(poses, session, 0, "NORMAL", 0, CFG)
        self.assertFalse(result["accepted"])
        self.assertEqual(result["reason"], "insufficient-contiguous-poses")


if __name__ == "__main__":
    unittest.main()
