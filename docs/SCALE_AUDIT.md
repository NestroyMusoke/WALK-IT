# Tracker scale audit, 2 November 2026

This is a read-only analysis of the two saved author walks and three same-endpoint short runs. The script is `geometry/scale_audit.py`; private input and full numeric time series remain in `eval/sessions/scale-audit/`. The analysis config SHA256 is `84f0d4e4918307d4c8de78e60e09c198da624e818082af8d817697dfc24020ea`. The capture's own configuration SHA is retained separately in each private result. Keyframe positions are tracker units, not metres.

| Split | Frames | Time (s) | Summed 3D steps (tracker units) | First y | Last y | y range | Median steps by temporal thirds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Author 1, map development | 51 | 50.541 | 22.2608 | 1.381 | 1.282 | 1.184 to 1.573 | 0.7104, 0.6222, 0.2000 |
| Author 2, validation | 50 | 49.754 | 5.6422 | 0.431 | 0.508 | 0.415 to 0.510 | 0.0675, 0.0763, 0.2340 |
| Short 1, scale screen | 20 | 19.274 | 4.4359 | 0.612 | 0.561 | 0.554 to 0.612 | 0.2816, 0.3244, 0.1375 |
| Short 2, scale screen | 17 | 16.267 | 1.6183 | 0.249 | 0.240 | 0.225 to 0.266 | 0.1131, 0.1375, 0.0776 |
| Short 3, scale screen | 17 | 16.305 | 6.5292 | 0.977 | 0.883 | 0.873 to 0.977 | 0.5251, 0.5734, 0.2489 |

The two author paths differ by 3.95 times in tracker length over similar recording times. The three short paths span 4.03 times. This confirms session-to-session scale inconsistency in the saved tracker traces. The short-run distance was approximately 10 m by the iPhone Measure app; its uncertainty was not recorded. The author walk length was estimated by 110 heel-to-toe placements with shoe length unmeasured, so neither supplies a precise metric ratio.

**Within-run classification:** indeterminate. Step lengths change across each run, but each sample is about one second apart and includes walking speed, pauses, turns and tracker motion. No time-stamped physical distance marks or independent metric camera poses exist in these five files. A constant per-session scale, a step change, and gradual drift cannot be distinguished reliably from these plots. The first y values range from 0.249 to 1.381 tracker units, but camera height in metres was not measured and tracker units are nonmetric. This does not prove any physical camera height or a specific initialization failure.

The plots in the private audit directory are `stepTrackerUnits.svg` and `positionYTrackerUnits.svg`. The next instrumented capture logs exact SDK configuration/projection calls, world-point depth summaries, motion samples, sway interval and taps at measured floor marks. A marked 0, 2, 4, 6, 8, 10 m walk can discriminate a linear per-session slope from a kink or gradual change, subject to mark and tap uncertainty. No arrow or metric claim follows from this audit.
