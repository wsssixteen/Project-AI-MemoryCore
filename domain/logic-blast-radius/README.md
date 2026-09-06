goal_status: draft (derived from nuke-marker+header on 2026-09-06; promote with node lib/goal-backfill.js promote logic-blast-radius)
symptom: Familiar-built batch (commit `2750811`). Root symptom: みや 2026-07-07 — *"checks must ALWAYS fire when I ask to apply fix or implement etanah code, even outside quests"*; recon found the v1 gate silently dark without `status=active`. v2 = quest-gate REMOVED — fires on ANY stateful-flow etanah .java Edit.
goal: logic-blast-radius.discipline.hook.js — PreToolUse hook (Edit | Write) v2 2026-07-07 — quest-gate REMOVED per みや ("checks must always fire on etanah fix work even outside quests"); relocated from .claude/hooks/logic-blast-radius-gate.js.
goal_signal: a fire on: its trigger
retention: rotate monthly
# logic-blast-radius

**PreToolUse hook (Edit | Write)** — HARD-BLOCKS any Edit/Write to a stateful-flow etanah `.java` file until a LOGIC BLAST RADIUS scenario-matrix banner has been emitted in the session transcript. The structural defender for the Rubric row (h) CODE-LOGIC scenario matrix (quest-protocol.md "🚨 Logic Blast Radius"; built for QA-268273).

## Contract

Fires when the Edit/Write target matches BOTH:
- path contains `etanah-(pelupusan|awam|common|teknikal)` followed by a path separator, AND
- filename ends `Form|Bean|Handler|Helper|Service|Controller|Manager` + `.java` (case-insensitive)

Then the edit is **denied** unless the session transcript already contains the banner:

```
═══ LOGIC BLAST RADIUS ═══
```

(box-char `═══` or ASCII `===` form — banner-only by design; loose phrase matching false-passes on /verify output and meta-discussion).

**v2 (2026-07-07): quest-independent — fires with or without an active quest.** v1 required a `status=active` block in `quest/active.txt`; that made the gate silently dark on ad-hoc "apply this fix" work outside quests (per みや 2026-07-07: checks must always fire on etanah fix work even outside quests). The active.txt read is deleted entirely — the ONLY predicates are the two path checks above.

## What it CAN and CANNOT do

| Dimension | Coverage |
|---|---|
| Presence (~100%) | verifies a Logic-Blast-Radius matrix EXISTS this session before a stateful-flow edit — kills SKIPPING the logic check |
| Correctness (0% — human judgment) | does NOT verify the matrix enumerated every action/state path, or that Safe? verdicts cite real Evidence; a shape-valid but shallow matrix PASSES |

## Pieces

| Piece | Path |
|---|---|
| Hook (v2) | `domain/logic-blast-radius/logic-blast-radius.discipline.hook.js` |
| Eval (6 fixtures) | `domain/logic-blast-radius/eval.js` |
| Fire log | `domain/logic-blast-radius/log.jsonl` (auto-created; actions: blocked / allowed / bypassed) |
| Paired skill | `.claude/skills/logic-blast-radius/SKILL.md` |
| Predecessor (v1, quest-gated) | `.claude/hooks/logic-blast-radius-gate.js` (retired by registrar after v2 registration) |

## Bypass

`[skip-logic-blast: <reason>]` anywhere in the session transcript — for a non-stateful change wrongly matched, or audit/compliance edits.

## Failure policy

Fail-OPEN on any error (no transcript, parse fail, missing file) → ALLOW. A gate must never block an edit because of its own bug.

## Registration

Registrar familiar updates `.claude/settings.json` (PreToolUse Edit|Write) and removes the old flat hook — this build does neither.

Migrated 2026-07-07 from `.claude/hooks/logic-blast-radius-gate.js` (v1 built 2026-07-02, QA-268273).
