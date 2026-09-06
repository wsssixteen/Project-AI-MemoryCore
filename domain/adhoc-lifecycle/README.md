goal_status: draft (derived from registry on 2026-09-06; promote with node lib/goal-backfill.js promote adhoc-lifecycle)
symptom: closed adhocs pile in active/ forever; quest/archive-quest.js never built
goal: surface terminal-status adhoc rows ripe for archive; propose-only sweep
goal_signal: the SessionStart fire produced: surface terminal-status adhoc rows ripe for archive; propose-only sweep
retention: rotate monthly
# adhoc-lifecycle

**Born** 2026-08-19 via `core/forge.js` (hook) + hand-built CLI. **Events** SessionStart (Door B). **Lifecycle** created.

**state-scoped: YES** — keyed by `<state>` path segment (`projects/coding-projects/active/etanah-knowledge/<state>/ADHOC-REGISTER.md`). Defaults to `melaka`; pass `--state <name>` for a future Perak register. (system-design Rule 11.)

## What it is

The **ACT** side of the adhoc register. The `adhoc-register` hook DETECTS open rows at ticket-time; this feature MOVES them — promote a matched adhoc into a ticket, archive one owned elsewhere, sweep terminal rows — and reverses any of it. **Never deletes.**

## The three doors

| Door | Trigger | Command | Effect |
|---|---|---|---|
| **A — promote** | a new/existing ticket's unique key matches a row | `adhoc-lifecycle.js promote --row A18 --ticket QA-1234 --slug <dir>` | Status → `TICKETED → #`, qa_doc → `archive\` |
| **B — weekly sweep** | first boot of a new ISO week (hook) | `adhoc-lifecycle.js sweep` | lists terminal-status rows ripe for archive (propose-only) |
| **C — manual archive** | you say "another module's — archive it" | `adhoc-lifecycle.js archive --row A18 --reason "MP handling" --slug <dir>` | Status → `OWNED-ELSEWHERE`, qa_doc → `archive\` |
| reverse | any time | `adhoc-lifecycle.js unarchive --row A18 --slug <dir>` | restores dir + Status |
| match | ticket text → which row | `adhoc-lifecycle.js match --keys "<text with ids>"` | prints matching rows + which key hit |

## Match keys (Door A join column)

Extracted from free text on both sides: **permohonan** (`PTMLK/…`), **aplikasi** (`3…`), **warta** (`NO. N`, pair with tarikh), **lesen** (`A02/2026/5/1`), **resit**, **hakmilik**, **kp**. The permohonan/aplikasi id is the strongest (exact); warta needs the date pair; kp is a tie-breaker.

## Files

| File | Role |
|---|---|
| `adhoc-lifecycle.js` | the mover CLI (match/promote/archive/unarchive/sweep) |
| `adhoc-lifecycle.check.hook.js` | Door B — SessionStart weekly surfacer (propose-only) |
| `adhoc-lifecycle.eval.js` | 14 fixtures (CLI + hook smoke), temp-dir, never touches the real register |
| `log.jsonl` | instrumentation — `ts + cmd + outcome + dur_ms` (system-rules Rule 5) |
| `NUKE-MARKER.md` | rollback recipe (system-design Rule 9) |

## Safety invariants

- Register Status edits touch **exactly one** row (matched by leading `| <id> |`); refuse on 0 or >1.
- Directory moves are `active\ ↔ archive\` only — **never rm**. Every exit is reversible via `unarchive`.
- Path resolution is main-repo-aware (register lives in gitignored `projects/`, absent from worktrees).

## Why boot, not Domain Expansion (Rule 8)

Boot ALWAYS fires; DE only fires if invoked. A DE-triggered sweep silently skips on sessions that never wrap. The hook guards to once per ISO week via `.last-sweep-week` (runtime state, not committed).


## STATE-SCOPE (2026-09-04, multi-state audit)

state-scoped: **yes — keyed by state via lib/states.js** (system/states.json). No state literal remains in the hook; a new state is one registry row. Migration verified by this Feature's own eval (green) + 
ode lib/states.js check (this file no longer listed as UNROUTED). Spec-preservation (Rule 6 v1.2): every prior fixture kept and passing; the only behavioural change is that a non-Melaka state now resolves to ITS OWN folder/trunk instead of Melaka's.

