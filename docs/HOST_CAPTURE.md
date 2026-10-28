# Host capture foundation

E07a is the in-memory recorder and reviewed-export boundary. It is not yet connected to the live camera page; it does not perform image encoding, download or network upload. E07b must supply synchronized pixels and the review controls before a real author walk.

The caller must copy the engine-rendered camera feed during the same pipeline frame, before drawing virtual markers. Pass the associated pose, full-display projection, receipt timestamp, raw SDK videoTime, calibration revision and upright RGBA image. Do not pair an asynchronous image from a later frame with an earlier pose. Image dimensions must describe the actual copied full viewport; raw video dimensions or a different crop cannot be substituted.

The current supported projection has standard perspective form, positive focal terms and no skew. Principal-point offsets are supported. K is calculated for the stored image dimensions; tests compare it against independently projected noncentral 3D points. Camera-to-map poses retain OpenGL axes; downstream CV conversion must explicitly account for the different camera axes.

The recorder accepts at most one keyframe per configured interval. Defaults are 1 second, 60 keyframes and a 640-pixel maximum image edge. These are resource limits, not experimentally optimized values. E07b must call rejection/abort on every invalid tracking update, even between selected keyframes; it must finish before the capacity limit. Loss, stale frames or changed display geometry invalidate the recording instead of joining potentially different tracker origins.

Raw pixels are transient RAM only. Every frame must be explicitly reviewed before export. Rectangular masks overwrite pixels in RAM before copying to an export. No EXIF exists in the RGBA input; eventual PNG encoding must not add device metadata. Permission and review are human workflow decisions, not machine guarantees of privacy.

The reviewed export contains the validated route manifest, masked pixel buffers and a timing table linked by keyframe ID. Positions remain in unverified tracker units. A translated trajectory is required, but that simple check is not proof of well-conditioned geometry or metric scale. The endpoint is the final accepted keyframe. This data does not authorize route arrows or arrival.

Pending: actual camera-pixel extraction, per-frame alignment verification, review/masking UI, encoding and authenticated private persistence, then a permitted field capture. Existing live diagnostic remains unchanged.

## Recording controls (E07b software; E07c phone validation pending)
Open live.html via the complete private HTTPS test link. Start camera, wait for NORMAL, expand Record permitted route, then Record walk. Keep portrait orientation and walk slowly along the approved short route. At the destination stop moving and press Mark destination; the next sampled camera frame ends capture. Recording aborts on tracking loss, resize, stale pose or mismatched viewport. Do not operate while driving.

Review each image. Drag over faces, plates or private details to black them out; Clear masks resets the current preview. Approve each image only after inspection. Then Save reviewed route to laptop. Keep the page open until a saved receipt appears. Failed saving retains reviewed data in memory for retry; reload/closing loses unsaved data. The laptop and tunnel must remain running.

Saved capture is one private `<session>-capture.json` in ignored eval/sessions containing validated manifest, timestamps and reviewed PNGs encoded as base64. It is not a reconstructed map and cannot authorize navigation. No raw media enters Git. Numeric logs still upload automatically; images upload only after explicit review/save. One route per session; reload for another route. Session expiry can prevent saving after an hour. Desktop tests do not prove the camera canvas contains the expected phone image; check this before recording the whole walk.
