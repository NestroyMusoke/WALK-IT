# WALK IT — executable event plan

Prepared 27 October 2026, Africa/Kampala. Planning document, not a completion claim.

## 1. Product and first proof

**Share the way. Follow it to the exact destination.**

Someone who knows the way records one permitted walk; another person opens the link and follows world-locked AR directions. This applies to deliveries, visits, shops, entrances, meeting places and rooms. It is not a hostel-only product. A destination is a physical place, not necessarily a door.

The long-term vision is broad. The first engineering proof is deliberately small: the already proposed 15–25 m university pedestrian route, one turn, one destination and one plausible nearby decoy. The exact permitted route still needs the human's confirmation. Do not silently expand to 60–100 m, stairs, six doors, a different site, or moving-car navigation.

There is no promise of universal phone compatibility, automatic navigation anywhere, guaranteed winning, or zero author effort. One author walk is required. A door is one useful destination-verification case.

## 2. Event and provenance

Source: participant guide supplied by the human on 27 October, sections 3–8; official public event pages listed in docs/RULES_AND_RESOURCES.md.

- Public repository required. Present only features and functionality developed during the event; identify contributions clearly.
- This checkout starts with planning documents. Implement event application code afresh. Do not copy project code into it from another local workspace.
- Timestamp commits normally; never backdate or rewrite provenance. A commit date is not proof of when its contents were authored.
- Keep docs/BUILD_LEDGER.md with actual work, checks and remaining limitations. Only claim tests that ran against this checkout.
- Meaningful use of an eligible Meta model is a submission gate, not an optional branding element.
- Three-minute demo, accessible code/video and contributor information are required by the supplied guide.
- The pasted rubric tables are missing. Do not assert exact weights or bonus-prize requirements from them.
- Reimplementing an existing idea does not itself establish eligibility. Answer any organizer provenance question accurately; seek clarification if required.

## 3. Time and capacity

User capacity: 3 h per weekday, 6 h per weekend day. From Tue 27 October through Sat 31 October that is at most **18 human hours**, assuming today's full allocation remains. Sun 1 November through Tue 3 November adds **12 hours**. Wed 4 November is buffer, not assumed to be a full workday before submission.

Targets: feature freeze by end of 31 October EAT; submission rehearsal 3 November; internal submission deadline 4 November at 12:00 EAT. Official deadline in the supplied guide is 4 November 21:00 EST, equivalent to 5 November 05:00 EAT. Kickoff was 26 October 12:00 ET (19:00 EAT); guide labels the building period 27 October–4 November. Use 27 October onward for this build's work records.

The imported draft's individual budgets sum to 36 hours before extra overhead, exceeding its stated 30 hours. We therefore prioritize a single complete route and one meaningful eligible-model component. A second venue, large pilot, three-model integration and broad device support are stretch items.

## 4. Immediate engineering gate: correct display geometry

The display must have a drawing buffer whose aspect ratio matches its actual CSS display area. Set its backing size explicitly; keep pose projection, video crop, drawing viewport and overlay coordinates consistent through orientation and browser-size changes.

Tests before implementation:

- Portrait and landscape, including 428 × 781 CSS pixels; test different device pixel ratios.
- A world point away from screen centre lands at the same pixel in GPU and DOM rendering under the intended mapping.
- A circular reference is not stretched vertically by the canvas.
- Resize invalidates placement and refreshes projection; stale frames hide every marker, including frozen GPU pixels.
- Log buffer dimensions, display rectangle, viewport, projection, placement and configuration hash. Keep placement/loss transitions even when repeated status samples fill the buffer.

First physical check: a rigid textured stationary surface; one placement, slow sideways motion, return, then loss/recovery. Obtain fresh event-build evidence. Passing algebra or shader tests does not prove tracking stability. If display is correct but world lock still fails, present native/borrowed-device choices to the human; do not silently abandon live AR or switch platforms.

## 5. Smallest useful architecture

Browser: capture, visitor camera, tracking and rendering.

Local Python service: route retrieval, local feature matching, PnP, map-to-session alignment and trust decisions.

Verified free batch compute: route geometry and eligible Meta model inference where supported. Heavy models are outside the per-frame rendering loop. No paid execution, credit-card setup, new always-on cloud resources or assumed grants.

