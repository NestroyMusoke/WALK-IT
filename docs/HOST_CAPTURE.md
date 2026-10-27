# Host capture foundation

E07a is the in-memory recorder and reviewed-export boundary. It is not yet connected to the live camera page; it does not perform image encoding, download or network upload. E07b must supply synchronized pixels and the review controls before a real author walk.

The caller must copy the engine-rendered camera feed during the same pipeline frame, before drawing virtual markers. Pass the associated pose, full-display projection, receipt timestamp, raw SDK videoTime, calibration revision and upright RGBA image. Do not pair an asynchronous image from a later frame with an earlier pose. Image dimensions must describe the actual copied full viewport; raw video dimensions or a different crop cannot be substituted.

The current supported projection has standard perspective form, positive focal terms and no skew. Principal-point offsets are supported. K is calculated for the stored image dimensions; tests compare it against independently projected noncentral 3D points. Camera-to-map poses retain OpenGL axes; downstream CV conversion must explicitly account for the different camera axes.

The recorder accepts at most one keyframe per configured interval. Defaults are 1 second, 60 keyframes and a 640-pixel maximum image edge. These are resource limits, not experimentally optimized values. E07b must call rejection/abort on every invalid tracking update, even between selected keyframes; it must finish before the capacity limit. Loss, stale frames or changed display geometry invalidate the recording instead of joining potentially different tracker origins.

Raw pixels are transient RAM only. Every frame must be explicitly reviewed before export. Rectangular masks overwrite pixels in RAM before copying to an export. No EXIF exists in the RGBA input; eventual PNG encoding must not add device metadata. Permission and review are human workflow decisions, not machine guarantees of privacy.

The reviewed export contains the validated route manifest, masked pixel buffers and a timing table linked by keyframe ID. Positions remain in unverified tracker units. A translated trajectory is required, but that simple check is not proof of well-conditioned geometry or metric scale. The endpoint is the final accepted keyframe. This data does not authorize route arrows or arrival.

Pending: actual camera-pixel extraction, per-frame alignment verification, review/masking UI, encoding and authenticated private persistence, then a permitted field capture. Existing live diagnostic remains unchanged.
