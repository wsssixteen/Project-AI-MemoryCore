goal_status: draft (derived from registry on 2026-09-06; promote with node lib/goal-backfill.js promote de-close-gate)
symptom: 2026-08-20 QA-276182: touched all session, deployed to int-env, had NO active.txt block and NO qa_doc; only miya's explicit audit ask caught it - step 2c is model-memory and 12.6 only iterates existing blocks
goal: BLOCK the DE close unless the deterministic close-conditions hold: (1) every ticket id mentioned this session that has a Task folder or qa_doc also has an active.txt block (kills the blockless-ticket hole), (2) resume-readiness.js ran this session (log.jsonl fresh), (3) main/current-session.md is at or under 500 lines (trim ran). Bypass [skip-de-close-gate: <reason>]
goal_signal: the Stop fire produced: BLOCK the DE close unless the deterministic close-conditions hold: (1) every tic
retention: keep
# de-close-gate — deterministic close-conditions for Domain Expansion

**What fires when**: Stop hook. Fires ONLY when the last assistant text carries the DE closing
banner (`Domain Expansion — closed` / `Barrier settles`). Silent on every other turn.

**Contract** — BLOCKS the DE close unless all three hold:

| # | Condition | Kills |
|---|---|---|
| C1 | Every ticket id worked on this session (appears inside a tool call, or ≥5 assistant-text mentions) has a block in `quest/active.txt` or `quest/active-archive.txt` | The blockless-ticket hole (QA-276182, 2026-08-20): step 2b is model memory, step 12.6 only iterates existing blocks — a blockless ticket is invisible to both |
| C2 | `resume-readiness.js` ran this session (`domain/checklist-reactivate/log.jsonl` entry `via=resume-readiness` within 12h) | Step 12.6 being silently skipped |
| C3 | `main/current-session.md` ≤ 500 lines | Step 2 trim skipped → next boot's briefing built on a truncated file (the 2026-08-04 1665-line failure) |

**Bypass**: `[skip-de-close-gate: <reason>]` in the last assistant text.

**Layer choice (Rule 7)**: hook-only — pure deterministic condition checks, no procedure for a
skill to carry. **Trigger moment (Rule 8)**: DE-close banner only, same narrow trigger as
siblings `de-step11-verdict-gate` + `de-knowledge-gate` — leanest possible; nothing to check
before a close is attempted.

**Observability**: every fire appends to `domain/de-close-gate/log.jsonl`
(`{ts, action: blocked|passed, detail}`) — blocked lines name the failing condition + ticket ids;
passed lines carry `touched=<n> rr-age=<h> lines=<n>` so the audit can see what each close held.

**state-scoped**: no, state-agnostic — reads MemoryCore quest state only; no per-state path,
schema, or urusan set. A second state reuses it unchanged.

**Eval**: `de-close-gate.eval.js` — 8 fixtures (replay QA-276182 blockless-block · pass ·
bypass · stale-12.6 · untrimmed · passing-mention no-false-positive · archived-block pass).

## C4 — Redmine reconcile (added 2026-08-21 evening)
DE close BLOCKS unless `node quest/redmine-reconcile.js` ran <=12h (writes action=reconcile-ran to log.jsonl). Reconciles active.txt open blocks against live Redmine both directions; report-only. Replay: 2026-08-21 — 20 stale open blocks vs 0 assigned-open.
