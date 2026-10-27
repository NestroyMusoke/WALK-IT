# WALK IT

**Share the way. Follow it to the exact destination.**

WALK IT is a planned camera-guided navigation experience: someone who knows a route captures it once, shares a link, and another person follows verified AR directions to the destination.

The intended users include delivery workers, customers, visitors and anyone meeting someone at a place a map pin does not fully describe. Destinations can be an entrance, shop, courtyard, pickup point or room. The first evaluation uses one short pedestrian route; it does not establish universal coverage or support on every device. Drivers use the camera only after parking safely.

## Event build status — 27 October 2026

The pinned web setup, synthetic display fixture and diagnostic timing journal are implemented. One setup test and nine unit tests pass, along with typecheck and production build. Browser GPU verification, live tracking, model execution and field navigation remain pending. See [PLAN.md](PLAN.md), [TASKS.md](TASKS.md) and [BUILD_LEDGER](docs/BUILD_LEDGER.md).

Target: Meta Global AI Developer Hackathon, Indie track, Build for Your World. The demo will identify the features developed during the event and distinguish live results from recorded replay. Codex assists with engineering and documentation.

## Intended experience

1. A route author walks a permitted route and marks the destination.
2. A visitor opens the shared route and scans the starting area.
3. Visual geometry checks the visitor's location; the phone draws arrows only while location and tracking remain valid.
4. A Meta-model-assisted destination check helps distinguish the intended destination from a nearby alternative. Uncertain evidence produces a request to rescan, not an arrival claim.

## Responsible use

Private destination links must expire and be revocable before sharing beyond supervised tests. No public directory of private destinations. No raw private imagery, credentials or model weights belong in this repository. Obtain permission before route capture and participant tests. Camera navigation is for stationary or walking use, never operation by someone driving.

No paid service is authorized. Provider credits, licenses and model access must be verified before use.
