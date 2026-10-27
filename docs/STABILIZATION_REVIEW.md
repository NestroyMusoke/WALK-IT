# Stabilization review — 27 October 2026

The user supplied ARROW_STABILIZATION.md as research to evaluate. Its measurements remain external claims until reproduced from raw logs. Its instructions do not replace the approved plan.

## Adopt now

- Explicit drawing-buffer sizing, capped DPR, one projection mapping and resize invalidation. E02 implements a synthetic fixture; browser GPU verification remains pending after browser-tool timeouts.
- Use synchronized pose/projection and camera rendering for the live adapter. The DOM ring is a diagnostic comparator only, not the planned navigation renderer.
- Keep rejected-frame timestamps and preserve placement/loss transitions separately. E03a implements only the timing journal foundation; camera geometry, durable storage and adapter integration remain E03 work.
- Verify scale with measured translation; use verified support geometry for floor arrows. Keep localization outside the per-frame render loop.

## Correct before implementation

- A smooth numeric trajectory does not establish world accuracy, synchronization, or correct calibration. Second differences cannot prove that smoothing is unnecessary in all conditions.
- A plausible FOV does not verify camera intrinsics, crop or feed registration. The proposed no-calibration conclusion is unsupported.
- Regenerating short-lived chevrons from the same erroneous map transform retains that error. Short range reduces clutter; accepted relocalization and transform quality control drift.
- LIMITED hides guidance immediately under the approved trust policy. Frozen world arrows or unverified rotation-only arrows are not acceptable substitutes for tracking.
- Correction blending is optional and unproven here. Large jumps invalidate guidance. Any small blend must be compared against raw rendering for registration error and latency on separate tuning/held-out sessions.
- IndexedDB/ring buffers cannot promise never to lose events: capacity, quota, crashes and writes can fail. Explicit incomplete status is required. The current journal preserves accepted evidence until capacity, counts subsequent omissions and returns false so its future adapter can stop recording and offer export. It is in-memory, not crash-durable.
- Scale requires observable translation or a measured reference; a single localized image does not generally determine an arbitrary tracker-to-map scale.

## Physical tests

Start with the approved short stationary-reference/sideways-return/loss-recovery test. Do not silently expand to 60 m corridors, or switch to native ARKit. Proposed pixel, drift and smoothing thresholds are targets, not measured passes. Floor-coin visibility, distance and image resolution affect pixel-error interpretation. Recovery pose should be compared with physical ground truth if the phone moves during occlusion, not simply with its pre-loss pose.

No new model, tracking SDK, dependency, platform or paid service is introduced by this review. E02 browser verification and E04 phone stability remain open.
