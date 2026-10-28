# E09a geometry smoke — 28 October 2026

Actual local runtime: Python 3.12.14, NumPy 2.3.5, OpenCV 5.0.0 from opencv-python-headless 5.0.0.93. The wheel SHA-256 was verified before offline installation. Exact Windows/Python 3.12 wheel hashes are recorded in geometry/requirements-win-py312.lock. No OpenCV 4 fallback or paid service used.

SIFT_create, triangulatePoints, findEssentialMat, recoverPose and solvePnPRansac are present. Executed SIFT matching/triangulation on real captures; API presence alone does not validate the other algorithms. Synthetic tests exercise known 3D recovery, rejection of inconsistent image correspondences and OpenGL-to-OpenCV axes.

| Saved author recording | Images | Adjacent pairs | Descriptor matches | Pairs with candidates | Candidate points |
|---|---:|---:|---:|---:|---:|
| Short trial | 18 | 17 | 3431 | 16 | 2276 |
| Longer trial | 53 | 52 | 3800 | 45 | 2380 |

Candidates pass positive depth and the configured 3 px per-view reprojection bound using the recorded tracker poses. Counts include duplicates; this is not the number of unique landmarks, an accuracy score, or evidence of reliable visitor localization. Stationary/small-baseline pairs can be ill-conditioned. No bundle adjustment, track merging, parallax gate, destination verification or held-out visitor evaluation has run. Scale remains unverified tracker units. Neither capture authorizes arrows.

Both are author captures, not held-out tests. Geometry defaults were set before seeing the reconstruction results; no threshold tuning was performed on these results. Full per-pair reports, candidate coordinates and source images remain in ignored eval/sessions. Capture and geometry configuration hashes are separately retained. The geometry settings were added while the live server continued using its original capture configuration; this is an intentional version difference, not a rewritten capture.

Next: reject ill-conditioned triangulations, establish persistent feature tracks/descriptors and a versioned sparse-map artifact, then test fresh-session geometric relocalization on a separately recorded visitor session. The Meta-model contribution remains a separate unverified gate.
