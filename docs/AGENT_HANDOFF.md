# WALK IT agent handoff — 30 October 2026, Africa/Kampala

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
