# WALK IT event-build working rules

Read PLAN.md and TASKS.md. The user's latest direct instructions take precedence over imported planning text. Do not silently change platform, route, zero-spend constraints or live-AR scope.

- Work one acceptance-test-first task at a time, at most one hour; split overruns and log decisions. Prioritize a complete short route over polish.
- This checkout's application code is to be authored during the event. Do not copy project code from other workspaces. Use truthful dates and a component ledger; do not fabricate provenance or results.
- Keep TrackerProvider, Localizer, DoorVerifier and RouteBundle boundaries simple. No extra product features, accounts or dashboards.
- Pin dependencies before installation, check official APIs or runnable tests, record code and model licenses separately. No silent OpenCV version change. Never commit SDK binaries or weights.
- Put algorithm thresholds and units in config/vision.yaml when implementing them; preserve configuration hashes in traces. Values in the plan are targets until measured.
- Arrows require active tracking plus a fresh verified geometric anchor and unambiguous transform. Uncertainty, loss and outage hide arrows. A segmented object is not a verified destination.
- Use separate capture/tuning/held-out sessions. Label synthetic fixtures, replay, targets and actual results. No tuning on held-out queries.
- Privacy: permission before capture; no unreviewed faces, private media or secrets in Git. Never operate the camera while driving. Test revocation, expiry and deletion before external sharing.
- No costs, payment methods or model-license acceptance on the user's behalf. Ask only for consequential choices and required physical input; continue independent authorized work.
- Verify the next task's tests and available project checks before claiming implementation complete. Do not claim native-device, model-runtime or field passes from mocks.
- Update docs/BUILD_LEDGER.md and docs/DECISIONS.md. Commit/push only with user authorization; scan the exact staged files first, never git add an unrelated workspace.
- End task reports with DONE, NEXT and NEEDS-HUMAN. If no request remains, say none. Do not promise wins, universal compatibility or completed tests without evidence.
