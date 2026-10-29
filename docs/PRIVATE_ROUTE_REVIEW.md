# Private route review

29 October 2026 — E14a development tool, not live navigation or a replacement product scope.

Run `node scripts/review-route.ts <capture.json> <query.json> <alignment.json>`. Inputs must be reviewed capture data with matching query capture SHA and alignment query-report SHA. The local receiver binds only to 127.0.0.1 on an automatically selected port and a random capability path; all other paths return 404. It exposes no file browsing or public tunnel. Link is stored only in ignored tmp/route-review-link.txt. Stop the process when finished.

The screen shows captured images, recorded top-view trajectory, per-frame pose hypotheses/rejections, and actual alignment evidence. Labels explicitly distinguish recorded diagnostics from navigation. No marker or arrow claims a localized destination. The route drawing uses recorded tracker coordinates, not metres. Images stay out of Git.

Verified: source joins reject mismatched hashes/duplicate query IDs; missing results remain Not evaluated. Full check passes 30 tests, setup/typecheck/isolated build. Actual local HTTP 200, generated JavaScript parse succeeds, invalid path 404. Browser automation timed out; visual rendering and control interaction have not been independently verified. Opening was queued in Codex; direct local link is available to the user. No new dependency, model call, recording or cloud charge.
