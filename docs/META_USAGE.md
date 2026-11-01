# Meta model usage — WALK IT

Status checked 1 November 2026: **no saved successful model response**. The first human Baseten call returned HTTP 403. No SAM call, real paired ablation or meaningful-model-use pass is claimed. Promotional credits are human-reported active; billed usage is unknown, not zero.

| Component | Endpoint / requested model | Calling source | Current evidence | Intended decision effect |
|---|---|---|---|---|
| Muse Spark Open via Baseten | `https://inference.baseten.co/v1/chat/completions`, `meta-models/muse-spark-open` | `geometry/e05_model_smoke.py`; launcher `scripts/run-e05.ps1` | Human-reported 403; error-receipt support added; no successful output | Extract visible text/attributes for a candidate destination; never supply location or authorize arrows |
| Muse Spark via Meta API | Exact model/endpoint must be verified before adapter work | Not implemented | Not run | A proposed alternative only; ask before switching |
| SAM 3.1 via Meta API | Documented candidate: `https://api.meta.ai/v1/responses`, `sam-3.1`; reverify contract before implementation | Not implemented | Not run | Segment the Spark-supported concept, then test mask position against geometric destination and decoy evidence |

Official sources previously consulted: [Meta hosted-provider guide](https://dev.meta.ai/docs/muse-spark-open/deploy), [Baseten model page](https://www.baseten.co/library/muse-spark-open/), [Meta segmentation guide](https://dev.meta.ai/docs/media-segmentation). API aliases are not immutable weight revisions; retain the actual returned model identifier and document an undisclosed revision. See `docs/THIRD_PARTY.md` for separate model/API terms. No gated terms are accepted by this document.

## Receipts and totals

Private receipts belong in ignored `eval/sessions/`. Successful E05 receipts retain input/prompt/config hashes, provider response ID/model, structured output, duration and provider-reported usage. Error receipts are failures, not inference evidence. Preserve both; review dashboard usage separately.

- Saved successful receipts observed: **0**.
- Known attempted inference calls: **at least 1**, reported by the human; HTTP 403.
- Total tokens, image charges, credit consumption and paid spend: **unknown**.
- Paired held-out approaches evaluated: **0**; no accuracy percentage available.
- Public real output examples: **none yet**. Do not substitute a synthetic response without its label.

## Pipeline and ablation contract

Geometric arrival candidate → Spark visible evidence → validated short noun phrase → SAM mask → geometric position/decoy checks → repeated-observation fusion. Missing, contradictory or stale evidence yields refusal/abstention. The baseline uses the same geometry and inputs without model evidence. Both arms retain every declared attempt; neither a mask nor repeated plate text is destination identity.

Each eventual public example must retain the real crop, mask overlay, Spark/SAM model IDs, request/receipt references, exact structured outputs, ground-truth label, split, both verdicts and reasons, plus input/config hashes. Strip secrets/private identifiers and review publication consent. The static explorer at `/evidence.html` currently publishes zero cases; it is labelled **RECORDED REPLAY**, never live navigation. `docs/EVIDENCE_EXPLORER.md` defines its format. Completion of the page is not completion of the model pipeline.

Before submission, replace unknown totals only from verified receipts/billing; publish 10–20 reviewed examples and the full declared-denominator report; link an actual measured decision effect including no benefit if observed. Preserve "Built with Muse Spark Open" attribution when that model is actually integrated.
