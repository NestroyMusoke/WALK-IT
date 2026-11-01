# Third-party ledger

## E01 pins recorded before installation — 27 October 2026

| Package | Exact version | License from official npm metadata | Purpose |
|---|---|---|---|
| three | 0.186.1 | MIT | World-to-camera geometry and shared-canvas rendering |
| @types/three | 0.186.0 | MIT | Type checks for the matching three release |
| vite | 8.3.5 | MIT | Local development and static build |
| vitest | 4.0.18 | MIT | Fast tests; supports installed Node 25.9.0, unlike latest Vitest 5 |
| typescript | 5.9.3 | Apache-2.0 | Stable strict type checking |
| @types/node | 25.5.0 | MIT | Node tooling types |
| @8thwall/engine-binary | 1.0.0 | Custom XR Engine License Agreement | Authorized free browser-tracking experiment; binary never committed |

Registry source: https://registry.npmjs.org/ (each package's version metadata). Exact resolved artifact URLs and integrity digests will be in package-lock.json. The SDK metadata integrity is `sha512-qH0WH7+HHQFtwzKL+TDEg8RT+RadC2eR3c2v+GcJW3Z+7ZedJYadHmA0lZcOXwntBbcQZkeKkj1HYuUKcZanrA==`.

SDK license reviewed from https://raw.githubusercontent.com/8thwall/engine/main/LICENSE . Preserve original distribution and notices; retain Niantic Spatial attribution and warranty-disclaimer link in the app. No reverse engineering or modification. Fee-based product restrictions mean this is not commercial clearance. The SDK is not covered by the licenses of our other dependencies. Existing authorized SDK use continues; no new model terms or payment agreement are accepted here.

Node observed 25.9.0, npm 11.12.1. npm's user-wide cache was not writable in the sandbox; use the ignored project-local cache instead. No system installation or security setting change.

Before installation record exact package/model version or revision, official source, code license, separate weight license, distribution restrictions, attribution, checksum/lockfile, purpose and runnable import/smoke result.

Special checks: 8th Wall distributed engine has a custom license and is not ordinary MIT engine source; never commit its binary. MapAnything variant matters. SAM and Muse weight/API terms must be checked separately. Do not publish a blanket Apache-2.0 license over third-party assets. Project license selection remains to be finalized before code publication.

Geometry runtime candidate (2026-10-28): numpy 2.3.5 (BSD-3-Clause), opencv-python-headless 5.0.0.93 (Apache-2.0; bundled third-party notices apply). Pins in geometry/requirements.txt before installation. Official distribution https://pypi.org/project/opencv-python-headless/5.0.0.93/ ; purpose: local feature extraction and geometry smoke, no model weights. Import/runtime verification required; no OpenCV 4 fallback.

Verified local import: OpenCV 5.0.0 / NumPy 2.3.5. Downloaded Windows wheel SHA-256 829717b6a95554f273e49e357cee3b3a2a26b6f4842fbc1bed2b45bdd8f87e0e matches official PyPI JSON metadata. Installation completed offline from verified wheel after slow/stalled pip downloads; NumPy installed from verified package metadata/cache. Platform wheel hashes: geometry/requirements-win-py312.lock.

## E05 hosted-model candidate — 30 October 2026

No new package or model weight is installed. The runner uses pinned NumPy/OpenCV and Python's standard HTTP library. Meta's [hosted-provider guide](https://dev.meta.ai/docs/muse-spark-open/deploy) and [Baseten model page](https://www.baseten.co/library/muse-spark-open/) identify endpoint `https://inference.baseten.co/v1/chat/completions` and API model ID `meta-models/muse-spark-open`. Meta's [published Muse Spark Open model card and Muse Model License](https://huggingface.co/meta-models/Muse-Spark-Open-816B-A42B-NVFP4) cover the open weights and require "Built with Muse Spark Open" attribution for a product using the model. Baseten's hosted API is subject to its separate [service terms](https://www.baseten.co/terms-and-conditions/); the user must review account terms. No local weights or model code are copied. The hosted API alias does not establish the exact serving weight revision; request the provider revision before claiming E05's revision gate. Baseten bills tokens; the user reports active promotional credit, but available balance and final charge remain unverified. No model call has been made in this card yet.

E05 sponsor alias update (1 November): the human supplied the sponsor email requiring meta-models/muse-spark-open-1026 with its separately issued hackathon key. This exact alias supersedes the public alias for our runner. Provider, model family and previously recorded terms remain unchanged; backend revision and actual credit usage remain unverified. No credential or single-use secret link is recorded here.

## 1 November — E05 SAM access runner prepared

Acceptance tests first failed on missing adapter, then passed (4 tests). The adapter uses Meta's documented `POST https://api.meta.ai/v1/responses` with model `sam-3.1`, one reviewed/re-encoded PNG, and the `wooden door` noun phrase supported by the saved Spark observation. It stores the complete streamed response privately before parsing, accepts only a `response.completed` event with the expected model, and treats zero matches as a valid abstention. No mask geometry, destination identity or live guidance is asserted. No network call was made by the agent. Exact backend revision, credit usage and actual SAM response are still pending. Python standard HTTP library adds no dependency. Sources: https://dev.meta.ai/docs/media-segmentation and https://dev.meta.ai/docs/sam/reading-segmentation and https://dev.meta.ai/docs/pricing-rate-limits . One still image is listed at $2.50 per 1000 images before promotional credits; check the Meta dashboard before/after the single human call.

Human smoke command: `powershell -ExecutionPolicy Bypass -File .\scripts\run-e05-sam.ps1` from repo root. It prompts for MODEL_API_KEY hidden and clears the process environment afterward. The existing private `eval/sessions/e05-destination.png` is used. Never paste the key or raw receipt in chat or Git. E05 remains open until the real call and billing/terms review.
