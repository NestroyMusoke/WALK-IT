"""Private reviewed author capture to optional marker-metre route hypothesis."""
import base64
import hashlib
import json

import cv2
import numpy as np

from marker_anchor import estimate_start_marker_pose
from marker_scale import calibrate_marker_to_session, session_points_to_marker_m


def build_metric_route_candidate(capture_bytes, config, config_bytes):
    identity = {'sourceCaptureSha256': hashlib.sha256(capture_bytes).hexdigest(),
                'configSha256': hashlib.sha256(config_bytes).hexdigest(),
                'opencvVersion': cv2.__version__, 'scaleVerified': False,
                'navigationReady': False, 'arrowAuthorized': False,
                'markerObservationCount': 0}

    def reject(reason, count=0):
        return {**identity, 'accepted': False, 'reason': reason,
                'markerObservationCount': count}

    if cv2.__version__.split('.')[0] != '5':
        return reject('opencv-version')
    try:
        if json.loads(config_bytes) != config:
            return reject('config-bytes-mismatch')
    except (TypeError, ValueError):
        return reject('invalid-config-bytes')
    if len(capture_bytes) > config['HOST_UPLOAD_LIMIT_BYTES']:
        return reject('capture-too-large')
    try:
        capture = json.loads(capture_bytes)
        manifest = capture['manifest']
        frames, images, timing, path = (manifest['keyframes'], capture['images'],
                                         capture['timing'], manifest['path'])
    except (ValueError, KeyError, TypeError):
        return reject('invalid-capture')
    if (capture.get('purpose', 'author-route') != 'author-route' or
            manifest.get('schemaVersion') != 1 or manifest.get('source') != 'captured' or
            manifest.get('units') != 'tracker' or manifest.get('scaleVerified') is not False or
            manifest.get('privacy') != {'capturePermitted': True, 'imagesReviewed': True} or
            manifest.get('configSha256') != identity['configSha256']):
        return reject('unreviewed-or-mismatched-capture')
    if not isinstance(frames, list) or len(frames) < config['ALIGNMENT_MIN_PAIRS_COUNT'] or not (
            len(frames) == len(images) == len(timing) == len(path)):
        return reject('incomplete-capture')
    if manifest.get('destination') != {'pathIndex': len(path)-1, 'keyframeId': frames[-1].get('id')}:
        return reject('invalid-destination')
    canonical_sha = hashlib.sha256(json.dumps(config, sort_keys=True,
                        separators=(',', ':')).encode()).hexdigest()
    seen_ids = set()
    last_video_time = -np.inf
    observations = []
    route_positions = []
    for index, (frame, image, stamp, point) in enumerate(zip(frames, images, timing, path)):
        try:
            fid = frame['id']
            width, height = frame['width'], frame['height']
            k = np.asarray(frame['intrinsics'], dtype=float).reshape(3, 3)
            position = np.asarray(frame['position'], dtype=float)
            path_position = np.asarray(point['position'], dtype=float)
            video_time = stamp['videoTime']
            if (not isinstance(fid, str) or not fid or fid in seen_ids or
                    image['id'] != fid or stamp['id'] != fid or point['keyframeId'] != fid or
                    type(width) is not int or type(height) is not int or
                    width <= 0 or height <= 0 or max(width, height) > config['HOST_IMAGE_MAX_EDGE_PX'] or
                    k.shape != (3, 3) or not np.isfinite(k).all() or
                    position.shape != (3,) or not np.isfinite(position).all() or
                    path_position.shape != (3,) or not np.array_equal(position, path_position) or
                    type(video_time) not in (int, float) or not np.isfinite(video_time) or
                    video_time <= last_video_time or
                    image.get('width', width) != width or image.get('height', height) != height):
                return reject('unpaired-or-invalid-frame', len(observations))
            pixels = cv2.imdecode(np.frombuffer(base64.b64decode(image['png'], validate=True),
                                               np.uint8), cv2.IMREAD_GRAYSCALE)
        except (KeyError, TypeError, ValueError, base64.binascii.Error, cv2.error):
            return reject('invalid-frame-image', len(observations))
        if pixels is None or pixels.shape != (height, width):
            return reject('invalid-frame-image', len(observations))
        seen_ids.add(fid)
        last_video_time = video_time
        route_positions.append(position)
        if index >= config['START_MAP_FRAME_CAPACITY_COUNT']:
            continue
        pose = estimate_start_marker_pose(pixels, k, config)
        if pose.get('accepted') is not True:
            continue
        if pose.get('configSha256') != canonical_sha or pose.get('markerId') != config['MARKER_ID']:
            return reject('untrusted-marker-pose', len(observations))
        observations.append({'frameId': fid, 'imageVideoTime': video_time,
                             'poseVideoTime': video_time, 'markerId': pose['markerId'],
                             'accepted': True, 'opencvVersion': pose['opencvVersion'],
                             'configSha256': canonical_sha,
                             'cameraCenterMarkerM': pose['cameraCenterMarkerM'],
                             'markerToCameraRotation': pose['markerToCameraRotation'],
                             'trackerRotation': frame['rotation'],
                             'trackerCameraCenter': position.tolist()})
    if len(observations) < config['ALIGNMENT_MIN_PAIRS_COUNT']:
        return reject('insufficient-marker-observations', len(observations))
    calibration = calibrate_marker_to_session(observations, config)
    if not calibration['accepted']:
        return reject(f"calibration-{calibration['reason']}", len(observations))
    metric_positions = session_points_to_marker_m(route_positions, calibration)
    return {**identity, 'accepted': True, 'reason': 'metric-route-hypothesis-only',
            'markerObservationCount': len(observations),
            'routeId': manifest.get('routeId'), 'units': 'metres',
            'path': [{'keyframeId': frame['id'], 'position': position.tolist()}
                     for frame, position in zip(frames, metric_positions)],
            'destination': manifest['destination'], 'markerToAuthorSession': calibration['markerToSession'],
            'maxRelativeResidual': calibration['maxRelativeResidual']}
