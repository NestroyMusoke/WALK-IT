import base64
import hashlib
import json
import unittest

import cv2
import numpy as np

from author_intake import audit_author_capture


def fixture():
    frames = []
    images = []
    encoded = base64.b64encode(cv2.imencode('.png', np.zeros((24, 32), np.uint8))[1]).decode()
    for index in range(12):
        name = f'kf{index}'
        frames.append({'id': name, 'width': 32, 'height': 24,
                       'intrinsics': [20, 0, 16, 0, 20, 12, 0, 0, 1],
                       'position': [index, 0, 0], 'rotation': [0, 0, 0, 1]})
        images.append({'id': name, 'png': encoded})
    capture = {'manifest': {'privacy': {'capturePermitted': True, 'imagesReviewed': True},
                            'configSha256': 'a' * 64, 'keyframes': frames,
                            'path': [{'keyframeId': f['id'], 'position': f['position']} for f in frames],
                            'destination': {'pathIndex': 11, 'keyframeId': 'kf11'}},
               'images': images}
    raw = json.dumps(capture).encode()
    model = {'captureSha256': hashlib.sha256(raw).hexdigest(), 'opencv': '5.0.0',
             'geometryConfigSha256': 'b' * 64,
             'coverageByKeyframe': {f['id']: 9 for f in frames}}
    cfg = {'START_MAP_FRAME_CAPACITY_COUNT': 10, 'LOCALIZER_MIN_INLIERS_COUNT': 8,
           'GEOMETRY_TRACK_MIN_VIEWS_COUNT': 3}
    return raw, json.dumps(model).encode(), cfg


class AuthorIntakeTests(unittest.TestCase):
    def test_complete_capture_is_only_an_intake_candidate(self):
        raw, map_raw, cfg = fixture()
        result = audit_author_capture(raw, map_raw, cfg, 'b' * 64)
        self.assertTrue(result['dataComplete'])
        self.assertEqual(result['startCoveredFrames'], 10)
        self.assertEqual(result['destinationCoveredFrames'], 3)
        self.assertEqual(result['startViewSpanDeg'], 0)
        self.assertFalse(result['navigationReady'])
        self.assertFalse(result['arrowAuthorized'])

    def test_private_review_and_source_identity_are_required(self):
        raw, map_raw, cfg = fixture()
        model = json.loads(map_raw)
        model['captureSha256'] = '0' * 64
        with self.assertRaises(ValueError):
            audit_author_capture(raw, json.dumps(model).encode(), cfg, 'b' * 64)
        capture = json.loads(raw)
        capture['manifest']['privacy']['imagesReviewed'] = False
        with self.assertRaises(ValueError):
            audit_author_capture(json.dumps(capture).encode(), map_raw, cfg, 'b' * 64)

    def test_invalid_image_and_missing_end_coverage_refuse(self):
        raw, map_raw, cfg = fixture()
        capture = json.loads(raw)
        capture['images'][0]['png'] = 'not png'
        changed = json.dumps(capture).encode()
        model = json.loads(map_raw)
        model['captureSha256'] = hashlib.sha256(changed).hexdigest()
        with self.assertRaises(ValueError):
            audit_author_capture(changed, json.dumps(model).encode(), cfg, 'b' * 64)
        model = json.loads(map_raw)
        model['coverageByKeyframe']['kf11'] = 0
        result = audit_author_capture(raw, json.dumps(model).encode(), cfg, 'b' * 64)
        self.assertFalse(result['dataComplete'])
        self.assertEqual(result['destinationCoveredFrames'], 2)

    def test_start_view_span_uses_camera_directions(self):
        raw, map_raw, cfg = fixture()
        capture = json.loads(raw)
        capture['manifest']['keyframes'][9]['rotation'] = [0, 2**-0.5, 0, 2**-0.5]
        changed = json.dumps(capture).encode()
        model = json.loads(map_raw)
        model['captureSha256'] = hashlib.sha256(changed).hexdigest()
        result = audit_author_capture(changed, json.dumps(model).encode(), cfg, 'b' * 64)
        self.assertAlmostEqual(result['startViewSpanDeg'], 90, places=5)


if __name__ == '__main__':
    unittest.main()
