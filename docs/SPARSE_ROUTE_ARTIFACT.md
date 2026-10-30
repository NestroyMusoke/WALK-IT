# E06b — versioned sparse route artifact

`geometry/route_artifact.py` binds one reviewed capture to its experimental OpenCV 5 SIFT map. It verifies the exact capture hash and capture configuration hash stored in the map, validates the map schema, keyframe identities and image calibration, checks every map observation references a real frame and falls within its image, and requires the route path and destination to agree with the captured camera centers. Mismatches fail closed.

The JSON artifact has `schemaVersion: 1` and `artifactType: sparse-route-v1`. It contains source/map/configuration hashes, OpenCV and descriptor identifiers, camera calibration and poses, path, destination and sparse landmarks. It omits PNGs and image paths. It explicitly says `units: tracker`, `scaleVerified: false`, `navigationReady: false`. It is stored privately under ignored `eval/sessions`; it is not a public route link or a live navigation result.

The first real development artifact was generated from the 53-frame author walk and filtered map: 53 path points and 259 landmarks. Only two landmarks cover the final frame in that map. No independent visitor trial or metric scale exists yet. This artifact does not cure the failed alignment or endpoint evidence.

The acceptance test failed first because the module was missing. Three tests then passed: correct binding without private images, rejection of mismatched map/observation provenance, and rejection of altered path/destination/unreviewed capture. No dependency, threshold or cloud service was added. Further checks are recorded in the build ledger.

Run privately:

    .venv\Scripts\python.exe geometry\route_artifact.py <reviewed-capture.json> <matching-sparse-map.json> <private-output.json>
