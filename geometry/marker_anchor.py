"""OpenCV 5 marker observation only; no route or arrow authorization."""
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
