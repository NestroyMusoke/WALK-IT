# CAPTURE_PROTOCOL.md: one field session that settles E04, E07c and E08

Goal: collect data good enough to answer, with evidence, "does fresh-session localization work?" Do not collect more than this protocol asks. Every item below exists because the previous author recording had **too little baseline, weak destination coverage, and an unverified tracker scale** (see TASKS.md E09b, E10b, E11a, E11b).

Labels: all thresholds are **targets** until measured. Keep raw logs private (never in Git).

## 0. Before leaving the desk (10 min)
- Phone charged above 80%, power bank packed, Do Not Disturb on, camera lens wiped, screen-lock disabled, auto-brightness off.
- Build running from the exact commit under test; write the commit hash and config hash in the session sheet.
- Written permission for the route (capture and, separately, publication) confirmed. No capture where people's faces dominate; pause when someone walks through.
- Safety: walk only; never record while driving; stop at stairs and doors.
- Session sheet (paper or notes app): date, time, light (daylight / corridor lamps / evening), phone model, build hash, operator.

## 1. Tracker scale and loop check (E04, about 15 min)
1. Tape **10 m** on the floor in a straight line (two marks, tape measure, note tape accuracy, about 1 cm).
2. Rigid reference: stand 1 m from a textured stationary surface. Place one marker on a coin or sticker. Move sideways 0.5 m, return, repeat 3 times. Note by eye whether the marker stays on the coin.
3. Walk the 10 m line three times at 0.6 to 0.8 m/s, camera forward, chest height, tilted slightly down. Record start/end tracker positions.
4. Walk a 30 m loop back to the start mark (or the longest loop available). Record return offset by tape.
5. Cover the lens for 3 s, 5 times, while standing; note recovery.

Hand back: raw diagnostic exports and the session sheet. Codex computes tracker path length vs tape, return offset, loss fraction (`tools/analyze_diagnostic.py`).

## 2. Author walks (E08 author part, about 20 min)
Walk the permitted route twice, at different times if possible (first in even light, second a few hours later or under different lighting).
- Speed 0.6 to 0.8 m/s; no running, no fast turns. Keep the camera forward and slightly down; avoid pointing at blank walls for long.
- **Start (landmark):** stand 5 s, then sway sideways about 0.3 m left and right, slowly. Rotation alone gives no baseline.
- **Turn:** slow down; keep the corner in view before and after.
- **Approach to destination:** begin from about 3 m away, keep the destination in view, hold 5 s, sway about 0.3 m.
- **Destination capture:** three frames: close-up of the plate/label, 1 m back, hall view showing neighbours. Tap the destination marker once.
- Include one **nearby similar alternative** in the shot sequence when approaching (it must be visible from the approach).
- Do not shake the phone. If you stumble, stop and restart the walk (a restart is cheaper than bad data).

## 3. Visitor session (E08 visitor part, different person if possible)
- A person who has not walked the route opens the link on the same phone first (fresh session, app fully closed and reopened), then a different phone if available.
- Start at the landmark; scan 3 to 5 s with a small sideways sway. Do NOT help or point.
- Follow the guidance; record screen plus a second phone filming the walker from behind if possible.
- Run these approach cases, **n declared before starting** (example: 5 each): correct destination; the similar alternative; approach from the wrong direction; scan from a slightly wrong start spot (about 2 m off).
- Log every outcome (arrived / refused / unsure / lost) with timestamps. Do not discard failures.

## 4. Ground truth (record uncertainty, do not assume it)
- Floor marks (tape or tile grid) every about 5 m along the route; note tolerance (for example plus/minus 5 cm tape, or tile width).
- Destination position measured from the start mark (tape, two measurements averaged).
- Which door is correct, which is the decoy: written on the sheet before the run.

## 5. Splits (never mix)
- **Capture/tuning:** author walk 1.
- **Validation:** author walk 2 (different time).
- **Held-out:** visitor sessions. No threshold tuning against held-out data.

## 6. After the session (30 min)
- Export logs; copy to the private `eval/sessions/` folder (not committed). Record sizes and hashes in the session sheet.
- Delete any frame with a recognizable face before further use; review before any image leaves the laptop.
- Tell Codex: session sheet contents, anything unusual (lighting change, people, tracking loss moments by clock time).
