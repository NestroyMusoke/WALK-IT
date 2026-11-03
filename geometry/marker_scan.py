"""One privacy-reviewed marker frame, synchronously checked by OpenCV 5."""
import base64
import hashlib
import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np

geometry_dir = str(Path(__file__).resolve().parent)
if geometry_dir not in sys.path:
    sys.path.insert(0, geometry_dir)
from marker_anchor import estimate_start_marker_pose


def scan_marker(request, config_bytes):
    config = json.loads(config_bytes)
    raw_sha = hashlib.sha256(config_bytes).hexdigest()
    if not isinstance(request, dict) or request.get('configSha256') != raw_sha or request.get('privacyReviewed') is not True:
        raise ValueError('Configuration and privacy review required before marker inference')
    frame_id = request.get('frameId')
    if not isinstance(frame_id, str) or not frame_id or len(frame_id) > 64:
        raise ValueError('Invalid frame ID')
    width, height = request.get('width'), request.get('height')
    if (type(width) is not int or type(height) is not int or min(width, height) <= 0 or
            max(width, height) > config['HOST_IMAGE_MAX_EDGE_PX']):
        raise ValueError('Invalid image size')
    try:
        intrinsics = np.asarray(request['intrinsics'], dtype=float).reshape(3, 3)
        tracker = np.asarray(request['trackerPosition'], dtype=float)
        rotation = np.asarray(request['trackerRotation'], dtype=float)
        encoded = request.get('imageJpegBase64',request.get('imagePngBase64'))
        if not isinstance(encoded, str) or len(encoded) > config['E05_IMAGE_MAX_INPUT_BYTES'] * 2:
            raise ValueError('Image too large')
        pixels_bytes = base64.b64decode(encoded, validate=True)
        if len(pixels_bytes) > config['E05_IMAGE_MAX_INPUT_BYTES']:
            raise ValueError('Image too large')
        pixels = cv2.imdecode(np.frombuffer(pixels_bytes, np.uint8), cv2.IMREAD_GRAYSCALE)
    except (KeyError, TypeError, ValueError, base64.binascii.Error, cv2.error) as error:
        raise ValueError('Invalid marker request') from error
    if (intrinsics.shape != (3, 3) or tracker.shape != (3,) or rotation.shape != (4,) or
            not np.isfinite(intrinsics).all() or not np.isfinite(tracker).all() or
            not np.isfinite(rotation).all() or
            abs(np.linalg.norm(rotation)-1) > config['QUATERNION_NORM_TOLERANCE'] or
            pixels is None or pixels.shape != (height, width)):
        raise ValueError('Image, calibration or tracker pose mismatch')
    frame_at = request.get('frameAtPhoneMs')
    video_time = request.get('videoTime')
    if not all(type(value) in (int, float) and math.isfinite(value) and value >= 0
               for value in (frame_at, video_time)):
        raise ValueError('Invalid synchronized frame time')
    pose = estimate_start_marker_pose(pixels, intrinsics, config)
    return {'frameId': frame_id, 'frameAtPhoneMs': frame_at,
            'imageVideoTime': video_time, 'poseVideoTime': video_time,
            'imageSha256': hashlib.sha256(pixels_bytes).hexdigest(),
            'configSha256': raw_sha, 'canonicalConfigSha256': pose['configSha256'],
            'markerId': pose.get('markerId'), 'accepted': pose['accepted'],
            'reason': pose['reason'], 'opencvVersion': cv2.__version__,
            'cameraCenterMarkerM': pose.get('cameraCenterMarkerM'),
            'markerToCameraRotation': pose.get('markerToCameraRotation'),
            'trackerCameraCenter': tracker.tolist(),
            'trackerRotation': rotation.tolist(),
            'reprojectionRmsPx': pose.get('reprojectionRmsPx'),
            'panelCount': pose.get('panelCount'),
            'nonCoplanarityRankRatio': pose.get('nonCoplanarityRankRatio'),
            'metricScaleVerified': False, 'navigationReady': False,
            'arrowAuthorized': False}


def main():
    config_bytes = (Path(__file__).resolve().parents[1] / 'config/vision.yaml').read_bytes()
    request = json.load(sys.stdin)
    print(json.dumps(scan_marker(request, config_bytes), allow_nan=False))


if __name__ == '__main__':
    main()
