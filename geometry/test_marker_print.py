import json
import unittest
from pathlib import Path

from geometry.marker_print import build_svg


CONFIG = json.loads((Path(__file__).resolve().parents[1] / 'config/vision.yaml').read_text())


class MarkerPrintTests(unittest.TestCase):
    def test_print_sheet_has_configured_marker_and_real_size_check(self):
        svg = build_svg(CONFIG)
        self.assertIn('width="210mm" height="297mm"', svg)
        self.assertIn('data-marker-id="0"', svg)
        self.assertIn('data-black-edge-mm="160.0"', svg)
        self.assertIn('data-check-bar-mm="100.0"', svg)
        self.assertIn('PRINT AT 100% SCALE', svg)
        self.assertEqual(svg.count('class="marker-cell"'), 28)


if __name__ == '__main__':
    unittest.main()
