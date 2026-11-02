"""One-command private map build and structural audit for a reviewed author backup."""
import argparse
import contextlib
import hashlib
import io
import json
from pathlib import Path

from author_intake import audit_author_capture
from tracks import run as build_tracks


def _sha(raw):
    return hashlib.sha256(raw).hexdigest()


def _build_map(private_capture, map_path):
    with contextlib.redirect_stdout(io.StringIO()):
        build_tracks(private_capture)
    config = json.loads((Path(__file__).resolve().parents[1] / 'config/vision.yaml').read_text())
    produced = private_capture.with_name(
        f"{private_capture.stem}-tracks-window{config['GEOMETRY_PAIR_WINDOW_FRAMES_COUNT']}-filtered.json")
    if not produced.exists():
        raise RuntimeError('Map builder did not produce its declared output')
    produced.replace(map_path)


def preflight(source, private_root, config, config_bytes, builder_bytes, builder=_build_map):
    source = Path(source)
    raw = source.read_bytes()
    capture = json.loads(raw)
    if capture.get('purpose', 'author-route') != 'author-route' or capture.get('manifest', {}).get(
            'privacy') != {'capturePermitted': True, 'imagesReviewed': True}:
        raise ValueError('A permitted, reviewed author backup is required')
    capture_sha, config_sha, builder_sha = map(_sha, (raw, config_bytes, builder_bytes))
    root = Path(private_root) / f'preflight-{capture_sha[:12]}-{config_sha[:12]}-{builder_sha[:12]}'
    root.mkdir(parents=True, exist_ok=True)
    private_capture, map_path, report_path = root / 'capture.json', root / 'map.json', root / 'intake.json'
    if private_capture.exists():
        if private_capture.read_bytes() != raw:
            raise ValueError('Cached capture conflicts with source')
    else:
        private_capture.write_bytes(raw)
    if not map_path.exists():
        builder(private_capture, map_path)
    result = audit_author_capture(raw, map_path.read_bytes(), config, config_sha)
    result['mapBuilderSha256'] = builder_sha
    encoded = json.dumps(result, indent=2, allow_nan=False).encode()
    if report_path.exists():
        if report_path.read_bytes() != encoded:
            raise ValueError('Cached report conflicts with current map or audit')
    else:
        report_path.write_bytes(encoded)
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('reviewed_backup', type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    config_bytes = (root / 'config/vision.yaml').read_bytes()
    builder_bytes = (root / 'geometry/tracks.py').read_bytes()
    result = preflight(args.reviewed_backup, root / 'eval/sessions', json.loads(config_bytes),
                       config_bytes, builder_bytes)
    print(json.dumps(result, indent=2))
    if not result['dataComplete']:
        print('STOP: structural intake incomplete. Inspect the route before leaving the site.')
        return 2
    print('Structural intake complete. Independent visitor localization is still required.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
