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
