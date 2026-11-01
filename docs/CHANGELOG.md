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

2026-10-28 — E10b: experimental map consumer, descriptor-to-PnP integration and author-only offline diagnostics.

2026-10-29 — E09c: wider frame matching, pair-geometry validation before track merging and documented baseline comparison.

2026-10-29 — E11a: map/session similarity fixture, degeneracy rejection and explicit failed real-data alignment report.

2026-10-29 — E14a: private recorded-route review screen with real frame results, trajectory and failed alignment evidence.

## E11b — 29 October
Added reproducible private motion-consistency CLI and three synthetic tests; preserved failed navigation gate.

## E11c — 30 October
Localizer now rejects pose hypotheses whose inlier image hull covers less than 5 percent of the frame and reports that fraction on rejection.

## E06b — 30 October
Added a versioned private sparse route artifact builder with capture/map hash binding, path/destination checks and observation bounds validation.

## Next-card planning — 30 October
Added predeclared E05 → E08b → E09d → E09e → E10c sequence and canonical capture/demo documents under `docs/`. No new data was evaluated or feature implemented.

## E05 preparation — 30 October
Added a guarded, metadata-stripping one-image Baseten Muse Spark Open smoke runner and private receipt format, plus a hidden-key PowerShell launcher and three acceptance tests. No model output or E05 pass is claimed.
Added a blank E08b field sheet for eight predeclared visitor attempts, measurements and uncertainty; no field data collected yet.
After the first human Baseten attempt returned HTTP 403, added a bounded, redacted private provider-error receipt. No model result claimed.

## 1 November — critical path and evidence shell
Reordered tasks to E05, one field session, small start-anchor relocalization, bounded tracker-follow arrows, Spark-to-SAM verification and paired ablation. Added META_USAGE.md, a static replay explorer with validated publication manifest, and case-format documentation. Empty public evidence set; no fabricated model output, provider switch or fallback. Tests: 33 web tests, typecheck and isolated build pass.

1 November: recorded the second E05 refusal and provider key-validation message; no runtime changes or successful model result.

1 November: corrected E05 request to the sponsor-required meta-models/muse-spark-open-1026 alias. Sponsor key required; no inference pass claimed.

1 November: save a successful HTTP provider response privately before parsing; require complete final JSON, use low reasoning and a 2048-token completion cap for the sponsor model. Earlier null-content response remains unmeasured because the old runner discarded it.

## E05 Spark receipt verified — 1 November 2026

One real sponsor-scoped Baseten call returned final structured JSON: requested and returned model `meta-models/muse-spark-open-1026`, finish reason `stop`, latency 24.875 seconds, 1,204 prompt tokens and 416 completion tokens (1,620 total reported). Private receipts: `eval/sessions/e05-muse-1793520831.json` and `eval/sessions/e05-muse-response-1793520831731796500.json`. Offline reparsing reproduces the saved evidence and its config SHA matches the current configuration. No additional API call was made for verification.

The model reported text D10 and D9 and appearance cues, with `usable_as_destination_evidence=false` and `navigationReady=false`. These are model observations, not independently scored OCR accuracy or destination confirmation. One call is not a latency benchmark. Spark transport/structured-output smoke passes; full E05 stays OPEN: SAM real response, terms review, backend revision disclosure and sponsor billing/zero-additional-charge evidence remain unverified. Do not infer remaining credits from token usage or personal dashboard balance.

Next: complete E05's separately tested SAM adapter/access check, then the declared field session. Keep all receipts/media private; no public explorer cases added and no commits made. Human supplies credentials only locally; no provider fallback is taken.
