"""Compare an independent OpenCV route pose with the live tracker in marker metres.

This is a diagnostic only. A small position residual by itself does not establish
heading, route progress, fresh geometry or permission to draw an arrow.
"""
import re

import numpy as np


def _similarity(value):
    if not isinstance(value, dict) or value.get('direction') != 'map-to-session':
        raise ValueError('Expected marker-to-session similarity')
    try:
        scale = float(value['scale'])
        rotation = np.asarray(value['rotation'], dtype=float).reshape(3, 3)
        translation = np.asarray(value['translation'], dtype=float).reshape(3)
    except (KeyError, TypeError, ValueError) as error:
        raise ValueError('Invalid similarity') from error
    if (not np.isfinite(scale) or scale <= 0 or not np.isfinite(rotation).all() or
            not np.isfinite(translation).all() or
            not np.allclose(rotation.T @ rotation, np.eye(3), atol=0.01) or
            not np.isclose(np.linalg.det(rotation), 1., atol=0.01)):
        raise ValueError('Invalid similarity')
    return scale, rotation, translation


def _point(value):
    try:
        point = np.asarray(value, dtype=float)
    except (TypeError, ValueError) as error:
        raise ValueError('Invalid camera center') from error
    if point.shape != (3,) or not np.isfinite(point).all():
        raise ValueError('Invalid camera center')
    return point


def compare_pose_to_tracker(opencv_center_author_tracker, visitor_center_tracker,
                            marker_to_author_session, marker_to_visitor_session,
                            author_config_sha, visitor_config_sha):
    """Invert each session transform, then compare two camera centers in marker metres."""
    if (not isinstance(author_config_sha, str) or
            not re.fullmatch('[0-9a-f]{64}', author_config_sha) or
            author_config_sha != visitor_config_sha):
        raise ValueError('Capture configuration mismatch')
    author_scale, author_rotation, author_translation = _similarity(marker_to_author_session)
    visitor_scale, visitor_rotation, visitor_translation = _similarity(marker_to_visitor_session)
    author_center = _point(opencv_center_author_tracker)
    visitor_center = _point(visitor_center_tracker)
    opencv_marker = author_rotation.T @ (author_center - author_translation) / author_scale
    tracker_marker = visitor_rotation.T @ (visitor_center - visitor_translation) / visitor_scale
    residual = float(np.linalg.norm(opencv_marker - tracker_marker))
    return {'configSha256': author_config_sha,
            'opencvCameraCenterMarkerM': opencv_marker.tolist(),
            'trackerCameraCenterMarkerM': tracker_marker.tolist(),
            'residualM': residual,
            'navigationReady': False, 'arrowAuthorized': False}
