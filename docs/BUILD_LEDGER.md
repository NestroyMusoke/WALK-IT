# Build ledger

Dates are Africa/Kampala. Commit timestamps are ordinary timestamps, not independent proof of authorship. Record actual work and outputs; never relabel imported work as newly implemented.

| Date | Component | Origin | Verified state |
|---|---|---|---|
| 2026-10-27 | README, PLAN, TASKS, AGENTS and planning ledgers | New event documentation, informed by user-provided draft and participant guide | Documents prepared; no application runtime claimed |

Application code: E01/E02/E03a foundations implemented; E02 browser gate remains pending. Third-party runtime installed locally and ignored by Git. Event-build phone trials: none yet. Model executions: none yet. Commits/push: not performed by this preparation step.

For each later component add authoring date, origin (new / licensed third-party / explicitly permitted reuse), source/license where needed, exact test command/result, raw output location, limitations and commit ID after a real commit exists. Do not copy results from a different build into this build's pass record.

2026-10-27 — E01: new TypeScript/Vite setup, exact dependency pins, SDK staging and readiness checks. One setup test and two SDK tests passed; typecheck and production build passed; clean npm ci installed 61 packages. Browser displayed Engine ready with no camera started. First-failing outputs in tmp/e01-first-fail.txt and tmp/e01-sdk-first-fail.txt. Engine remains ignored and unmodified. No model call, field tracking or navigation claim.

2026-10-27 — E02 display fixture implemented: calibrated buffer sizing, CPU/GPU reference comparison and placement invalidation. Four unit tests passed. Browser fixture loaded, but GPU report could not be retrieved after repeated browser tool timeouts. E02 remains open; no phone stability claim.

2026-10-27 — E03a timing journal implemented independently of the live adapter. Test-first missing-module failure: tmp/e03a-first-fail.txt. Three journal tests pass, covering rejected timestamps, separate transitions, explicit capacity omissions and copied evidence. scripts/check.ps1 passed: one setup test, nine Vitest tests, typecheck and production build (tmp/e03a-check.txt). In-memory foundation only: no durable capture or live integration. Reviewed supplied stabilization research in docs/STABILIZATION_REVIEW.md. No model call or deployment.
