import unittest

from geometry.scale_audit import audit_capture


class ScaleAuditTest(unittest.TestCase):
    def test_step_lengths_use_video_time_and_report_vertical_series(self):
        capture = {
            "manifest": {"keyframes": [
                {"id": "kf0", "position": [0, 1, 0]},
                {"id": "kf1", "position": [1, 1.2, 0]},
                {"id": "kf2", "position": [3, 1.4, 0]},
            ]},
            "timing": [
                {"id": "kf0", "videoTime": 5},
                {"id": "kf1", "videoTime": 6},
                {"id": "kf2", "videoTime": 8},
            ],
        }
        result = audit_capture(capture)
        self.assertEqual(result["timesSeconds"], [0, 1, 3])
        self.assertEqual(result["positionYTrackerUnits"], [1, 1.2, 1.4])
        self.assertAlmostEqual(result["stepTrackerUnits"][0], 1.0198039027)
        self.assertAlmostEqual(result["stepTrackerUnits"][1], 2.0099751242)
        self.assertEqual(result["withinSessionScaleClass"], "unidentifiable-without-metric-marks")


if __name__ == "__main__":
    unittest.main()
