"""Private, structural intake for one reviewed author walk. Never certifies navigation."""
import argparse
import base64
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np


def _sha(raw):
    return hashlib.sha256(raw).hexdigest()


def audit_author_capture(capture_bytes, map_bytes, config, config_sha256):
    if cv2.__version__.split('.')[0] != '5':
        raise RuntimeError('OpenCV 5 required')
    capture, model = json.loads(capture_bytes), json.loads(map_bytes)
    manifest = capture['manifest']
    if manifest.get('privacy') != {'capturePermitted': True, 'imagesReviewed': True}:
        raise ValueError('Permission and completed privacy review required')
    if model.get('captureSha256') != _sha(capture_bytes):
        raise ValueError('Map/source capture identity mismatch')
    geometry_sha = model.get('geometryConfigSha256')
    if not isinstance(geometry_sha, str) or len(geometry_sha) != 64 or any(
            char not in '0123456789abcdef' for char in geometry_sha):
        raise ValueError('Map geometry configuration identity missing')
    if not str(model.get('opencv', '')).startswith('5.'):
        raise ValueError('OpenCV 5 map required')
    frames, images = manifest.get('keyframes'), capture.get('images')
    if not isinstance(frames, list) or not isinstance(images, list) or len(frames) != len(images):
        raise ValueError('Frame/image count mismatch')
    if len(frames) < config['START_MAP_FRAME_CAPACITY_COUNT']:
        raise ValueError('Insufficient start views')
    path = manifest.get('path')
    if not isinstance(path, list) or len(path) != len(frames):
        raise ValueError('Incomplete route path')
    destination = manifest.get('destination')
    if destination != {'pathIndex': len(frames)-1, 'keyframeId': frames[-1]['id']}:
        raise ValueError('Destination does not identify final frame')
    ids, viewing = set(), []
    for frame, image, point in zip(frames, images, path, strict=True):
        identity = frame.get('id')
        if not isinstance(identity, str) or identity in ids or image.get('id') != identity:
            raise ValueError('Invalid frame/image identity')
        ids.add(identity)
        if point.get('keyframeId') != identity or point.get('position') != frame.get('position'):
            raise ValueError('Route path does not follow saved frames')
        width, height = frame.get('width'), frame.get('height')
        if type(width) is not int or type(height) is not int or min(width, height) <= 0:
            raise ValueError('Invalid image dimensions')
        intrinsics = np.asarray(frame.get('intrinsics'), dtype=float)
        rotation = np.asarray(frame.get('rotation'), dtype=float)
        position = np.asarray(frame.get('position'), dtype=float)
        if (intrinsics.shape != (9,) or rotation.shape != (4,) or position.shape != (3,) or
                not np.isfinite(intrinsics).all() or not np.isfinite(rotation).all() or
                not np.isfinite(position).all() or intrinsics[0] <= 0 or intrinsics[4] <= 0 or
                abs(np.linalg.norm(rotation)-1) > 0.01):
            raise ValueError('Invalid calibrated camera pose')
        try:
            raw = base64.b64decode(image['png'], validate=True)
            pixels = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_GRAYSCALE)
        except (KeyError, ValueError, cv2.error) as error:
            raise ValueError('Invalid reviewed image') from error
        if pixels is None or pixels.shape != (height, width):
            raise ValueError('Reviewed image does not match calibration')
        x, y, z, w = rotation
        # OpenGL camera looks down local -Z; rotate that vector into world space.
        direction = np.array([-2*(x*z+y*w), -2*(y*z-x*w), -(1-2*(x*x+y*y))])
        viewing.append(direction)
    coverage = model.get('coverageByKeyframe')
    if not isinstance(coverage, dict) or set(coverage) != ids or any(
            type(value) is not int or value < 0 for value in coverage.values()):
        raise ValueError('Incomplete map coverage report')
    start = frames[:config['START_MAP_FRAME_CAPACITY_COUNT']]
    end = frames[-config['GEOMETRY_TRACK_MIN_VIEWS_COUNT']:]
    required = config['LOCALIZER_MIN_INLIERS_COUNT']
    start_covered = sum(coverage[frame['id']] >= required for frame in start)
    end_covered = sum(coverage[frame['id']] >= required for frame in end)
    directions = np.asarray(viewing[:len(start)])
    cosine = np.clip(directions @ directions.T, -1, 1)
    span = float(np.degrees(np.arccos(cosine.min())))
    return {'kind': 'one-walk-structural-intake', 'captureSha256': _sha(capture_bytes),
            'mapSha256': _sha(map_bytes), 'captureConfigSha256': manifest['configSha256'],
            'mapGeometryConfigSha256': geometry_sha, 'intakeConfigSha256': config_sha256,
            'opencv': cv2.__version__,
            'savedFrameCount': len(frames), 'startFrameCount': len(start),
            'startCoveredFrames': start_covered, 'destinationFrameCount': len(end),
            'destinationCoveredFrames': end_covered, 'startViewSpanDeg': span,
            'minimumPerFrameLandmarksCount': required,
            'dataComplete': start_covered == len(start) and end_covered == len(end),
            'metricScaleVerified': False, 'navigationReady': False, 'arrowAuthorized': False}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('capture', type=Path)
    parser.add_argument('map', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--config', type=Path, default=Path(__file__).resolve().parents[1] / 'config/vision.yaml')
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError('Refusing to overwrite an intake report')
    config_raw = args.config.read_bytes()
    report = audit_author_capture(args.capture.read_bytes(), args.map.read_bytes(),
                                  json.loads(config_raw), _sha(config_raw))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, allow_nan=False))
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
