# DEMO_SPEC.md: what "perfect version one" means

Version one is **one route, one author, one independent visitor, one similar wrong destination**, shown live and honestly. Everything below serves that. Nothing here is a completion claim; each item is a gate to pass with evidence.

## 1. The promise the demo must prove

> A person who has never seen this route opens a shared link, scans the start, and follows world-locked arrows to the exact destination. At a similar nearby destination the app refuses to confirm. At the right one it confirms, and it shows why.

The demo is "perfect" only if a skeptical viewer could not say: it is scripted, it is a replay pretending to be live, the arrow is a screen overlay, or the check always says yes.

## 2. Rubric from the participant guide (supplied by the human on 26 October; Codex PLAN.md says the tables were missing, so paste them in again)

Stage 1 is pass/fail: fits a theme and reasonably uses Meta Model API and/or Meta open-weight models. Stage 2 is four equally weighted 0 to 10 criteria:

| Criterion | What the demo must show |
|---|---|
| Impact | A real person, a real route, a real failure of map pins, measured outcome |
| Use of Meta AI tooling | A model that changes a logged decision beyond a basic call; a paired with/without comparison, even if the result is small |
| Technical depth and execution | Honest geometry (fresh session, scale, ambiguity, abstention), tests, real counts including failures |
| Demo | Works live, holds up, video is genuinely worth watching |

Final round: top 5 per track; judges watch the three-minute videos and rank them. The video is the product for most viewers.

## 3. Acceptance criteria (all must hold; record N for each)

1. **Fresh session:** app fully closed and reopened; a person who did not author the route is the visitor. No scene reset counted as relocalization.
2. **World-locked arrow:** sticker test passes (marker within about 15 px of a coin through a 3 m arc); arrows hidden whenever tracking, anchor, alignment or ambiguity gates fail. The film shows at least one natural "scanning" or "lost" moment, so viewers see arrows are earned.
3. **Wrong destination refused:** at least the declared number of approaches to the similar alternative, with the refusal reason shown ("evidence does not match", not a scripted banner).
4. **Right destination confirmed:** repeated consistent observations; show the evidence panel.
5. **Meta model effect:** the model output appears on screen (structured result), and the comparison table states with-vs-without results on the same held-out approaches, including "no benefit" if that is the truth.
6. **Counts:** every attempt logged; the film and README report attempts, successes, refusals, abstentions and failures. No cherry-picking: if three takes were needed, say so.
7. **Second phone** (if available): same route, labelled as a different device. If not available, say "tested on one phone".
8. **Privacy:** no faces, private media or secrets in anything published; link expiry and revocation tested before sharing a link beyond supervised tests.
9. **Labels:** every scene tagged LIVE, RECORDED REPLAY or SYNTHETIC. No old footage presented as event-build proof.

## 4. Screens and states (keep it minimal)

- **Landing:** wordmark, one sentence, one button ("Start at the entrance"), privacy line, permission explanation.
- **Scanning:** instruction "Look at the starting area and sway the phone gently side to side"; progress ring; no arrow.
- **Guiding:** one clear arrow (or three chevrons) on the floor; distance to next turn; confidence ring that dims as evidence ages.
- **Near destination:** "Slow down. Point at the destination." Hold prompt.
- **Verifying:** evidence card with three lines: where the map says you are, what the model read or saw, how far the competing alternative scored. Green only when all agree.
- **Refused:** "Not this one." Show why in one sentence and keep guiding to the correct destination.
- **Lost/outage:** arrows hidden; one instruction ("Look slowly left and right"); retry.
- Visual polish comes last, only after the geometry works: restrained glow, correct floor perspective, no bouncing.

## 5. The film (three minutes, captions throughout)

| Time | Scene | Label |
|---|---|---|
| 0:00 to 0:12 | Delivery pin on a map, then the real entrance area where the pin ends. "Maps get you to the building. Not to the right place." | LIVE footage |
| 0:12 to 0:30 | Author records the walk once (sped up); link is shared | LIVE |
| 0:30 to 1:20 | Visitor opens the link (fresh session), scans, follows the arrow: one continuous take plus screen capture inset | LIVE |
| 1:20 to 1:50 | Approach to the similar alternative: refusal and reason | LIVE |
| 1:50 to 2:10 | Correct destination: confirmation and evidence panel | LIVE |
| 2:10 to 2:40 | What the Meta model contributed and the measured with/without result | RESULTS |
| 2:40 to 2:55 | Honest results table: attempts, refusals, failures, limits | RESULTS |
| 2:55 to 3:00 | One reusable path for the next person, any destination type | VISION |

Rules: voice-over in your own voice; music only if CC0 or your own; log every asset in `docs/ASSETS.md`; show a failure on screen at least once; identify what was built during the event.

## 6. Rehearsal and contingency

- **Warm-up checklist** (day of filming): tunnel reachable, backend restarted from a clean state, phone storage and battery, lighting similar to the capture session, route permission in hand, link expiry set.
- **Known-good recording:** keep one fully logged successful run as a labelled replay, so a live failure on camera does not erase the evidence. It supplements, never replaces, the live take.
- **Two-camera plan:** one phone as the AR device, a second phone filming the walker. Screen-record the AR phone.
- **If live AR fails after the bounded investigation:** stop and ask the human which reduced scope to take (native or borrowed phone route; labelled recorded replay plus destination verifier). Do not silently switch.

## 7. Quality bar for "version one is done"

Done means all of section 3 has evidence, the repo runs from a clean clone with the documented steps, the three-minute video is accessible logged out, and the ledger lists new work, third-party components and licences. If any item is open, say so in the README.
