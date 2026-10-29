# Event task queue

E01, E02, E02a and E03a are complete; remaining cards are unchecked until their own acceptance checks pass. Follow dependency order; only independent fixture/access/documentation work may proceed while a physical gate is pending.

- [x] P00 — Read supplied plan and participant guide; prepare revised product scope, schedule and operating rules. Documentation only. Repository cloned empty on 27 October. No code or event phone-test pass.
- [x] E01 (1 h) — Pin the minimal web/test dependencies and verify SDK licensing/loading. Acceptance: exact versions, source/license ledger, clean reproducible install, no committed engine binary. G0.
- [x] E02 (1 h) — Calibrated display fixture. First-failing tests: portrait/landscape/DPR sizing, noncentral CPU/GPU point agreement, ring aspect, resize invalidation. Real browser shader check required. G1.
- [x] E02a (1 h, independent delivery) — Guided synthetic check with automatic local receipt, retry/export on failure, bounded input and server-derived verdict. No physical tracking claim.
- [x] E03a (1 h, independent fixture) — Bounded diagnostic journal: timestamp rejected frames, retain transitions, explicit capacity failure and configuration identity. No camera integration or field claim.
- [x] E03 (1 h) — Basic phone camera/pose/placement/upload evidence received; physical loss/recovery remains E04. Tracker adapter and live diagnostic. Acceptance: permission, pose/projection/frame synchronization, actual display geometry in log, loss/stale hide, stop cleanup, retained placement transitions. G1; phone result remains separate. Depends E02/E03a.
- [ ] E04 (human gate) — Rigid-reference iPhone comparison, then short loop and recovery trials. Preserve raw private logs. No stability claim from numeric pose acceptance. G1.
- [ ] E05 (1 h, independent of E04) — Eligible model access smoke: one permitted input, real output, exact version/license and zero-spend evidence. Do not assume credits. G0/model gate.
- [x] E06 (1 h) — Capture-manifest schema and adversarial fixtures: units, calibration, version/config identity, privacy and destination validation. Fixtures clearly synthetic. Independent of E04.
- [ ] E06b — Versioned sparse map/descriptor artifacts, after geometry runtime selection. No invented model-output schema.
- [x] E07a (1 h) — In-memory host recorder, image-calibration conversion, timestamp retention, loss/stale/resize rejection and reviewed/masked export boundary. Synthetic fixtures only; not connected to phone capture.
- [x] E07b (software, 1 h) — Connect synchronous camera-canvas extraction, image review/masking and authenticated private capture receipt. Synthetic/schema/HTTP tests pass; no phone image alignment claim.
- [ ] E07c (human gate) — Verify actual camera pixels, crop, pose synchronization and destination capture on iPhone; confirm loss/resize discards recording. Depends E04/E07b before usable field map.
- [ ] E08 (human gate) — One permitted short author walk and a separate visitor session. Ground truth and publication consent recorded privately. G2.
- [ ] E09 (1 h) — First offline geometry runtime smoke on reviewed capture; record actual output/failure. Depends E08 and verified compute. Split map-build implementation based on observed runtime.
- [ ] E10 (1 h) — Localizer geometric fixture: real selected OpenCV runtime, correct/wrong correspondences, degenerate alignment rejection, no synthetic arrow authorization. Depends exact dependencies/schema; real map integration after E09.
- [ ] E11 (1 h) — Fresh-session localizer integration and ambiguity/expiry gate. Depends E09/E10. Field verification required before guidance claim.
- [ ] E12 (1 h) — Visitor route arrow from verified alignment; stop/hide/recover tests. Depends E04/E11. G3.
- [ ] E13 (1 h) — Eligible-model destination evidence integrated with geometric identity; decoy and missing-evidence tests. Depends E05/E11. G4.
- [ ] E14 (1 h) — Evaluation/report tool; separate trial/session identities, correct/false/abstained counts and paired ablation. Synthetic arithmetic first, real counts only after field trials. G5.
- [ ] E15 (human + documentation) — Independent visitor, adversarial approaches, three-minute video, final build ledger and logged-out access checks. Freeze scope 31 October; rehearse 3 November; submit by internal 4 November noon EAT target.

These budgets are implementation timeboxes, not a claim that field capture, model download or human testing takes one hour. Split cards before exceeding scope; log unmet gates instead of checking them off.

- [x] E07d — Correct camera-fill crop guard using received phone geometry; regression first, full check, physical retry pending.

- [x] E08a — Private capture audit and first recording inspection. Validated actual saved bundle; no fresh-session or geometric gate pass. E08/E09 remain open.

- [x] E09a — Isolated pinned OpenCV 5 runtime and known-pose paired-frame triangulation diagnostic on saved trials; no held-out localization or navigation claim.

- [x] E09b — Mutual observation tracks, all-view triangulation, parallax/reprojection rejection and private per-frame coverage report. Real retained tracks: 120 short / 193 longer. Endpoint coverage inadequate; no navigation gate passed.

- [x] E10a — Independent synthetic PnP/localizer gate with outlier recovery, duplicate/degenerate rejection and ambiguity abstention. E10 map-consumer integration and E11 visitor gate remain open.

- [x] E10b — Experimental map validation, mutual query matching, duplicate suppression and offline author diagnostics. 4/18 cross-recording and 27/53 self-query hypotheses; not accuracy or navigation. Full artifact/visitor gates remain open.

- [x] E09c — Compare wider frame window and geometric pre-merge checks on author data. Retain filtered development candidate: 259 tracks, 4 uncovered frames; destination coverage 2 and cross-query 4/18 unchanged. No navigation pass.

- [x] E11a — Synthetic map-to-session similarity fixture and real author alignment diagnostic. Synthetic tests pass; real four-pose alignment fails (relative residual 0.38884275293727005 > 0.05). Live alignment/visitor gate remains open.

- [x] E14a — Private local recorded-route review with source-identity checks and explicit failed gates. HTTP/script checks pass; browser visual verification pending. Not live navigation.
