# Changes

2026-10-27: E01 pinned web setup; E02 synthetic calibrated display implementation (browser gate pending); E03a tested diagnostic timing journal. Reviewed stabilization research without adopting unsupported accuracy or smoothing claims. No live tracking or navigation claim.

Run npm ci --ignore-scripts, npm run engine:fetch, npm run check, then npm run dev. Laptop preview: http://127.0.0.1:5173/. Select Run display checks for the pending eight-case GPU report. This is a synthetic fixture, not a camera feed. The localhost URL is not a public phone link.

2026-10-27 — E02 browser GPU verification passed 8/8. E02a guided test and automatic local receipt implemented and checked end-to-end. Twelve unit tests plus setup/typecheck/build pass. Instructions: docs/TESTING.md.

2026-10-27 — E03 live phone page, protected automatic numeric-log receiver and temporary HTTPS hosting added. Code/transport checks pass; field stability remains unverified.
