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
