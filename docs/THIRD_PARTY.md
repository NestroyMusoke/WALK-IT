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
