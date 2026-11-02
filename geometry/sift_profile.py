"""OpenCV 5 SIFT constructor tied to the exact map/query configuration."""
import math

import cv2


def make_sift(config):
    if cv2.__version__.split('.')[0] != '5':
        raise RuntimeError('OpenCV 5 required')
    count = config['GEOMETRY_SIFT_FEATURES_COUNT']
    if type(count) is not int or count <= 0:
        raise ValueError('Invalid SIFT feature count')
    contrast_present = 'GEOMETRY_SIFT_CONTRAST_THRESHOLD' in config
    edge_present = 'GEOMETRY_SIFT_EDGE_THRESHOLD' in config
    if contrast_present != edge_present:
        raise ValueError('Incomplete custom SIFT profile')
    kwargs = {'nfeatures': count}
    if contrast_present:
        contrast, edge = config['GEOMETRY_SIFT_CONTRAST_THRESHOLD'], config['GEOMETRY_SIFT_EDGE_THRESHOLD']
        if (type(contrast) not in (int, float) or type(edge) not in (int, float) or
                not math.isfinite(contrast) or not math.isfinite(edge) or contrast <= 0 or edge <= 0):
            raise ValueError('Invalid custom SIFT profile')
        kwargs.update(contrastThreshold=contrast, edgeThreshold=edge)
    return cv2.SIFT_create(**kwargs)
