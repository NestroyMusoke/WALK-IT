"""OpenCV 5 marker observation only; no route or arrow authorization."""
import hashlib
import json
import math

import cv2
import numpy as np

PANEL_CORNERS = np.array([[-1., 1., 0.], [1., 1., 0.], [1., -1., 0.], [-1., -1., 0.]])
UP = np.array([0., 1., 0.])


def config_identity(config):
    return {'configSha256': hashlib.sha256(json.dumps(config, sort_keys=True,
                    separators=(',', ':')).encode()).hexdigest(),
            'configHashEncoding': 'canonical-json', 'opencvVersion': cv2.__version__,
            'navigationReady': False, 'metricScaleVerified': False,
            'arrowAuthorized': False}


def folded_panel_corners(index, config):
    """Object points of one panel of the folded target, in PANEL ZERO's own frame.

    Panel zero's frame is the target frame, so folding the paper does not move the
    origin that every consumer of cameraCenterMarkerM already depends on. The companion
    panel's placement is derived from two physical print facts - the black square edge
    and the quiet zone ArUco needs - never from a measured fit.
    """
    if type(index) is not int or index < 0:
        raise ValueError('Invalid marker panel index')
    half = config['MARKER_BLACK_SQUARE_EDGE_M'] / 2
    if not math.isfinite(half) or half <= 0:
        raise ValueError('Invalid marker size')
    corners = PANEL_CORNERS * half
    if index == 0:
        return corners
    if index >= config['MARKER_PANEL_COUNT']:
        raise ValueError('Marker panel index outside the configured target')
    margin = config['MARKER_PANEL_QUIET_MARGIN_M']
    fold = math.radians(config['MARKER_FOLD_ANGLE_DEG'])
    if not math.isfinite(fold) or not 0 < fold <= math.pi or not math.isfinite(margin) or margin < 0:
        raise ValueError('Invalid folded target geometry')
    if math.isclose(fold, math.pi, rel_tol=1e-9):
        # An unfolded sheet: both squares lie in one plane. Kept expressible so the
        # coplanar refusal below is reachable and testable, never so it can be trusted.
        return corners + np.array([(half + margin) * 2 * index, 0., 0.])
    radius = (half + margin) / math.tan(fold / 2)

    def basis(phi):
        return (np.array([math.sin(phi), 0., math.cos(phi)]),
                np.array([math.cos(phi), 0., -math.sin(phi)]))

    normal_zero, tangent_zero = basis(-fold / 2)
    normal_one, tangent_one = basis(fold / 2)
    to_local = np.column_stack([tangent_zero, UP, normal_zero]).T
    centre = to_local @ (radius * (normal_one - normal_zero))
    tangent = to_local @ tangent_one
    return np.array([centre + lx * tangent + ly * UP for lx, ly, _ in corners])


def noncoplanarity_rank_ratio(points):
    """Smallest to largest singular value of a point cloud: 0 for a plane, >0 for a solid."""
    cloud = np.asarray(points, dtype=np.float64)
    if cloud.ndim != 2 or cloud.shape[1] != 3 or cloud.shape[0] < 3 or not np.isfinite(cloud).all():
        return 0.
    values = np.linalg.svd(cloud - cloud.mean(axis=0), compute_uv=False)
    if values[0] <= 0:
        return 0.
    return float(values[-1] / values[0])


def detect_marker_panels(image, config):
    """Every configured panel seen in one frame, keyed by marker id.

    A repeated configured id is dropped rather than guessed at, matching
    detect_start_marker, which refuses unless exactly one match is present.
    """
    if cv2.__version__.split('.')[0] != '5':
        raise RuntimeError('OpenCV 5 required')
    if not isinstance(image, np.ndarray) or image.dtype != np.uint8 or image.ndim not in (2, 3):
        raise ValueError('Expected an 8-bit camera image')
    wanted = [config['MARKER_ID']]
    if config['MARKER_PANEL_COUNT'] > 1:
        wanted.append(config['MARKER_COMPANION_ID'])
    dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
    corners, ids, _ = cv2.aruco.ArucoDetector(dictionary).detectMarkers(image)
    if ids is None:
        return {}
    counts = {}
    for found in ids.ravel():
        counts[int(found)] = counts.get(int(found), 0) + 1
    panels = {}
    for corner, found in zip(corners, ids.ravel()):
        marker_id = int(found)
        if marker_id in wanted and marker_id not in panels and counts[marker_id] == 1:
            panels[marker_id] = corner.reshape(4, 2).astype(float)
    return panels


