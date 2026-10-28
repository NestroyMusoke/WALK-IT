# Changes

2026-10-27: E01 pinned web setup; E02 synthetic calibrated display implementation (browser gate pending); E03a tested diagnostic timing journal. Reviewed stabilization research without adopting unsupported accuracy or smoothing claims. No live tracking or navigation claim.

Run npm ci --ignore-scripts, npm run engine:fetch, npm run check, then npm run dev. Laptop preview: http://127.0.0.1:5173/. Select Run display checks for the pending eight-case GPU report. This is a synthetic fixture, not a camera feed. The localhost URL is not a public phone link.

2026-10-27 — E02 browser GPU verification passed 8/8. E02a guided test and automatic local receipt implemented and checked end-to-end. Twelve unit tests plus setup/typecheck/build pass. Instructions: docs/TESTING.md.

2026-10-27 — E03 live phone page, protected automatic numeric-log receiver and temporary HTTPS hosting added. Code/transport checks pass; field stability remains unverified.

2026-10-27 — Analyzed first real phone diagnostic and recorded its limits. Added route capture-manifest validation with three adversarial tests; all 17 unit tests and project checks pass. Live renderer unchanged.

2026-10-27 — E07a host recording core added with calibration, frame timing, privacy review/masking and invalid-tracking rejection. All 22 tests and project checks pass. Phone capture controls and persistent export are E07b, not yet implemented.

2026-10-28 — E07b: experimental route recording, destination marking, in-memory image review/masking, reviewed private upload with receipt, shared manifest validation and capture acceptance tests. E07c retains physical camera alignment validation.

2026-10-28 — E07d: fix host recorder rejection of the observed iPhone camera fill crop; invalidate missing viewport metadata rather than retain old values.

2026-10-28 — E08a: repeatable private capture integrity/timing/trajectory audit and first real recording inspection.

2026-10-28 — E09a: pinned local OpenCV 5 environment, known-pose triangulation diagnostic, synthetic geometry checks, private reports for both real author recordings, and nondisruptive verification build output.

2026-10-28 — E09b: experimental multiview landmark tracks, weak-depth rejection, retained descriptors and explicit route coverage report.

2026-10-28 — E10a: geometric pose estimator, consistency/coverage rejection and ambiguity abstention; navigation remains disabled.
