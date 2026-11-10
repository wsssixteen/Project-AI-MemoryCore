# fix-photo

symptom: 2026-09-28 #256334 miya: 'include the fix photo with red box you add into fix folder ... a step/behaviour you always do when talking about the UI, especially since BA have already provided the photos'
goal: a red-box fix photo per changed screen is made in one command (`mark.py`) and saved in the cycle's `2. Fix` folder, so miya can upload it to Redmine without asking
diagram: domain/fix-photo/diagram.png (shows the Stop gate that was retired 2026-11-10)
goal_signal: `mark.py` prints one `FIX-PHOTO: <path>` line per photo and the path exists on disk
retention: rotate monthly

**Retired 2026-11-10: the Stop gate `fix-photo.check.hook.js`.** From telemetry 2026-07-12 to 2026-11-10 it ran 18,563 times: 261 blocks and 186 bypasses (42% of its decisions were the bypass token, 40 sessions). The ask rule stays where it lives: the quest SKILL.md pre-emit row for the UI fix photo, and the memory rule that a fix photo is made only when miya asks. The red-box tool stays.

## Pieces

| Piece | Role |
|---|---|
| `mark.py` | Draws red boxes + white-backed red labels on BA's screenshot, saves PNG. Clamps boxes / shifts labels into the image (WARN), warns on a non-`2. Fix` folder, an off-pattern name, or a date/email in a label; exit 2 on bad input with nothing saved. Refuses boxes that overlap or sit inside each other (`--merge` draws the union). Prints the `FIX-PHOTO:` line to paste. |
| `fix-photo.eval.js` | 17 mark.py fixtures (M01-M17). |
| `log.jsonl` | one row per `mark.py` run: ts · dst · boxes · labels · warns · outcome (`saved`/`error`) · dur_ms. Eval runs log to a temp file (`FIX_PHOTO_LOG`). |

**state-scoped**: no, state-agnostic (paths come from the arguments).

## Rules kept from earlier versions

- A fix photo is a real after-fix screen (a frame of his test video or a screenshot he gave), never BA's before-screenshot with a box drawn on it (v2, #282924).
- One box per change the note or ticket names. Never box an unchanged field and never box an empty spot where something was removed (2026-10-22, #285768).
- Boxes are big or specific, never nested or overlapping (v5, 2026-11-05).
