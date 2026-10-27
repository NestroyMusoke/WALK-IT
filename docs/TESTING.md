# Guided tests

## Available now: synthetic display test

The laptop server is started with `npm run dev` from the repository. Open http://127.0.0.1:5173/ on the laptop. This address is not reachable from an iPhone as-is.

1. Press **Start guided display test** once.
2. Keep the page open while all eight cases run. No camera permission or walking is needed.
3. Wait for **Saved on laptop**. PASS or FAIL is the test result; Saved confirms receipt, not a pass.
4. If it says **NOT SAVED**, keep the page open and select **Retry sending**. Download result is an additional backup.

The assistant already ran this test on 27 October: 8/8 passed. The user does not need to repeat it unless requested on another browser/device.

## Automatic results

Reports are saved under `eval/sessions/` (ignored by Git). Started but unfinished sessions stay distinguishable from received reports. The receiver accepts synthetic numerical display reports only, not arbitrary files, imagery, audio or location. It does not yet receive live tracking journals.

The server must stay running and the laptop awake. Browser storage failure, server restart or a lost connection is reported; no promise of lossless capture across crashes. The assistant can read saved reports during an active chat turn without asking for attachments. No background assistant monitoring is configured.

## Next: live iPhone test

The E03-1 live diagnostic is now available; use the current phone link and instructions below. Physical stability remains unverified until the phone test. Do not use older diagnostic links.

## Live phone test E03-1 — now available

Use the complete temporary HTTPS link provided in chat (also in ignored tmp/phone-link.txt). Open in iPhone Safari, not a social-app browser. Keep the laptop awake with the test server and tunnel running.

1. Wait for Ready; first engine download can take up to 90 seconds. Tap Start camera test and Allow camera.
2. In a well-lit, permitted area, slowly scan a textured floor. Aim the white centre crosshair at a tile corner or mark and tap Place reference. The magenta cross is the tracked reference.
3. Hold still about 10 seconds. Tap Next step.
4. Move sideways about half a metre and return while keeping the mark visible. Tap Next step.
5. Stand still, cover the rear camera for two seconds, then uncover. Tracking loss must hide the reference; re-place after recovery if desired. Tap Next step and select what you observed.
6. Keep the page open until Saved on laptop and Test finished appear. Upload failures retry; Download backup is available. You can stop early with Finish and send logs.

Numeric batches are written automatically to eval/sessions/*-live-*.json. No image, audio or GPS collection in this diagnostic. Server-received logs do not independently establish visual accuracy; the observation answer is part of the evidence. A missing end event means the run is incomplete. The assistant can inspect logs during an active turn; this is not an always-running assistant service.

Developer restart: npm run build; node server/phone-server.ts; cloudflared tunnel --url http://127.0.0.1:5180 --no-autoupdate --protocol http2. Restarting the server changes its access key; regenerate the full link using tmp/phone-access.json rather than reusing an old key. Never commit the private link, access key or live logs.
