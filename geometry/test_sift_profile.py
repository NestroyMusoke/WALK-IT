import hashlib
import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from sift_profile import make_sift
from test_author_intake import fixture
from tracks import run as build_tracks


class SiftProfileTests(unittest.TestCase):
    def test_default_and_experimental_constructor_arguments(self):
        with patch('sift_profile.cv2.SIFT_create') as create:
            make_sift({'GEOMETRY_SIFT_FEATURES_COUNT': 1500})
            create.assert_called_once_with(nfeatures=1500)
        with patch('sift_profile.cv2.SIFT_create') as create:
            make_sift({'GEOMETRY_SIFT_FEATURES_COUNT': 8000,
                       'GEOMETRY_SIFT_CONTRAST_THRESHOLD': 0.01,
                       'GEOMETRY_SIFT_EDGE_THRESHOLD': 20})
            create.assert_called_once_with(nfeatures=8000, contrastThreshold=0.01, edgeThreshold=20)

    def test_partial_custom_profile_refuses(self):
        with self.assertRaises(ValueError):
            make_sift({'GEOMETRY_SIFT_FEATURES_COUNT': 8000,
                       'GEOMETRY_SIFT_CONTRAST_THRESHOLD': 0.01})

    def test_map_builder_uses_selected_config_identity(self):
        raw, _, _ = fixture()
        capture = json.loads(raw)
        capture['manifest']['units'] = 'tracker'
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'capture.json'
            source.write_text(json.dumps(capture))
            original = Path(__file__).resolve().parents[1] / 'config/vision.yaml'
            config = json.loads(original.read_text())
            config['GEOMETRY_SIFT_FEATURES_COUNT'] = 8000
            config['GEOMETRY_SIFT_CONTRAST_THRESHOLD'] = 0.01
            config['GEOMETRY_SIFT_EDGE_THRESHOLD'] = 20
            profile = root / 'experiment.json'
            profile.write_text(json.dumps(config))
            with contextlib.redirect_stdout(io.StringIO()):
                build_tracks(source, config_path=profile)
            produced = source.with_name('capture-tracks-window3-filtered.json')
            result = json.loads(produced.read_text())
            self.assertEqual(result['geometryConfigSha256'], hashlib.sha256(profile.read_bytes()).hexdigest())


if __name__ == '__main__':
    unittest.main()
