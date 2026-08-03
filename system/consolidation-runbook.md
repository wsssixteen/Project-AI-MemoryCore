# Weekly Consolidation Runbook — the "dream" pass (audit R5, sprint 2026-07-13)

> Cadence: weekly (or after ~5 sessions), in a DEDICATED session, decided WITH みや.
> Everything below is generated-data-driven — no step relies on prose memory.

| # | Step | Command / source |
|---|---|---|
| 1 | Telemetry weekly roll-up | `node lib/telemetry-report.js --weekly` — fires, blocks, bypasses, tripwire math, contingency line |
| 2 | Lifecycle flags review | same report: PROMOTION candidates (<80% compliance over ≥20 fires) · RETIREMENT candidates (0 fires/30d) — decisions with みや, executed via forge refine / unregister |
| 3 | Full eval suite | `node lib/eval-runner.js` — must be green before and after any consolidation |
| 4 | Slip dashboard | `node core/slips.js dashboard` — guard-accountability table; みや-catch count vs baseline (18/14d @ 2026-07-13) |
| 5 | Registry health | `node core/registry.js` — ghosts / unregistered / eval-less deltas |
| 6 | State hygiene | `node core/state-check.js` — stale closed blocks → archive via `quest/archive-quest.js` |
| 7 | Memory dedupe | scan `.claude/auto-memory/` deferred table (auto-memory-plan.md Table 4) — forge one deferred item per week max |
| 8 | Boot-bundle shadow compare | `node core/boot.js` — bundle vs prose-boot drift; cutover decision when 1 week of agreement |
| 9 | One-page diff report | summarize 1-8 deltas → ledger + みや |

**Blind-review pattern (N1, wired here)**: any plan/claim/fix reviewed during consolidation goes to a CLEAN-context subagent with the diff + criteria ONLY (no authorship, no session reasoning) — the `/review-etanah` + `/code-review` path for code; a fresh `Explore` agent for docs.

**Skill grading (N4, deferred-with-home)**: extend spawn-telemetry to Skill-tool invocations post-sprint; grades reviewed at step 2.

**Next external audit (booked)**: monthly → **2026-08-11** (same fresh-context format, this sprint's ledger = its baseline) · quarterly cross-model → ~2026-10.
