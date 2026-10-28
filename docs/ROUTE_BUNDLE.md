# Route capture manifest v1

E06 defines the capture-manifest boundary, not a completed navigation map. `validateRouteBundle` checks exact schema fields, configuration identity, permission/review declarations, safe relative image references, unique keyframe identities, finite camera poses, image calibration and an existing destination at the path endpoint.

`source` explicitly distinguishes synthetic fixtures from captured sessions. `units` is `tracker` until a metric reference establishes scale. `scaleVerified` records a separate measurement, not an inference from the engine's absolute-scale option. `requireMetricScale` checks this prerequisite only; it does not authorize AR, localization or arrival.

Coordinate convention: right-handed map frame; keyframe position and quaternion (x, y, z, w) transform camera coordinates into the map frame. Camera looks along negative Z in the renderer. Intrinsics are row-major 3x3 pinhole K for the actual stored image (u right, v down), not the engine's 4x4 display projection. Future capture must supply correct crop/resolution conversion and distortion handling; copying display intrinsics directly is invalid.

Privacy flags are workflow declarations, not evidence that an automatic redactor ran. Capture/export remains blocked until permission and image review are performed. No actual images are included in these tests. Sparse point/descriptor artifacts and localization evidence will be added with a versioned map schema after the geometry runtime is selected and tested; this manifest alone cannot relocalize a visitor.

## E09a local geometry diagnostic

Install the exact geometry/requirements.txt pins into the project .venv. OpenCV 5 is required explicitly; the script refuses other major versions. No cloud service or model is used here. This is the classical geometry component, not the required Meta-model contribution.

Run:

    .venv\Scripts\python.exe -m unittest discover -s geometry
    .venv\Scripts\python.exe geometry\reconstruct.py eval\sessions\<session>-capture.json

The script decodes reviewed images, extracts SIFT features, applies the configured descriptor ratio test, and triangulates neighboring-frame matches with recorded poses. It converts OpenGL camera axes to OpenCV axes explicitly. Positive depth and reprojection error checks reject inconsistent candidates. Results remain beside the private capture file. Candidate points are not deduplicated or bundle-adjusted, and do not constitute a verified sparse map. Near-stationary frames, repeated textures and inaccurate poses can produce misleading candidates; no navigation gate uses this output.

Reports preserve both capture and geometry configuration hashes. A changed geometry config does not rewrite capture provenance. Frame pairs are correlated diagnostics, not independent localization trials or an accuracy benchmark. The separate visitor session remains held out.

During an active phone test, set WALKIT_VERIFY_BUILD=1 before scripts/check.ps1 so Vite writes only to tmp/check-dist. Leave the live dist and receiver unchanged until recording is complete.
