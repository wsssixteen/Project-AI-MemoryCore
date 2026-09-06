goal_status: draft (derived from hook-header on 2026-09-06; promote with node lib/goal-backfill.js promote ba-understanding-table)
symptom: not recorded at birth (pre-Rule-13 feature)
goal: ba-understanding-table.discipline.hook.js — Stop hook (Power: ba-understanding-table) WHY (QA-267382, 2026-06-25 — みや directed): At quest intake I read the BA brief + 3 attachments, then OVERRODE the BA's
goal_signal: a fire on: its trigger
retention: rotate monthly
# Power: ba-understanding-table

**Fires:** Stop hook, on a quest-INTAKE turn (ticket id + brief/attachment signals).

**Contract:** at pre-Phase-0, the reply MUST contain a 2-column table —
`| BA said (verbatim, one row per attachment) | My pre-Phase-0 understanding |`.
If absent → ADVISORY nudge (flips to block after the ledger validates low false-positive).

**Why:** QA-267382 (2026-06-25). I read the BA brief + 3 attachments, then overrode the
BA's verbatim screenshot annotation (*"Tarik pelan yang salah — expected pelan public
upload"*) with my own inference (*"just resized"*) and stamped it VERIFIED. The table
forces the BA's literal words to be the written anchor before any analysis can drift.

**Pieces:**
- `ba-understanding-table.discipline.hook.js` — back gate (Stop; checks the table is present).
- Front gate — a line in `.claude/hooks/ticket-gate.js` Phase-0 injection announces the mandate.
- `log.jsonl` — one line per fire (per system-rules Rule 5).

**Bypass:** `[skip-ba-table: <reason>]`.

**Inventory note (system-rules Rule 1):** extends — does NOT duplicate — `multi-dim-evidence`
(judgment skill, reads dimensions), `annotations` (extracts), `quest-objective-anchor`
(injects symptom reminder, advisory). None forced a written BA-verbatim → understanding
table at intake; this does.

**Pairs with:** `veritas-claim-gate` CHECK 3 (conclusion backstop — catches a *later*
downgrade of the symptom). Intake-anchor + conclusion-backstop = the two ends of the same
slip class.
