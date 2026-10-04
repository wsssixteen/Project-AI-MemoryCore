goal_status: draft (derived from nuke-marker+header on 2026-09-06; promote with node lib/goal-backfill.js promote predicate-box)
symptom: Familiar-built batch (commit `2750811`). Root symptom: みや 2026-07-07 — *"checks must ALWAYS fire when I ask to apply fix or implement etanah code, even outside quests"*; recon found the v1 gate silently dark without `status=active`. v2 = quest-gate REMOVED + advisory PROMOTED to `decision:block`; firing scope = etanah edit + fix-intent in last user message; `stop_hook_active` guard. v3 (2026-10-04, #282442): two etanah fix builds went to test with zero probe loggers; the logger rules said HOW to log, nothing forced the DECISION. みや 2026-10-04: *"everytime when putting loggers you should make it extensive & make fallbacks even for loggers if they didn't go through the ones you first though it would go through"*.
goal: no etanah code edit ends a turn without its Predicate Diagram, and no etanah .java fix build reaches a test hand-back without an extensive probe plan: a PROBE COVERAGE MATRIX of at least 3 candidate paths plus a fallback probe, or a reasoned skip.
goal_signal: a blocked row in log.jsonl is followed by a passed / probe-passed / probe-bypassed row in the same session
retention: rotate monthly
footprint: per-turn: 1 node per Stop on the existing registration, no new process (v3 added none)
state-scoped: no, state-agnostic (matches any etanah-pelupusan / awam / common / teknikal clone path)
# predicate-box — Feature power

> Deterministic back-gate for two things that must accompany an etanah code edit:
> the Predicate Diagram (ASSUMPTION → EVIDENCE → matches/FALSIFIER) and the probe decision
> (PROBE COVERAGE MATRIX). One Stop hook, one registration.

## Requirement 1 — Predicate Diagram (v2, unchanged)

Fires at **Stop**. The turn is **HARD-BLOCKED** (`{"decision":"block"}` on stdout) when ALL THREE hold:

| # | Condition | How detected |
|---|---|---|
| a | The turn edited an etanah file | v1 heuristic unchanged: an `etanah-(pelupusan\|awam\|common\|teknikal)` path ending `.java` / `.xhtml` appears in the transcript alongside an edit-shaped cue (`Edit` / `Write` / `old_string` / `new_string` / `file_path`) |
| b | The **last user message** carries fix-intent | regex, case-insensitive: `\b(fix\|fixes\|patch\|bug\|debug\|error\|issue\|implement\|apply\|broken\|salah\|tak keluar)\b` |
| c | The reply lacks BOTH markers | neither `ASSUMPTION` nor `FALSIFIER` (case-insensitive) appears in the transcript's assistant text |

Bypass: `[skip-predicate-box: <reason>]` anywhere in the session. v3: a reason holding `<` does not count (the block text and this file quote the token with a placeholder).

## Requirement 2 — probe decision (v3, 2026-10-04)

| Item | Rule |
|---|---|
| Trigger | an `Edit` / `Write` / `MultiEdit` **tool call** whose `file_path` is an etanah `.java` file, anywhere in the session. No fix-intent word needed. `.xhtml`-only edits never trigger. |
| Passes on | a **PROBE COVERAGE MATRIX** table in assistant text or in a `.md` the session wrote: a header row with a `Probe placed` cell, a separator row, **at least 3 data rows** (Ritual 6: ≥3 what-if scenarios) and **one row marked `FALLBACK` or `OUTERMOST`** (the probe that still fires when none of the expected paths run) · OR every `.java` edit in the session is probe **cleanup** (the `QA<num>-PROBE` marker is in `old_string`, gone from `new_string`) |
| Skip | `[skip-probe-matrix: <reason>]` in **assistant text, after the last `.java` edit**. Refused: a reason holding `<`, shorter than 8 characters, or arguing from size (`small` · `tiny` · `trivial` · `simple` · `minor` · `quick` · `one-line` · `kecil`). A skip never covers a later edit. |
| Block | exit 2, reason on stderr. Fires at every Stop until paid. With requirement 1 also unmet, both reasons ride in the one `decision:block`. |
| Not counted | one probe placed with no matrix (one probe answers one hypothesis) · `QA<num>-PROBE` named in reply text only · a matrix with fewer than 3 rows or no fallback row · a token in a user-role message |
| Probes stay local | `domain/probe-local-only-gate` keeps probes off env branches. The matrix may describe uncommitted probes; this gate never asks for a commit. |

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

## Anti-loop / failure mode / log

- `stop_hook_active: true` in the Stop payload → immediate silent exit (never
  re-block the same stop — copied from `domain/show-gate/`). Both requirements.
- **Fail-OPEN**: any read/parse error → exit 0 silently. Never traps the session.
- Fires are logged to `domain/predicate-box/log.jsonl`:
  `blocked` / `passed` / `bypassed` / `skipped-no-intent` (requirement 1) ·
  `probe-blocked` / `probe-passed` / `probe-bypassed` (carries the skip reason, for audit) /
  `probe-refused` (incomplete matrix or refused skip reason) (requirement 2).

## Files

| File | Role |
|---|---|
| `predicate-box.discipline.hook.js` | the Stop hook (this power's enforcement) |
| `eval.js` | 36-fixture regression eval — run `node domain/predicate-box/eval.js`, exits 0 only on all PASS. 1-7 pin requirement 1, 8-36 pin requirement 2 |
| `log.jsonl` | fire log (created on first fire) |
| `.claude/skills/predicate-box/SKILL.md` | paired skill — the procedure the block points the model at |

## Known limitations (presence-only)

Cannot verify the diagram's or the matrix's CONTENT is correct, that cited Evidence is real, or
that it was emitted BEFORE the specific edit. Requirement 2 does not see a `.java` change made
through a shell command (`git apply`, a script) or by a sub-agent, and one matrix covers every
ticket worked in the same session.
