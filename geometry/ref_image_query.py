"""Experimental reference-image matching with 2D-to-3D lifting. Not navigation-ready."""
import base64
import hashlib
import json
import time

import cv2
import numpy as np

from localizer import estimate_pose
from map_query import validate_map
from tracks import ratio_matches


class ReferenceImageQuery:
    def __init__(self, map_bytes, capture_bytes, config):
        if cv2.__version__.split('.')[0] != '5':
            raise RuntimeError('OpenCV 5 required')
        model, capture = json.loads(map_bytes), json.loads(capture_bytes)
        if model['captureSha256'] != hashlib.sha256(capture_bytes).hexdigest():
            raise ValueError('Map/source capture identity mismatch')
        self.landmarks = validate_map(model)
        self.config = config
        self.sift = cv2.SIFT_create(nfeatures=config['GEOMETRY_SIFT_FEATURES_COUNT'])
        lookup = {(obs['keyframeId'], obs['featureIndex']): index
                  for index, landmark in enumerate(model['landmarks'])
                  for obs in landmark['observations']}
        self.references = []
        for image, frame in zip(capture['images'], capture['manifest']['keyframes'], strict=True):
            pixels = cv2.imdecode(np.frombuffer(base64.b64decode(image['png']), np.uint8), cv2.IMREAD_GRAYSCALE)
            if pixels is None or pixels.shape != (frame['height'], frame['width']):
                raise ValueError('Invalid reference image')
            points, descriptors = self.sift.detectAndCompute(pixels, None)
            owners = {feature: lookup[(frame['id'], feature)] for feature in range(len(points))
                      if (frame['id'], feature) in lookup}
            self.references.append((points, descriptors, owners))

    def query_pixels(self, pixels, intrinsics):
        started = time.perf_counter()
        if cv2.__version__.split('.')[0] != '5':
            raise RuntimeError('OpenCV 5 required')
        if pixels.ndim != 2 or pixels.dtype != np.uint8:
            raise ValueError('Expected grayscale reviewed image')
        if not self.references:
            return {'accepted': False, 'reason': 'no-reference-images', 'navigationReady': False}
        points, descriptors = self.sift.detectAndCompute(pixels, None)
        if descriptors is None:
            return {'accepted': False, 'reason': 'insufficient-matches', 'matches': 0,
                    'navigationReady': False, 'elapsedMs': (time.perf_counter()-started)*1000}
        candidates = []
        for _, ref_desc, owners in self.references:
            forward = ratio_matches(descriptors, ref_desc, self.config['GEOMETRY_MATCH_RATIO'])
            reverse = ratio_matches(ref_desc, descriptors, self.config['GEOMETRY_MATCH_RATIO'])
            for query_index, ref_index in forward.items():
                if reverse.get(ref_index) != query_index or ref_index not in owners:
                    continue
                owner = owners[ref_index]
                score = float(np.linalg.norm(descriptors[query_index]-ref_desc[ref_index]))
                candidates.append((score, query_index, owner))
        used_queries, used_landmarks, used_pixels, used_positions, matches = set(), set(), set(), set(), []
        for _, query_index, owner in sorted(candidates):
            pixel=tuple(points[query_index].pt)
            position=tuple(self.landmarks[owner]['position'])
            if (query_index in used_queries or owner in used_landmarks or
                    pixel in used_pixels or position in used_positions):
                continue
            used_queries.add(query_index); used_landmarks.add(owner)
            used_pixels.add(pixel); used_positions.add(position)
            matches.append((query_index, owner))
        xyz = np.asarray([self.landmarks[owner]['position'] for _, owner in matches]).reshape(-1,3)
        uv = np.asarray([points[index].pt for index, _ in matches]).reshape(-1,2)
        result = estimate_pose(xyz, uv, np.asarray(intrinsics).reshape(3,3),
                               (pixels.shape[1], pixels.shape[0]),
                               [self.landmarks[owner]['id'] for _, owner in matches], self.config)
        return {**result, 'matches': len(matches), 'navigationReady': False,
                'elapsedMs': (time.perf_counter()-started)*1000}
