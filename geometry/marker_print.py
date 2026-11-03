"""Generate the configured OpenCV 5 ArUco start marker as a scale-checkable A4 SVG."""
import argparse
import json
from pathlib import Path

import cv2


def build_svg(config, panel=0):
    if cv2.__version__.split('.')[0] != '5':
        raise RuntimeError('OpenCV 5 required')
    if type(panel) is not int or not 0 <= panel < config['MARKER_PANEL_COUNT']:
        raise ValueError('Panel is outside the configured folded target')
    marker_id = config['MARKER_ID'] if panel == 0 else config['MARKER_COMPANION_ID']
    black_edge_mm = config['MARKER_BLACK_SQUARE_EDGE_M'] * 1000
    check_bar_mm = config['MARKER_CHECK_BAR_M'] * 1000
    quiet_mm = config['MARKER_PANEL_QUIET_MARGIN_M'] * 1000
    fold_deg = config['MARKER_FOLD_ANGLE_DEG']
    if not 0 <= marker_id < 50 or not 0 < black_edge_mm <= 170 or not 0 < check_bar_mm <= 170:
        raise ValueError('Marker does not fit A4 with a quiet border')
    dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
    image = cv2.aruco.generateImageMarker(dictionary, marker_id, 600, borderBits=1)
    cells = 6
    unit = black_edge_mm / cells
    left, top = (210 - black_edge_mm) / 2, 25
    rectangles = []
    for row in range(cells):
        for col in range(cells):
            if image[row * 100 + 50, col * 100 + 50] == 0:
                rectangles.append(f'<rect class="marker-cell" x="{left + col * unit:.5f}" '
                                  f'y="{top + row * unit:.5f}" width="{unit:.5f}" '
                                  f'height="{unit:.5f}"/>')
    bar_y = top + black_edge_mm + 20
    tape_side = 'RIGHT' if panel == 0 else 'LEFT'
    lines = [f'<text x="30" y="{bar_y+33}" font-family="Arial" font-size="4.5" fill="black">'
             'PRINT AT 100% SCALE. Turn off Fit to page.</text>',
             f'<text x="30" y="{bar_y+41}" font-family="Arial" font-size="4.5" fill="black">'
             'Keep the full black square flat and evenly lit.</text>']
    if config['MARKER_PANEL_COUNT'] > 1:
        for offset, line in enumerate((
                f'PANEL {panel + 1} OF {config["MARKER_PANEL_COUNT"]}. '
                f'Tape the {tape_side} white border to the other panel.',
                f'Fold to {fold_deg:g} degrees and stand facing the crease: both squares '
                f'must be visible at once.',
                f'Never cut the {quiet_mm:g} mm white border - without it ArUco finds nothing.')):
            lines.append(f'<text x="30" y="{bar_y + 49 + offset * 8}" font-family="Arial" '
                         f'font-size="4.5" fill="black">{line}</text>')
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" '
            'viewBox="0 0 210 297" data-marker-id="' + str(marker_id) +
            '" data-panel-index="' + str(panel) +
            '" data-panel-count="' + str(config['MARKER_PANEL_COUNT']) +
            '" data-fold-angle-deg="' + str(fold_deg) +
            '" data-black-edge-mm="' + str(black_edge_mm) +
            '" data-quiet-margin-mm="' + str(quiet_mm) +
            '" data-check-bar-mm="' + str(check_bar_mm) + '">\n'
            '<rect width="210" height="297" fill="white"/>\n'
            '<g fill="black" shape-rendering="crispEdges">\n' + '\n'.join(rectangles) + '\n</g>\n'
            f'<path d="M30 {bar_y}h{check_bar_mm}" stroke="black" stroke-width="1.2"/>\n'
            f'<path d="M30 {bar_y-3}v6 M{30+check_bar_mm} {bar_y-3}v6" stroke="black" stroke-width="1.2"/>\n'
            f'<text x="30" y="{bar_y+8}" font-family="Arial" font-size="5" fill="black">'
            f'Check bar: {check_bar_mm:g} mm</text>\n'
            f'<text x="30" y="{bar_y+24}" font-family="Arial" font-weight="bold" font-size="6" fill="black">'
            'WALK IT · START MARKER</text>\n' + '\n'.join(lines) + '\n</svg>\n')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', type=Path, default=Path(__file__).resolve().parents[1] / 'config/vision.yaml')
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'design/start-marker-a4.svg')
    parser.add_argument('--panel', type=int, default=None)
    args = parser.parse_args()
    config = json.loads(args.config.read_bytes())
    panels = range(config['MARKER_PANEL_COUNT']) if args.panel is None else [args.panel]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    for panel in panels:
        suffix = '' if panel == 0 else f'-panel{panel + 1}'
        target = args.output if args.panel is not None else args.output.with_name(
            args.output.stem + suffix + args.output.suffix)
        target.write_text(build_svg(config, panel), encoding='utf-8')
        print(target)


if __name__ == '__main__':
    main()
