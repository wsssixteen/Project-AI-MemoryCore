goal: every system change is shown to miya as the same five one-sentence lines (What · Why · How · When · Where) before his nod and after it lands
goal_signal: the step 3 and step 8 replies of a system change each carry a card that printed CHANGE-CARD: PASS
goal_signal_regex: CHANGE-CARD: PASS
retention: keep; log.jsonl rotate monthly
footprint: on-demand: 1 node process per check, reads one text, under 0.1 s; twice per system change; nothing running otherwise
boundary: covers one card text (the last CHANGE-CARD block of a stage in main/current-session.md, or any file), prints PASS or FAIL with reasons · never edits a file, never draws a picture · stops at the verdict line (report only)
self_audit: each run re-reads the card it was given and checks all five lines, one sentence each, the How and Where pictures and the closing name line against the goal; it exits 1 with the line to fix, logs ts, stage, pass and reasons to log.jsonl, and the skill re-runs it after the fix
diagram: domain/change-card/diagram.png (checked by node lib/diagram-census.js --check domain/change-card)
state-scoped: no, state-agnostic
symptom: 2026-11-05 miya: "Answer in single sentence each: What, Why, How, When, Where. How using diagram flow. Where using the boxed diagram (please remind me at the end what's the name) ... a very easy thing to review, before and after."

# change-card

**Born** 2026-11-05. **Kind** Feature (a skill + its checker). "system-upgrade" in his words is read as the change route (`/system-change`); not confirmed by him.

## What it is

A review card for any system change, shown twice: at change route step 3 (BEFORE, the card he nods on) and step 8 (AFTER, as built). Five lines, one sentence each. How reuses the step 2 flow picture. Where is the change map (`lib/change-map.js`), the system map's own boxes with each part tagged; the same spec JSON is rendered at step 3 (planned) and step 8 (built). The card ends with `Where picture = the change map (lib/change-map.js).`

## Parts

| File | Job |
|---|---|
| `.claude/skills/change-card/SKILL.md` | the card rules and the two moments |
| `domain/change-card/change-card.js` | checker: `node domain/change-card/change-card.js <file> [--stage before\|after]` → `CHANGE-CARD: PASS` or `FAIL <reasons>`; on a session file it checks the last block of that stage |
| `domain/change-card/eval.js` | 12 fixtures: good card, table form, session file, each failure kind |
| `diagram.html` / `.png` | the change route with the two card moments marked |
| `log.jsonl` | one row per check |

## Wiring

`system/INDEX.md` §The change route: row 3 (Check + nod) and row 8 (Report) name the card. No hook.

**Enforcement not built (on record)**: the step-3 rider `domain/design-consult-gate/step3-check.js` already reads the STEP-3 block; it could refuse a build that has no `CHANGE-CARD (before)` block. Built only on slip evidence (system-rules: no new gate without a slip).

## Design check

Step 3 by `claude-fable-5-1` (A/S/C), verdict "build with changes": How reuses the step 2 picture, one spec JSON for both maps, the card lives in `main/current-session.md`, sentence count ignores dots in file names, When = the trigger, part diagrams added, enforcement named here.
