# WALK IT: one-walk route, verified live guidance

Status on 2 November 2026: **design and offline intake are ready; visitor navigation is not proven.** A host records one continuous walk. The visitor receives a link and should see arrows in the live camera only while the app knows where the visitor is. The system must visibly pause when it does not know. This document is the implementation and field-test contract, not a claim of 95% reliability.

## Why the previous attempt failed

The saved host recording has a valid reviewed image/map pair, 10/10 start frames and 3/3 final frames with at least the minimum mapped landmarks, but the first ten views span only 9.1805° of camera direction. Two saved fresh scans each yielded 0/10 accepted starting poses under the original map and under a stronger reference-image matcher. The stronger matcher increased tentative matches (up to 11 and 15), yet geometry refused every pose. This does not isolate one cause. It shows that adding more images or lowering the match threshold cannot safely establish a physical position. A person may face a different part of the same place, and repeated corridor details may look alike.

## The route as a small visual map

| Stage | What it does | Evidence required before proceeding |
| --- | --- | --- |
| Host capture | One continuous camera-and-pose walk. First views include a fixed sign and textured background from several overlapping angles; then the turn and exact destination. Privacy review and a downloadable private backup happen before departure. | Image/frame/calibration/path identity, upload or recoverable backup, first/turn/final image visibility. |
| Map build | Use OpenCV 5 to match nearby host frames, form multi-view tracks and a sparse map. Keep the whole route's reference images and their observed 3D points. | Registered start, turn and end; map and capture hashes; measured image and landmark coverage. A map made from unstable tracker poses remains experimental. |
| Visitor entry | Visitor opens the link near the shared physical start and aims at the fixed landmark. Retrieve plausible host images, match their local features, lift matches to the map and run robust PnP. | A geometrically accepted, unambiguous fresh-session pose with independent wrong-start rejection. More descriptor matches alone do not pass. |
| Session alignment | Associate each accepted map pose with its timestamped browser-tracker pose; fit a recent gravity-aligned transform and reject inconsistent scale or drift. | Supported, recent transform; tracking NORMAL; measured path/scale validity. The host map and browser tracker have unrelated origins and may have different scale. |
| Guidance | Render a fixed 3D route point in the camera's own AR scene. Smooth only the visual transition after a valid transform; never smooth an invalid position into apparent certainty. | Current OpenCV anchor and active tracking. Loss, stale fix, ambiguity, off-route state or large correction hides the arrow and asks the visitor to rescan. |
| Arrival | Compare the final projected area to reviewed destination evidence; use Spark/SAM only if their actual result changes a logged verification decision. | Geometry and visual evidence agree across distinct observations; a similar door or model outage abstains. |

The route can be topological at first, meaning “next turn” and “next scene,” but a **world-anchored floor arrow** still needs a trustworthy map-to-tracker transform and local scale. The existing host tracker scale varied between sessions. Removing metre labels does not repair an incorrect world transform. An alternative visual teach-and-repeat route follower could compare a visitor's image sequence with host images and guide by scene order, but that is a separate architecture to test, not an approved silent fallback.

## Why the arrow should look stable

The phone's tracker owns frame-to-frame drawing; a server response never directly moves the arrow each animation frame. A verified OpenCV correction updates the map-to-tracker transform at its original capture timestamp. The renderer then places the next route target in the same 3D camera canvas as the camera feed. The existing 1.5-second geometry-age gate and loss gates stay in force. A visually smooth arrow that points to the wrong staircase is a failure, so a large or contradictory correction removes it. The designed arrow may use the current glass/visual identity, but decoration cannot override these gates.

## One site visit, one host recording

1. Before travelling, run the web build and local receiver, verify the HTTPS phone page, private backup download and intake CLI with a non-private fixture. Confirm the visitor link resolves to the intended route and that the phone camera/tracker starts. No field trip is requested until these checks pass.
2. At the site, use one permitted, well-lit 20–25 m pedestrian route with a distinctive fixed start, one turn and a labelled exact destination. Measure the physical length if reporting metre error. Keep another person available for a fresh visitor attempt if possible.
3. Record once using [ONE_WALK_CAPTURE.md](ONE_WALK_CAPTURE.md). In the first ten saved images, deliberately show the start landmark and fixed surroundings from overlapping directions while moving sideways; do not spend all ten frames looking nearly straight ahead. Record the rest of the route and final doorway in the same session.
4. Review/mask images and download the private backup. Run `tracks.py` and `author_intake.py` on that backup before leaving. If either refuses or the start/turn/end is visibly absent, the app must say **capture incomplete while still on site**. Passing this intake only means the data can enter localization testing; it does not certify a visitor.
5. Freeze the map and code before the independent visitor attempts. Record every correct and wrong-start attempt, tracking status, accepted/refused poses, arrow visibility and measured end error. The declared S06 gate remains 4/5 correct starts within 1.0 m plus reference uncertainty and 10° heading, zero accepted wrong starts, and under 3 m endpoint error in at least half the runs. Missing measurements mean no accuracy pass.

There is no honest way to derive “95% certainty” of visitor success from the current author repeats or the two failed saved scans. The nearest useful pre-field proof is a reproducible intake, frozen localizer, negative controls, tracker-loss fixtures and a functioning phone link. The final physical visitor run is essential.

## Research basis and boundaries

- [Hierarchical Localization](https://github.com/cvg/Hierarchical-Localization) uses reference retrieval, local feature matching and geometric pose estimation. [AIR-HLoc](https://arxiv.org/abs/2403.18281) studies adaptive retrieval. These support the pipeline structure, not this route's success rate.
- [LightGlue](https://github.com/cvg/LightGlue) provides learned local matching options and CPU benchmark information. Its weights, dependencies, license and this laptop's latency must be verified before adoption.
- [Visual teach-and-repeat research](https://dspace.mit.edu/entities/publication/63b4656c-83a9-4106-bfc4-94ae26db3522) studies routes specified by a single monocular image sequence. [A low-compute implementation](https://github.com/QVPR/teach-repeat) also uses wheel odometry, which a walking phone does not have; it is not a drop-in solution.
- [Apple's world-tracking documentation](https://developer.apple.com/documentation/arkit/understanding-world-tracking) explains why sensor fusion stabilizes local AR, while [saved world maps](https://developer.apple.com/documentation/ARKit/saving-and-loading-world-data) are an iOS-native relocalization path. Moving this project to a native iOS app would be a platform change requiring the student's decision and a feasible Mac build path.
