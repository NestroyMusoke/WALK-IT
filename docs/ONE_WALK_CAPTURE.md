# One author walk: field capture for WALK IT

This is one continuous recording. The host records once and leaves with a private reviewed backup. A successful capture preserves the material needed for development; it does not prove that a new visitor can navigate yet.

## Choose the place before opening the camera

- Use a permitted, well-lit pedestrian path about 20–25 m long with one clear turn and one exact destination. Avoid stairs for the first live-route test.
- Start beside a distinctive fixed landmark such as a signpost. Keep a textured, fixed building surface behind or beside it in view. Avoid an isolated sign against sky, a blank wall, moving crowds, or a dark entrance.
- Pick a destination with a visible fixed label or distinctive doorway. Know exactly where the walk ends.
- If route length matters, measure it with a tape or a cord whose length you have checked. A nominal 1.992 m cord can be constructed from six 297 mm A4 long edges plus one 210 mm short edge; record gaps and placement uncertainty. Without a measurement, route length and metre-error gates stay unknown.

## Record once in the WALK IT camera page

1. Hold the iPhone upright at chest height with the rear camera pointed toward the start landmark and its fixed background. Use portrait orientation throughout.
2. Start the author recording. For its first **ten saved images** (about ten seconds), stay at the start. Move slowly sideways about half a metre while keeping the landmark and background visible. Make a gentle left-right pan, then return to the forward view. Do not rotate toward a blank wall or walk down the route yet. Sideways movement supplies depth; varied views give the next visitor more appearance coverage.
3. Walk the route slowly, pointing ahead. Keep the corner in view before and after the turn. Avoid abrupt phone spins and long views of blank ground or sky.
4. At the exact destination, hold still for several seconds and capture the label/door together with its fixed surroundings. Then tap **Mark destination**. Keep the entire recording within the configured 60 saved-image limit.
5. Review every saved image. Mask faces, plates and private details before approving. Tap **Download backup and save to laptop**. Keep the private backup even if upload fails.

## Before leaving

- Confirm the backup download exists and transfer it to the laptop. Run `\.venv\Scripts\python.exe geometry\author_preflight.py "C:\path\to\walkit-reviewed-route-backup.json"` from the WALK-IT folder. This builds a private map and reports structural intake without requiring a server upload. Stay at the location until the command finishes and the first ten images, turn and final destination have been visually checked. A server receipt is helpful but the local backup is the recovery path.
- Note the physical start, turn and end marks, approximate lighting, phone model, and how route length was measured. Do not publish the images or commit the backup.
- This is a data-quality check, not a promise that localization passes. The visitor test remains separate and must show live camera arrows, wrong-start refusal and a measured end error before those claims are made.

The previous `CAPTURE_PROTOCOL.md` two-author-walk evaluation is superseded for the host product flow by this one-recording protocol. Repeated author walks were development experiments, not a requirement for each user.
