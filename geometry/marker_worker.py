"""One warm OpenCV interpreter serving many marker frames.

Line protocol: one JSON object per line in, one JSON object per line out, matched
by 'id'. A request that raises is answered with {'id':..., 'error':...} so the
worker stays alive; the caller decides what a failure means. Nothing is written
to stdout except protocol lines, and no submitted pixel is ever retained.
"""
import json
import sys
from pathlib import Path

import cv2

geometry_dir = str(Path(__file__).resolve().parent)
if geometry_dir not in sys.path:
    sys.path.insert(0, geometry_dir)
from marker_scan import scan_marker
from visitor_marker_alignment import align_visitor_marker

CONFIG_BYTES = (Path(__file__).resolve().parents[1] / 'config/vision.yaml').read_bytes()


def handle(request):
    kind = request.get('kind')
    if kind == 'scan':
        return scan_marker(request.get('request'), CONFIG_BYTES)
    if kind == 'align':
        return align_visitor_marker(request.get('receipts'), CONFIG_BYTES, request.get('routeId'))
    raise ValueError(f'Unknown worker request kind: {kind!r}')


def main():
    sys.stdout.write(json.dumps({'ready': True, 'opencvVersion': cv2.__version__,
                                 'configSha256': __import__('hashlib').sha256(CONFIG_BYTES).hexdigest()}) + '\n')
    sys.stdout.flush()
    while True:
        line = sys.stdin.readline()
        if not line:
            return
        line = line.strip()
        if not line:
            continue
        identifier = None
        try:
            request = json.loads(line)
            identifier = request.get('id') if isinstance(request, dict) else None
            response = {'id': identifier, **handle(request)}
        except Exception as error:  # noqa: BLE001 - protocol errors must not kill the worker
            response = {'id': identifier, 'error': type(error).__name__, 'detail': str(error)[:200]}
        sys.stdout.write(json.dumps(response, allow_nan=False) + '\n')
        sys.stdout.flush()


if __name__ == '__main__':
    main()
