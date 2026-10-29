# E11b — recorded motion evidence

The reproducible command is `python geometry/motion_evidence.py <capture.json> <query.json> <private-output.json>`. It verifies capture identity and query frame uniqueness, compares all accepted pose pairs, and records input/config hashes. No acceptance threshold, dependencies or navigation authorization were added. Rotation matrices are projected onto SO(3) to remove floating-point orthogonality error before angle measurement.

Actual development author data (not held-out visitor trials): four hypotheses, frames 7, 8, 9, 12. The three pairwise session/map distance ratios among frames 7–9 were 1.5921270863567287, 1.679662363212712 and 1.6477338241025006. Pairs involving frame 12 gave 5.592045138985624, 8.533072125034945 and 74.75775282587509. Frame 9–12 displacement was 0.017879336655803157 map units versus 1.3366190304051406 session units. These units are not verified metres. Maximum relative orientation disagreement was 2.621659159644834 degrees.

Interpretation: one constant scale cannot explain all four pose hypotheses. This does not establish whether matching, reconstructed geometry, capture synchronization/calibration, or phone tracking caused the mismatch. Do not discard frame 12 and claim success. The existing full alignment gate remains failed. Depth inspection found nearby as well as farther inliers, so a distant-landmarks-only explanation is unsupported.

Next experiment: inspect image/pose synchronization and matched observations for frame 12 against frames 7–9 before changing matching or calibration. Preserve all data and current thresholds. Images and detailed results remain ignored/private in eval/sessions.

Verification: the new test failed first with missing module; after implementation all 18 Python tests passed. Synthetic checks cover known rotation/scale, collapsed motion without division by zero, invalid shapes and nonfinite inputs. Full web/project check recorded separately in the build ledger.
