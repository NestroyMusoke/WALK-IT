import json
import unittest
from unittest.mock import patch

from geometry.marker_preflight import preflight
from geometry.test_metric_route_candidate import capture, CONFIG_BYTES


class MarkerPreflightTests(unittest.TestCase):
    def test_no_marker_is_explicit_failure_not_route_authorization(self):
        report = preflight(json.dumps(capture()).encode(), CONFIG_BYTES)
        self.assertFalse(report['readyForVisitorTest'])
        self.assertEqual(report['markerAcceptedFrames'], 0)
        self.assertEqual(report['markerReasons']['marker-not-found'], 5)
        self.assertFalse(report['arrowAuthorized'])

    def test_version_two_backup_is_unwrapped_and_source_hashed(self):
        bundle = {'schemaVersion': 2, 'capture': capture(),
                  'diagnostic': {'configSha256': capture()['manifest']['configSha256'],
                                 'events': []}}
        # The capture is still marker-free; the envelope does not create evidence.
        report = preflight(json.dumps(bundle).encode(), CONFIG_BYTES)
        self.assertEqual(report['sourceClass'], 'RECORDED REPLAY')
        self.assertEqual(report['markerAcceptedFrames'], 0)

    def test_wrong_configuration_refused_before_detection(self):
        with self.assertRaisesRegex(ValueError, 'config'):
            preflight(json.dumps(capture()).encode(), b'{}')


if __name__ == '__main__':
    unittest.main()
