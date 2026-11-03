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

    def test_the_printed_quiet_border_is_the_one_the_fold_geometry_assumes(self):
        """Paper and geometry must agree, or the taped fold lands in the wrong place."""
        left_mm = (210 - CONFIG['MARKER_BLACK_SQUARE_EDGE_M'] * 1000) / 2
        self.assertAlmostEqual(left_mm, CONFIG['MARKER_PANEL_QUIET_MARGIN_M'] * 1000, places=9)

    def test_the_companion_sheet_prints_the_other_panel_and_tapes_on_the_other_side(self):
        zero, one = build_svg(CONFIG, 0), build_svg(CONFIG, 1)
        self.assertIn(f'data-marker-id="{CONFIG["MARKER_COMPANION_ID"]}"', one)
        self.assertIn('data-panel-index="0"', zero)
        self.assertIn('data-panel-index="1"', one)
        self.assertIn(f'data-panel-count="{CONFIG["MARKER_PANEL_COUNT"]}"', one)
        self.assertIn(f'data-fold-angle-deg="{CONFIG["MARKER_FOLD_ANGLE_DEG"]}"', one)
        self.assertIn(f'data-quiet-margin-mm="{CONFIG["MARKER_PANEL_QUIET_MARGIN_M"]*1000}"', one)
        self.assertIn('Tape the RIGHT white border', zero)
        self.assertIn('Tape the LEFT white border', one)
        self.assertIn('both squares must be visible'.upper(), one.upper())
        self.assertGreater(one.count('class="marker-cell"'), 0)

    def test_a_single_panel_config_prints_no_fold_instructions(self):
        svg = build_svg({**CONFIG, 'MARKER_PANEL_COUNT': 1}, 0)
        self.assertNotIn('PANEL 1 OF', svg)
        self.assertNotIn('Tape the', svg)
        self.assertIn('data-panel-count="1"', svg)

    def test_a_panel_outside_the_configured_target_is_refused(self):
        with self.assertRaises(ValueError):
            build_svg(CONFIG, CONFIG['MARKER_PANEL_COUNT'])
        with self.assertRaises(ValueError):
            build_svg(CONFIG, -1)


if __name__ == '__main__':
    unittest.main()