Provider interfaces:

| Interface | Responsibility |
|---|---|
| TrackerProvider | Timestamped camera pose, projection, frame acquisition and tracking state; provider-specific implementation |
| Localizer | Map candidates, geometric pose hypotheses, ambiguity and scale-aware alignment |
| DoorVerifier | Initial destination-verification adapter for the door/entrance case; reports evidence, never independently authorizes arrival |
| RouteBundle | Versioned route, destination, geometry, units, provenance and capture calibration |

The trust engine must not depend on an engine SDK. Future destination types can have their own verification adapters; do not build a universal object verifier during this event.

Proposed stack from the supplied draft: TypeScript/Vite/three.js, Python/FastAPI/NumPy/SciPy/OpenCV, Vitest/pytest. These are proposed, not installed or pinned. Add only dependencies needed by the next task, after exact version, license and runtime checks. PyTorch is unnecessary in the live CPU path unless a proven model needs it there. OpenCV version choice requires an explicit recorded decision; no silent downgrade from the earlier OpenCV 5 requirement.

## 6. Model roles and access gates

Choose the first model by actual access and usefulness, not by model count.

- **SAM 3.1 candidate:** segment the destination object/door and nearby alternatives. Combine masks with geometrically localized map identity and independent visual/text evidence. A mask alone cannot identify the correct door. Verify API or weight access, license and runtime before building around it.
- **Muse Spark Open candidate:** extract a visible plate/sign and distinguishable landmark observations into structured evidence; request a specific rescan when evidence is missing. It must not invent coordinates, decide a destination from appearance alone, or bypass geometric verification. Use it as the first eligible-model role if that is the accessible, measurable path.
- **MapAnything Apache candidate:** construct route geometry offline. Eligibility under this event is unresolved. Do not make it the sole eligibility argument; verify the exact model variant, compatible inputs and free runtime. Classical geometry is a possible comparison/fallback, not a second full pipeline to build before the first works.

One meaningful eligible model must actually run on permitted inputs and affect a logged decision. Add the second/third only after the end-to-end route works. Run a paired ablation on the same held-out cases; report no benefit if that is the result.

Credits: the guide advertises Meta credits with a payment-method requirement, and conditional partner credits. A notification is not a hard spending cap. Choose a provider only after visible grant/quota, applicable terms and an actual successful call/job. Kaggle/Colab availability and VRAM are also unverified, not a guaranteed fallback. If no eligible model can run at zero authorized spend, that is an explicit submission blocker.

## 7. Capture, map and localization

Capture synchronized permitted images, pose, projection, orientation, dimensions, camera parameters and tracking state. Do not assume a 4×4 display projection is a 3×3 camera intrinsic matrix: conversion must account for the actual image crop and resolution. Skip invalid tracking. First implement one local export; resumable upload queues are stretch.

RouteBundle v1 must distinguish measured metres from arbitrary tracker units; record scale source and uncertainty. Include route/destination IDs, schema version, configuration hash, model/code versions, privacy review, keyframe calibration, 3D features, route path and destination evidence. Reject inconsistent units, calibration or versions.

Use retrieval to shortlist frames, local matching plus PnP/RANSAC to test location, and competing-hypothesis checks to abstain. A stationary pan cannot establish the translation baseline needed to estimate scale. Scale estimation needs translation, observability checks and a well-conditioned trajectory or independently measured scale. Reject rotation-only, tiny-baseline and degenerate alignments; do not simply demand three poses and assume the transform is valid.

Do not smooth away large localization corrections. Small correction blending, if added, is only after verified alignment; a large change clears guidance and requests re-confirmation.

## 8. Guidance and arrival

SCANNING → LOCALIZED → GUIDING → VERIFYING → ARRIVED / UNSURE / WRONG_DESTINATION.

Arrows require a fresh verified geometric anchor, an unambiguous route hypothesis, a valid map-to-session transform and active tracking. Timeout, wrong destination, loss or service outage hides arrows. Never use a synthetic fixture to authorize real-world guidance.

