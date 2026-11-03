"""Private one-capture marker visibility and route-scale preflight."""
import argparse
import base64
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

import cv2
import numpy as np

geometry_dir = str(Path(__file__).resolve().parent)
if geometry_dir not in sys.path:
    sys.path.insert(0, geometry_dir)
from marker_anchor import estimate_start_marker_pose
from metric_route_candidate import build_metric_route_candidate


def preflight(input_bytes, config_bytes):
    if cv2.__version__.split('.')[0] != '5':
        raise RuntimeError('OpenCV 5 required')
    config = json.loads(config_bytes)
    original = json.loads(input_bytes)
    if original.get('schemaVersion') == 2:
        capture = original['capture']
        if original['diagnostic']['configSha256'] != capture['manifest']['configSha256']:
            raise ValueError('Diagnostic/capture config mismatch')
    else:
        capture = original
    manifest = capture['manifest']
    config_sha = hashlib.sha256(config_bytes).hexdigest()
    if manifest.get('configSha256') != config_sha:
        raise ValueError('Capture config mismatch')
    if capture.get('purpose', 'author-route') != 'author-route' or manifest.get('privacy') != {
            'capturePermitted': True, 'imagesReviewed': True}:
        raise ValueError('Reviewed permitted author capture required')
    frames, images = manifest['keyframes'], capture['images']
    if len(frames) != len(images):
        raise ValueError('Incomplete frame/image sequence')
    findings = []
    for frame, image in list(zip(frames, images))[:config['START_MAP_FRAME_CAPACITY_COUNT']]:
        if frame['id'] != image['id']:
            raise ValueError('Frame/image ID mismatch')
        pixels = cv2.imdecode(np.frombuffer(base64.b64decode(image['png'], validate=True), np.uint8),
                              cv2.IMREAD_GRAYSCALE)
        if pixels is None or pixels.shape != (frame['height'], frame['width']):
            raise ValueError('Frame/image size mismatch')
        pose = estimate_start_marker_pose(pixels, frame['intrinsics'], config)
        findings.append({'frameId': frame['id'], 'accepted': pose['accepted'],
                         'reason': pose['reason'],
                         'reprojectionRmsPx': pose.get('reprojectionRmsPx')})
    capture_bytes = json.dumps(capture, separators=(',', ':')).encode()
    candidate = build_metric_route_candidate(capture_bytes, config, config_bytes)
    return {'sourceClass': 'RECORDED REPLAY', 'sourceInputSha256': hashlib.sha256(input_bytes).hexdigest(),
            'captureSha256': hashlib.sha256(capture_bytes).hexdigest(), 'configSha256': config_sha,
            'opencvVersion': cv2.__version__, 'routeId': manifest['routeId'],
            'markerFrameLimit': config['START_MAP_FRAME_CAPACITY_COUNT'],
            'markerAcceptedFrames': sum(item['accepted'] for item in findings),
            'markerReasons': dict(Counter(item['reason'] for item in findings)),
            'frames': findings, 'candidate': candidate,
            'readyForVisitorTest': False, 'navigationReady': False, 'arrowAuthorized': False}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--config', type=Path, default=Path(__file__).resolve().parents[1] / 'config/vision.yaml')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    report = preflight(args.input.read_bytes(), args.config.read_bytes())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({key: report[key] for key in
                      ('sourceInputSha256', 'configSha256', 'markerAcceptedFrames',
                       'markerReasons', 'readyForVisitorTest', 'arrowAuthorized')}))
    print('Route candidate:', report['candidate']['reason'])


if __name__ == '__main__':
    main()
