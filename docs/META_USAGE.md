# Meta model usage — WALK IT

Status checked 1 November 2026: **no saved successful model response**. Two calls with the public alias returned HTTP 403; one corrected sponsor-model call reached the parser with null final content. No SAM call, real paired ablation or meaningful-model-use pass is claimed. Promotional credits are human-reported active; billed usage is unknown, not zero.

| Component | Endpoint / requested model | Calling source | Current evidence | Intended decision effect |
|---|---|---|---|---|
| Muse Spark Open via Baseten | `https://inference.baseten.co/v1/chat/completions`, `meta-models/muse-spark-open-1026` | `geometry/e05_model_smoke.py`; launcher `scripts/run-e05.ps1` | Two HTTP 403s on public alias; sponsor-model request had null final content; no structured output | Extract visible text/attributes for a candidate destination; never supply location or authorize arrows |
| Muse Spark via Meta API | Exact model/endpoint must be verified before adapter work | Not implemented | Not run | A proposed alternative only; ask before switching |
| SAM 3.1 via Meta API | Documented candidate: `https://api.meta.ai/v1/responses`, `sam-3.1`; reverify contract before implementation | Not implemented | Not run | Segment the Spark-supported concept, then test mask position against geometric destination and decoy evidence |

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
