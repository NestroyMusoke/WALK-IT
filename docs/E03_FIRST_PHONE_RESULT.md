# First E03-1 phone session — 27 October 2026

Evidence: one user-operated session, automatic numeric upload, plus the user's report that the reference shook substantially less but could improve. This is an initial diagnostic, not a navigation or accuracy benchmark. No video or independently measured positions were supplied for this session.

- 246 batches, sequences 0 through 245 with no missing sequence numbers.
- 4,599 events including 4,587 camera updates over 81.409 seconds.
- 1 UNAVAILABLE, 1,337 LIMITED, 3,249 NORMAL updates. Every NORMAL update passed pose validation.
- First NORMAL arrived 26.038 seconds after the first camera update. All 3,249 subsequent updates were NORMAL over 55.371 seconds; no later LIMITED update was logged.
- Callback gaps: median 17 ms, p95 22 ms, maximum 142 ms. These are callback timing measurements, not motion-to-photon latency.
- Buffer 856 x 1562; CSS display 428 x 781; DPR 2. Aspect ratios agree.
- Three FEATURE_POINT placements. No guided step-completion events or structured observation answer. Terminal event: user-finished-early. The session was explicitly ended, but the prescribed physical protocol was not completed.
- Configuration SHA-256 dd059db009b6495648782d3e642bc5da9cb5a06f80736d7c37ec9d3b49c9ae9d matches the current configuration.

Interpretation: basic live camera/pose/render/upload integration now has phone evidence. The user's improved-stability observation supports preserving this renderer. Initial acquisition took about 26 seconds; the overall LIMITED fraction is entirely before first NORMAL and must not be described as repeated tracking loss during the stable period. The logs do not establish physical accuracy, metric scale, real motion coverage, or loss/recovery behavior. No smoothing or new thresholds were tuned on this run. E04 remains open; unrelated route-schema implementation can proceed.

Raw batches and the numeric summary remain private under eval/sessions/ and are ignored by Git. The ad-hoc analysis is tmp/analyze-live.mjs; this note contains aggregates only.
