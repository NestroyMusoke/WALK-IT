# E09b landmark tracks — 28 October 2026

Real author-capture results, not held-out localization accuracy:

| Recording | Retained tracks | Tracks shorter than 3 views | Geometry-rejected tracks | Frames with zero retained coverage | Destination-frame coverage |
|---|---:|---:|---:|---:|---:|
| Short | 120 | 1251 | 498 | 2 of 18 | 0 |
| Longer | 193 | 1316 | 394 | 7 of 53 | 2 |

Mutual SIFT ratio matches connect exact (frame, feature-index) observations. Connected components containing two different features from the same frame are discarded. Each remaining track requires at least 3 views and is triangulated jointly with linear DLT. Every observation must have positive depth and at most 3 px reprojection error; the maximum angle between viewing rays must reach 1 degree. Defaults were recorded before these runs, not fitted to held-out results.

Retained tracks are distinct observation chains, not guaranteed distinct physical landmarks. Descriptor identity is one representative SIFT float32 descriptor (128 dimensions, L2 distance). The experimental tracks artifact records observations, point positions, error/parallax, per-frame coverage, runtime versions and both config hashes. Artifacts remain private beside captures. This is not yet the validated sparse-map contract or a live navigation input.

The results expose insufficient destination coverage. No route-completion, metric-scale, full-camera-synchronization, fresh-session or arrival claim is justified. Other limitations: fixed tracker poses, no bundle adjustment, adjacent-frame matching only, possible wrong repeat-texture matches and duplicate physical landmarks. Longer feature baselines or additional observations may help; do not lower gates merely to increase counts.

Reproduce:

    .venv\Scripts\python.exe -m unittest discover -s geometry
    .venv\Scripts\python.exe geometry\tracks.py eval\sessions\<session>-capture.json

Next: validate/version the map consumer and geometric localizer on synthetic correspondences, then test on a separate visitor session. Refuse navigation in regions without adequate geometric evidence. Meta-model and endpoint-verification work remain open.
