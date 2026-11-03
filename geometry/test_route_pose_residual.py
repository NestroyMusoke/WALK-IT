import hashlib
import json
import unittest
from pathlib import Path

from geometry.route_pose_residual import compare_pose_to_tracker


RAW = (Path(__file__).resolve().parents[1] / 'config/vision.yaml').read_bytes()
SHA = hashlib.sha256(RAW).hexdigest()
AUTHOR = {'direction': 'map-to-session', 'scale': 4.,
          'rotation': [0., 0., 1., 0., 1., 0., -1., 0., 0.],
          'translation': [1., 2., 3.]}
VISITOR = {'direction': 'map-to-session', 'scale': 2.,
           'rotation': [1., 0., 0., 0., 1., 0., 0., 0., 1.],
           'translation': [5., 6., 7.]}


class RoutePoseResidualTests(unittest.TestCase):
    def test_same_marker_position_across_independent_tracker_scales_has_zero_residual(self):
        result = compare_pose_to_tracker([-3., 10., -1.], [7., 10., 5.],
                                         AUTHOR, VISITOR, SHA, SHA)
        self.assertAlmostEqual(result['residualM'], 0., places=8)
        self.assertEqual(result['opencvCameraCenterMarkerM'], [1., 2., -1.])
        self.assertEqual(result['trackerCameraCenterMarkerM'], [1., 2., -1.])
        self.assertFalse(result['navigationReady'])
        self.assertFalse(result['arrowAuthorized'])

    def test_drift_is_reported_in_metres_without_authorizing_arrow(self):
        result = compare_pose_to_tracker([-3., 10., -1.], [7., 10., 13.],
                                         AUTHOR, VISITOR, SHA, SHA)
        self.assertAlmostEqual(result['residualM'], 4., places=8)
        self.assertFalse(result['arrowAuthorized'])

    def test_mismatched_hash_and_invalid_similarity_refuse(self):
        for author, visitor, author_sha, visitor_sha in [
            (AUTHOR, VISITOR, SHA, '0' * 64),
            ({**AUTHOR, 'scale': 0.}, VISITOR, SHA, SHA),
            (AUTHOR, {**VISITOR, 'rotation': [1.] * 9}, SHA, SHA),
        ]:
            with self.assertRaises(ValueError):
                compare_pose_to_tracker([-3., 10., -1.], [7., 10., 5.],
                                        author, visitor, author_sha, visitor_sha)


if __name__ == '__main__':
    unittest.main()
