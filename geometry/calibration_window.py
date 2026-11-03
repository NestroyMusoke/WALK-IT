"""Best-conditioned suffix window over buffered marker receipts.

Gates are untouched: every candidate window is judged by
calibrate_marker_to_session with the same configuration. This module only
decides which buffered views are offered to that gate, so unsettled frames at
the start of a session cannot veto a later well-conditioned stretch of the same
walk. Only leading views are ever dropped, which keeps the newest observation
inside every candidate and preserves calibration freshness.
"""
import sys
from pathlib import Path

geometry_dir = str(Path(__file__).resolve().parent)
if geometry_dir not in sys.path:
    sys.path.insert(0, geometry_dir)
from marker_scale import calibrate_marker_to_session

SELECTION_RULE = ('suffix-window-search: candidates keep the newest view and drop only leading views; '
                  'accept the window with the largest minimum gate margin over metric baseline, orientation '
                  'disagreement, pairwise scale disagreement and relative residual; ties prefer more views, '
                  'then a larger metric baseline')
MARGIN_CAP = 1e6
NEAR_MISS_RANK = {'marker-tracker-residual': 0, 'inconsistent-scale': 1,
                  'inconsistent-marker-orientation': 2, 'insufficient-metric-baseline': 3,
                  'insufficient-tracker-baseline': 4, 'marker-too-far': 5, 'invalid-scale': 6}


def gate_margins(result, config):
    """How much of each gate budget an accepted window keeps; above one means passing."""
    margins = {}
    span = result.get('markerBaselineM')
    if isinstance(span, (int, float)) and span > 0:
        margins['metricBaseline'] = min(span / config['ANCHOR_MIN_START_BASELINE_M'], MARGIN_CAP)
    spread = result.get('maxOrientationDisagreementDeg')
    if isinstance(spread, (int, float)):
        margins['orientation'] = min(config['ANCHOR_MAX_ORIENTATION_DISAGREEMENT_DEG'] / max(spread, 1e-9), MARGIN_CAP)
    disagreement = result.get('maxPairwiseScaleDisagreementFraction')
    if isinstance(disagreement, (int, float)):
        margins['pairwiseScale'] = min(
            config['ANCHOR_MAX_PAIRWISE_SCALE_DISAGREEMENT_FRACTION'] / max(disagreement, 1e-9), MARGIN_CAP)
    residual = result.get('maxRelativeResidual')
    if isinstance(residual, (int, float)):
        margins['relativeResidual'] = min(
            config['ALIGNMENT_MAX_RELATIVE_RESIDUAL'] / max(residual, 1e-9), MARGIN_CAP)
    return margins


def select_calibration_window(observations, config):
    """Return the gate result for the best-conditioned suffix window, plus the selection record."""
    total = len(observations) if isinstance(observations, list) else 0
    minimum = config['ALIGNMENT_MIN_PAIRS_COUNT']

    def record(calibration, candidates=0, passing=0, start=None, margins=None, conditioning=None):
        return {**calibration, 'windowSelection': {
            'accepted': calibration.get('accepted') is True, 'rule': SELECTION_RULE,
            'totalObservationCount': total, 'candidateWindowCount': candidates,
            'passingWindowCount': passing, 'selectedStartIndex': start,
            'selectedObservationCount': None if start is None else total - start,
            'discardedLeadingObservationCount': 0 if start is None else start,
            'selectedFrameIds': [] if start is None else [
                observation.get('frameId') for observation in observations[start:]],
            'gateMargins': margins or {}, 'conditioning': conditioning,
            'reasonSource': 'whole-buffer' if start is None else 'best-conditioned-suffix-window'}}

    if total < minimum:
        return record(calibrate_marker_to_session(observations if isinstance(observations, list) else [], config))

    accepted, rejected = [], []
    for start in range(total - minimum + 1):
        window = observations[start:]
        result = calibrate_marker_to_session(window, config)
        if result.get('accepted') is True:
            margins = gate_margins(result, config)
            conditioning = min(margins.values()) if margins else 0.
            accepted.append((-conditioning, -len(window), -float(result.get('markerBaselineM') or 0.),
                             start, result, margins, conditioning))
        else:
            rank = NEAR_MISS_RANK.get(result.get('reason'), len(NEAR_MISS_RANK))
            rejected.append((rank, -float(result.get('markerBaselineM') or 0.), -len(window), start, result))

    if accepted:
        accepted.sort(key=lambda item: item[:3])
        _, _, _, start, result, margins, conditioning = accepted[0]
        return record(result, len(accepted) + len(rejected), len(accepted), start, margins, conditioning)
    rejected.sort(key=lambda item: item[:3])
    _, _, _, start, result = rejected[0]
    margins = gate_margins(result, config)
    return record(result, len(rejected), 0, start, margins)
