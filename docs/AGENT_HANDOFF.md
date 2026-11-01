# Current checkpoint — 1 November 2026

Spark and SAM real still-image access has been demonstrated on the same reviewed input. SAM returned two box/mask records. See the latest dated entries below for receipts and exact limitations. E05 full gate awaits billing/terms/revision; E08b field session is next. Temporary supervised iPhone link is private at ignored tmp/phone-link.txt, server PID 39780 and tunnel PID 12736 at this checkpoint; verify before reusing. No live route navigation has passed. Last observed commit 7cb2d14. Only two unrelated duplicate documents remain untracked alongside the E05 SAM changes.


## E05 Spark receipt verified — 1 November 2026

One real sponsor-scoped Baseten call returned final structured JSON: requested and returned model `meta-models/muse-spark-open-1026`, finish reason `stop`, latency 24.875 seconds, 1,204 prompt tokens and 416 completion tokens (1,620 total reported). Private receipts: `eval/sessions/e05-muse-1793520831.json` and `eval/sessions/e05-muse-response-1793520831731796500.json`. Offline reparsing reproduces the saved evidence and its config SHA matches the current configuration. No additional API call was made for verification.

The model reported text D10 and D9 and appearance cues, with `usable_as_destination_evidence=false` and `navigationReady=false`. These are model observations, not independently scored OCR accuracy or destination confirmation. One call is not a latency benchmark. Spark transport/structured-output smoke passes; full E05 stays OPEN: SAM real response, terms review, backend revision disclosure and sponsor billing/zero-additional-charge evidence remain unverified. Do not infer remaining credits from token usage or personal dashboard balance.

Next: complete E05's separately tested SAM adapter/access check, then the declared field session. Keep all receipts/media private; no public explorer cases added and no commits made. Human supplies credentials only locally; no provider fallback is taken.

The historical checkpoints below are superseded by the receipt status above.

# WALK IT agent handoff — 30 October 2026, Africa/Kampala

**E05 sponsor correction — 1 November:** The sponsor email requires meta-models/muse-spark-open-1026, not the public alias. Runner and regression test corrected. Use the saved sponsor-issued key, not a new personal key; no need to reopen the single-use secret link. Personal dashboard credit balance is not evidence of sponsor-key balance. Five E05 tests and full 33-test web check/build pass; corrected remote call still pending.

**Latest checkpoint — 1 November:** User supplied PATH_TO_FINAL.md (found at repo root; copied to docs/PATH_TO_FINAL.md). The active TASKS section supersedes the older ordering: E05 → E08b → E11d start-anchor SfM/relocalization → E12b bounded tracker-follow → E13b/E14b Spark-to-SAM and paired ablation → film/submission. Ask before EVERY fallback. Author validation and visitor hold-out remain distinct; five correct/five wrong start trials are separate from twenty approach trials. E05 still has no successful receipt: human saw Baseten 403, and the updated runner will save a redacted private diagnostic on retry. User needs to rerun scripts/run-e05.ps1 once with their key; do not request it in chat. No provider switch is authorized by this new plan.

E16a static explorer shell is complete independently: apps/web/evidence.html and src/evidence*; public/evidence/manifest.json has ZERO cases. META_USAGE.md states missing actual outputs and unknown billing. Three first-failing then passing explorer tests; scripts/check.ps1 passes 33 web tests/typecheck/isolated build. Desktop browser empty-state visually checked. Local dev server restarted on 127.0.0.1:5173; evidence URL /evidence.html. Real populated cases, phone layout, field/navigation/model gates remain unverified. No public deployment. All E05 and current E16a/plan changes are still uncommitted as of this checkpoint (last observed commit 0670f40); provide explicit commit commands and preserve unrelated root PATH_TO_FINAL.md and docs/CAPTURE_PROTOCOL (1).md.

**Priority update, 30 October:** The user supplied `TASKS_NEXT.md`, `docs/CAPTURE_PROTOCOL.md` and `docs/DEMO_SPEC.md`. The next-card sequence in `TASKS.md` is now **E05 → E08b one field session → E09d → E09e → E10c**. Its pass rules were declared before the new field data. Author walk 2 is validation; independent visitor attempts are held-out. This update supersedes the older priority order below. Inspect Git status and the newly supplied files before acting; the older staged E06b warning below may have changed.

This is a working checkpoint for any local coding agent and for Codex when its usage resets. **Update this file at the end of every completed task** with the new commit state, measured result, remaining gates, exact next card, and any human input needed. Inspect files and tests before trusting this summary. The repository is `C:\Users\X1 Yoga\Documents\Codex\WALK-IT`, remote `https://github.com/NestroyMusoke/WALK-IT.git`.

