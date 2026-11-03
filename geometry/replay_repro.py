"""Offline localizer and destination-gate reproduction on reviewed captures."""
import argparse
import base64
import hashlib
import json
import sys
from pathlib import Path

import cv2
import numpy as np

from geometry.replay_verifier_report import build_report


def summarize(queries, verifier_frames):
    if len(queries) != len(verifier_frames):
        raise ValueError('Localizer and verifier attempts differ')
    accepted = [sum(candidate.get('accepted') is True for candidate in result['candidates'])
                for result in queries]
    return {'attempts': len(queries), 'verifiedStartSuccesses': 0,
            'localizationCandidateFrames': sum(count > 0 for count in accepted),
            'ambiguousCandidateFrames': sum(count > 1 for count in accepted),
            'refusals': sum(frame['status'] == 'refused' for frame in verifier_frames),
            'abstentions': sum(frame['status'] == 'abstain' for frame in verifier_frames),
            'failures': sum(count == 0 for count in accepted),
            'confirmations': sum(frame['status'] == 'confirmed' for frame in verifier_frames)}


def run(author_bytes, map_bytes, visitor_bytes, map_config_bytes, capture_config_bytes,
        cases=None, frame_limit=None):
    if cv2.__version__.split('.')[0] != '5':
        raise RuntimeError('OpenCV 5 required')
    model, author, visitor = json.loads(map_bytes), json.loads(author_bytes), json.loads(visitor_bytes)
    map_config_sha = hashlib.sha256(map_config_bytes).hexdigest()
    if model.get('geometryConfigSha256') != map_config_sha or model.get('captureSha256') != hashlib.sha256(author_bytes).hexdigest():
        raise ValueError('Author map/config/source mismatch')
    map_config = json.loads(map_config_bytes)
    # Legacy geometry modules have local imports. No alternative model or silent fallback.
    geometry_dir = str(Path(__file__).resolve().parent)
    if geometry_dir not in sys.path:
        sys.path.insert(0, geometry_dir)
    from ref_image_query import ReferenceImageQuery
    query = ReferenceImageQuery(map_bytes, author_bytes, map_config)
    manifest = visitor['manifest']
    if manifest.get('privacy') != {'capturePermitted': True, 'imagesReviewed': True}:
        raise ValueError('Visitor capture not reviewed')
    if len(visitor['images']) != len(manifest['keyframes']):
        raise ValueError('Visitor image count mismatch')
    selected = list(zip(visitor['images'], manifest['keyframes'], strict=True))
    selected = selected[:frame_limit if frame_limit is not None else map_config['START_MAP_FRAME_CAPACITY_COUNT']]
    queries = []
    for image, frame in selected:
        if image['id'] != frame['id']:
            raise ValueError('Visitor image/frame mismatch')
        pixels = cv2.imdecode(np.frombuffer(base64.b64decode(image['png'], validate=True), np.uint8),
                              cv2.IMREAD_GRAYSCALE)
        if pixels is None or pixels.shape != (frame['height'], frame['width']):
            raise ValueError('Visitor image/calibration mismatch')
        queries.append(query.query_by_reference(pixels, frame['intrinsics']))
    verifier = build_report(visitor_bytes, capture_config_bytes, cases)
    counts = summarize(queries, verifier['frames'][:len(queries)])
    return {'sourceClass': 'RECORDED REPLAY', 'kind': 'localizer-and-verifier-screening-not-navigation',
            'opencv': cv2.__version__, 'authorSha256': hashlib.sha256(author_bytes).hexdigest(),
            'mapSha256': hashlib.sha256(map_bytes).hexdigest(),
            'visitorSha256': hashlib.sha256(visitor_bytes).hexdigest(),
            'mapConfigSha256': map_config_sha,
            'captureConfigSha256': verifier['configSha256'],
            'receiptProvenance': verifier['receiptProvenance'],
            'counts': counts, 'navigationReady': False, 'arrowAuthorized': False}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--author', type=Path, required=True)
    parser.add_argument('--map', type=Path, required=True)
    parser.add_argument('--visitor', type=Path, required=True)
    parser.add_argument('--map-config', type=Path, required=True)
    parser.add_argument('--capture-config', type=Path, required=True)
    parser.add_argument('--cases', type=Path)
    parser.add_argument('--frame-limit', type=int)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    cases = json.loads(args.cases.read_text()) if args.cases else None
    report = run(args.author.read_bytes(), args.map.read_bytes(), args.visitor.read_bytes(),
                 args.map_config.read_bytes(), args.capture_config.read_bytes(),
                 cases, args.frame_limit)
    if args.output:
        args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
