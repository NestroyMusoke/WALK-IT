# Next supervised WALK IT field run

This sheet is for collecting the data needed to decide whether the current iPhone browser tracker can support a real 20 to 25 m route. It is a data-collection protocol, not a live-navigation claim. Keep completed notes and all route images private in `eval/sessions/`. Do not give the visitor a supposed guidance link until the visitor flow is connected and its gates pass.

## What to bring

- iPhone 12 Pro Max, charged, Safari, and a charger or power bank if available.
- One sheet marked **A4**, a cord or string if available, small removable floor markers, and a pen. A4's nominal dimensions are 297 mm by 210 mm. Six long edges plus one short edge make a nominal **1.992 m** segment. Mark any gap or overlap while laying it out. If the sheet is not A4, write its actual known dimensions or treat the distance as unverified.
- A visitor who has not seen the route. They are needed later for fresh-start trials, after the visitor app is ready. Get their permission before recording them.
- A permitted pedestrian area with a textured start landmark, one turn, a clear destination, and one nearby similar alternative. Avoid people, faces, private signs and vehicle plates in view.

## Phase A: three short marked walks, do these first

Make one straight nominal 9.96 m line: five consecutive 1.992 m segments. Put small marks at 0, 1.992, 3.984, 5.976, 7.968 and 9.960 m. The app buttons round these to 0, 2, 4, 6, 8 and 10 m; retain the true nominal positions in the sheet. Keep the same six marks for all three runs. Record the measurement method and your best honest estimate of cumulative gap/overlap uncertainty. If you cannot estimate it, write `unknown`; the diagnostic remains useful but cannot pass a metric accuracy gate. Do not claim centimetre precision from an unverified sheet or loose placements.

For each of three **separate** runs:

1. Open the current protected phone link in **iPhone Safari**. Keep the laptop awake. Start the camera, allow camera and motion access, and wait for `NORMAL` tracking.
2. Expand **Record permitted route**. At the 0 mark, tap **Start 3-second sway** and move the phone gently sideways while facing a textured fixed scene. When **Record walk** unlocks, tap it. Keep the phone upright at approximately the same height.
3. While standing at the 0 mark, tap **Tap at 0 m mark**. Walk at a natural steady pace. Stop briefly at each physical mark and tap its matching button. Do not tap while between marks. Keep the camera facing forward; no running or fast turns.
4. At the last mark, stand still and tap **Mark destination**. Wait for the review screen. Inspect every image, mask any face, plate or private detail, then approve every frame.
5. Tap **Download backup and save to laptop**. The download must finish before you close Safari. The new `walkit-reviewed-route-evidence.json` contains the reviewed images and numeric mark logs together; keep it private and off Git. Wait for the saved receipt and frame count. The new upload sends the route in resumable parts. If the connection interrupts, keep the backup and tap Save again on the same page to send only missing parts. Do not record another walk just because upload fails. Record run number, receipt prefix if any, frame count and anything unusual. Reload the page only after saving or retaining the backup. Old `walkit-reviewed-route-backup*.json` files contain images but cannot recover mark taps.

Do not redo a bad run without recording that it was attempted and why it failed. If the app aborts, write that down; it is part of the denominator.

## Phase B: two author walks on one 20 to 25 m route

Measure the intended path along the turns, not a straight-line shortcut. A cord marked at nominal 1.992 m can be laid 11 times for a nominal 21.912 m path. Record every segment, any unused part and the placement uncertainty. Put discreet marks at the physical start, turn and destination and photograph just the marks for the private session sheet. Write down which destination is correct and which similar one is the decoy **before** testing.

Run the same capture flow twice with the same physical start and end. Label walk 1 `author-map` and walk 2 `author-validation`. Use a fresh page and camera session for each. After tapping Record, remain at the start for several frames and sway slowly about 0.3 m sideways with the start landmark visible. Then walk the route, slow at the turn, and hold the destination in view for several frames before Mark destination. Finish within the 60-frame capture limit. Review and save each walk separately. Different lighting for walk 2 is useful, but keep the route and marks identical.

## What to tell Codex after saving

Send only: `three marked runs saved`, the six physical mark distances, how you measured them and estimated uncertainty or `unknown`, the five capture receipt prefixes and frame counts, the 20 to 25 m route length and uncertainty, whether the two author walks used identical start/turn/end marks, and any aborted attempts. The server stores numeric logs and reviewed captures under ignored `eval/sessions/` when upload succeeds. The new backup preserves both if upload fails. `geometry/marked_scale.py --backup <private-file> --marks-m ... --uncertainty-m unknown` extracts the tap positions, per-segment tracker units per metre and source hashes without treating them as navigation success. Do not paste private images, access keys or the completed location sheet into chat.

## Later visitor gate

When the share-link visitor flow is connected and frozen, the visitor opens it from five separately restarted sessions at the true start, plus five wrong-start trials. Record all attempts, including abstentions. For each correct start, use independent position and heading references with uncertainty. The predeclared gate is at least 4/5 correct fresh starts, zero accepted wrong starts, and end error strictly below 3 m in at least half the runs on the measured route. The existing author capture page cannot score this gate or prove that the link-and-arrow product works.
