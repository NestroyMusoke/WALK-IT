# Route capture manifest v1

E06 defines the capture-manifest boundary, not a completed navigation map. `validateRouteBundle` checks exact schema fields, configuration identity, permission/review declarations, safe relative image references, unique keyframe identities, finite camera poses, image calibration and an existing destination at the path endpoint.

`source` explicitly distinguishes synthetic fixtures from captured sessions. `units` is `tracker` until a metric reference establishes scale. `scaleVerified` records a separate measurement, not an inference from the engine's absolute-scale option. `requireMetricScale` checks this prerequisite only; it does not authorize AR, localization or arrival.

Coordinate convention: right-handed map frame; keyframe position and quaternion (x, y, z, w) transform camera coordinates into the map frame. Camera looks along negative Z in the renderer. Intrinsics are row-major 3x3 pinhole K for the actual stored image (u right, v down), not the engine's 4x4 display projection. Future capture must supply correct crop/resolution conversion and distortion handling; copying display intrinsics directly is invalid.

Privacy flags are workflow declarations, not evidence that an automatic redactor ran. Capture/export remains blocked until permission and image review are performed. No actual images are included in these tests. Sparse point/descriptor artifacts and localization evidence will be added with a versioned map schema after the geometry runtime is selected and tested; this manifest alone cannot relocalize a visitor.
