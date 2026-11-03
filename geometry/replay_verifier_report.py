"""Offline, per-frame replay of the existing Spark/SAM destination gate.

This binds caller-supplied receipts to reviewed pixels. It never grants an AR
anchor, and a local receipt file is not proof of a real provider call.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path

from geometry.destination_verifier import fuse_observations
from geometry.receipt_pair import evaluate_pair


def sha(data):
    return hashlib.sha256(data).hexdigest()


def build_report(capture_bytes, config_bytes, cases=None, *, source_class='RECORDED REPLAY', now_ms=None):
    if source_class not in ('RECORDED REPLAY', 'SYNTHETIC'):
        raise ValueError('Invalid source class')
    config = json.loads(config_bytes)
    capture = json.loads(capture_bytes)
    if capture.get('schemaVersion') == 2:
        capture = capture['capture']
    manifest = capture['manifest']
    config_sha = sha(config_bytes)
    if manifest.get('configSha256') != config_sha:
        raise ValueError('Capture config hash does not match supplied config')
    if manifest.get('privacy') != {'capturePermitted': True, 'imagesReviewed': True}:
        raise ValueError('Capture is not reviewed and permitted')
    frames, images, timing = manifest['keyframes'], capture['images'], capture['timing']
    if not frames or len(frames) != len(images) or len(frames) != len(timing):
        raise ValueError('Incomplete capture')
    cases = cases or {}
    if not isinstance(cases, dict):
        raise ValueError('Receipt cases must be keyed by frame ID')
    out, candidates, seen = [], [], set()
    for frame, image, stamp in zip(frames, images, timing):
        fid = frame['id']
        if fid in seen or fid != image['id'] or fid != stamp['id']:
            raise ValueError('Unpaired or duplicate frame')
        seen.add(fid)
        image_sha = sha(base64.b64decode(image['png'], validate=True))
        case = cases.get(fid, {})
        if not isinstance(case, dict):
            raise ValueError('Invalid receipt case')
        context = case.get('context')
        if isinstance(context, dict) and (context.get('frame_id') != fid or
                                          context.get('route_id') != manifest.get('routeId') or
                                          context.get('image_sha256') != image_sha):
            result = {'status': 'abstain', 'reason': 'image-or-config-mismatch', 'confirmed': False}
        else:
            at = now_ms if now_ms is not None else stamp['receivedAtMs']
            result = evaluate_pair(case.get('spark'), case.get('sam'), context,
                                   at, config_sha, config)
            if result.get('status') == 'candidate':
                candidates.append(result)
                fused = fuse_observations(candidates, at, config)
                if fused.get('confirmed') is True:
                    result = {**result, 'status': 'confirmed', 'confirmed': True,
                              'reason': fused['reason'], 'observation_count': fused['observation_count']}
            else:
                candidates.clear()
        out.append({'frameId': fid, 'imageSha256': image_sha, 'status': result['status'],
                    'reason': result['reason'], 'confirmed': result.get('confirmed') is True,
                    'modelEvidence': 'caller-supplied' if case else 'missing'})
    unknown = set(cases) - seen
    if unknown:
        raise ValueError('Receipt case references unknown frame')
    counts = {'attempts': len(out), 'candidates': sum(x['status'] == 'candidate' for x in out),
              'confirmations': sum(x['confirmed'] for x in out),
              'abstentions': sum(x['status'] == 'abstain' for x in out)}
    return {'schemaVersion': 1, 'sourceClass': source_class,
            'captureSha256': sha(capture_bytes), 'configSha256': config_sha,
            'routeId': manifest['routeId'], 'purpose': capture.get('purpose', 'author-route'),
            'receiptProvenance': 'caller-supplied; not authenticated',
            'anchorAuthorized': False, 'counts': counts, 'frames': out}


def main():
    parser = argparse.ArgumentParser(description='Run real verifier code on private replay frames')
    parser.add_argument('--capture', type=Path, required=True)
    parser.add_argument('--config', type=Path, required=True)
    parser.add_argument('--cases', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    cases = json.loads(args.cases.read_text()) if args.cases else None
    report = build_report(args.capture.read_bytes(), args.config.read_bytes(), cases)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'report': str(args.output), 'captureSha256': report['captureSha256'],
                      'configSha256': report['configSha256'], 'counts': report['counts']}))


if __name__ == '__main__':
    main()
