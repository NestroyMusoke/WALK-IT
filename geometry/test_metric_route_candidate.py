import base64
import hashlib
import json
import unittest
from pathlib import Path
from unittest.mock import patch

import cv2
import numpy as np

from metric_route_candidate import build_metric_route_candidate


ROOT = Path(__file__).resolve().parents[1]
CONFIG_BYTES = (ROOT / 'config/vision.yaml').read_bytes()
CONFIG = json.loads(CONFIG_BYTES)
CONFIG_SHA = hashlib.sha256(CONFIG_BYTES).hexdigest()
CANONICAL_SHA = hashlib.sha256(json.dumps(CONFIG, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
CENTERS_M = np.array([[0., 0., -0.8], [0.2, 0., -0.85], [0.3, 0.08, -0.9],
                      [0.45, 0., -1.05], [0.6, -0.05, -1.15]])
ROTATION = np.array([[0., 0., 1.], [0., 1., 0.], [-1., 0., 0.]])
TRACKER = 4 * CENTERS_M @ ROTATION.T + [1., 2., 3.]


def capture():
    image = np.full((480, 640), 255, np.uint8)
    encoded = base64.b64encode(cv2.imencode('.png', image)[1]).decode()
    frames = [{'id': f'kf{i}', 'width': 640, 'height': 480,
               'intrinsics': [700, 0, 320, 0, 700, 240, 0, 0, 1],
               'position': position.tolist(), 'rotation': [0, 0, 0, 1]}
              for i, position in enumerate(TRACKER)]
    return {'purpose': 'author-route',
            'manifest': {'schemaVersion': 1, 'routeId': 'fixture', 'source': 'captured',
                         'units': 'tracker', 'scaleVerified': False, 'configSha256': CONFIG_SHA,
                         'privacy': {'capturePermitted': True, 'imagesReviewed': True},
                         'keyframes': frames,
                         'path': [{'keyframeId': f['id'], 'position': f['position']} for f in frames],
                         'destination': {'pathIndex': 4, 'keyframeId': 'kf4'}},
            'images': [{'id': f'kf{i}', 'png': encoded} for i in range(5)],
            'timing': [{'id': f'kf{i}', 'receivedAtMs': i*1000, 'videoTime': float(i)}
                       for i in range(5)]}


def poses():
    return [{'accepted': True, 'markerId': CONFIG['MARKER_ID'],
             'cameraCenterMarkerM': center.tolist(), 'opencvVersion': cv2.__version__,
             'markerToCameraRotation': (np.diag([1., -1., -1.]) @ ROTATION).reshape(9).tolist(),
             'configSha256': CANONICAL_SHA}
            for center in CENTERS_M]


class MetricRouteCandidateTests(unittest.TestCase):
    def run_candidate(self, data):
        raw = json.dumps(data).encode()
        with patch('metric_route_candidate.estimate_start_marker_pose', side_effect=poses()):
            return build_metric_route_candidate(raw, CONFIG, CONFIG_BYTES), raw

    def test_reviewed_capture_yields_private_metric_path_hypothesis(self):
        result, raw = self.run_candidate(capture())
        self.assertTrue(result['accepted'], result)
        self.assertEqual(result['sourceCaptureSha256'], hashlib.sha256(raw).hexdigest())
        self.assertEqual(result['configSha256'], CONFIG_SHA)
        self.assertEqual(result['markerObservationCount'], 5)
        np.testing.assert_allclose([p['position'] for p in result['path']], CENTERS_M, atol=0.01)
        self.assertFalse(result['scaleVerified'])
        self.assertFalse(result['navigationReady'])
        self.assertFalse(result['arrowAuthorized'])
        self.assertNotIn('images', result)

    def test_bad_privacy_purpose_and_timing_refuse(self):
        variants = []
        bad = capture(); bad['manifest']['privacy']['imagesReviewed'] = False; variants.append(bad)
        bad = capture(); bad['purpose'] = 'visitor-start-scan'; variants.append(bad)
        bad = capture(); bad['timing'][1]['id'] = 'kf0'; variants.append(bad)
        bad = capture(); bad['timing'][1]['videoTime'] = bad['timing'][0]['videoTime']; variants.append(bad)
        bad = capture(); bad['images'][0]['png'] = 'broken'; variants.append(bad)
        bad = capture(); bad['images'][0]['width'] = 639; variants.append(bad)
        for data in variants:
            result, _ = self.run_candidate(data)
            self.assertFalse(result['accepted'], result)
            self.assertFalse(result['arrowAuthorized'])

    def test_too_few_marker_observations_refuse(self):
        raw = json.dumps(capture()).encode()
        detections = poses()
        detections[2:] = [{'accepted': False, 'reason': 'marker-not-found'}] * 3
        with patch('metric_route_candidate.estimate_start_marker_pose', side_effect=detections):
            result = build_metric_route_candidate(raw, CONFIG, CONFIG_BYTES)
        self.assertFalse(result['accepted'])
        self.assertEqual(result['markerObservationCount'], 2)

    def test_config_object_must_match_hashed_bytes(self):
        raw = json.dumps(capture()).encode()
        changed = dict(CONFIG, MARKER_ID=CONFIG['MARKER_ID'] + 1)
        result = build_metric_route_candidate(raw, changed, CONFIG_BYTES)
        self.assertFalse(result['accepted'])
        self.assertEqual(result['reason'], 'config-bytes-mismatch')


if __name__ == '__main__':
    unittest.main()
