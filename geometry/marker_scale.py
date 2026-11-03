"""Optional marker-metre to one AR session similarity hypothesis."""
import hashlib
import json

import cv2
import numpy as np

from reconstruct import extrinsic


def calibrate_marker_to_session(observations, config):
    config_sha = hashlib.sha256(json.dumps(config, sort_keys=True,
                                separators=(',', ':')).encode()).hexdigest()
    identity = {'configSha256': config_sha, 'configHashEncoding': 'canonical-json',
                'opencvVersion': cv2.__version__, 'metricScaleVerified': False,
                'navigationReady': False, 'arrowAuthorized': False}

    def reject(reason, **metrics):
        return {**identity, 'accepted': False, 'reason': reason, **metrics}

    if cv2.__version__.split('.')[0] != '5':
        return reject('opencv-version')
    if not isinstance(observations, list) or len(observations) < config['ALIGNMENT_MIN_PAIRS_COUNT']:
        return reject('insufficient-observations')
    marker_centers, tracker_centers, orientations, seen_ids = [], [], [], set()
    last_video_time = -np.inf
    for observation in observations:
        if not isinstance(observation, dict):
            return reject('invalid-observation')
        frame_id = observation.get('frameId')
        image_video_time = observation.get('imageVideoTime')
        pose_video_time = observation.get('poseVideoTime')
        if (not isinstance(frame_id, str) or not frame_id or frame_id in seen_ids or
                type(image_video_time) not in (int, float) or type(pose_video_time) not in (int, float) or
                not np.isfinite(image_video_time) or not np.isfinite(pose_video_time) or
                image_video_time != pose_video_time or image_video_time <= last_video_time or
                observation.get('accepted') is not True or
                observation.get('markerId') != config['MARKER_ID'] or
                observation.get('configSha256') != config_sha or
                not str(observation.get('opencvVersion', '')).startswith('5.')):
            return reject('untrusted-or-unsynchronized-observation')
        try:
            marker = np.asarray(observation.get('cameraCenterMarkerM'), dtype=float)
            tracker = np.asarray(observation.get('trackerCameraCenter'), dtype=float)
            marker_to_camera = np.asarray(observation.get('markerToCameraRotation'), dtype=float).reshape(3, 3)
            tracker_quaternion = np.asarray(observation.get('trackerRotation'), dtype=float)
        except (TypeError, ValueError):
            return reject('missing-or-invalid-orientation')
        if (marker.shape != (3,) or tracker.shape != (3,) or tracker_quaternion.shape != (4,) or
                not np.isfinite(marker).all() or not np.isfinite(tracker).all() or
                not np.isfinite(marker_to_camera).all() or not np.isfinite(tracker_quaternion).all() or
                abs(np.linalg.norm(tracker_quaternion)-1) > config['QUATERNION_NORM_TOLERANCE'] or
                not np.allclose(marker_to_camera.T @ marker_to_camera, np.eye(3), atol=0.01) or
                not np.isclose(np.linalg.det(marker_to_camera), 1., atol=0.01)):
            return reject('missing-or-invalid-orientation')
        if np.linalg.norm(marker) > config['ANCHOR_MARKER_MAX_DISTANCE_M']:
            return reject('marker-too-far')
        tracker_to_camera = extrinsic({'rotation': tracker_quaternion.tolist(),
                                        'position': tracker.tolist()})[:, :3]
        orientations.append(marker_to_camera.T @ tracker_to_camera)
        marker_centers.append(marker)
        tracker_centers.append(tracker)
        seen_ids.add(frame_id)
        last_video_time = image_video_time
    marker_centers = np.asarray(marker_centers)
    tracker_centers = np.asarray(tracker_centers)
    span = max(np.linalg.norm(a-b) for a in marker_centers for b in marker_centers)
    if span < config['ANCHOR_MIN_START_BASELINE_M']:
        return reject('insufficient-metric-baseline', markerBaselineM=float(span))
    u, _, vt = np.linalg.svd(np.sum(orientations, axis=0))
    reflection = np.eye(3)
    reflection[-1, -1] = np.linalg.det(u @ vt)
    rotation = u @ reflection @ vt
    angles = [float(np.degrees(np.arccos(np.clip((np.trace(rotation.T @ sample)-1)/2, -1, 1))))
              for sample in orientations]
    if max(angles) > config['ANCHOR_MAX_ORIENTATION_DISAGREEMENT_DEG']:
        return reject('inconsistent-marker-orientation', markerBaselineM=float(span),
                      maxOrientationDisagreementDeg=max(angles))
    # Use separated start views. Adjacent saved frames may move only a few
    # centimetres, especially in a session with many tracker units per metre.
    pair_indices = [(i, j) for i in range(len(observations))
                    for j in range(i + 1, len(observations))]
    step_marker = np.asarray([np.linalg.norm(marker_centers[j]-marker_centers[i])
                              for i, j in pair_indices])
    step_tracker = np.asarray([np.linalg.norm(tracker_centers[j]-tracker_centers[i])
                               for i, j in pair_indices])
    usable = step_tracker >= config['ALIGNMENT_WINDOW_MIN_HORIZONTAL_EXTENT_TRACKER_UNITS']
    if int(usable.sum()) < 2:
        return reject('insufficient-tracker-baseline')
    scale = float(step_marker[usable].sum() / step_tracker[usable].sum())
    if not np.isfinite(scale) or scale <= 0:
        return reject('invalid-scale')
    pair_scales = step_marker[usable] / step_tracker[usable]
    disagreement = float(np.max(np.abs(pair_scales/scale-1)))
    if disagreement > config['ANCHOR_MAX_PAIRWISE_SCALE_DISAGREEMENT_FRACTION']:
        return reject('inconsistent-scale', markerBaselineM=float(span),
                      maxOrientationDisagreementDeg=max(angles),
                      maxPairwiseScaleDisagreementFraction=disagreement)
    translation = marker_centers.mean(axis=0)-scale*rotation@tracker_centers.mean(axis=0)
    predicted = scale*(tracker_centers @ rotation.T)+translation
    residual = np.linalg.norm(predicted-marker_centers, axis=1)
    relative_residual = float(residual.max()/span)
    if relative_residual > config['ALIGNMENT_MAX_RELATIVE_RESIDUAL']:
        return reject('marker-tracker-residual')
    inverse_rotation = rotation.T
    inverse_scale = 1/scale
    inverse_translation = -inverse_scale*inverse_rotation@translation
    return {**identity, 'accepted': True, 'reason': 'marker-to-session-hypothesis-only',
            'trackerToMarker': {'direction': 'session-to-map', 'scale': scale,
                                'rotation': rotation.reshape(9).tolist(),
                                'translation': translation.tolist()},
            'markerToSession': {'direction': 'map-to-session', 'scale': inverse_scale,
                                'rotation': inverse_rotation.reshape(9).tolist(),
                                'translation': inverse_translation.tolist()},
            'maxRelativeResidual': relative_residual,
            'maxResidualSessionUnits': float(residual.max()/scale),
            'maxOrientationDisagreementDeg': max(angles),
            'maxPairwiseScaleDisagreementFraction': disagreement,
            'markerBaselineM': float(span),
            'observationCount': len(observations)}


def session_points_to_marker_m(session_points, calibration):
    if calibration.get('accepted') is not True:
        raise ValueError('Accepted marker-to-session calibration required')
    transform = calibration['markerToSession']
    if transform['direction'] != 'map-to-session':
        raise ValueError('Unexpected calibration direction')
    points = np.asarray(session_points, dtype=float)
    if points.ndim != 2 or points.shape[1] != 3 or not np.isfinite(points).all():
        raise ValueError('Invalid route points')
    rotation = np.asarray(transform['rotation'], dtype=float).reshape(3, 3)
    translation = np.asarray(transform['translation'], dtype=float)
    return ((points - translation) @ rotation) / transform['scale']
