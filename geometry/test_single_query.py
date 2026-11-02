import base64
import json
import unittest
from unittest.mock import patch
from pathlib import Path

import cv2
import numpy as np

from map_query import query_frame


CFG = json.loads((Path(__file__).resolve().parents[1] / "config/vision.yaml").read_text())


class SingleFrameQueryTests(unittest.TestCase):
    def test_blank_reviewed_frame_abstains_without_navigation(self):
        image = np.zeros((64, 64), dtype=np.uint8)
        ok, png = cv2.imencode(".png", image)
        self.assertTrue(ok)
        frame = {"id": "kf0", "png": base64.b64encode(png.tobytes()).decode()}
        camera = {"id": "kf0", "width": 64, "height": 64,
                  "intrinsics": [50, 0, 32, 0, 50, 32, 0, 0, 1]}
        landmarks = [{"id": "lm0", "position": np.array([0., 0., 2.]),
                      "descriptor": np.ones(128, dtype=np.float32)},
                     {"id": "lm1", "position": np.array([1., 0., 2.]),
                      "descriptor": np.ones(128, dtype=np.float32) * 2}]
        refs = np.asarray([item["descriptor"] for item in landmarks], dtype=np.float32)
        sift = cv2.SIFT_create(nfeatures=CFG["GEOMETRY_SIFT_FEATURES_COUNT"])
        result = query_frame(frame, camera, landmarks, refs, CFG, sift)
        self.assertFalse(result["accepted"])
        self.assertEqual(result["reason"], "insufficient-matches")
        self.assertFalse(result["navigationReady"])
        with self.assertRaises(ValueError):
            query_frame({**frame, "id": "wrong"}, camera, landmarks, refs, CFG, sift)
        with patch.object(cv2, "__version__", "4.9.0"):
            with self.assertRaises(RuntimeError):
                query_frame(frame, camera, landmarks, refs, CFG, sift)


if __name__ == "__main__":
    unittest.main()
