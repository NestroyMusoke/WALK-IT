"""Read-only tracker pose audit. Step length is not a metric scale measurement."""
import argparse
import hashlib
import json
import math
from pathlib import Path


def audit_capture(capture):
    keyframes = capture["manifest"]["keyframes"]
    times = {row["id"]: row["videoTime"] for row in capture["timing"]}
    if len(keyframes) < 2 or len(times) != len(keyframes):
        raise ValueError("Incomplete keyframes or timing")
    t0 = times[keyframes[0]["id"]]
    t = [times[k["id"]] - t0 for k in keyframes]
    xyz = [k["position"] for k in keyframes]
    if any(not math.isfinite(v) for row in xyz for v in row) or any(b <= a for a, b in zip(t, t[1:])):
        raise ValueError("Invalid poses or nonincreasing video time")
    steps = [math.dist(a, b) for a, b in zip(xyz, xyz[1:])]
    y = [row[1] for row in xyz]
    return {
        "frames": len(keyframes), "timesSeconds": t,
        "stepTimesSeconds": t[1:], "stepTrackerUnits": steps,
        "positionYTrackerUnits": y, "firstYTrackerUnits": y[0],
        "lastYTrackerUnits": y[-1], "minYTrackerUnits": min(y),
        "maxYTrackerUnits": max(y), "pathTrackerUnits": sum(steps),
        "durationSeconds": t[-1],
        # Walking pace, pauses, turn geometry, and tracker scale are confounded.
        "withinSessionScaleClass": "unidentifiable-without-metric-marks",
    }


def _svg(rows, name):
    width, height = 1000, 280
    colors = ["#c55234", "#136f68", "#6855ad", "#b48423", "#3275a8"]
    lines = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-label="{name} by time">',
             '<rect width="100%" height="100%" fill="#faf8f2"/>',
             f'<text x="50" y="26" font-family="sans-serif" font-size="17">{name} versus video time, each run starts at t=0</text>',
             '<path d="M50 40V235H970" fill="none" stroke="#555"/>']
    values = [v for row in rows for v in row[name]]
    hi = max(values) if values else 1
    lo = min(values) if values else 0
    if hi == lo:
        hi += 1
    maxt = max(row["durationSeconds"] for row in rows)
    for index, row in enumerate(rows):
        times = row["stepTimesSeconds"] if name == "stepTrackerUnits" else row["timesSeconds"]
        points = " ".join(f"{50+920*t/maxt:.1f},{230-180*(v-lo)/(hi-lo):.1f}" for t, v in zip(times, row[name]))
        lines.append(f'<polyline points="{points}" fill="none" stroke="{colors[index]}" stroke-width="2"/>')
        lines.append(f'<text x="{50+index*180}" y="265" font-family="sans-serif" font-size="12" fill="{colors[index]}">{row["label"]}</text>')
    lines.append('</svg>')
    return "\n".join(lines)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("output", type=Path)
    p.add_argument("captures", type=Path, nargs="+")
    args = p.parse_args()
    if len(args.captures) != 5:
        p.error("Exactly five declared captures required")
    rows = []
    config_hash = hashlib.sha256((Path(__file__).resolve().parents[1] / "config/vision.yaml").read_bytes()).hexdigest()
    for label, path in zip(("author-1", "author-2", "short-1", "short-2", "short-3"), args.captures):
        raw = path.read_bytes()
        row = audit_capture(json.loads(raw))
        row.update(label=label, captureFile=path.name, captureSha256=hashlib.sha256(raw).hexdigest(),captureConfigSha256=json.loads(raw)["manifest"]["configSha256"],analysisConfigSha256=config_hash)
        rows.append(row)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "scale-audit.json").write_text(json.dumps(rows, indent=2))
    for name in ("stepTrackerUnits", "positionYTrackerUnits"):
        (args.output / f"{name}.svg").write_text(_svg(rows, name))
    for row in rows:
        print(f'{row["label"]}: n={row["frames"]}, duration={row["durationSeconds"]:.3f}s, path={row["pathTrackerUnits"]:.4f} tracker units, y0={row["firstYTrackerUnits"]:.3f}, yEnd={row["lastYTrackerUnits"]:.3f}, yRange=[{row["minYTrackerUnits"]:.3f},{row["maxYTrackerUnits"]:.3f}], within-run scale={row["withinSessionScaleClass"]}')


if __name__ == "__main__":
    main()