Arrival requires consistent map location, destination-specific evidence, rejection of a nearby alternative, and repeated consistent observations. A plate match alone is not sufficient where numbers repeat. Masks provide boundaries, not identity. When evidence is weak, show one useful rescan instruction.

Path rendering must use a measured/verified support surface or be labelled non-floor-anchored. Do not silently assume camera height as a reliable floor. Start with a simple clear arrow, then polish only after its geometry works.

## 9. Gates and paired work

| Gate | Codex work | Human work | Exit evidence |
|---|---|---|---|
| G0: event setup | Plan, ledger, exact dependency/license checks, repo hygiene | Confirm permitted route and available credits; personally claim credits if wanted | No assumed entitlements; model path chosen or blocked |
| G1: stable capture/display | Fresh calibrated renderer and tracker adapter; tests and metadata | Short rigid-reference test on iPhone; loss/recovery | No obvious stretch/crop disagreement; actual world-lock observations |
| G2: one route bundle | Capture/export, one proven geometry path, viewer | Permitted author walk, separate visitor session | Bundle validates and has identifiable destination |
| G3: fresh-session navigation | Retrieval, PnP, observable alignment, arrows and expiry | Visitor begins in a new session, walks route | Actual localization and correct guidance; no scene reset masquerading as relocalization |
| G4: destination decision | Eligible-model evidence and abstaining trust engine | Correct and similar wrong-destination approaches | Real refusal and arrival traces, not scripted verdicts |
| G5: submission evidence | Evaluation, ablation, film outline, reproducible README | Independent tester, recording, permissions and final review | Counts and failures, three-minute demo, accessible deliverables |

Each code task is at most one hour; split overruns in the decision log. Do not refactor unrelated code. If waiting for a phone, work on independent fixture/schema tests, access verification and evaluation tools. Fixtures must be visibly labelled synthetic. Field-dependent gates remain open.

## 10. Evaluation and fallback policy

Use separate author/training, tuning/validation and held-out visitor sessions. Never split adjacent frames from the same walk across train/test or treat every video frame as an independent trial. No tuning on held-out cases.

Record independent trial counts, failures, abstentions, latency, tracking-loss recovery and destination mistakes. Tape/tile measurements have recorded uncertainty, not an assumed 10 cm precision. Distinguish offline frame replay from live navigation and camera-to-display delay from backend inference latency.

The draft's 20 relocalization trials, 30 wrong-door arrivals, 10 recovery tests and 5–8-person pilot are stretch targets, not commitments or completion claims. Predeclare achievable trial counts before collection. Zero false confirmations in 30 independent trials would still allow an approximately 10% upper failure-rate bound at 95% confidence; do not claim guaranteed accuracy.

If live AR fails after a bounded calibration/tracker investigation, ask the human to choose a supported native/borrowed-phone route or a clearly labelled recorded replay. Replay is not fulfillment of the live product promise and its competitiveness/eligibility must not be assumed. A destination-only verifier is also a reduced scope requiring explicit approval.

## 11. Hosting, privacy and reproducibility

Keep static assets independent of the laptop if a verified free host/license combination permits. GitHub Pages is a candidate; configure its repository base path and test assets/SDK loading over HTTPS. A private route bundle must not be put on a public Pages site.

Laptop backend tunnels are temporary and may expire. Verify reachability immediately before a test; document restart and shutdown. Do not promise an always-live judging backend. An honestly labelled accessible replay/video complements, but does not replace, a claimed live demo.

No private media, keys, model weights, node_modules or SDK binaries in Git. SDK binaries fetched from official sources under their license. Permission covers capture and publication separately. Face/plate/private-information removal precedes stored/uploaded route imagery. Uploaded visitor frames are ephemeral; deletion/revocation needs tests before external sharing.

## 12. Demo story

Open with a delivery/visitor arriving at a map pin but still needing the actual entrance or destination. Show one author walk becoming a shared link; an independent visitor follows the real route, an incorrect destination is refused, and the correct destination is confirmed when evidence permits.

Explain the eligible Meta model's exact contribution and real measured effect. End with the product's broader reach: one reusable path for another person, across many types of destinations. Show limitations and distinguish live, replay, synthetic and aspirational scenes. Do not use old footage as event-build proof.