## Product and demo contract

The author records one permitted walk. A visitor opens a link, starts at a recognizable place, and follows world-locked AR arrows to a specific destination. It is for any hard-to-find destination, including deliveries, entrances, shops, gates and rooms. The user wants a compelling live first demo and eventual product, not a hostel-only concept. The approved first proof is a short pedestrian route with one turn and destination; never guide camera use while driving. The user is a solo builder with iPhone 12 Pro Max; Samsung A17 does not support ARCore. The browser tracking stack has run on the iPhone. Do not change platform, approved route, AR scope or spending constraints silently.

## What has actually run

- Browser camera/tracking and a magenta 3D reference point ran on the iPhone. The user observed less shake after stabilization work, but rigid-reference loss/recovery and route arrow gates remain open (`E04`).
- Reviewed author capture works. Two separate author recordings are private in ignored `eval/sessions`: 18 frames/17.169 s and 53 frames/52.777 s. These are **both author data**; neither is a held-out visitor trial. The longer recording has 53 saved images, 53 path points and a destination at `kf52`. No permission to publish images in the README has been recorded. Keep private images out of Git.
- An isolated pinned Python 3.12 environment runs NumPy 2.3.5 and OpenCV 5.0.0.93. SIFT/triangulation/`solvePnPRansac` have been executed. The current filtered three-frame-window map has 259 landmarks but only **two** covering the final keyframe. It is tracker units, not verified metres.
- Cross-recording query of the longer map against the shorter **author** recording accepted 3 of 18 pose hypotheses after the current image coverage gate. The fourth previous hypothesis at `kf12` was rejected because its inliers covered 1.65% of the image and its estimated motion contradicted the phone trajectory. Three poses are fewer than the four required for alignment. The earlier four-pose fit failed with relative residual 0.3888427529 versus configured 0.05. These counts are neither localization accuracy nor independent trials.
- A private `sparse-route-v1` artifact binds the longer capture to its OpenCV map, path, destination and provenance hashes. It contains 53 path points and 259 landmarks and no PNGs. `scaleVerified` and `navigationReady` are false. See `docs/SPARSE_ROUTE_ARTIFACT.md`.
- A local recorded-route review exists for inspecting the failed gates (`docs/PRIVATE_ROUTE_REVIEW.md`). It is a diagnostic, not live navigation. Any old localhost or trycloudflare URL may be expired; inspect the running server before sending a new phone link.
- The last full verification before this handoff: 22 Python tests passed; `scripts/check.ps1` passed 30 web tests, typecheck and isolated build on retry. Its first run hit an existing 5 s HTTP receiver-test timeout while another suite ran concurrently. Do not weaken the assertion; rerun alone if needed.

## Immediate repository state at this handoff

`git log -1` was `7387d9c E11c: reject poses supported by narrow image patches`. The **E06b card is staged but uncommitted** (`TASKS.md`, `docs/BUILD_LEDGER.md`, `docs/CHANGELOG.md`, `docs/DECISIONS.md`, `docs/SPARSE_ROUTE_ARTIFACT.md`, `geometry/route_artifact.py`, `geometry/test_route_artifact.py`). Do not reset, overwrite or restage that work. The user commits manually. Re-run `git status --short` because this may have changed after this handoff was written.

## Next work in priority order

1. **Finish the staged E06b commit with the user's commands, then resume independent work.** Do not wait for the user to commit if you can work safely on another file, but keep staged and unstaged changes clear.
2. **E05 Meta model access smoke.** The user says Meta and Baseten credits have been received, but this checkout has no verified model call, eligible model version, license/terms, quota or free-cost evidence. Use only a permitted test input. Keep credentials in local environment or an ignored secret store, never chat/Git. Verify the official API/model contract and log real output. The model must make a useful destination/landmark decision that geometry alone cannot; do not decorate the pitch with an unused model. Do not assume MapAnything eligibility or use paid compute without the user's approval.
3. **Complete visitor capture and separate visitor test (`E08`)**, on the same approved pedestrian route, after checking image/pose synchronization and privacy. Current phone UI is an author recorder; do not mislabel an author replay as a visitor trial. Arrange the phone link and precise steps with the human when the flow is ready.
4. **E11 fresh-session localizer:** consume the versioned route artifact, retrieve candidates, run OpenCV geometry, align the visitor tracking frame to the map, and abstain on ambiguity, insufficient overlap, stale anchors or unknown scale. Preserve provenance/config hashes and actual latency. Work on synthetic acceptance tests first, then the separate visitor recording. The current author evidence does not permit arrows.
5. **E12/E13:** draw world-locked route arrows only behind the real gates; integrate the eligible Meta model into destination evidence and wrong-destination refusal. Then E14 independent trial counts/ablation and E15 three-minute video/submission. A visually polished replay may support the story but must be labeled replay.

