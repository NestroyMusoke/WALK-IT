"""Paired destination-decision accounting. Labels must be independent ground truth."""
import argparse
import json
from pathlib import Path
from geometry.replay_verifier_report import build_report


def compare(with_model, without_model, labels=None):
    if not with_model and not without_model and not labels:
        return {'available': False, 'reason': 'no-held-out-paired-approaches', 'approaches': 0}
    if not isinstance(labels, list) or not labels or len(with_model) != len(without_model) or len(labels) != len(with_model):
        raise ValueError('Paired results and ground-truth labels required')
    if any(label not in ('right', 'wrong') for label in labels):
        raise ValueError('Unknown destination ground truth')

    def count(results):
        statuses = [item.get('status') for item in results]
        if any(status not in ('confirmed', 'refused', 'abstain') for status in statuses):
            raise ValueError('Unknown verifier decision')
        return {'confirmations': statuses.count('confirmed'), 'refusals': statuses.count('refused'),
                'abstentions': statuses.count('abstain'),
                'falseConfirms': sum(status == 'confirmed' and truth == 'wrong'
                                     for status, truth in zip(statuses, labels))}
    return {'available': True, 'approaches': len(labels),
            'withModel': count(with_model), 'withoutModel': count(without_model)}


def evaluate_paired(capture_bytes, config_bytes, cases, labels):
    """Run identical reviewed frames/context through the gate with and without receipts."""
    if not cases or not labels:
        return compare([], [])
    with_report = build_report(capture_bytes, config_bytes, cases)
    without_report = build_report(capture_bytes, config_bytes)
    frame_ids = [frame['frameId'] for frame in with_report['frames']]
    if set(labels) != set(frame_ids):
        raise ValueError('Independent labels must cover every attempted frame')
    if set(cases) != set(frame_ids) or any(
            not isinstance(cases[frame_id], dict) or
            not all(isinstance(cases[frame_id].get(key), dict)
                    for key in ('spark', 'sam', 'context')) for frame_id in frame_ids):
        raise ValueError('Both model receipts and route context required for every paired frame')
    result = compare(with_report['frames'], without_report['frames'],
                     [labels[frame_id] for frame_id in frame_ids])
    return {**result, 'captureSha256': with_report['captureSha256'],
            'configSha256': with_report['configSha256'],
            'receiptProvenance': with_report['receiptProvenance']}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--capture', type=Path, required=True)
    parser.add_argument('--config', type=Path, required=True)
    parser.add_argument('--cases', type=Path, required=True)
    parser.add_argument('--labels', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(evaluate_paired(args.capture.read_bytes(), args.config.read_bytes(),
                                     json.loads(args.cases.read_text()),
                                     json.loads(args.labels.read_text())), indent=2))


if __name__ == '__main__':
    main()
