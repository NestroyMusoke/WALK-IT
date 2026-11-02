import json
import unittest
from pathlib import Path

import cv2
import numpy as np

from marker_anchor import detect_start_marker


CFG = json.loads((Path(__file__).resolve().parents[1] / 'config/vision.yaml').read_text())


class MarkerAnchorTests(unittest.TestCase):
    def test_detects_only_the_configured_marker(self):
        dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
        marker = cv2.aruco.generateImageMarker(dictionary, CFG['MARKER_ID'], 400)
        image = np.full((600, 600), 255, dtype=np.uint8)
        image[100:500, 100:500] = marker
        result = detect_start_marker(image, CFG)
        self.assertEqual(result['markerId'], CFG['MARKER_ID'])
        self.assertEqual(len(result['cornersPx']), 4)
        self.assertFalse(result['navigationReady'])
        self.assertIsNone(detect_start_marker(np.full_like(image, 255), CFG))
        other = cv2.aruco.generateImageMarker(dictionary, CFG['MARKER_ID'] + 1, 400)
        image[100:500, 100:500] = other
        self.assertIsNone(detect_start_marker(image, CFG))


if __name__ == '__main__':
    unittest.main()
