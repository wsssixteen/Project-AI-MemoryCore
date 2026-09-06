---
name: system-audit
description: Audit briefing — like session boot, but for the system's health. Triggers — "/system-audit", "audit briefing", "system audit", "what is not working", "what is slow", "audit the system briefly". Prints ONE short screen from the ledgers (NOT WORKING · TOO SLOW · MISTAKES · HIGH-RETURN OPTIMIZATIONS · needs miya's ruling). NOT the deep 5-familiar audit — that is /system-check.
---

# /system-audit — audit briefing (born via core/forge.js 2026-09-07, plan §9d)

symptom: miya 2026-09-06 — "I am basically almost blind on this … I need a proper audit briefing, like session boot … things NOT WORKING, or OPTIMIZATIONS … critical or high returns"
goal: miya types /system-audit and reads one short screen of what is not working, too slow, causing mistakes, and the top optimizations
goal_signal: the skill runs `lib/audit-briefing.js` and shows its blocks unchanged
retention: keep (this file) · the briefing itself is regenerate

## Procedure (fixed, no judgment before step 3)

1. Run, in this order, and paste NOTHING but their summary lines while they run:
   - `node lib/turn-report.js` (regenerates `system/monitoring-dashboard.md`)
   - `node lib/feature-census.js`
   - `node lib/audit-briefing.js`
2. Show the audit-briefing output **verbatim** — the five blocks, in that order. An empty block prints `none`; never drop a block.
3. Below it, add at most **three short sentences** of Ruri judgment: the single most important item, why, and the one command or nod that resolves it. Nothing else — no re-narration of the blocks.
4. If miya rules a row (RETIRE / KEEP / resolve watch / BUILD), do it in the same turn and cite the file or command.

## Banned
- Re-describing the blocks in prose · adding sections the script did not print · running /system-check instead (that is the deep audit, invoked separately) · hiding an empty block.

## Where the numbers come from
`system/telemetry/hook-fires*.jsonl` · `turns*.jsonl` · `eval-battery.jsonl` · `system/eval-quarantine.jsonl` · `system/slips.jsonl` · `system/feature-census.md` · `domain/*/goal-log.jsonl` · `domain/turn-ledger/goal-lens-pending.jsonl` · `domain/quest-bounty/log.jsonl` (wrong-fix rows) · `system/claude-md-watchlist*.jsonl`. Blind spots the audit cannot see are listed in the plan §9e and must be said as "unknown", never "fine".

> Fixture: `node lib/audit-briefing.js` on the 2026-09-07 ledgers prints NOT WORKING (2 quarantined evals + 3 failing), TOO SLOW (boot 45 s), MISTAKES (7-day slips), OPTIMIZATIONS (Q7 cache, unruled proposals, goal-less features), RULING rows.
