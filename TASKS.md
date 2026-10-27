# Event task queue

All feature cards below are unstarted. Follow dependency order; only independent fixture/access/documentation work may proceed while a physical gate is pending.

- [x] P00 — Read supplied plan and participant guide; prepare revised product scope, schedule and operating rules. Documentation only. Repository cloned empty on 27 October. No code or event phone-test pass.
- [ ] E01 (1 h) — Pin the minimal web/test dependencies and verify SDK licensing/loading. Acceptance: exact versions, source/license ledger, clean reproducible install, no committed engine binary. G0.
- [ ] E02 (1 h) — Calibrated display fixture. First-failing tests: portrait/landscape/DPR sizing, noncentral CPU/GPU point agreement, ring aspect, resize invalidation. Real browser shader check required. G1.
- [ ] E03 (1 h) — Tracker adapter and live diagnostic. Acceptance: permission, pose/projection/frame synchronization, actual display geometry in log, loss/stale hide, stop cleanup, retained placement transitions. G1; phone result remains separate.
- [ ] E04 (human gate) — Rigid-reference iPhone comparison, then short loop and recovery trials. Preserve raw private logs. No stability claim from numeric pose acceptance. G1.
- [ ] E05 (1 h, independent of E04) — Eligible model access smoke: one permitted input, real output, exact version/license and zero-spend evidence. Do not assume credits. G0/model gate.
- [ ] E06 (1 h) — RouteBundle schema and adversarial fixtures: units, calibration, version/config identity, privacy and destination validation. Fixtures clearly synthetic. Independent of E04.
- [ ] E07 (1 h) — Host capture/export with frame calibration and invalid-tracking rejection. Test first. Depends E03/E06; field capture after E04 and permission.
- [ ] E08 (human gate) — One permitted short author walk and a separate visitor session. Ground truth and publication consent recorded privately. G2.
- [ ] E09 (1 h) — First offline geometry runtime smoke on reviewed capture; record actual output/failure. Depends E08 and verified compute. Split map-build implementation based on observed runtime.
- [ ] E10 (1 h) — Localizer geometric fixture: real selected OpenCV runtime, correct/wrong correspondences, degenerate alignment rejection, no synthetic arrow authorization. Depends exact dependencies/schema; real map integration after E09.
- [ ] E11 (1 h) — Fresh-session localizer integration and ambiguity/expiry gate. Depends E09/E10. Field verification required before guidance claim.
- [ ] E12 (1 h) — Visitor route arrow from verified alignment; stop/hide/recover tests. Depends E04/E11. G3.
- [ ] E13 (1 h) — Eligible-model destination evidence integrated with geometric identity; decoy and missing-evidence tests. Depends E05/E11. G4.
- [ ] E14 (1 h) — Evaluation/report tool; separate trial/session identities, correct/false/abstained counts and paired ablation. Synthetic arithmetic first, real counts only after field trials. G5.
- [ ] E15 (human + documentation) — Independent visitor, adversarial approaches, three-minute video, final build ledger and logged-out access checks. Freeze scope 31 October; rehearse 3 November; submit by internal 4 November noon EAT target.

These budgets are implementation timeboxes, not a claim that field capture, model download or human testing takes one hour. Split cards before exceeding scope; log unmet gates instead of checking them off.
