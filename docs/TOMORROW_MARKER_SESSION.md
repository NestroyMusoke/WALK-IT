# Tomorrow's single author walk: live marker gate

**3 November result:** The first reviewed 57-frame author recording is preserved, and the printed marker was found in eight of its first ten views. Marker/tracker orientation and scale consistency failed the predeclared calibration gates. Stop this route's live-arrow claim. Do not ask for another recording until the camera/tracker mismatch is diagnosed and a before-walk multiview calibration check prevents wasting an author walk. The same file can be inspected as RECORDED REPLAY without claiming navigation.

**Final-pass update:** The root cause was tracker world-frame settling. The app now shows a live four-view rolling preflight, and recording stays locked until it passes. On the saved evidence4 frames the preflight never unlocks; the final settled window has 0.31 m span below the existing 0.4 m limit. This is a regression result, not proof that a new phone session will pass. Use no more than three coached preflight tries. If none passes, stop without recording a full walk and use a clearly labelled fallback.

This is the field procedure for the **live** WALK IT workflow. The recorded replay is a separate judge artifact. One author recording is planned; visitor trials are independent attempts, not extra author walks. The current build has **not** passed live navigation. Keep the marker and exact destination available until the preflight result is read.

## Before leaving for the route

1. Print [the A4 marker](../design/start-marker-a4.svg) at **100% / actual size**. Measure the printed check bar; it must be 100 mm. Mount the sheet flat and upright in even light. It must remain at the start for the visitor.
2. Choose a permitted pedestrian route about 20–25 m long, with one turn and a visually distinct destination. Record no people, plates, room occupants or private notices. Have a nearby similar wrong destination available for a separate visitor approach.
3. Use the iPhone 12 Pro Max on Wi-Fi, with battery charge and Safari camera permission. Open the fresh protected phone link from this repo's phone-server/tunnel, not an old link. Confirm the page loads and the camera reaches `NORMAL` before recording. The tunnel and receiving laptop must stay running.
4. Keep the camera landscape/portrait orientation fixed throughout. Hold it upright at walking height, aimed in the direction of travel. Do not zoom, switch cameras or cover the marker with your hand.

## One author recording

1. At the exact start, face the marker from roughly one arm's length and stay within **2 m**. With the camera at NORMAL tracking, tick the privacy review and tap **Start live marker preflight**. Keep swaying gently for 6–10 seconds. Watch the live spread, span and scale disagreement. Only tap **Record author walk** after the app says **PASS** and unlocks it. If it does not pass in three coached tries, stop this field run.
2. During the first ten saved frames, keep the entire marker visible while moving gently sideways about **0.6–0.8 m**. The hard minimum in config is 0.4 m, but separated frame pairs also need enough tracker displacement for a stable scale check. Keep some of the surrounding scene visible too. Do not pivot in place or rush off before those frames are captured. OpenCV uses marker orientation plus the phone pose to establish the route frame; a center-only fit is forbidden because it can rotate the route incorrectly even with a small residual.
3. Turn toward the route and walk **once**, steadily, with the camera showing the path ahead. Slow at the turn. Stop at the **exact** destination, hold the view for a final saved frame, then tap **Mark destination**.
4. Review every saved image. Black out faces, plates and private details before approval. Tap **Download backup and save to laptop**. Keep the Safari tab open until it explicitly says **Saved on laptop**. The downloaded private backup is the recovery path if upload fails. Do not put it in Git.
5. On the laptop, run `powershell -ExecutionPolicy Bypass -File .\scripts\marker-preflight.ps1 -CapturePath "<absolute path to the reviewed backup>"`. Read the printed marker count, reasons and candidate decision. Do this **before leaving the location**. If rejected, stop. Do not infer that a marker or route was valid from how it looked on screen.

## Visitor attempt, only if author preflight accepts

1. The laptop must issue a fresh protected route link. A candidate link by itself is not proof that route-follow works. The visitor opens it on a separate fresh camera session, at the same physical marker, while standing still.
2. The visitor checks that the camera view contains no faces, plates or private details, then taps **Scan start marker** and moves gently sideways while keeping the marker in view. The page reports the OpenCV pose and four-view alignment. If it reports ambiguity, stale data or a mismatch, no arrow is shown.
3. A route-follow trial counts only if world-locked arrows actually appear in the live camera and the visitor reaches the marked destination. Record the full attempt, including pauses and wrong turns. Approach the similar wrong destination separately and record the door decision. No scripted confirmation.

## Predeclared field gate and stopping rule

These are **targets fixed before the new field data**, not measured results. Use the exact units and values in `config/vision.yaml`. Log every attempted take, including refused scans, tracking loss, wrong turns, abstentions, model outages and failed uploads. Do not choose only the best take for the film.

1. **Start and scale:** one author walk; five independent fresh visitor starts, at least four correctly anchored. The marker's printed 100 mm check bar must physically match. No guessed scale or reused session counts as a fresh start.
2. **World lock:** with active NORMAL tracking, the test sticker stays within **15 CSS px** of its physical target throughout a **3 m** walking arc. The 1.5-second image expiry remains for fresh-image localization, but a marker-calibrated VIO session uses the separate drift budget proxy: 0.1 m starting allowance plus 0.05 m per metre travelled, capped at 1.5 m. This proxy is a hypothesis. Field displacement and end error are the independent checks on whether it is safe enough.
3. **End point:** on a measured route of about 20 m, physical route-end error is **under 3 m** in at least half the five attempted visitor runs. Record the measured distance method and uncertainty. The iPhone Measure app alone does not establish precise ground truth.
4. **Destination decision:** independently label five approaches to the true destination and five to a similar wrong one before checking model output. Pass screening only with at least four correct confirmations, all five wrong approaches refused, and zero false confirmations. Record every abstention and failure. The separate full paired ablation still requires its predeclared twenty approaches.
5. **Arrow safety:** every live arrow requires a verified metric marker start in that visitor session, a matching route and source capture hash, a valid route transform, NORMAL fresh tracker pose, no off-route/ambiguous segment and drift proxy within budget. The application must hide it immediately on loss, jump or budget exhaustion. The provisional live arrow permits measuring the field gate; `fieldGatePassed` remains false until the independent end error is recorded.

Stop after this one author recording and five fresh visitor attempts. If a gate fails or cannot be measured in the bounded session, **stop the live-arrow claim and use the labelled RECORDED REPLAY** as the submission artifact. Do not repeat captures until a take looks good or relax a threshold after seeing held-out results. The replay must show its actual abstentions and cannot present a synthetic arrow as live.

At present the marker scanner, author route candidate, private link, route-progress logic, VIO budget architecture and replay are built, but the **live route-follow arrow and Spark→SAM destination field gates have not passed**. Tomorrow's phone session is an experiment, not a promised successful delivery.
