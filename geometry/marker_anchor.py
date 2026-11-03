"""OpenCV 5 marker observation only; no route or arrow authorization."""
import hashlib
import json

import cv2
import numpy as np


def detect_start_marker(image, config):
    if cv2.__version__.split('.')[0] != '5':
        raise RuntimeError('OpenCV 5 required')
    if not isinstance(image, np.ndarray) or image.dtype != np.uint8 or image.ndim not in (2, 3):
        raise ValueError('Expected an 8-bit camera image')
    marker_id = config['MARKER_ID']
    if type(marker_id) is not int or not 0 <= marker_id < 50:
        raise ValueError('Invalid configured marker ID')
    dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
    corners, ids, _ = cv2.aruco.ArucoDetector(dictionary).detectMarkers(image)
    if ids is None:
        return None
    matching = [corner.reshape(4, 2) for corner, found in zip(corners, ids.ravel())
                if int(found) == marker_id]
    if len(matching) != 1:
        return None
    return {'markerId': marker_id, 'cornersPx': matching[0].astype(float).tolist(),
            'markerEdgeM': config['MARKER_BLACK_SQUARE_EDGE_M'],
            'navigationReady': False, 'arrowAuthorized': False,
            'opencvVersion': cv2.__version__}


def estimate_marker_pose(corners_px, intrinsics, config):
    """Metric camera pose relative to one known square, never a route anchor."""
    identity = {'configSha256': hashlib.sha256(json.dumps(config, sort_keys=True,
                       separators=(',', ':')).encode()).hexdigest(),
                'configHashEncoding': 'canonical-json', 'opencvVersion': cv2.__version__,
                'navigationReady': False, 'metricScaleVerified': False,
                'arrowAuthorized': False}

    def reject(reason):
        return {**identity, 'accepted': False, 'reason': reason}

    if cv2.__version__.split('.')[0] != '5':
        return reject('opencv-version')
    try:
        uv = np.asarray(corners_px, dtype=np.float64)
        k = np.asarray(intrinsics, dtype=np.float64).reshape(3, 3)
    except (TypeError, ValueError):
        return reject('invalid-input')
    if uv.shape != (4, 2) or not np.isfinite(uv).all() or not np.isfinite(k).all():
        return reject('invalid-input')
    if not np.array_equal(k[2], [0, 0, 1]) or min(k[0, 0], k[1, 1]) < config['MARKER_POSE_MIN_FOCAL_PX']:
        return reject('invalid-calibration')
    if any(np.linalg.norm(uv[(i + 1) % 4] - uv[i]) < config['MARKER_POSE_MIN_EDGE_PX']
           for i in range(4)):
        return reject('marker-too-small')
    edge = config['MARKER_BLACK_SQUARE_EDGE_M']
    if not np.isfinite(edge) or edge <= 0:
        return reject('invalid-marker-size')
    half = edge / 2
    xyz = np.asarray([[-half, half, 0], [half, half, 0],
                      [half, -half, 0], [-half, -half, 0]], dtype=np.float64)
    try:
        solved = cv2.solvePnPGeneric(xyz, uv, k, None, flags=cv2.SOLVEPNP_IPPE_SQUARE)
    except cv2.error:
        return reject('pnp-failed')
    if not solved[0] or len(solved[1]) != 2:
        return reject('pnp-failed')
    candidates = []
    for rvec, tvec in zip(solved[1], solved[2]):
        r = cv2.Rodrigues(rvec)[0]
        projected = cv2.projectPoints(xyz, rvec, tvec, k, None)[0].reshape(4, 2)
        rms = float(np.sqrt(np.mean(np.sum((projected - uv) ** 2, axis=1))))
        depths = (r @ xyz.T + tvec.reshape(3, 1))[2]
        if np.isfinite(rms) and np.isfinite(tvec).all() and np.all(depths > 0):
            candidates.append((rms, r, tvec.reshape(3)))
    if len(candidates) != 2:
        return reject('ambiguous-or-invalid-pose')
    candidates.sort(key=lambda item: item[0])
    best, second = candidates
    if best[0] > config['MARKER_POSE_MAX_REPROJECTION_RMS_PX']:
        return reject('high-reprojection-error')
    if second[0] < max(best[0], 1e-9) * config['MARKER_POSE_MIN_SECOND_ERROR_RATIO']:
        return reject('planar-ambiguous')
    center = -best[1].T @ best[2]
    if np.linalg.norm(center) > config['ANCHOR_MARKER_MAX_DISTANCE_M']:
        return reject('marker-too-far')
    return {**identity, 'accepted': True, 'reason': 'single-frame-marker-pose-only',
            'cameraCenterMarkerM': center.tolist(),
            'markerToCameraRotation': best[1].reshape(9).tolist(),
            'markerToCameraTranslationM': best[2].tolist(),
            'reprojectionRmsPx': best[0], 'secondReprojectionRmsPx': second[0]}


def estimate_start_marker_pose(image, intrinsics, config):
    observation = detect_start_marker(image, config)
    if observation is None:
        return {'accepted': False, 'reason': 'marker-not-found',
                'configSha256': hashlib.sha256(json.dumps(config, sort_keys=True,
                       separators=(',', ':')).encode()).hexdigest(),
                'navigationReady': False, 'metricScaleVerified': False,
                'arrowAuthorized': False, 'opencvVersion': cv2.__version__}
    pose = estimate_marker_pose(observation['cornersPx'], intrinsics, config)
    return {**pose, 'markerId': observation['markerId']}
