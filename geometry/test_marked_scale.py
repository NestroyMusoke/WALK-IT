import unittest

from marked_scale import analyze_marks


def event(label, t, x):
    return {"kind": "step", "label": label, "t": t,
            "values": [t, t / 1000, x, 0, 0, 0, 0, 0, 1]}


class MarkedScaleTest(unittest.TestCase):
    def test_reports_each_marked_segment_without_claiming_navigation(self):
        events = [event(f"mark-{i*2}m", i*1000, i) for i in range(6)]
        result = analyze_marks(events, [0, 1.992, 3.984, 5.976, 7.968, 9.960])
        self.assertEqual(result["status"], "complete-marked-diagnostic")
        self.assertEqual(result["markCount"], 6)
        self.assertAlmostEqual(result["segments"][0]["trackerUnitsPerMeter"], 1/1.992)
        self.assertFalse(result["navigationReady"])
        self.assertFalse(result["metricScaleVerified"])

    def test_missing_or_duplicate_marks_cannot_pass(self):
        marks = [0, 1.992, 3.984, 5.976, 7.968, 9.960]
        events = [event(f"mark-{i*2}m", i*1000, i) for i in range(5)]
        self.assertEqual(analyze_marks(events, marks)["status"], "incomplete-marks")
        with self.assertRaises(ValueError):
            analyze_marks(events + [events[-1]], marks)


if __name__ == "__main__":
    unittest.main()
