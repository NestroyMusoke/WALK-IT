"""The window search may only re-offer views; it may never relax a gate."""
import hashlib
import json
import unittest
from pathlib import Path

import cv2
import numpy as np

from calibration_window import SELECTION_RULE, select_calibration_window
from marker_scale import calibrate_marker_to_session
from geometry.test_marker_scale import MARKER_CENTERS, SESSION_CENTERS, ROTATION

CFG = json.loads((Path(__file__).resolve().parents[1] / 'config/vision.yaml').read_text())
CFG_SHA = hashlib.sha256(json.dumps(CFG, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
FLIP = np.diag([1., -1., -1.])


def yaw(angle):
    return np.array([[np.cos(angle), 0, np.sin(angle)], [0, 1., 0],
                     [-np.sin(angle), 0, np.cos(angle)]])


def clumsy_walk(deg_per_frame, tracker_x, scale=0.15, depth=-0.9):
    """A person stands still while the tracker settles, then walks sideways."""
    rotation = yaw(np.deg2rad(20))
    tracker = np.array([[x, 0., 0.] for x in tracker_x])
    metric = scale * tracker @ rotation.T + [0., 0., depth]
    observations = []
    for index, (degrees, position) in enumerate(zip(deg_per_frame, tracker)):
        perturbed = yaw(np.deg2rad(degrees)) @ rotation
        observations.append({
            'frameId': f'c{index}', 'imageVideoTime': float(index), 'poseVideoTime': float(index),
            'markerId': CFG['MARKER_ID'], 'accepted': True, 'configSha256': CFG_SHA,
            'opencvVersion': cv2.__version__, 'cameraCenterMarkerM': metric[index].tolist(),
            'trackerCameraCenter': position.tolist(),
            'markerToCameraRotation': (FLIP @ perturbed.T).reshape(9).tolist(),
            'trackerRotation': [0., 0., 0., 1.]})
    return observations


SETTLING = clumsy_walk([20, 14, 8, 0, 0, 0, 0, 0], [0, .05, .12, .9, 1.7, 2.5, 3.3, 4.2])
STATIONARY = clumsy_walk([0] * 8, [0, .01, .02, .03, .04, .05, .06, .07])


class CalibrationWindowTests(unittest.TestCase):
    def test_unsettled_leading_views_cannot_veto_a_later_consistent_walk(self):
        whole = calibrate_marker_to_session(SETTLING, CFG)
        self.assertFalse(whole['accepted'], whole)
        self.assertEqual(whole['reason'], 'inconsistent-marker-orientation')
        found = select_calibration_window(SETTLING, CFG)
        self.assertTrue(found['accepted'], found)
        selection = found['windowSelection']
        self.assertTrue(selection['accepted'])
        self.assertGreaterEqual(selection['discardedLeadingObservationCount'], 1)
        self.assertEqual(selection['selectedObservationCount'],
                         len(SETTLING) - selection['selectedStartIndex'])
        self.assertEqual(selection['selectedFrameIds'],
                         [o['frameId'] for o in SETTLING[selection['selectedStartIndex']:]])
        self.assertEqual(selection['reasonSource'], 'best-conditioned-suffix-window')
        self.assertEqual(selection['rule'], SELECTION_RULE)
        self.assertEqual(found['observationCount'], selection['selectedObservationCount'])
        self.assertFalse(found['arrowAuthorized'])
        self.assertFalse(found['metricScaleVerified'])
        # The chosen window must satisfy the untouched gate on its own.
        independent = calibrate_marker_to_session(SETTLING[selection['selectedStartIndex']:], CFG)
        self.assertTrue(independent['accepted'], independent)
        self.assertEqual(independent['markerToSession'], found['markerToSession'])

    def test_the_newest_view_is_never_discarded(self):
        selection = select_calibration_window(SETTLING, CFG)['windowSelection']
        self.assertEqual(selection['selectedObservationCount'] + selection['selectedStartIndex'],
                         selection['totalObservationCount'])
        self.assertIn('c7', selection['selectedFrameIds'])

    def test_a_walk_that_never_reaches_the_baseline_still_refuses(self):
        found = select_calibration_window(STATIONARY, CFG)
        self.assertFalse(found['accepted'])
        self.assertEqual(found['reason'], 'insufficient-metric-baseline')
        selection = found['windowSelection']
        self.assertFalse(selection['accepted'])
        self.assertEqual(selection['passingWindowCount'], 0)
        self.assertEqual(selection['reasonSource'], 'best-conditioned-suffix-window')
        self.assertLess(found['markerBaselineM'], CFG['ANCHOR_MIN_START_BASELINE_M'])

    def test_too_few_observations_report_the_whole_buffer(self):
        found = select_calibration_window(SETTLING[:3], CFG)
        self.assertFalse(found['accepted'])
        self.assertEqual(found['reason'], 'insufficient-observations')
        self.assertEqual(found['windowSelection']['candidateWindowCount'], 0)
        self.assertEqual(found['windowSelection']['reasonSource'], 'whole-buffer')
        self.assertIsNone(found['windowSelection']['selectedStartIndex'])

    def test_stricter_configuration_is_honoured_not_bypassed(self):
        strict = {**CFG, 'ANCHOR_MIN_START_BASELINE_M': 5.0}
        self.assertFalse(select_calibration_window(SETTLING, strict)['accepted'])

    def test_selection_is_deterministic(self):
        first = select_calibration_window(SETTLING, CFG)['windowSelection']
        second = select_calibration_window(list(SETTLING), CFG)['windowSelection']
        self.assertEqual(first, second)

    def test_a_consistent_buffer_keeps_every_view(self):
        observations = [{'frameId': f'f{i}', 'imageVideoTime': float(i), 'poseVideoTime': float(i),
                         'markerId': CFG['MARKER_ID'], 'accepted': True, 'configSha256': CFG_SHA,
                         'opencvVersion': cv2.__version__, 'cameraCenterMarkerM': a.tolist(),
                         'trackerCameraCenter': b.tolist(),
                         'markerToCameraRotation': (FLIP @ ROTATION).reshape(9).tolist(),
                         'trackerRotation': [0., 0., 0., 1.]}
                        for i, (a, b) in enumerate(zip(MARKER_CENTERS, SESSION_CENTERS))]
        found = select_calibration_window(observations, CFG)
        self.assertTrue(found['accepted'], found)
        self.assertEqual(found['windowSelection']['selectedStartIndex'], 0)
        self.assertEqual(found['windowSelection']['selectedObservationCount'], len(observations))
        self.assertEqual(found['windowSelection']['discardedLeadingObservationCount'], 0)
        np.testing.assert_allclose(found['markerToSession']['rotation'],
                                   calibrate_marker_to_session(observations, CFG)['markerToSession']['rotation'])


if __name__ == '__main__':
    unittest.main()
