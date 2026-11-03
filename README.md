# WALK IT

## Live marker field run, 3 November

The printed [A4 start marker](design/start-marker-a4.svg) uses OpenCV DICT_4X4_50 ID 0, a **0.16 m black square**, and a 100 mm check bar. Print at actual size and measure the bar. The current raw config SHA-256 is `9617ba8a18926fba1eeded4e25bb1eb4cb409897fe7330f9e349df14cba249c7`; use the same config for the capture, preflight, route link and visitor fit.

From the repository root on Windows, run `npm ci`, `npm run build`, then `node server/phone-server.ts`. In a second terminal run `cloudflared tunnel --url http://127.0.0.1:5180 --no-autoupdate --protocol http2`. Use the temporary HTTPS host together with the local `tmp/phone-access.json` key to form the protected author link; keep both private. The server and tunnel must stay running. `docs/TESTING.md` describes the protected link and phone steps.

On the author phone, wait for NORMAL tracking, check the privacy box, start marker preflight, and keep swaying gently for 6–10 seconds. **Record author walk** unlocks only while a four-view marker/tracker fit has passed in the trailing 2000 ms window. Keep the marker visible in the first ten recorded frames, walk once, mark the destination, review every frame, and save the private backup. Run `powershell -ExecutionPolicy Bypass -File .\scripts\marker-preflight.ps1 -CapturePath "<absolute private backup path>"`; only an accepted report can be used with `node scripts/issue-route.ts eval/sessions/tomorrow-marker-preflight.json`. Give that new link to the visitor, who scans the same physical marker in a fresh session. All images, links, keys and reports stay out of Git.

The visitor code now installs a route-bound live OpenCV fit in the guidance runtime. A live arrow is a **geometry hypothesis during the field test**; independent route-end accuracy has not been measured. The app hides the arrow on tracking loss, route ambiguity or drift overrun. The private record command is `python scripts/record-field-gate.py --route-id <id> --source-capture-sha256 <sha> --evidence <private-field-log> --end-error-m <measured-metres> --output eval/sessions/<new-record>.json`. It refuses an end error above the unchanged 3 m budget and does not create a measurement for you.

Verification: `powershell -ExecutionPolicy Bypass -File .\scripts\check.ps1` and `.venv\Scripts\python.exe -m unittest discover -s geometry -p 'test_*.py'`. The saved evidence4 walk remains refused: the last settled four-view window reached 3.8° orientation spread but only 0.31 m span against the 0.4 m minimum. No fresh visitor end error exists yet.

Meta Global AI Developer Hackathon · **Build for Your World / Indie** (supplied guide).
Planned model pipeline: **Muse Spark → SAM 3.1**, fused with geometric destination evidence. Sponsor API access smokes succeeded; a paired destination decision and live navigation have not. See [Meta usage and current evidence](docs/META_USAGE.md).

