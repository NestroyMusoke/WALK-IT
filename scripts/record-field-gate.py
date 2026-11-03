"""Write a private measured route-end record; never manufactures a pass."""
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--route-id', required=True)
    parser.add_argument('--source-capture-sha256', required=True)
    parser.add_argument('--evidence', type=Path, required=True)
    parser.add_argument('--end-error-m', type=float, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    config_path = Path(__file__).resolve().parents[1] / 'config/vision.yaml'
    config_bytes = config_path.read_bytes()
    config = json.loads(config_bytes)
    if not args.evidence.is_file() or not args.route_id or len(args.source_capture_sha256) != 64:
        parser.error('Real field evidence and route identity required')
    if not 0 <= args.end_error_m <= config['ROUTE_END_ERROR_BUDGET_M']:
        parser.error('Measured end error exceeds route-end budget; no passing record issued')
    record = {
        'routeId': args.route_id,
        'sourceCaptureSha256': args.source_capture_sha256,
        'configSha256': hashlib.sha256(config_bytes).hexdigest(),
        'endErrorM': args.end_error_m,
        'timestampUtc': datetime.now(timezone.utc).isoformat(),
        'evidenceSha256': hashlib.sha256(args.evidence.read_bytes()).hexdigest(),
        'evidenceType': 'measured-field-run',
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.output.exists():
        parser.error('Output exists; choose a new private record path')
    args.output.write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
    print(f"Private field-gate record saved: {args.output}")


if __name__ == '__main__':
    main()
