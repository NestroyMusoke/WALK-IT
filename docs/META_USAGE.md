# Meta model usage — WALK IT

E13b-3 update (1 November): `geometry/receipt_pair.py` binds model outputs, input-image SHA, active config SHA and route geometry to the verifier. The two prior real access-smoke receipts share image bytes but have **different config SHAs** and therefore abstain as a pair; Spark also reported the image unusable as destination evidence. This is correct provenance behavior, not a paired ablation or an arrival result. No new API call was made.

E13b-2 update (1 November): `geometry/sam_mask.py` now uses Meta's [official Python parser](https://dev.meta.ai/docs/sam/client-libraries) to decode real SAM mask pixels. The saved private SAM response parsed into two masks with zero parser diagnostics. The checked pixels were arbitrary diagnostics, not projected route locations. Real Spark/SAM/geometry fusion and paired outcome counts remain absent.

E13b-1 update (1 November): `geometry/destination_verifier.py` now defines a synthetic-tested decision contract for matching Spark, SAM and geometric evidence. This is **not** a real paired pipeline yet: live geometric projections and receipt binding are absent, and no field confirmation or ablation has run. It makes no additional API call. The verifier's positive result is only meaningful after those adapters and independent visitor tests are connected.

Status checked 1 November 2026: real Spark and SAM still-image calls are saved privately and described below. No real paired ablation or meaningful-model-use pass is claimed. Promotional credits are human-reported active; billed usage is unknown, not zero.

| Component | Endpoint / requested model | Calling source | Current evidence | Intended decision effect |
|---|---|---|---|---|
| Muse Spark Open via Baseten | `https://inference.baseten.co/v1/chat/completions`, `meta-models/muse-spark-open-1026` | `geometry/e05_model_smoke.py`; launcher `scripts/run-e05.ps1` | One real structured response on reviewed image; 1,620 provider-reported tokens, 24.875 s. Earlier failed calls retained privately. | Extract visible text/attributes for a candidate destination; never supply location or authorize arrows |
| Muse Spark via Meta API | Exact model/endpoint must be verified before adapter work | Not implemented | Not run | A proposed alternative only; ask before switching |
| SAM 3.1 via Meta API | `https://api.meta.ai/v1/responses`, `sam-3.1` | `geometry/e05_sam_smoke.py`; launcher `scripts/run-e05-sam.ps1` | One real reviewed-image response: 1 image, 2 box/mask records, 26.531 s; geometry/identity unchecked. | Segment the Spark-supported concept, then test mask position against geometric destination and decoy evidence |

