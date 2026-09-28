# fix-photo

symptom: 2026-09-28 #256334 miya: 'include the fix photo with red box you add into fix folder ... a step/behaviour you always do when talking about the UI, especially since BA have already provided the photos'
goal: every UI-changing quest hand-back ships a red-box fix photo per changed screen in the cycle 2. Fix folder, so miya can upload it to Redmine without asking
goal_signal: the hand-back reply carries one FIX-PHOTO: <path> line per changed screen and each path exists on disk
goal_signal_regex: FIX-PHOTO:\s*`?[A-Za-z]:[\\/].*[\\/]2\. Fix[\\/].+\.(png|jpe?g)
retention: rotate monthly

**What fires when**: Stop. The CURRENT reply is an etanah hand-back (`▶ YOUR MOVE` · `Test Scenario` · `DEPLOY —` card · `Redmine` note) that describes a UI change (medan/field · butang/button · dropdown · checkbox · Agihan Kepada · panel · popup · papar/hilang/dibuang), BA screenshots were seen this session (a pasted image, or a `Read` of an image under `0. Brief`), and no VALID `FIX-PHOTO:` line exists in any reply this session.

**Contract**: BLOCK until each changed screen has a red-box photo made with `mark.py` in the cycle's `2. Fix` folder and a `FIX-PHOTO: <full path> ✓` line is in the reply. VALID = full path · `.png`/`.jpg` · inside a `2. Fix` folder · exists on disk. Bypass `[skip-fix-photo: <real reason>]` in the current reply (a `<reason>` placeholder never counts, so the block text quoted back cannot disarm it).

## Pieces

| Piece | Role |
|---|---|
| `mark.py` | Draws red boxes + white-backed red labels on BA's screenshot, saves PNG. Clamps boxes / shifts labels into the image (WARN), warns on a non-`2. Fix` folder, an off-pattern name, or a date/email in a label; exit 2 on bad input with nothing saved. Prints the `FIX-PHOTO:` line to paste. |
| `fix-photo.check.hook.js` | Stop gate above. Reads the last 20 MB of the transcript. |
| `fix-photo.eval.js` | 42 fixtures: 24 hook (H01-H24) + 17 mark.py (M01-M17) + 1 end-to-end (E01). 42/42 green 2026-09-28; live replay on the real #256334 session transcript blocked without a photo line and passed with one. |
| `log.jsonl` | one row per `mark.py` run: ts · dst · boxes · labels · warns · outcome (`saved`/`error`) · dur_ms. Eval runs log to a temp file (`FIX_PHOTO_LOG`). Hook fires log to `system/telemetry/hook-fires.jsonl`. |

**Layer choice (Rule 7)**: hook + script, plus the quest SKILL.md pre-emit gate row. The rule alone (skill text) already missed once on 2026-09-28; a Stop advisory is never shown to the model, so the visible form is a block.

**Trigger moment (Rule 8)**: Stop on a hand-back only. Three narrowing conditions (hand-back marker AND UI-change words AND etanah terms) plus BA-image evidence keep it off ordinary UI talk and off MemoryCore UI work.

**state-scoped**: no, state-agnostic (etanah terms include PTMLK and PTPRK; paths come from the reply).

## Adversarial scenarios (system-design Rule 12)

| # | Scenario | Verdict |
|---|---|---|
| 1 | empty / malformed stdin | fixture H01 H02 |
| 2 | transcript path missing | fixture H03 |
| 3 | replay: UI hand-back, BA screenshot, no photo line | fixture H04 (block) |
| 4 | valid photo line | fixture H05 |
| 5 | photo line to a missing file | fixture H06 |
| 6 | photo saved outside a `2. Fix` folder | fixture H07 |
| 7 | relative photo path | fixture H08 |
| 8 | real bypass reason | fixture H09 |
| 9 | self-disarm: block text quoted back with `<reason>` | fixture H10 |
| 10 | empty bypass reason | fixture H11 |
| 11 | no BA screenshot this session | fixture H12 |
| 12 | image arrives as an image block, not a text marker | fixture H13 |
| 13 | BA screenshot only read from `0. Brief` | fixture H14 |
| 14 | Read of my own fix photo is not BA evidence | fixture H15 |
| 15 | UI explanation that is not a hand-back | fixture H16 |
| 16 | hand-back with no UI change | fixture H17 |
| 17 | MemoryCore (non-etanah) UI hand-back | fixture H18 |
| 18 | photo made in an earlier reply, deploy card later | fixture H19 |
| 19 | short reply | fixture H20 |
| 20 | malformed transcript lines | fixture H21 |
| 21 | large transcript | fixture H22 (20 MB tail cap) |
| 22 | path in backticks | fixture H23 |
| 23 | Redmine note describing a UI change | fixture H24 |
| 24 | several screens changed, only one photo line | accepted-risk: the reply cannot be mapped to a screen count reliably; one valid photo satisfies the gate |
| 25 | Stop re-fires until satisfied (loop) | accepted-risk: every block names the exact fix and the bypass; no state to go stale |
| 26 | BA words quoted with `medan` on a data-only fix | accepted-risk: a photo still helps Redmine; bypass with the reason when not |
| 27 | mark.py bad inputs (missing src, missing folder, non-png, bad box, bad label, not an image) | fixtures M03 M04 M05 M07 M13 M14 M15 |
| 28 | box / label outside the image | fixtures M06 M08 |
| 29 | wrong folder, wrong name, date/email in label | fixtures M09 M10 M11 |
| 30 | re-run overwrites (idempotent) · webp source · logging | fixtures M12 M16 M17 |
| 31 | the line mark.py prints satisfies the gate end to end | fixture E01 |
