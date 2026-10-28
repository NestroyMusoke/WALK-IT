# E10a geometric pose gate

Implemented and tested locally with OpenCV 5.0.0. Input: known 3D landmark coordinates, matched 2D pixels, unique landmark IDs and calibrated pinhole intrinsics. Output: a geometric pose hypothesis with inlier/error/coverage evidence, runtime version and canonical-JSON configuration hash. This hash deliberately identifies the supplied configuration values, not raw file whitespace. Translation is world-to-camera in the map's units; cameraCenter is camera position in that map frame. No claim of metric scale.

Flow: validate finite, unique, in-image correspondences; reject rank-deficient 3D layouts; solvePnPRansac with EPNP; refine selected inliers using iterative solvePnP; recompute reprojection, depth, rank and image coverage; reject insufficient evidence. Multiple accepted candidates always abstain. This conservative first implementation rejects planar layouts; planar localization may be supported later with an explicitly tested ambiguity policy.

Synthetic tests recover the known pose with six corrupted correspondences among forty and reject insufficient points, duplicates, planar geometry, scrambled matches and multiple accepted hypotheses. These are solver tests, not field accuracy, independent trial counts or proof of descriptor retrieval. Real matching, map-schema validation and separate visitor evaluation have not been integrated. Coherently wrong correspondences can still support a wrong geometric pose; temporal checks and competing hypotheses remain necessary.

Every result has navigationReady=false. A future caller still needs map/session alignment, verified scale, active tracking, fresh anchor and outage/ambiguity gates. This module does not render arrows or decide arrival.

Validation: seven Python geometry tests; twenty-nine web tests, setup test, typecheck and isolated production build. No live files changed. Next: validated sparse-map contract and map-to-query feature matching, then a separate visitor recording.
