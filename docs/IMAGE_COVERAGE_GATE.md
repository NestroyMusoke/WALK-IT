# E11c — reject narrow visual support

The older cross-recording author diagnostic accepted four pose hypotheses from 18 query frames. Frame 12 had 9 inliers with a maximum reprojection error of 2.006479062511645 px, but their image convex hull covered only 0.01649454165915274 of the frame. Their pixels lay at x 236.7–340.4 and y 93.7–152.6 in a 351×640 image. Its map position was almost unchanged from frame 9 while the capture tracker had moved 1.3366190304051406 units. Rotation disagreement was under 2.7 degrees. This evidence supports rejecting a pose based on a small image patch; it does not prove the remaining poses are accurate.

The initial minimum image coverage was 0.01. A test using 40 nonplanar synthetic points whose image hull exceeded 0.01 but remained below 0.05 failed first because the old localizer accepted it. The configured minimum is now 0.05; rejected hypotheses report the actual coverage fraction. This is a conservative safety gate chosen using development author data. It has not been calibrated on a held-out visitor set.

Rerunning the same 18-frame author query with the unchanged map gives 3 accepted hypotheses: kf7 (coverage 0.07049), kf8 (0.39083), kf9 (0.43085). kf12 is rejected (0.01649). The previous query report is preserved privately as `*-coverage01-baseline.json`; the latest report remains private and ignored. Four positions are required for the current alignment gate, so navigation is still blocked. No measurements of physical localization accuracy or visitor success are claimed.

Next: improve map/query overlap along the approved route and collect an independent visitor recording, preserving the remaining gate thresholds. Do not infer route alignment from only these three author poses.
