"""Private marked-walk diagnostic. Physical marks are supplied by the operator."""
import argparse
import hashlib
import json
import math
from pathlib import Path


def load_backup_events(path):
    raw = path.read_bytes()
    envelope = json.loads(raw)
    if not isinstance(envelope, dict) or set(envelope) != {"schemaVersion", "capture", "diagnostic"} or envelope["schemaVersion"] != 2:
        raise ValueError("Backup lacks embedded numeric diagnostics; older route-only backups cannot recover mark taps")
    capture = envelope["capture"]
    diagnostic = envelope["diagnostic"]
    if not isinstance(capture, dict) or not isinstance(diagnostic, dict) or set(diagnostic) != {"configSha256", "events"}:
        raise ValueError("Malformed private evidence backup")
    manifest = capture.get("manifest")
    config = diagnostic.get("configSha256")
    if not isinstance(manifest, dict) or not isinstance(config, str) or len(config) != 64 or manifest.get("configSha256") != config:
        raise ValueError("Capture and diagnostic configuration differ")
    events = diagnostic.get("events")
    if not isinstance(events, list) or any(not isinstance(e, dict) for e in events):
        raise ValueError("Invalid backup events")
    return {"events": events, "configSha256": config,
            "backupSha256": hashlib.sha256(raw).hexdigest(),
            "captureSha256": hashlib.sha256(json.dumps(capture, separators=(",", ":")).encode()).hexdigest()}


def analyze_marks(events, physical_distances_m):
    distances = [float(value) for value in physical_distances_m]
    if len(distances) < 2 or not all(math.isfinite(v) for v in distances) or any(b <= a for a, b in zip(distances, distances[1:])):
        raise ValueError("Physical mark distances must increase")
    expected = [f"mark-{2 * i}m" for i in range(len(distances))]
    # A page may contain an aborted recording followed by the reviewed route.
    # Keep the full log in the evidence file, but score only the last attempt.
    starts = [i for i, event in enumerate(events)
              if event.get("kind") == "step" and event.get("label") == "host-recording-started"]
    scored_events = events[starts[-1] + 1:] if starts else events
    found = {}
    for event in scored_events:
        if event.get("kind") != "step" or not event.get("label", "").startswith("mark-"):
            continue
        label = event["label"]
        if label in found:
            raise ValueError(f"Duplicate mark tap: {label}")
        values = event.get("values", [])
        if len(values) < 5 or not all(isinstance(v, (int, float)) and math.isfinite(v) for v in values[:5]):
            raise ValueError(f"Invalid mark pose: {label}")
        found[label] = {"timeMs": event["t"], "videoTimeSeconds": values[1], "positionTrackerUnits": values[2:5]}
    unknown = sorted(set(found) - set(expected))
    if unknown:
        raise ValueError(f"Unexpected mark tap labels: {unknown}")
    missing = [label for label in expected if label not in found]
    base = {"navigationReady": False, "metricScaleVerified": False,
            "markCount": len(found), "expectedMarkCount": len(expected), "missingMarks": missing,
            "physicalDistanceM": distances[-1] - distances[0]}
    if missing:
        return {**base, "status": "incomplete-marks", "segments": []}
    ordered = [found[label] for label in expected]
    if any(b["timeMs"] <= a["timeMs"] for a, b in zip(ordered, ordered[1:])):
        raise ValueError("Mark taps out of order")
    segments = []
    for index, (a, b) in enumerate(zip(ordered, ordered[1:])):
        physical = distances[index + 1] - distances[index]
        tracker = math.dist(a["positionTrackerUnits"], b["positionTrackerUnits"])
        segments.append({"from": expected[index], "to": expected[index + 1],
                         "startDistanceM": distances[index], "endDistanceM": distances[index + 1],
                         "elapsedSeconds": (b["timeMs"] - a["timeMs"]) / 1000,
                         "displacementTrackerUnits": tracker,
                         "trackerUnitsPerMeter": tracker / physical})
    return {**base, "status": "complete-marked-diagnostic", "segments": segments,
            "firstMarkTrackerY": ordered[0]["positionTrackerUnits"][1]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("session_id", nargs="?")
    parser.add_argument("--backup", type=Path, help="Version-2 private route evidence backup")
    parser.add_argument("--directory", type=Path, default=Path("eval/sessions"))
    parser.add_argument("--marks-m", nargs="+", type=float, required=True)
    parser.add_argument("--uncertainty-m", required=True, help="Measured bound in metres, or 'unknown'")
    args = parser.parse_args()
    try:
        uncertainty = None if args.uncertainty_m == "unknown" else float(args.uncertainty_m)
    except ValueError:
        parser.error("Use a nonnegative uncertainty in metres or 'unknown'")
    if uncertainty is not None and (uncertainty < 0 or not math.isfinite(uncertainty)):
        parser.error("Use a nonnegative uncertainty in metres or 'unknown'")
    if bool(args.session_id) == bool(args.backup):
        parser.error("Supply exactly one session ID or --backup path")
    if args.backup:
        source = load_backup_events(args.backup)
        events = source["events"]
        config = source["configSha256"]
        source_identity = {"source": "private-backup-v2", "backupSha256": source["backupSha256"],
                           "captureSha256": source["captureSha256"]}
        output_stem = source["backupSha256"][:16]
        files = []
    else:
        files = sorted(args.directory.glob(f"{args.session_id}-live-*.json"), key=lambda path: int(path.stem.rsplit("-", 1)[1]))
        if not files:
            parser.error("No saved numeric batches for that session")
        batches = [json.loads(path.read_bytes()) for path in files]
        seqs = [batch["seq"] for batch in batches]
        if seqs != list(range(len(seqs))):
            raise ValueError("Missing or duplicate numeric batch")
        configs = {batch["configSha256"] for batch in batches}
        if len(configs) != 1:
            raise ValueError("Inconsistent capture configuration")
        events = [event for batch in batches for event in batch["events"]]
        config = configs.pop()
        source_identity = {"source": "saved-numeric-batches", "sessionId": args.session_id}
        output_stem = args.session_id
    report = analyze_marks(events, args.marks_m)
    report.update(**source_identity, captureConfigSha256=config,
                  physicalDistanceUncertaintyM=uncertainty,
                  numericBatchCount=len(files), numericEventCount=len(events),
                  numericBatchSha256=[hashlib.sha256(path.read_bytes()).hexdigest() for path in files])
    output = args.directory / f"{output_stem}-marked-scale.json"
    output.write_text(json.dumps(report, indent=2))
    print(json.dumps({key: report[key] for key in ("status", "markCount", "expectedMarkCount", "missingMarks", "physicalDistanceM", "physicalDistanceUncertaintyM", "segments")}, indent=2))
    print(f"Private report: {output}")


if __name__ == "__main__":
    main()
