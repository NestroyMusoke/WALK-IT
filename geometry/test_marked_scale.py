import unittest
import json
import tempfile
from pathlib import Path

from marked_scale import analyze_marks, load_backup_events


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

    def test_uses_latest_recording_after_an_aborted_attempt(self):
        events = [event("mark-0m", 1, 0),
                  {"kind": "step", "label": "host-recording-started", "t": 2, "values": []},
                  event("mark-0m", 3, 0), event("mark-2m", 4, 1)]
        result = analyze_marks(events, [0, 1.992])
        self.assertEqual(result["status"], "complete-marked-diagnostic")
        self.assertEqual(result["segments"][0]["displacementTrackerUnits"], 1)

    def test_downloaded_evidence_backup_recovers_marks_without_server_logs(self):
        sha = "a" * 64
        marks = [event(f"mark-{i*2}m", i*1000, i) for i in range(6)]
        envelope = {"schemaVersion": 2,
                    "capture": {"manifest": {"configSha256": sha}, "images": [], "timing": []},
                    "diagnostic": {"configSha256": sha, "events": marks}}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "private.json"
            path.write_text(json.dumps(envelope))
            result = load_backup_events(path)
            self.assertEqual(result["events"], marks)
            self.assertEqual(result["configSha256"], sha)
            self.assertEqual(analyze_marks(result["events"], [0, 1.992, 3.984, 5.976, 7.968, 9.960])["markCount"], 6)
            path.write_text(json.dumps(envelope["capture"]))
            with self.assertRaises(ValueError):
                load_backup_events(path)


if __name__ == "__main__":
    unittest.main()
