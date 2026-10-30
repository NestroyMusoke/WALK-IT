# WALK IT: instructions for the next coding agent

Read `AGENTS.md`, `docs/AGENT_HANDOFF.md`, `PLAN.md`, `TASKS.md`, and the newest entries in `docs/BUILD_LEDGER.md` before editing. This is the event repository at `C:\Users\X1 Yoga\Documents\Codex\WALK-IT`; do not start a new project or copy code from another checkout. The human's latest direct instructions override older plans.

Build the strongest honest demo of **one person's recorded walk becoming live AR guidance for another person to the exact destination**. Delivery drivers and visitors are use cases; the product is not limited to hostels or rooms. The first permitted test is a short pedestrian route. Preserve the AR-arrow goal, but show an arrow only when tracking, geometric relocalization, alignment, ambiguity, freshness, and scale gates are actually satisfied. Seek better approaches when evidence supports them; record pivots rather than pretending a gate passed.

`docs/AGENT_HANDOFF.md` is the current checkpoint. Read the Git working tree and private test evidence yourself; the handoff is a map, not proof that a feature works. Continue one `TASKS.md` card at a time, test first, then implement and run the relevant tests. Update the handoff, task status, build ledger, decisions, and changelog after each card. Give the human concise progress and a concrete next step. Do not spend money, publish private imagery, upload secrets, or accept model terms on the human's behalf.

The user makes Git commits. **With every completed build, give copyable Windows `cmd` commands** to enter this repository, stage only the exact files changed, inspect the staged diff, commit with the task ID, and push. Do not run `git add -A`, commit, or push for them. Check `git status` first because another card may already be staged. Never backdate or claim that a commit proves when work was authored.

Verification on this Windows checkout:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s geometry
$env:WALKIT_VERIFY_BUILD='1'
.\scripts\check.ps1
git diff --check
```

`WALKIT_VERIFY_BUILD=1` keeps the live phone `dist` untouched. If `.venv` is absent, use the pinned `geometry/requirements.txt` and `geometry/requirements-win-py312.lock`; never silently substitute OpenCV 4. Do not commit `eval/sessions`, `tmp`, SDK binaries, credentials, or model weights.