Run locally: `npm run dev`, then open `http://127.0.0.1:5173/replay.html` for the **RECORDED REPLAY** playground. It plays a locally selected reviewed capture and can load a frame-bound verifier report. No reviewed imagery is bundled or published; a judge opening the page without a capture sees an empty state. The separate [evidence explorer](http://127.0.0.1:5173/evidence.html) also has zero published real cases. The critical path is in [TASKS.md](TASKS.md).

## Evidence ledger · 3 November 2026

The following counts come from `powershell -ExecutionPolicy Bypass -File .\scripts\replay-repro.ps1` on the **first ten frames** of one saved visitor start scan. The command uses OpenCV 5.0.0, the same reference-image localizer, and the same Spark→SAM verifier decision code as the replay. It requires ignored private files already on this laptop, so this is a local reproducibility result, **not yet a clean-clone judge command**. Its JSON includes the author, map, visitor and both configuration hashes. It does not authenticate any caller-supplied model receipt.

| Proven or measured on the saved frames | Count | Interpretation |
|---|---:|---|
| Localizer frame attempts | 10 | All first-ten scan frames included |
| Frames with at least one accepted geometric candidate | 4 | All four had multiple accepted candidates, so none was a verified start |
| Frames with no accepted candidate | 6 | Localization failure on these frames |
| Verified start successes | 0 | No metric, unambiguous, fresh visitor anchor |
| Destination confirmations / refusals / abstentions | 0 / 0 / 10 | No paired frame-bound model receipts or trusted route geometry |
| Live visitor arrow and exact-door arrivals | 0 proven | These recordings do not demonstrate either |

The separate 20-frame playback report contains **20 abstentions, 0 confirmations** because no matching receipts or trusted geometry were supplied. These are frame decisions, not 20 independent visitor trials. The Spark→SAM paired ablation on independently labelled held-out approaches is **unavailable (0 approaches)**; `geometry/replay_ablation.py` is ready to evaluate both paths on the same reviewed frames and labels when they exist. No model advantage or false-confirm rate can be inferred yet.

| Scene or component | Evidence class | What it establishes |
|---|---|---|
| Saved visitor camera frames in the local playground | RECORDED REPLAY | Frame playback and provenance binding, not a live visitor result |
| OpenCV reference-image candidate counts above | RECORDED REPLAY | Offline hypotheses and ambiguity, not navigation accuracy |
| Spark and SAM sponsor access smokes | RECORDED REPLAY | Provider access and response parsing, not destination discrimination |
| Marker, arrow-renderer and verifier contract fixtures | SYNTHETIC | Code-path behavior under controlled inputs, not field success |
| Fresh visitor following a world-locked arrow to a verified door | LIVE | Not demonstrated |

The playground withholds arrows unless the existing guidance runtime receives a verified metric route and unexpired OpenCV anchor. The saved scan has neither. Its door panel says `abstain`; that is a refusal to **confirm**, not evidence that the image depicts a wrong door. Publication of a privacy-audited sample, verified route geometry, and held-out destination approaches are open work.

**Share the way. Follow it to the exact destination.**

WALK IT is a planned camera-guided navigation experience: someone who knows a route captures it once, shares a link, and another person follows verified AR directions to the destination.

The intended users include delivery workers, customers, visitors and anyone meeting someone at a place a map pin does not fully describe. Destinations can be an entrance, shop, courtyard, pickup point or room. The first evaluation uses one short pedestrian route; it does not establish universal coverage or support on every device. Drivers use the camera only after parking safely.

## Current build status — 3 November 2026

The capture and live camera diagnostic exist. A local browser replay and frame-bound verifier report now work on saved reviewed frames. The current private repro found no verified visitor start or destination decision, so the promised live route remains unproven. The last full check passed 105 Python tests, 61 web tests, typecheck and a production build. See [guided testing instructions](docs/TESTING.md), [TASKS.md](TASKS.md) and [BUILD_LEDGER](docs/BUILD_LEDGER.md).

Target: Meta Global AI Developer Hackathon, Indie track, Build for Your World. The demo will identify the features developed during the event and distinguish live results from recorded replay. Codex assists with engineering and documentation.

## Intended experience

1. A route author walks a permitted route and marks the destination.
2. A visitor opens the shared route and scans the starting area.
3. Visual geometry checks the visitor's location; the phone draws arrows only while location and tracking remain valid.
4. A Meta-model-assisted destination check helps distinguish the intended destination from a nearby alternative. Uncertain evidence produces a request to rescan, not an arrival claim.

## Responsible use

Private destination links must expire and be revocable before sharing beyond supervised tests. No public directory of private destinations. No raw private imagery, credentials or model weights belong in this repository. Obtain permission before route capture and participant tests. Camera navigation is for stationary or walking use, never operation by someone driving.

The participant received sponsor model credits; prior access smokes used those APIs. No new paid deployment is part of this replay path. Check provider billing before additional calls.