def estimate_folded_target_pose(panels_px, intrinsics, config):
    """One joint pose from two or more non-coplanar panels, expressed in panel zero's frame.

    SQPNP is globally optimal for non-coplanar points and returns a single solution, so
    IPPE's two-solution ratio test does not apply: the ambiguity it detects is
    structurally absent. In exchange this path demands strictly more than a single square
    does - two configured panels, both detected, and provable non-coplanarity. The
    minimum-edge, reprojection-RMS and maximum-distance bounds are enforced unchanged.
    """
    identity = config_identity(config)

    def reject(reason, **extra):
        return {**identity, 'accepted': False, 'reason': reason, **extra}

    if cv2.__version__.split('.')[0] != '5':
        return reject('opencv-version')
    ordered = [config['MARKER_ID'], config['MARKER_COMPANION_ID']]
    present = [(index, marker_id) for index, marker_id in enumerate(ordered)
               if marker_id in panels_px]
    if len(present) < 2:
        return reject('insufficient-marker-panels')
    try:
        k = np.asarray(intrinsics, dtype=np.float64).reshape(3, 3)
        object_points = np.vstack([folded_panel_corners(index, config) for index, _ in present])
        image_points = np.vstack([np.asarray(panels_px[marker_id], dtype=np.float64).reshape(4, 2)
                                  for _, marker_id in present])
    except (TypeError, ValueError, KeyError):
        return reject('invalid-input')
    if not np.isfinite(k).all() or not np.isfinite(image_points).all():
        return reject('invalid-input')
    if not np.array_equal(k[2], [0, 0, 1]) or min(k[0, 0], k[1, 1]) < config['MARKER_POSE_MIN_FOCAL_PX']:
        return reject('invalid-calibration')
    ratio = noncoplanarity_rank_ratio(object_points)
    if ratio < config['MARKER_MIN_NONCOPLANARITY_RANK_RATIO']:
        return reject('coplanar-target-ambiguous', nonCoplanarityRankRatio=ratio)
    for slot in range(len(present)):
        uv = image_points[slot * 4:(slot + 1) * 4]
        if any(np.linalg.norm(uv[(i + 1) % 4] - uv[i]) < config['MARKER_POSE_MIN_EDGE_PX']
               for i in range(4)):
            return reject('marker-too-small')
    try:
        solved, rvec, tvec = cv2.solvePnP(object_points, image_points, k, None,
                                          flags=cv2.SOLVEPNP_SQPNP)
    except cv2.error:
        return reject('pnp-failed')
    if not solved:
        return reject('pnp-failed')
    rotation = cv2.Rodrigues(rvec)[0]
    projected = cv2.projectPoints(object_points, rvec, tvec, k, None)[0].reshape(-1, 2)
    rms = float(np.sqrt(np.mean(np.sum((projected - image_points) ** 2, axis=1))))
    if not np.isfinite(rms) or not np.isfinite(tvec).all():
        return reject('pnp-failed')
    if rms > config['MARKER_POSE_MAX_REPROJECTION_RMS_PX']:
        return reject('high-reprojection-error', reprojectionRmsPx=rms)
    if not np.all((rotation @ object_points.T + tvec.reshape(3, 1))[2] > 0):
        return reject('ambiguous-or-invalid-pose')
    center = -rotation.T @ tvec.reshape(3)
    if np.linalg.norm(center) > config['ANCHOR_MARKER_MAX_DISTANCE_M']:
        return reject('marker-too-far')
    return {**identity, 'accepted': True, 'reason': 'folded-target-pose-only',
            'cameraCenterMarkerM': center.tolist(),
            'markerToCameraRotation': rotation.reshape(9).tolist(),
            'markerToCameraTranslationM': tvec.reshape(3).tolist(),
            'reprojectionRmsPx': rms, 'panelCount': len(present),
            'nonCoplanarityRankRatio': ratio}


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
    if config['MARKER_PANEL_COUNT'] > 1:
        panels = detect_marker_panels(image, config)
        if len(panels) > 1:
            return {**estimate_folded_target_pose(panels, intrinsics, config),
                    'markerId': config['MARKER_ID']}
    observation = detect_start_marker(image, config)
    if observation is None:
        return {'accepted': False, 'reason': 'marker-not-found',
                **config_identity(config), 'markerId': config['MARKER_ID']}
    pose = estimate_marker_pose(observation['cornersPx'], intrinsics, config)
    return {**pose, 'markerId': observation['markerId'], 'panelCount': 1}
