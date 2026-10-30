goal_status: draft (derived from nuke-marker+header on 2026-09-06; promote with node lib/goal-backfill.js promote logic-blast-radius)
symptom: Familiar-built batch (commit `2750811`). Root symptom: みや 2026-07-07 — *"checks must ALWAYS fire when I ask to apply fix or implement etanah code, even outside quests"*; recon found the v1 gate silently dark without `status=active`. v2 = quest-gate REMOVED — fires on ANY stateful-flow etanah .java Edit.
goal: logic-blast-radius.discipline.hook.js — PreToolUse hook (Edit | Write) v2 2026-07-07 — quest-gate REMOVED per みや ("checks must always fire on etanah fix work even outside quests"); relocated from .claude/hooks/logic-blast-radius-gate.js.
goal_signal: a fire on: its trigger
retention: rotate monthly
diagram: domain/logic-blast-radius/diagram.png (v3 step marked)
self_audit: eval.js replays every fixture; each fire logs arrival-ok or blocked-arrival with the failed rows to log.jsonl
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


## v3 arrival paths (2026-10-30, per miya on 287048)

His words: "We should really improve our Rubric or Phase 1 to take into account the different scenarios. Make sure all of them are covered, make a gate. Like Pembetulan or Alter that makes the permohonan go through it again." and "the scenario can simply refer to the flowable, whether DB or BPMN file, which ever is the most efficient."

Design from the Fable 5.1 audit. **Why it was missed**: Rubric row (h) defined re-entry at the page level (reload, re-init), never how the permohonan arrives at the tugasan, so a shallow matrix passed. 287048 shipped a check that counted rows from any pass.

| Part | What it does |
|---|---|
| `arrival-paths.js <URUSAN> <TUGASAN> --env mlit|stg` | reads the running model from the engine DB (latest `act_re_procdef`, XML from `act_ge_bytearray`), parses it with `bpmn-check parseXml`, walks back from the task, prints the `first-pass` · `loop:<variable>` · `entry:*` · `subflow:*` rows plus the fixed `alter` `initiate` `reassign` `migrated`. Caches `arrival/<URUSAN>-<TUGASAN>.json` (retention: regenerate). Local BPMN only with `--file`, which prints `file STALE <bytes>/<bytes>`. |
| hook v3 | on a Java edit whose new or old text, or enclosing method, carries a state-check token (`setHantarSeterusnyaDisabled(` · `adalahBolehDihantar` · `submitDisabled` · `verifySign` · `isSigned*` · `*BolehDihantar*`), or an xhtml edit adding `disabled=`: BLOCK until the table exists, in chat or in the quest doc through the line `ARRIVAL PATHS DOC: QA-<num>`. |
| checks | ticket is active · source line equals the script's · every listed id has a row · flow rows carry a SELECT · verdict is ✓ ✗ BA-Q · shared code (`BasePelupusanLiteForm`, `PelupusanService.isSignedAllReport`) has a table per urusan. |
| `falsifier-ran-check` | kind `arrival-missing`: a ✗ or BA-Q row under `## Arrival paths` with no `arrival:<id>` ledger row blocks the commit. |

**Limit, stated**: the hook checks shape, ids and source. Whether a SELECT is true and a verdict is right stays judgment. A second active ticket's table satisfies the ticket check.

state-scoped: yes, the script's process keys and engine schemas are Melaka (`MLK_PLP_*`, `et_flowable_mlit`, `et_flowable17`); another state adds its own to `ENGINE` and the key rule.

| # | v3 adversarial scenario (Rule 12) | Verdict |
|---|---|---|
| 1 | banner, no table, gate edit | fixture A1 |
| 2 | first-pass row only | fixture A2 |
| 3 | loop row says n/a while the flowable lists it | fixture A3 |
| 4 | prose instead of a SELECT | fixture A4 |
| 5 | verdict not ✓ ✗ BA-Q | fixture A5 |
| 6 | complete table | fixture A6 |
| 7 | ✗ row and no ledger row | fixture A7 edit allowed; commit blocked by `arrival-missing` |
| 8 | Form edit with no state token | fixture A8 |
| 9 | xhtml adds disabled= | fixture A9 |
| 10 | xhtml with no disabled= | fixture A10 |
| 11 | table from a closed ticket | fixture A11 |
| 12 | shared Lite form, one table of seven | fixture A12 |
| 13 | isSignedAllReport edit | fixture A13 |
| 14 | table inside a code fence | fixture A14 |
| 15 | source differs from the script (stale undeclared) | fixture A15 |
| 16 | no BPMN and no cache | fixture A16 |
| 17 | engine source and no cache | fixture A17 |
| 18 | table in the quest doc | fixture A18 |
| 19 | bypass token | fixture A19 |
| 20 | broken stdin | fixture A20 |
| 21 | self-closed sequenceFlow in a model | accepted-risk: `parseXml` swallows it; Flowable writes open and close tags, the engine models read fine |
| 22 | hook runs from the main folder, script cache in a worktree | handled: landed with the change |