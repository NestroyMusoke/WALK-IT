# E05: reviewed destination image smoke

Status: runner and guard tests prepared; **real model output and E05 pass still pending**.

Decision branch: a Meta vision model extracts exact visible destination text and distinctive appearance cues from a reviewed destination image. E13 must later show that these cues change a right-versus-decoy destination decision on paired approaches. A text description alone never confirms arrival or enables AR arrows.

The first option, SAM 3.1 local weights, needs human approval of gated access and a free CUDA runtime, neither verified here. The user reports active Baseten credit and an available key, so the second option is prepared. The user chose Meta Model API SAM 3.1 as a later fallback; that path has not been called. Meta API has per-image pricing, so do not call it until its credit and cost path are checked. See `docs/THIRD_PARTY.md` for model and provider terms.

## Run one image safely on Windows

1. Open the Baseten dashboard and note the current promotional credit balance. Confirm the model is available in the account. Keep the key private.
2. Choose **one** image of the permitted destination. Mask every face, vehicle plate, and private detail manually; inspect the saved image. Save it as `eval/sessions/e05-destination.png` in this repo. `eval/sessions/` is ignored by Git. The runner strips image metadata by decoding and re-encoding the pixels, but it does not detect or mask faces.
3. In PowerShell at the repo root run `powershell -ExecutionPolicy Bypass -File .\scripts\run-e05.ps1`. When prompted, paste the Baseten key. Input is hidden and is held only for that process; it is not printed or written to Git. Do not paste it in chat, source, screenshots or command arguments.
4. On success, the command prints the private `eval/sessions/e05-muse-*.json` receipt path. It contains the input, prompt and config hashes, API response ID/model, structured image evidence, token usage and request latency. It is **not** a localization accuracy result or a zero-cost proof.
5. Recheck Baseten promotional balance and billed usage. Record the before/after amounts and request receipt privately. Share only the receipt path and redacted balances; no image or key in chat. If the provider does not expose a backend revision, record `unreported_by_provider` and keep that gate open. Do not rerun repeatedly to chase a desirable answer.

E05 passes only after an actual permitted image run, reviewed terms/revision evidence and a verified zero additional charge. The planned E13 paired ablation must establish the model's practical effect. The human remains responsible for any model access acceptance and the field input.

## 30 October: first provider refusal

The human ran the reviewed-image launcher and reported **HTTP 403** from Baseten. No model response or usage receipt was produced, so E05 stays open. Baseten's [authentication change notice](https://www.baseten.co/resources/changelog/upcoming-change-to-api-authentication-error-responses/) says 403 now indicates valid credentials with insufficient permissions, while missing/invalid/expired credentials return 401; the rollout may vary. The exact reason for this request is **unconfirmed**. The first runner omitted Baseten's error body, so a diagnostic update now stores a bounded redacted JSON error summary at `eval/sessions/e05-baseten-error-*.json` on a future failure. One retry with the same image and local key is enough to collect it. Do not repeatedly retry or change models based solely on HTTP status.

Second-attempt evidence (1 November): the saved private JSON receipt asks to check the supplied API key. Verify the actual secret value belongs to the active Baseten account and has inference access; do not paste a key ID, Meta key, Bearer prefix or surrounding quotes into the launcher. The earlier permissions-only reading of HTTP 403 is not established. No provider fallback has been taken.

## Sponsor key correction — 1 November
The user supplied Baseten's hackathon email: the separately issued key is restricted to exactly meta-models/muse-spark-open-1026. The earlier runner incorrectly used the public alias meta-models/muse-spark-open. Corrected the alias after a regression test failed on that mismatch. Use the sponsor-issued key already saved locally; a newly created personal key is not a substitute for this grant. Do not reopen or publish the single-use secret link. The email promises $100 credit, but remaining credit and charges are still unverified; a personal dashboard showing $0 does not establish the sponsor key's billing balance. No successful rerun yet, so the mismatch is established but resolution of the 403 is not.

## 1 November: final-content troubleshooting
The sponsor-scoped call reached Baseten but returned null final content. [Baseten reasoning docs](https://docs.baseten.co/inference/model-apis/reasoning) state Muse Spark Open always reasons and `max_tokens` includes reasoning tokens. The old 512-token limit may have been insufficient; exact finish reason and usage were not saved. The runner now requests low reasoning with a 2048-token cap, saves the full provider response privately before parsing, and refuses incomplete or malformed output. The next run will retain real response metadata for diagnosis. A successful HTTP response is not yet an E05 pass; inspect the resulting usage and actual evidence. Do not commit the raw response.

## E05 Spark receipt verified — 1 November 2026

One real sponsor-scoped Baseten call returned final structured JSON: requested and returned model `meta-models/muse-spark-open-1026`, finish reason `stop`, latency 24.875 seconds, 1,204 prompt tokens and 416 completion tokens (1,620 total reported). Private receipts: `eval/sessions/e05-muse-1793520831.json` and `eval/sessions/e05-muse-response-1793520831731796500.json`. Offline reparsing reproduces the saved evidence and its config SHA matches the current configuration. No additional API call was made for verification.

The model reported text D10 and D9 and appearance cues, with `usable_as_destination_evidence=false` and `navigationReady=false`. These are model observations, not independently scored OCR accuracy or destination confirmation. One call is not a latency benchmark. Spark transport/structured-output smoke passes; full E05 stays OPEN: SAM real response, terms review, backend revision disclosure and sponsor billing/zero-additional-charge evidence remain unverified. Do not infer remaining credits from token usage or personal dashboard balance.

Next: complete E05's separately tested SAM adapter/access check, then the declared field session. Keep all receipts/media private; no public explorer cases added and no commits made. Human supplies credentials only locally; no provider fallback is taken.
