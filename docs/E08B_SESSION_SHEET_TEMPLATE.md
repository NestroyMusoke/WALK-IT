# E08b field sheet — copy privately before the one session

**1 November update:** declare five correct fresh starts (S01–S05), five wrong/decoy starts (N01–N05), and twenty approach attempts (A01–A20: five each correct/decoy/wrong-direction/wrong-start). Keep independent position/heading references and uncertainty for every stop. Record any shared session IDs; start and approach results have separate denominators. No live-follow claim until E11d/E12b pass.

Copy this blank sheet to `eval/sessions/e08b-session-sheet.md` and fill it **before starting**. Never commit the completed sheet, images, names or raw logs. Use the permitted pedestrian route in `docs/CAPTURE_PROTOCOL.md`. This template does not mark E08b or any navigation gate passed.

## Before capture

- Date/time and light: ______
- Route description and start/turn/correct/decoy marks (private): ______
- Site capture permission: ______; separate publication permission: ______
- Operator phone and OS: ______; visitor phone and OS: ______
- Build SHA (`git rev-parse HEAD`): ______
- Config SHA (`Get-FileHash config/vision.yaml -Algorithm SHA256`): ______
- Distance measurement method and uncertainty U (metres): ______
- Independent heading reference method and uncertainty (degrees): ______
- Attempt counts declared **now**, before recording: correct 5; similar decoy 5; wrong direction 5; wrong start 5; total **20 separately initiated approach attempts**, plus the separate ten start trials. Each attempt ends before the next begins. Every attempt remains in the denominator.
- Split: author walk 1 = capture/tuning; author walk 2 = validation; all visitor attempts = held-out.

## Tracker and capture evidence

| Item | Actual measurement / file / notes |
|---|---|
| Rigid sticker test, three 0.5 m sideways cycles; screen recording for pixel measurement | |
| 10 m taped line: tape uncertainty and three tracker lengths | |
| Loop: measured route length and tracker return offset | |
| Five 3 s lens-cover events, each recovery result | |
| Author walk 1, start/turn/destination visible, capture receipt and frame count | |
| Author walk 2, different lighting/time, capture receipt and frame count | |
| Correct destination and decoy location, independently measured from start | |
| Five-metre floor marks, positions and uncertainty | |

## Held-out visitor attempts

Record each query stop's independent position and heading reference **before** looking at localization output. If heading is unavailable, write `unknown`; do not infer it from the app. If live guidance is not ready, label the attempt **offline query**, never arrival success.

| Attempt | Case | Fresh app start? | Query stop ground truth (m) ± U | Heading (°) ± U or unknown | Start/end time | Outcome: correct / false / abstain / failure | Log/receipt file |
|---|---|---|---|---|---|---|---|
| A01 | Correct | | | | | | |
| A02 | Correct | | | | | | |
| A03 | Correct | | | | | | |
| A04 | Correct | | | | | | |
| A05 | Correct | | | | | | |
| A06 | Decoy | | | | | | |
| A07 | Decoy | | | | | | |
| A08 | Decoy | | | | | | |
| A09 | Decoy | | | | | | |
| A10 | Decoy | | | | | | |
| A11 | Wrong direction | | | | | | |
| A12 | Wrong direction | | | | | | |
| A13 | Wrong direction | | | | | | |
| A14 | Wrong direction | | | | | | |
| A15 | Wrong direction | | | | | | |
| A16 | Wrong start | | | | | | |
| A17 | Wrong start | | | | | | |
| A18 | Wrong start | | | | | | |
| A19 | Wrong start | | | | | | |
| A20 | Wrong start | | | | | | |

## Separate start trials

| Trial | Case | Fresh session ID | Independent position ± U | Heading ± U | Outcome / receipt |
|---|---|---|---|---|---|
| S01 | Correct start | | | | |
| S02 | Correct start | | | | |
| S03 | Correct start | | | | |
| S04 | Correct start | | | | |
| S05 | Correct start | | | | |
| N01 | Wrong/decoy start | | | | |
| N02 | Wrong/decoy start | | | | |
| N03 | Wrong/decoy start | | | | |
| N04 | Wrong/decoy start | | | | |
| N05 | Wrong/decoy start | | | | |

## After capture

- List every private file, byte size, SHA-256; include discarded captures and reasons: ______
- Image review and masking completed before any upload; faces/plates removed: ______
- Anything unusual: people, lighting, tracker loss, interruptions: ______
- All twenty approaches and ten start trials accounted for? ______
- No private media committed or published: ______
