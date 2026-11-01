# Static evidence explorer

Open `http://127.0.0.1:5173/evidence.html` after `npm run dev`. The page is also included in `npm run build` as `dist/evidence.html`. It uses only static files; no inference API, camera, private receiver endpoint or API key is needed. Hosting is not yet configured and no public-access claim is made.

The shipped manifest at `apps/web/public/evidence/manifest.json` is intentionally empty. No real Spark/SAM pair or approach result is available for publication. E16a is a shell, not an E05/E14b pass. Do not copy private captures into the public tree automatically.

## Publication contract

Top level: `schemaVersion: "walkit-evidence-v1"`, `declaredApproachCount` (planned held-out denominator, not completed count), and `cases`.

Each case requires:

- `id`, `label: "RECORDED REPLAY"`, `split: "validation"` or `"held-out"`.
- `privacyReviewed: true` and `publicationApproved: true`, set only after real review/permission. These assertions are not automatic face detection or proof of consent.
- `image` and `overlay`: reviewed crop and actual SAM overlay on that same crop, located beside the manifest. Only plain PNG/JPEG/WebP filenames are accepted. No remote URLs, filesystem paths, SVG or data URLs.
- `inputSha256` and `configSha256`: hashes retained from the original evaluation. Mask/crop derivatives need their transform and source binding preserved in the private receipt; never call an overlay correct without checking image alignment.
- `groundTruth`: `correct`, `decoy`, `wrong-direction` or `wrong-start` from independently recorded labels.
- `spark` and `sam`: each has `model`, a non-sensitive public `receipt` reference, and the actual structured `output` object. Review output strings for private details; the validator only catches obvious credential field names. It is not a general secret scanner.
- `withModels` and `withoutModels`: each has `verdict` (`confirmed`, `refused`, `abstained`, `failed`) and an actual logged `reason`. No missing arm, replaced failure or invented counterfactual.

All model text is inserted as text, not HTML. The browser rejects malformed manifests and duplicate IDs. Each split is shown separately. False confirmation means `confirmed` on any ground truth other than `correct`; no accuracy percentage is computed from the selected published sample. The complete twenty-attempt report remains necessary even if only ten reviewed examples are published.

For static hosting copy the built `evidence.html`, the JS/CSS assets it references (including its module-preload dependency), and `evidence/` from the build output. Do not include private sessions, environment files, model weights or tracking vendor binaries. Publication and logged-out checks are E15; no deployment was performed here.

Verification on 1 November: first-failing missing-module acceptance tests, then three passing explorer tests. Full project check: 33 web tests, setup check, typecheck and isolated production build pass. Desktop browser inspection confirmed the empty replay page and zero published cases. Populated real cases and phone layout remain to be inspected once evidence exists.
