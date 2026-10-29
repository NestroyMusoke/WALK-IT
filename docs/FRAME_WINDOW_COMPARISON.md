# E09c frame-window development comparison

Completed 29 October 2026. Longer author capture used to build all variants; the short author capture supplies 18 diagnostic queries. These are development data, not held-out accuracy measurements. All reprojection, minimum-view, parallax and PnP gates remained unchanged.

| Variant | Retained tracks | Frames with zero coverage | Destination coverage | Accepted cross-recording hypotheses |
|---|---:|---:|---:|---:|
| Adjacent baseline | 193 | 7 | 2 | 4/18 |
| Three-frame window, unfiltered edges | 182 | 10 | 2 | 2/18 |
| Three-frame window, geometric edge checks | 259 | 4 | 2 | 4/18 |

Decision: retain the filtered window as the next development candidate because map coverage improved without reducing this diagnostic's accepted count. Do not claim improved localization accuracy or reliable arrival. Preserve the baseline and failed variant privately for comparison. No live map has been enabled.

Matching up to three frames apart can bridge missing immediate matches, but adds false links. Before merging connected observations, pair triangulation now rejects nonfinite/behind-camera candidates and pairs exceeding the existing 3 px reprojection limit. Full multiview, minimum three observations and 1-degree parallax gates still apply afterward. Pair tests do not replace full-track checks.

Candidate output: `<capture>-tracks-window3-filtered.json`. Each pair records raw and geometry-accepted counts. The artifact preserves capture/config identity and labels pairGeometryFilter=true. The old adjacent artifact and unfiltered window variant remain separate files under ignored eval/sessions.

Twelve Python tests and the complete web checks pass (29 web tests, setup, typecheck, isolated build). First-failing regression evidence: tmp/e09c-first-fail.txt and tmp/e09c-pair-first-fail.txt. No camera or runtime dependency changes.

The endpoint problem remains unresolved. More matching alone did not create sufficient endpoint evidence. Before an arrival claim, inspect endpoint observations and obtain a deliberate translated endpoint scan if needed; a stationary pan cannot supply depth. Map-to-session alignment, a separate visitor trial and the eligible Meta-model component remain outstanding.
