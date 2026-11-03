import hashlib
import json
import unittest
from pathlib import Path

import numpy as np
import cv2

from marker_scale import calibrate_marker_to_session, session_points_to_marker_m
from marker_anchor import estimate_marker_pose


CFG = json.loads((Path(__file__).resolve().parents[1] / 'config/vision.yaml').read_text())
CFG_SHA = hashlib.sha256(json.dumps(CFG, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
MARKER_CENTERS = np.array([[0., 0., -0.8], [0.2, 0., -0.85], [0.3, 0.08, -0.9],
                           [0.45, 0., -1.05], [0.6, -0.05, -1.15]])
ROTATION = np.array([[0., 0., 1.], [0., 1., 0.], [-1., 0., 0.]])
SESSION_CENTERS = 4. * MARKER_CENTERS @ ROTATION.T + [1., 2., 3.]


class MarkerScaleTests(unittest.TestCase):
    def test_orientation_aided_lateral_sway_recovers_rotation_without_3d_center_spread(self):
        angle = np.deg2rad(35)
        rotation = np.array([[np.cos(angle), -np.sin(angle), 0],
                             [np.sin(angle), np.cos(angle), 0], [0, 0, 1.]])
        tracker = np.array([[0., 0., 0.], [0.75, 0., 0.], [1.5, 0., 0.],
                            [2.25, 0., 0.], [3., 0., 0.]])
        metric = 0.2 * tracker @ rotation.T + [0., 0., -0.9]
        marker_to_camera = (np.diag([1., -1., -1.]) @ rotation.T).reshape(9).tolist()
        observations = [{'frameId': f'f{i}', 'imageVideoTime': float(i),
                         'poseVideoTime': float(i), 'markerId': CFG['MARKER_ID'],
                         'accepted': True, 'configSha256': CFG_SHA,
                         'opencvVersion': cv2.__version__,
                         'cameraCenterMarkerM': metric[i].tolist(),
                         'trackerCameraCenter': tracker[i].tolist(),
                         'markerToCameraRotation': marker_to_camera,
                         'trackerRotation': [0., 0., 0., 1.]}
                        for i in range(5)]
        result = calibrate_marker_to_session(observations, CFG)
        self.assertTrue(result['accepted'], result)
        np.testing.assert_allclose(result['trackerToMarker']['rotation'], rotation.reshape(9), atol=1e-6)
        self.assertAlmostEqual(result['trackerToMarker']['scale'], 0.2, places=6)
        np.testing.assert_allclose(session_points_to_marker_m(tracker, result), metric, atol=1e-6)

    def test_high_tracker_scale_lateral_sway_uses_wide_frame_pairs(self):
        tracker = np.array([[i * 0.02, 0., 0.] for i in range(8)])
        metric = 4.79 * tracker + [0., 0., -0.9]
        marker_to_camera = np.diag([1., -1., -1.]).reshape(9).tolist()
        observations = [{'frameId': f'h{i}', 'imageVideoTime': float(i),
                         'poseVideoTime': float(i), 'markerId': CFG['MARKER_ID'],
                         'accepted': True, 'configSha256': CFG_SHA,
                         'opencvVersion': cv2.__version__,
                         'cameraCenterMarkerM': metric[i].tolist(),
                         'trackerCameraCenter': tracker[i].tolist(),
                         'markerToCameraRotation': marker_to_camera,
                         'trackerRotation': [0., 0., 0., 1.]}
                        for i in range(8)]
        result = calibrate_marker_to_session(observations, CFG)
        self.assertTrue(result['accepted'], result)
        self.assertAlmostEqual(result['trackerToMarker']['scale'], 4.79, places=6)

    def observations(self):
        marker_to_camera = (np.diag([1., -1., -1.]) @ ROTATION).reshape(9).tolist()
        return [{'frameId': f'f{i}', 'imageVideoTime': float(i),
                 'poseVideoTime': float(i), 'markerId': CFG['MARKER_ID'],
                 'accepted': True, 'configSha256': CFG_SHA, 'opencvVersion': cv2.__version__,
                 'cameraCenterMarkerM': a.tolist(), 'trackerCameraCenter': b.tolist(),
                 'markerToCameraRotation': marker_to_camera,
                 'trackerRotation': [0., 0., 0., 1.]}
                for i, (a, b) in enumerate(zip(MARKER_CENTERS, SESSION_CENTERS))]

    def test_recovers_marker_to_session_and_route_inverse(self):
        result = calibrate_marker_to_session(self.observations(), CFG)
        self.assertTrue(result['accepted'], result)
        self.assertAlmostEqual(result['markerToSession']['scale'], 4., places=6)
        converted = session_points_to_marker_m(SESSION_CENTERS, result)
        np.testing.assert_allclose(converted, MARKER_CENTERS, atol=0.01)
        self.assertFalse(result['metricScaleVerified'])
        self.assertFalse(result['arrowAuthorized'])

    def test_mixed_marker_duplicate_unsynced_and_short_traces_refuse(self):
        variants = []
        base = self.observations()
        variants.append(base[:3])
        mixed = self.observations(); mixed[2]['markerId'] += 1; variants.append(mixed)
        duplicate = self.observations(); duplicate[2]['frameId'] = duplicate[1]['frameId']; variants.append(duplicate)
        unsynced = self.observations(); unsynced[2]['poseVideoTime'] += 1; variants.append(unsynced)
        for samples in variants:
            result = calibrate_marker_to_session(samples, CFG)
            self.assertFalse(result['accepted'], result)
            self.assertFalse(result['arrowAuthorized'])

    def test_inconsistent_center_refuses(self):
        observations = self.observations()
        observations[-1]['trackerCameraCenter'][0] += 5
        result = calibrate_marker_to_session(observations, CFG)
        self.assertFalse(result['accepted'], result)
        self.assertFalse(result['arrowAuthorized'])

    def test_missing_orientation_and_outlier_scale_refuse_even_with_small_center_residual(self):
        missing = self.observations()
        del missing[2]['markerToCameraRotation']
        self.assertEqual(calibrate_marker_to_session(missing, CFG)['reason'],
                         'missing-or-invalid-orientation')
        stretched = self.observations()
        stretched[2]['cameraCenterMarkerM'][0] += 0.12
        self.assertFalse(calibrate_marker_to_session(stretched, CFG)['accepted'])
        spun = self.observations()
        spun[2]['trackerRotation'] = [0., 0., 1., 0.]
        self.assertEqual(calibrate_marker_to_session(spun, CFG)['reason'],
                         'inconsistent-marker-orientation')

    def test_projected_marker_corners_feed_calibration(self):
        edge = CFG['MARKER_BLACK_SQUARE_EDGE_M']
        half = edge / 2
        square = np.array([[-half, half, 0], [half, half, 0],
                           [half, -half, 0], [-half, -half, 0]], float)
        k = np.array([[700., 0., 320.], [0., 700., 240.], [0., 0., 1.]])
        rvec = np.array([0.25, -0.18, 0.05])
        rotation = cv2.Rodrigues(rvec)[0]
        observations = self.observations()
        translations = [[-0.25, -0.02, 0.9], [-0.10, -0.02, 0.9],
                        [0.05, 0.07, 0.95], [0.20, 0.06, 1.02],
                        [0.35, -0.06, 1.10]]
        expected_centers = []
        for i, translation in enumerate(translations):
            tvec = np.asarray(translation, float)
            center = -rotation.T @ tvec
            corners = cv2.projectPoints(square, rvec, tvec, k, None)[0].reshape(4, 2)
            pose = estimate_marker_pose(corners, k, CFG)
            self.assertTrue(pose['accepted'], (i, pose))
            observations[i]['cameraCenterMarkerM'] = pose['cameraCenterMarkerM']
            marker_to_camera = np.asarray(pose['markerToCameraRotation']).reshape(3, 3)
            tracker_to_marker = marker_to_camera.T @ np.diag([1., -1., -1.])
            observations[i]['trackerCameraCenter'] = (4. * center @ tracker_to_marker).tolist()
            observations[i]['markerToCameraRotation'] = pose['markerToCameraRotation']
            observations[i]['trackerRotation'] = [0., 0., 0., 1.]
            expected_centers.append(center)
        result = calibrate_marker_to_session(observations, CFG)
        self.assertTrue(result['accepted'], result)
        np.testing.assert_allclose(session_points_to_marker_m(
            [o['trackerCameraCenter'] for o in observations], result), expected_centers, atol=0.01)


if __name__ == '__main__':
    unittest.main()
