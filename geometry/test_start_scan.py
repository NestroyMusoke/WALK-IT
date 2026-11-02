import copy
import hashlib
import json
import unittest
from pathlib import Path

from start_scan import evaluate_reviewed_start_scan


CFG_BYTES = (Path(__file__).resolve().parents[1] / "config/vision.yaml").read_bytes()
CFG = json.loads(CFG_BYTES)
CFG_SHA = hashlib.sha256(CFG_BYTES).hexdigest()


def fixture():
    landmark = {
        "id": "lm0", "position": [1, 2, 3], "descriptor": [1.0] * 128,
        "observations": [{"keyframeId": f"kf{i}", "featureIndex": 0, "pixel": [10, 20]} for i in range(3)],
        "maxReprojectionErrorPx": 1.0, "maxParallaxDeg": 2.0,
    }
    source = b"different-author-capture"
    model = {
        "schemaVersion": 1, "descriptorType": "SIFT-float32-128-L2", "units": "tracker",
        "scaleVerified": False, "navigationReady": False,
        "captureSha256": hashlib.sha256(source).hexdigest(),
        "captureConfigSha256": "b" * 64, "geometryConfigSha256": CFG_SHA,
        "landmarkCount": 1, "landmarks": [landmark],
    }
    frames = [{"id": f"q{i}", "width": 100, "height": 100, "intrinsics": [1, 0, 50, 0, 1, 50, 0, 0, 1]}
              for i in range(CFG["START_MAP_FRAME_CAPACITY_COUNT"] + 2)]
    capture = {
        "purpose": "visitor-start-scan",
        "manifest": {"privacy": {"capturePermitted": True, "imagesReviewed": True},
                     "configSha256": "c" * 64, "keyframes": frames},
        "images": [{"id": frame["id"], "png": "private"} for frame in frames],
    }
    return model, capture


class StartScanTests(unittest.TestCase):
    def test_records_every_bounded_attempt_without_claiming_a_live_anchor(self):
        model, capture = fixture()
        calls = []

        def query(image, frame, *_):
            calls.append(frame["id"])
            return {"accepted": True, "cameraCenter": [1, 2, 3], "descriptorMatches": 9}

        report = evaluate_reviewed_start_scan(model, capture, CFG, CFG_SHA, query=query)
        self.assertEqual(calls, [f"q{i}" for i in range(CFG["START_MAP_FRAME_CAPACITY_COUNT"])])
        self.assertEqual(report["attemptedFrames"], len(calls))
        self.assertEqual(report["acceptedHypotheses"], len(calls))
        self.assertEqual(report["geometryConfigSha256"], CFG_SHA)
        self.assertEqual(report["capturePurpose"], "visitor-start-scan")
        self.assertEqual(report["reason"], "offline-query-only-live-freshness-unknown")
        self.assertFalse(report["navigationReady"])
        self.assertFalse(report["arrowAuthorized"])
        self.assertNotIn("private", json.dumps(report))

    def test_refuses_unreviewed_same_source_mismatched_or_short_scan(self):
        model, capture = fixture()
        cases = []
        unreviewed = copy.deepcopy(capture)
        unreviewed["manifest"]["privacy"]["imagesReviewed"] = False
        cases.append((model, unreviewed))
        mismatched = copy.deepcopy(capture)
        mismatched["images"][0]["id"] = "wrong"
        cases.append((model, mismatched))
        short = copy.deepcopy(capture)
        short["images"] = short["images"][:2]
        short["manifest"]["keyframes"] = short["manifest"]["keyframes"][:2]
        cases.append((model, short))
        same_source = copy.deepcopy(model)
        same_source["captureSha256"] = hashlib.sha256(json.dumps(capture, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        cases.append((same_source, capture))
        wrong_role = copy.deepcopy(capture)
        wrong_role["purpose"] = "admin"
        cases.append((model, wrong_role))
        for bad_map, bad_capture in cases:
            with self.subTest(case=len(cases)):
                with self.assertRaises(ValueError):
                    evaluate_reviewed_start_scan(bad_map, bad_capture, CFG, CFG_SHA, query=lambda *_: {})

    def test_refuses_mismatched_geometry_configuration(self):
        model, capture = fixture()
        model["geometryConfigSha256"] = "d" * 64
        with self.assertRaises(ValueError):
            evaluate_reviewed_start_scan(model, capture, CFG, CFG_SHA, query=lambda *_: {})

    def test_invalid_frame_counts_as_a_refused_attempt(self):
        model, capture = fixture()

        def query(image, frame, *_):
            if frame["id"] == "q2":
                raise ValueError("private image decoder detail")
            return {"accepted": False, "reason": "no-valid-candidate", "descriptorMatches": 0}

        report = evaluate_reviewed_start_scan(model, capture, CFG, CFG_SHA, query=query)
        self.assertEqual(report["attemptedFrames"], CFG["START_MAP_FRAME_CAPACITY_COUNT"])
        self.assertEqual(report["results"][2]["reason"], "invalid-query-frame")
        self.assertNotIn("private image decoder detail", json.dumps(report))


if __name__ == "__main__":
    unittest.main()
