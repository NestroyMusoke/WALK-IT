import json
import unittest
from pathlib import Path

import cv2
import numpy as np

from marker_anchor import estimate_marker_pose, estimate_start_marker_pose


CFG = json.loads((Path(__file__).resolve().parents[1] / 'config/vision.yaml').read_text())
EDGE_M = CFG['MARKER_BLACK_SQUARE_EDGE_M']
OBJECT = np.array([[-EDGE_M/2, EDGE_M/2, 0], [EDGE_M/2, EDGE_M/2, 0],
                   [EDGE_M/2, -EDGE_M/2, 0], [-EDGE_M/2, -EDGE_M/2, 0]], np.float64)
K = np.array([[700., 0., 320.], [0., 700., 240.], [0., 0., 1.]])


class MarkerPoseTests(unittest.TestCase):
    def corners(self, rotation, translation):
        return cv2.projectPoints(OBJECT, np.asarray(rotation, float),
                                 np.asarray(translation, float), K, None)[0].reshape(4, 2)

    def test_tilted_square_recovers_metric_camera_pose(self):
        rvec = np.array([0.25, -0.18, 0.05])
        tvec = np.array([0.01, -0.02, 0.9])
        result = estimate_marker_pose(self.corners(rvec, tvec), K, CFG)
        expected_rotation = cv2.Rodrigues(rvec)[0]
        expected_center = -expected_rotation.T @ tvec
        self.assertTrue(result['accepted'], result)
        np.testing.assert_allclose(result['cameraCenterMarkerM'], expected_center, atol=0.01)
        actual_rotation = np.asarray(result['markerToCameraRotation']).reshape(3, 3)
        delta = actual_rotation @ expected_rotation.T
        angle = np.degrees(np.arccos(np.clip((np.trace(delta)-1)/2, -1, 1)))
        self.assertLess(angle, 1)
        self.assertFalse(result['arrowAuthorized'])

    def test_frontal_square_is_ambiguous(self):
        result = estimate_marker_pose(self.corners([0, 0, 0], [0, 0, 1]), K, CFG)
        self.assertFalse(result['accepted'])
        self.assertFalse(result['arrowAuthorized'])

    def test_invalid_and_small_inputs_refuse(self):
        corners = self.corners([0.25, -0.18, 0.05], [0, 0, 0.9])
        for candidate, calibration in [(corners[:3], K), (corners, np.eye(3)),
                                       (corners/100, K)]:
            result = estimate_marker_pose(candidate, calibration, CFG)
            self.assertFalse(result['accepted'], result)
            self.assertFalse(result['arrowAuthorized'])

    def test_missing_marker_refuses(self):
        result = estimate_start_marker_pose(np.full((480, 640), 255, np.uint8), K, CFG)
        self.assertFalse(result['accepted'])
        self.assertFalse(result['arrowAuthorized'])

    def test_far_but_detectable_marker_cannot_establish_start_anchor(self):
        result = estimate_marker_pose(self.corners([0.25, -0.18, 0.05],
                                                    [0.01, -0.02, 2.4]), K, CFG)
        self.assertFalse(result['accepted'], result)
        self.assertEqual(result['reason'], 'marker-too-far')

    def test_inconsistent_corners_refuse_high_reprojection_error(self):
        corners = self.corners([0.25, -0.18, 0.05], [0, 0, 0.9])
        corners[0] += [25, -20]
        result = estimate_marker_pose(corners, K, CFG)
        self.assertFalse(result['accepted'], result)
        self.assertIn(result['reason'], ('high-reprojection-error', 'ambiguous-or-invalid-pose'))

    def test_detected_warped_marker_flows_into_metric_pose(self):
        dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
        marker = cv2.aruco.generateImageMarker(dictionary, CFG['MARKER_ID'], 400)
        rvec = np.array([np.pi - 0.25, -0.18, 0.05])
        tvec = np.array([0.01, -0.02, 0.9])
        corners = self.corners(rvec, tvec).astype(np.float32)
        source = np.float32([[0, 0], [399, 0], [399, 399], [0, 399]])
        warp = cv2.getPerspectiveTransform(source, corners)
        image = cv2.warpPerspective(marker, warp, (640, 480),
                                    flags=cv2.INTER_NEAREST, borderValue=255)
        result = estimate_start_marker_pose(image, K, CFG)
        self.assertTrue(result['accepted'], result)
        expected = -cv2.Rodrigues(rvec)[0].T @ tvec
        np.testing.assert_allclose(result['cameraCenterMarkerM'], expected, atol=0.03)


if __name__ == '__main__':
    unittest.main()