Official sources previously consulted: [Meta hosted-provider guide](https://dev.meta.ai/docs/muse-spark-open/deploy), [Baseten model page](https://www.baseten.co/library/muse-spark-open/), [Meta segmentation guide](https://dev.meta.ai/docs/media-segmentation). API aliases are not immutable weight revisions; retain the actual returned model identifier and document an undisclosed revision. See `docs/THIRD_PARTY.md` for separate model/API terms. No gated terms are accepted by this document.

## Receipts and totals

Private receipts belong in ignored `eval/sessions/`. Successful E05 receipts retain input/prompt/config hashes, provider response ID/model, structured output, duration and provider-reported usage. Error receipts are failures, not inference evidence. Preserve both; review dashboard usage separately.

- Saved successful receipts observed: **0**.
- Known attempted inference calls: **at least 3**, reported by the human: two HTTP 403s on the public alias, then one sponsor-model call with null final content. Its HTTP response was not saved by the old runner, so finish reason and usage are unknown.
- Total tokens, image charges, credit consumption and paid spend: **unknown**.
- Paired held-out approaches evaluated: **0**; no accuracy percentage available.
- Public real output examples: **none yet**. Do not substitute a synthetic response without its label.

## Pipeline and ablation contract

Geometric arrival candidate → Spark visible evidence → validated short noun phrase → SAM mask → geometric position/decoy checks → repeated-observation fusion. Missing, contradictory or stale evidence yields refusal/abstention. The baseline uses the same geometry and inputs without model evidence. Both arms retain every declared attempt; neither a mask nor repeated plate text is destination identity.

Each eventual public example must retain the real crop, mask overlay, Spark/SAM model IDs, request/receipt references, exact structured outputs, ground-truth label, split, both verdicts and reasons, plus input/config hashes. Strip secrets/private identifiers and review publication consent. The static explorer at `/evidence.html` currently publishes zero cases; it is labelled **RECORDED REPLAY**, never live navigation. `docs/EVIDENCE_EXPLORER.md` defines its format. Completion of the page is not completion of the model pipeline.

Before submission, replace unknown totals only from verified receipts/billing; publish 10–20 reviewed examples and the full declared-denominator report; link an actual measured decision effect including no benefit if observed. Preserve "Built with Muse Spark Open" attribution when that model is actually integrated.

1 November: sponsor-scoped call returned HTTP success but final content was null; runner now logs raw provider response privately before parsing and requests low reasoning with 2048 completion tokens. Exact prior token usage unknown; E05 still pending real structured output and billing evidence. No commit until human smoke passes.

## E05 Spark receipt verified — 1 November 2026

One real sponsor-scoped Baseten call returned final structured JSON: requested and returned model `meta-models/muse-spark-open-1026`, finish reason `stop`, latency 24.875 seconds, 1,204 prompt tokens and 416 completion tokens (1,620 total reported). Private receipts: `eval/sessions/e05-muse-1793520831.json` and `eval/sessions/e05-muse-response-1793520831731796500.json`. Offline reparsing reproduces the saved evidence and its config SHA matches the current configuration. No additional API call was made for verification.

The model reported text D10 and D9 and appearance cues, with `usable_as_destination_evidence=false` and `navigationReady=false`. These are model observations, not independently scored OCR accuracy or destination confirmation. One call is not a latency benchmark. Spark transport/structured-output smoke passes; full E05 stays OPEN: SAM real response, terms review, backend revision disclosure and sponsor billing/zero-additional-charge evidence remain unverified. Do not infer remaining credits from token usage or personal dashboard balance.

Next: complete E05's separately tested SAM adapter/access check, then the declared field session. Keep all receipts/media private; no public explorer cases added and no commits made. Human supplies credentials only locally; no provider fallback is taken.

## 1 November — E05 SAM access runner prepared

Acceptance tests first failed on missing adapter, then passed (4 tests). The adapter uses Meta's documented `POST https://api.meta.ai/v1/responses` with model `sam-3.1`, one reviewed/re-encoded PNG, and the `wooden door` noun phrase supported by the saved Spark observation. It stores the complete streamed response privately before parsing, accepts only a `response.completed` event with the expected model, and treats zero matches as a valid abstention. No mask geometry, destination identity or live guidance is asserted. No network call was made by the agent. Exact backend revision, credit usage and actual SAM response are still pending. Python standard HTTP library adds no dependency. Sources: https://dev.meta.ai/docs/media-segmentation and https://dev.meta.ai/docs/sam/reading-segmentation and https://dev.meta.ai/docs/pricing-rate-limits . One still image is listed at $2.50 per 1000 images before promotional credits; check the Meta dashboard before/after the single human call.

Human smoke command: `powershell -ExecutionPolicy Bypass -File .\scripts\run-e05-sam.ps1` from repo root. It prompts for MODEL_API_KEY hidden and clears the process environment afterward. The existing private `eval/sessions/e05-destination.png` is used. Never paste the key or raw receipt in chat or Git. E05 remains open until the real call and billing/terms review.

## 1 November — E05 SAM real call verified

The human ran the prepared Meta Model API still-image call. Private receipt `eval/sessions/e05-sam-1793536897662857200.json` and raw stream exist and are Git-ignored. Provider reported `sam-3.1`, response ID `resp_6ae73375b514ce25528c4343`, `images_processed=1`, 26.531 s client latency, and no backend revision. Its reviewed image SHA `de14ebd20f6ef1ba681be524002a732bd159218997f77bff295a41d3022b6c10` matches the earlier Spark input. Offline reparse matched the saved response and current config SHA. The output contains one image frame, two box-and-mask records; bounded boxes are object 0 [87,286,156,935] and object 1 [221,350,466,850] in a 768x1024 image. These are provider predictions, not independently labeled segmentation accuracy or destination identity. New first-failing then passing test validates paired masks and bounded boxes; actual response parsed without another call.

E05 technical access now demonstrated for both Meta models. Full E05 remains OPEN because actual credit debit/zero additional charge, provider backend revisions and terms review are unverified. No navigation, paired ablation or public evidence case passed. Proceed to the approved E08b field collection while the account checks are resolved; this is the next card in the declared path, not a fallback.
