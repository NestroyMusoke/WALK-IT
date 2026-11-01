# PATH_TO_FINAL.md: Anchor, Follow, Verify

Goal: reach the top 5 of the Indie track. Facts from the participant guide: Stage 1 is pass/fail (fits a theme; reasonably uses Meta Model API and/or Meta open-weight models). Stage 2 scores four equal 0 to 10 criteria (Impact, Use of Meta AI tooling, Technical depth and execution, Demo) mainly from the three-minute video plus code and live product. The final round has judges **watch the video demos live and rank them** (prepare a 60 to 90 second spoken pitch in case). "Simple image analyzers" are listed as a generic anti-project, so a door checker with no navigation context is not enough.

Everything below is a plan with targets [T], not a result.

## 1. Design

- **Start anchor (geometric):** relocalize once at a distinctive, natural landmark at the route start, using a small high-overlap map built from the author's start frames with a 0.3 m sideways sway (baseline). Needs: at least 4 of 5 held-out fresh-session starts to succeed [T].
- **Follow (tracker):** the phone tracker carries the arrow over the 15 to 25 m route. Arrows hide on loss, stale anchor, ambiguity or outage. Corrections: small tracker snaps use the bleed filter; any large correction clears arrows and asks for re-confirmation.
- **Verify (Meta models):** near the destination, Muse Spark reads the plate and states the distinguishing attribute; SAM 3.1 gets one short noun-phrase concept that includes it; the app checks whether the segmented door lies where the map says the destination is and beats the nearby alternative. A mask alone never confirms; plate text alone never confirms where numbers repeat.
- Honest labels: the arrow is anchored through the start relocalization plus tracker, not to an object.

## 2. Why this design

- Whole-route cross-session localization is failing on the current data (3/18 cross-recording queries, alignment residual far above limit). A 20 m route needs one well-posed start anchor, not continuous localization.
- The verification pipeline is where the Meta models genuinely help and where results can be measured without good geometry.
- Layered outcomes: Layer 1 (route bundle plus real SAM/Spark outputs) is always real; Layer 2 (live follow) is real if gates pass; Layer 3 (wrong-door refusal plus results) is real from recorded approaches.

## 3. Critical path (about 21 hours at 3 h weekdays / 6 h weekends; adjust to reality)

| Step | Hours | Gate | If it fails |
|---|---|---|---|
| E05: SAM 3.1 + Muse Spark (Meta API) and Spark Open (Baseten) smoke calls; save terms pages and ledger | 1.5 | Real parsed output at $0 paid spend | Debug with hints in the scripts; ask organizers |
| Field session per `docs/CAPTURE_PROTOCOL.md` (do first, in daylight): scale walk, loop, two author walks, visitor starts, decoy approaches, 3 pilot walkers | 4 | Data collected; no faces; ground truth noted | Shorten route; keep decoy |
| Start-anchor relocalization on held-out fresh starts (small SfM or E09d on start frames; matcher swap per E09e only if needed) | 4 | At least 4 of 5 [T] | Go to replay fallback (section 5) |
| Tracker-follow arrows with the canvas fix (`ARROW_STABILIZATION.md` T1, T2) | 3 | Sticker test within 15 px; LIMITED at most 10% on route [T] | Replay-render fallback |
| Verification pipeline plus paired ablation on at least 20 labelled approaches (with vs without model evidence) | 3 | Zero false confirmations in the declared set; report abstentions | Report honestly; keep SAM gate |
| Film shoot and edit (`docs/DEMO_SPEC.md` section 5) | 4 | 3:00 or less, captions, labels | Use best honest takes |
| Submission package, logged-out checks | 1.5 | Repo, video, contributors accessible | Fix, resubmit |

Do not start a native iOS build now: not enough hours. Cut anything that never appears on screen or in the results (second venue, extra UI, large pilot).

## 4. Stage 1 hardening and the "live product"

- `docs/META_USAGE.md`: each model, endpoint, the source file that calls it, an example output (non-private), usage-ledger totals, and where it changes a logged decision. A screener (human or automated) should confirm Meta model use in under a minute.
- README first lines: theme (Build for Your World), track (Indie), models used, how to run.
- Static **evidence explorer** page: 10 to 20 real test cases (door crop, SAM mask overlay, Spark JSON, verdict incl. refusals), no backend, no key exposed, privacy-reviewed. Label it replay.
- Never commit keys, weights, SDK binaries or private media. Public repo opens logged out.

## 5. Fallback if live arrows fail the gates

Film Layers 1 and 3 live, plus a clearly labelled replay in which arrows are rendered from the real recorded session's poses. Say so on screen. Do not present it as live navigation. If the start anchor works but the tracker is poor, show the anchor localization and the verification live, with the replay for the walk.

## 6. Film: what must be unmistakable in three minutes

1. A real Kampala place and a real person in the first ten seconds.
2. The author walk becoming a link; a different person following it.
3. The refusal at the similar destination, with the reason on screen.
4. The Meta models' outputs on screen and one measured with/without comparison.
5. An honest results card (attempts, refusals, failures).
6. One sentence on the wider use (delivery and visits).

## 7. Final-round readiness

Prepare a 60 to 90 second spoken pitch: the problem, what is live, what the models do, the measured result, the limit, the next step. Prepare honest answers: what is replay, what is synthetic, why arrows hide, what you did not test.
