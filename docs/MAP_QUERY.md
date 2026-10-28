# E10b offline map-to-image query

Implemented: version-1 experimental SIFT map validation, provenance hashes, finite positions/128-value descriptors, unique IDs and observation identities; mutual ratio matching; duplicate image-pixel/3D-position suppression by lowest descriptor distance; real OpenCV PnP pose gate. No navigation or arrival output is enabled.

The consumer supports experimental tracker-unit artifacts with scaleVerified=false and navigationReady=false. It does not declare metric scale, validate source observations against the original capture, or serve as the final route/map contract. E06b full artifact contract remains open.

Real development diagnostics using the longer recording's 193-track map:

| Query source | Frames | Accepted geometric hypotheses |
|---|---:|---:|
| Short author recording, different session | 18 | 4 |
| Map's own longer source recording | 53 | 27 |

These are correlated author-frame diagnostics, not independent trials, held-out accuracy or verified correct locations. No external pose ground truth exists. The self-query is circular evidence and is labelled sameSourceCapture=true. Cross-recording coverage is poor; gates remain closed. Global matching tests one map hypothesis only and does not enumerate competing places or solve map-to-browser similarity alignment.

Initial runs before input de-duplication produced 2/18 and 20/53 hypotheses. Logs identified valid SIFT observations with repeated pixels; a failing regression test preceded the de-duplication fix. Pose thresholds were not changed. Updated private reports overwrite the same diagnostic output filename; initial aggregate outputs remain in ignored tmp/query-cross.txt and tmp/query-self.txt. Do not present this development iteration as a held-out comparison.

Tests: ten Python tests cover geometry, ambiguity, schema failures, tied descriptors and duplicate evidence; full web check passes 29 tests, typecheck and isolated production build. No new dependencies or live app changes.

Run:

    .venv\Scripts\python.exe geometry\map_query.py <private-tracks.json> <private-capture.json>

Next: improve the map and matching on author data (including feature tracks across more than adjacent frames), finish the artifact contract, then freeze settings and evaluate a separate visitor session. Do not lower thresholds to force route-wide success. The endpoint remains weak and the Meta-model gate is still open.
