# predicate-box — Feature power

> Deterministic back-gate for the Predicate Diagram (CLAUDE.md §10 — the 3-node
> ASSUMPTION → EVIDENCE → matches/FALSIFIER flowchart that must precede any
> etanah code edit during fix work).

## Contract (v2 — BLOCKING)

Fires at **Stop**. The turn is **HARD-BLOCKED** (`{"decision":"block"}` — reply
rejected, model must add the Predicate Diagram and re-send) when ALL THREE hold:

| # | Condition | How detected |
|---|---|---|
| a | The turn edited an etanah file | v1 heuristic unchanged: an `etanah-(pelupusan\|awam\|common\|teknikal)` path ending `.java` / `.xhtml` appears in the transcript alongside an edit-shaped cue (`Edit` / `Write` / `old_string` / `new_string` / `file_path`) |
| b | The **last user message** carries fix-intent | regex, case-insensitive: `\b(fix\|fixes\|patch\|bug\|debug\|error\|issue\|implement\|apply\|broken\|salah\|tak keluar)\b` |
| c | The reply lacks BOTH markers | neither `ASSUMPTION` nor `FALSIFIER` (case-insensitive) appears in the transcript's assistant text — the Predicate Diagram was never emitted |

Any condition false → silent pass (exit 0, no output).

## v2 (2026-07-07): quest-independent + blocking

v1 (`.claude/hooks/predicate-box-gate.js`) was **doubly toothless**:

1. **Quest-gated** — required `quest/active.txt` to contain `status=active`, so it
   was completely dark outside formal quests (exactly where undisciplined edits
   happen). v2 DELETES the active.txt read entirely; the **fix-intent regex on
   the last user message** replaces it as the firing scope, so the gate still
   does not nag on non-fix chatter.
2. **Advisory** — `console.log` reminder the model could (and did) ignore. v2
   emits `decision:block`.

Per みや 2026-07-07: "checks must always fire."

## Anti-loop / bypass / failure mode

- `stop_hook_active: true` in the Stop payload → immediate silent exit (never
  re-block the same stop — copied from `domain/show-gate/`).
- **Bypass**: include `[skip-predicate-box: <reason>]` anywhere in the session.
- **Fail-OPEN**: any read/parse error → exit 0 silently. Never traps the session.
- Fires are logged to `domain/predicate-box/log.jsonl`
  (`blocked` / `passed` / `bypassed` / `skipped-no-intent`).

## Files

| File | Role |
|---|---|
| `predicate-box.discipline.hook.js` | the Stop hook (this power's enforcement) |
| `eval.js` | 7-fixture regression eval — run `node domain/predicate-box/eval.js`, exits 0 only on 7/7 PASS |
| `log.jsonl` | fire log (created on first fire) |
| `.claude/skills/predicate-box/SKILL.md` | paired skill — the procedure the block points the model at |

## Known limitations (presence-only, same tier as v1)

Cannot verify the diagram's CONTENT is correct, that cited Evidence is real, or
that it was emitted BEFORE the specific edit it should have gated. A shape-valid
diagram anywhere in the transcript passes.
