"""Replay receipt binding tests. Mocked model masks are SYNTHETIC only."""
import base64
import hashlib
import json
import unittest
from unittest.mock import patch

from geometry.replay_verifier_report import build_report


CONFIG = {'VERIFY_MAX_OBSERVATION_AGE_MS': 120000,
          'VERIFY_MAX_GEOMETRY_AGE_MS': 1500,
          'VERIFY_MIN_DISTINCT_OBSERVATIONS_COUNT': 2}
CONFIG_BYTES = json.dumps(CONFIG).encode()
CONFIG_SHA = hashlib.sha256(CONFIG_BYTES).hexdigest()


def capture():
    images = [base64.b64encode(b'image-one').decode(), base64.b64encode(b'image-two').decode()]
    return json.dumps({'purpose': 'visitor-start-scan', 'manifest': {
        'routeId': 'r1', 'configSha256': CONFIG_SHA,
        'privacy': {'capturePermitted': True, 'imagesReviewed': True},
        'keyframes': [{'id': 'kf0'}, {'id': 'kf1'}]},
        'images': [{'id': f'kf{i}', 'png': image} for i, image in enumerate(images)],
        'timing': [{'id': f'kf{i}', 'receivedAtMs': 1000 + i * 100,
                    'videoTime': i + 1} for i in range(2)]}).encode()


class ReplayReportTests(unittest.TestCase):
    def test_missing_receipts_abstain_on_every_real_frame(self):
        raw = capture()
        report = build_report(raw, CONFIG_BYTES)
        self.assertEqual(report['sourceClass'], 'RECORDED REPLAY')
        self.assertEqual(report['captureSha256'], hashlib.sha256(raw).hexdigest())
        self.assertEqual([r['reason'] for r in report['frames']],
                         ['missing-receipt-or-context'] * 2)
        self.assertEqual(report['counts']['abstentions'], 2)
        self.assertEqual(report['counts']['confirmations'], 0)

    def test_mismatched_receipt_cannot_confirm(self):
        raw = capture()
        cases = {'kf0': {'spark': {'input_sha256': 'a' * 64},
                         'sam': {}, 'context': {}}}
        report = build_report(raw, CONFIG_BYTES, cases)
        self.assertEqual(report['frames'][0]['reason'], 'image-or-config-mismatch')
        self.assertEqual(report['frames'][1]['status'], 'abstain')

    def test_capture_config_mismatch_refused(self):
        with self.assertRaisesRegex(ValueError, 'config'):
            build_report(capture(), b'{}')

    @patch('geometry.receipt_pair.inspect_sam_image', return_value={
        'mask_evaluated': True, 'object_count': 1,
        'target_projected_inside_mask': True,
        'decoy_projected_inside_mask': False})
    def test_two_distinct_synthetic_candidates_can_confirm_only_via_fusion(self, _):
        raw = json.loads(capture())
        cases = {}
        for i, frame in enumerate(raw['images']):
            sha = hashlib.sha256(base64.b64decode(frame['png'])).hexdigest()
            cases[frame['id']] = {
                'spark': {'input_sha256': sha, 'config_sha256': CONFIG_SHA,
                          'requested_model': 'meta-models/muse-spark-open-1026',
                          'evidence': {'usable_as_destination_evidence': True,
                                       'visible_text': ['D10'], 'visual_cues': ['wooden door']}},
                'sam': {'input_sha256': sha, 'config_sha256': CONFIG_SHA,
                        'requested_model': 'sam-3.1', 'concept': 'wooden door',
                        'evidence': {'output_text': 'synthetic-only'}},
                'context': {'image_sha256': sha, 'config_sha256': CONFIG_SHA,
                            'frame_id': frame['id'], 'route_id': 'r1', 'anchor_id': 'a1',
                            'captured_at_ms': 1000 + i * 100,
                            'geometry_verified_at_ms': 1100, 'anchor_valid': True,
                            'tracking_active': True, 'target_text': 'D10',
                            'required_cue': 'wooden door', 'image_size': (10, 10),
                            'target_pixel': (2, 2), 'decoy_pixel': (8, 8)}}
        result = build_report(capture(), CONFIG_BYTES, cases, source_class='SYNTHETIC', now_ms=1200)
        self.assertEqual(result['frames'][0]['status'], 'candidate')
        self.assertEqual(result['frames'][1]['status'], 'confirmed')
        self.assertEqual(result['counts']['confirmations'], 1)


if __name__ == '__main__':
    unittest.main()
