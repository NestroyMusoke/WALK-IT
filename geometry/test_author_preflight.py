import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from author_preflight import preflight
from test_author_intake import fixture


class AuthorPreflightTests(unittest.TestCase):
    def test_private_map_and_report_are_reused_without_overwriting(self):
        raw, map_raw, cfg = fixture()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'reviewed.json'
            source.write_bytes(raw)
            calls = []

            def builder(private_capture, map_path):
                calls.append(private_capture)
                map_path.write_bytes(map_raw)

            first = preflight(source, root / 'private', cfg, b'config', b'builder', builder)
            second = preflight(source, root / 'private', cfg, b'config', b'builder', builder)
            self.assertEqual(len(calls), 1)
            self.assertEqual(first, second)
            self.assertTrue(first['dataComplete'])
            self.assertFalse(first['navigationReady'])
            self.assertFalse(first['arrowAuthorized'])
            self.assertEqual(first['captureSha256'], hashlib.sha256(raw).hexdigest())
            self.assertTrue(list((root / 'private').glob('*/intake.json')))

    def test_refuses_unreviewed_and_visitor_before_private_copy(self):
        raw, map_raw, cfg = fixture()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'input.json'
            capture = json.loads(raw)
            capture['manifest']['privacy']['imagesReviewed'] = False
            source.write_text(json.dumps(capture))
            with self.assertRaises(ValueError):
                preflight(source, root / 'private', cfg, b'config', b'builder', lambda *_: None)
            capture['manifest']['privacy']['imagesReviewed'] = True
            capture['purpose'] = 'visitor-start-scan'
            source.write_text(json.dumps(capture))
            with self.assertRaises(ValueError):
                preflight(source, root / 'private', cfg, b'config', b'builder', lambda *_: None)
            self.assertFalse((root / 'private').exists())

    def test_cache_conflict_is_refused(self):
        raw, map_raw, cfg = fixture()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'reviewed.json'
            source.write_bytes(raw)

            def builder(private_capture, map_path):
                map_path.write_bytes(map_raw)

            preflight(source, root / 'private', cfg, b'config', b'builder', builder)
            private_capture = next((root / 'private').glob('*/capture.json'))
            private_capture.write_text('different bytes')
            with self.assertRaises(ValueError):
                preflight(source, root / 'private', cfg, b'config', b'builder', builder)


if __name__ == '__main__':
    unittest.main()
