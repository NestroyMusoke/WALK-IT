# Audit of the independent rescue report

2 November 2026. The external `WALK-IT-RESCUE/RESCUE_REPORT.md` was read with its scripts and JSON outputs. This is an engineering audit of already inspected recordings, not a held-out visitor evaluation or a live-navigation result. Our reproduction is private at `eval/sessions/e11d-3k-rescue-audit.json` and records the exact input, config and script hashes.

## Findings we can use

- The decoded author and visitor `kf5` images show different content: a forward corridor view versus a side-wall close-up. Other early frames do overlap. The failure is view dependent; “the visitor never saw the author scene” is too broad.
- On one author/visitor image pair, OpenCV 5 SIFT with 8,000 requested features, contrast threshold 0.01 and edge threshold 20 found 45 mutual matches and 31 homography inliers, compared with 10/7 for the original settings. The same detector also improved one within-author pair from 22/16 to 63/41. This supports a **new detector experiment**, not a verified localization gain. These settings were explored after looking at the visitor scan, so that scan cannot later be called held out.
- The 153-point old start map had a reported median maximum parallax of 3.95° and 60.1% of landmarks below 5°. This makes depth conditioning a concern; the report did not independently measure 3D point error.
- Our reproduction found 4/10 visitor frames with an essential-matrix candidate after homography selection. The first four frames had 3, 3, 3 and 5 candidate reference images. One selected adjacent pair disagreed with the phone's measured relative rotation by 22.55°, exceeding the predeclared 10° screen. The other two adjacent errors were 3.55° and 1.59°. The current “choose most homography inliers” rule therefore fails as a stable orientation cue.

## Corrections before implementation

1. The external aggressive-SIFT PnP test uses `featureIndex` observations from a map built with the original SIFT settings. Changing SIFT detection changes feature indices, so the claimed `≤6` lifted 3D correspondences cannot be interpreted as a valid rebuilt-map PnP result. Rebuild the map and the reference features with identical settings before comparing PnP.
2. Its emitted `visitorCenterInMapTrackerUnits` has nine values, caused by a `(3,)` vector broadcasting against a `(3,1)` vector. It is not a 3D position. Even after fixing the shape, `recoverPose` returns a **unit translation direction**, not the distance to the visitor. For image points ordered visitor→author, the visitor center would be `C_author + λ R_author.T @ t`, with unknown positive `λ`; the script's `-R.T @ t` is the inverse-direction center. No numerical visitor position can be composed without another scale constraint.
3. Selecting homography inliers before estimating an essential matrix concentrates matches on one planar scene. A high essential/recoverPose inlier count confirms consistency with that fitted image geometry; it does not settle planar ambiguity, wrong reference choice, physical distance or map-to-tracker alignment.
4. The 0.8187 intensity-histogram cosine is not proof of physical place identity. The single-image synthetic lighting and warp tests do not exclude real changing sunlight, shadows, exposure or viewpoint as contributors elsewhere.

## Independent baseline

On author `kf0`→`kf5`, aggressive SIFT gave 63 mutual, 41 homography and 40 `recoverPose` inliers. Relative rotation disagreed with recorded author camera rotation by 0.429°. `recoverPose` translation norm was 1.0, while the recorded tracker displacement was 0.25834 tracker units. This is useful evidence that orientation recovery can work when images share content, and direct evidence that its translation cannot be inserted into the author route as a measured displacement.

## Decision

Use aggressive SIFT and 2D-to-2D geometry as **candidate retrieval and guided camera alignment investigations**. Do not use their 4/10 count as a start-localization pass, accept a map position, authorize a live arrow, relax the 1.5-second gate or claim 95% reliability. Independently, the route still needs a verified metric/map-to-tracker transform and a continuous visitor correction path. The student later explicitly authorized a printed marker as an optional demo aid; it is not a universal product requirement. A native platform or labelled replay pivot still needs a product decision.

## Controlled follow-up on the real data

With map and query built using the same aggressive SIFT profile, the full map contained 2,595 landmarks. A global mixed-reference PnP query still refused all first-ten frames in both previously inspected visitor scans. Isolating each reference image's 2D matches and lifting only its own map observations recovered accepted **geometric hypotheses** on 4/10 frames in scan 2f and 6/10 in scan 2h. Both author repeat walks had a hypothesis on all 20 first/final sampled frames. The reference-isolated query took about 1.6–2.8 seconds median CPU per frame; many frames had multiple accepted hypotheses. A trajectory-blind candidate-center medoid passed the unchanged first-ten-frame gravity alignment gate for author run 7 but failed `stale-window-support` for run 8. That predeclared author gate stopped the candidate before visitor trajectory alignment. These scans are already inspected development diagnostics, never held-out proof of visitor accuracy. Private reports and hashes are recorded under E11d-3l-2/3/4 in `docs/DECISIONS_LOG.md`.
