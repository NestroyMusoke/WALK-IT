# E11a similarity alignment and endpoint diagnosis

29 October 2026. The map-to-session fixture fits a positive-scale proper rotation and translation to paired camera centers. It requires four unique pairs and observable variation on a second trajectory axis, then checks maximum residual relative to the session trajectory extent. Defaults are in config/vision.yaml. It rejects reflection/inconsistency, rotation-only and straight-line samples. Metric scale and navigation remain unverified even when the fit succeeds.

Synthetic tests recover a known transform and reject degenerate/outlier/reflected inputs. Fifteen total Python tests and 29 web tests, setup/typecheck/isolated build pass. No live files, dependency versions or map thresholds changed.

## Development data outcome

Four cross-author pose hypotheses (kf7, kf8, kf9, kf12) from the filtered-window map were paired with the short capture's recorded camera centers. The capture SHA was checked against the query report before pairing. Result: rejected, inconsistent-alignment. Maximum residual is 0.7453943941237937 session tracker units, or 0.38884275293727005 of trajectory extent, exceeding the configured 0.05 bound. These units are not verified metres. This is not a measured position error against external ground truth; it is internal disagreement between two estimates.

The result demonstrates why individual PnP hypotheses must not authorize arrows. Possible causes include incorrect landmark associations, fixed-pose map errors, drift or image/projection/pose calibration mismatch. This experiment does not isolate the cause. No threshold relaxation or removal of inconvenient hypotheses was performed.

## Endpoint evidence

The final kf51-kf52 pair has 263 mutual matches and 199 pair-geometry survivors, but preceding links are sparse: kf50-kf51 has 3 matches, kf50-kf52 has 5, and kf49-kf50 has 2 with no geometric survivors. Only 2 final-frame landmarks meet full track requirements. The endpoint lacks sufficient multi-view overlap; last-pair matching alone cannot repair this. A deliberate overlapping translated endpoint capture may be needed later. No change to the approved route is made.

Next: investigate image/pose calibration and cross-session correspondences before live integration. A separate visitor trial, reliable endpoint evidence and Meta-model contribution remain open.