Time is short: `PLAN.md` sets a 31 October feature-freeze target and a 4 November noon EAT internal submission target. These are internal targets, not proof of completed work. Prioritize a real short-route user journey and truthful failure behavior over broad features.

## Working rules and reproducible commands

Read `AGENTS.md` and `TASKS.md`; implement one card at a time, first failing acceptance test, minimal fix, passing test and full checks. All thresholds and units belong in `config/vision.yaml`. Pin new dependencies and record license/model terms in `docs/THIRD_PARTY.md` before use. Keep raw captures, contact sheets, route artifacts, logs, SDK and keys out of Git. No change to the live production `dist` while phone tests may be running. To check safely in PowerShell:

```powershell
cd 'C:\Users\X1 Yoga\Documents\Codex\WALK-IT'
git status --short
.\.venv\Scripts\python.exe -m unittest discover -s geometry
$env:WALKIT_VERIFY_BUILD='1'
.\scripts\check.ps1
git diff --check
```

For **every** completed build, give the human a Windows `cmd` block with `cd /d`, `git add` followed by the exact changed files, `git diff --cached --stat`, `git diff --cached --check`, `git commit -m "TASKID: concrete behavior"`, and `git push`. Do not execute these Git mutations unless the human explicitly asks. The final report should state **DONE / NEXT / NEEDS-HUMAN**, include real tests and limitations, and keep this handoff current so another agent can resume without chat history.

## Return-to-Codex checkpoint

When Codex usage resets, the user can say: “Open `C:\Users\X1 Yoga\Documents\Codex\WALK-IT\docs\AGENT_HANDOFF.md`, inspect `git status`, `git log`, `TASKS.md` and the latest test reports, then continue the highest-priority unfinished card. Do not assume the handoff is up to date.”

**Latest E05:** The sponsor-model request reached Baseten; `content` was null. The old parser discarded the response so provider usage for that request is unknown. The next runner revision saves raw response privately before parsing. No structured image evidence or decision effect yet.

## 1 November — E05 SAM access runner prepared

Acceptance tests first failed on missing adapter, then passed (4 tests). The adapter uses Meta's documented `POST https://api.meta.ai/v1/responses` with model `sam-3.1`, one reviewed/re-encoded PNG, and the `wooden door` noun phrase supported by the saved Spark observation. It stores the complete streamed response privately before parsing, accepts only a `response.completed` event with the expected model, and treats zero matches as a valid abstention. No mask geometry, destination identity or live guidance is asserted. No network call was made by the agent. Exact backend revision, credit usage and actual SAM response are still pending. Python standard HTTP library adds no dependency. Sources: https://dev.meta.ai/docs/media-segmentation and https://dev.meta.ai/docs/sam/reading-segmentation and https://dev.meta.ai/docs/pricing-rate-limits . One still image is listed at $2.50 per 1000 images before promotional credits; check the Meta dashboard before/after the single human call.

Human smoke command: `powershell -ExecutionPolicy Bypass -File .\scripts\run-e05-sam.ps1` from repo root. It prompts for MODEL_API_KEY hidden and clears the process environment afterward. The existing private `eval/sessions/e05-destination.png` is used. Never paste the key or raw receipt in chat or Git. E05 remains open until the real call and billing/terms review.

## 1 November — E05 SAM real call verified

The human ran the prepared Meta Model API still-image call. Private receipt `eval/sessions/e05-sam-1793536897662857200.json` and raw stream exist and are Git-ignored. Provider reported `sam-3.1`, response ID `resp_6ae73375b514ce25528c4343`, `images_processed=1`, 26.531 s client latency, and no backend revision. Its reviewed image SHA `de14ebd20f6ef1ba681be524002a732bd159218997f77bff295a41d3022b6c10` matches the earlier Spark input. Offline reparse matched the saved response and current config SHA. The output contains one image frame, two box-and-mask records; bounded boxes are object 0 [87,286,156,935] and object 1 [221,350,466,850] in a 768x1024 image. These are provider predictions, not independently labeled segmentation accuracy or destination identity. New first-failing then passing test validates paired masks and bounded boxes; actual response parsed without another call.

E05 technical access now demonstrated for both Meta models. Full E05 remains OPEN because actual credit debit/zero additional charge, provider backend revisions and terms review are unverified. No navigation, paired ablation or public evidence case passed. Proceed to the approved E08b field collection while the account checks are resolved; this is the next card in the declared path, not a fallback.
