import json
import unittest
from pathlib import Path
from unittest.mock import patch

import cv2
import numpy as np

from ref_image_query import ReferenceImageQuery


CONFIG = json.loads((Path(__file__).resolve().parents[1] / 'config/vision.yaml').read_text())
INTRINSICS = [80, 0, 50, 0, 80, 50, 0, 0, 1]


class FixedSift:
    def __init__(self, points, descriptors):
        self.points = points
        self.descriptors = descriptors

    def detectAndCompute(self, _pixels, _mask):
        return self.points, self.descriptors


class ReferenceViewQueryTests(unittest.TestCase):
    def matcher(self):
        points = [cv2.KeyPoint(float(x), float(y), 1) for x, y in
                  [(10, 10), (75, 12), (12, 70), (74, 75), (32, 26), (50, 44), (23, 49), (63, 60)]]
        descriptors = np.eye(8, 128, dtype=np.float32)
        matcher = ReferenceImageQuery.__new__(ReferenceImageQuery)
        matcher.config = CONFIG
        matcher.sift = FixedSift(points, descriptors)
        matcher.references = [(points, descriptors, {i: i for i in range(8)}),
                              (points, descriptors, {i: i+8 for i in range(8)})]
        matcher.landmarks = [{'id': f'lm{i}', 'position': [float(i), 0, 1]} for i in range(16)]
        return matcher

    def test_each_reference_lifts_only_its_own_landmark_ids(self):
        matcher = self.matcher()
        seen = []

        def estimate(_xyz, _pixels, _k, _size, ids, _config):
            seen.append(ids)
            return {'accepted': True, 'reason': 'fixture', 'inliers': len(ids), 'navigationReady': False}

        with patch('ref_image_query.estimate_pose', side_effect=estimate):
            report = matcher.query_by_reference(np.zeros((100, 100), np.uint8), INTRINSICS)
        self.assertEqual(len(seen), 2)
        self.assertEqual(seen[0], [f'lm{i}' for i in range(8)])
        self.assertEqual(seen[1], [f'lm{i}' for i in range(8, 16)])
        self.assertEqual([item['referenceIndex'] for item in report['candidates']], [0, 1])
        self.assertFalse(report['navigationReady'])
        self.assertFalse(report['arrowAuthorized'])

    def test_blank_frame_has_no_candidate_and_no_arrow(self):
        matcher = ReferenceImageQuery.__new__(ReferenceImageQuery)
        matcher.config = CONFIG
        matcher.sift = cv2.SIFT_create(nfeatures=200)
        matcher.references = [(None, None, {})]
        matcher.landmarks = []
        report = matcher.query_by_reference(np.zeros((100, 100), np.uint8), INTRINSICS)
        self.assertEqual(report['candidates'], [])
        self.assertFalse(report['navigationReady'])
        self.assertFalse(report['arrowAuthorized'])

    def test_repeated_query_pixel_does_not_invalidate_reference_hypothesis(self):
        matcher = self.matcher()
        original_points = matcher.sift.points
        repeated = [*original_points, cv2.KeyPoint(*original_points[0].pt, 1)]
        descriptors = np.eye(9, 128, dtype=np.float32)
        matcher.sift = FixedSift(repeated, descriptors)
        matcher.references = [(repeated, descriptors, {i: i for i in range(9)})]
        matcher.landmarks = [{'id': f'lm{i}', 'position': [float(i), 0, 1]}
                             for i in range(9)]
        with patch('ref_image_query.estimate_pose') as estimate:
            estimate.return_value = {'accepted': True, 'reason': 'fixture'}
            matcher.query_by_reference(np.zeros((100, 100), np.uint8), INTRINSICS)
        self.assertEqual(len(estimate.call_args.args[1]), 8)


if __name__ == '__main__':
    unittest.main()
