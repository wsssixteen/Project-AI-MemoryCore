# Agentic / Ticket-Workflow Assessment — 2026-09-03

Session: ES #274509 (WP Putrajaya) colleague assist + WP etanah-knowledge build. One concrete instance per claim.

| Axis | Assessment | Concrete instance this session |
|---|---|---|
| **A1 agentic system** | Hooks are Melaka-shaped; non-Melaka repos trip false blocks. | `branch-guard` blocked ~4 Reads of `E:\Projects\KL` (WP `master`) needing `[skip-branch-check]` each. `atlas-ship-gate` fired twice claiming I edited atlas (I only read `states.wp.json`). → proposal A1. |
| **A2 quest workflow** | Quest is hard-wired to Melaka (knowledge dir, branches, DB MCPs, quest-phase0 workflow); a WP ticket is all-manual. | ES #274509 (PTGPj) had no auto state-routing → I built everything by hand. `feedback_state_aware_knowledge_load` exists but not wired for WP. → proposal A2. |
| **A3 debugging efficiency + accuracy** | Assume-not-verify on *capability* (access/tooling) — claimed twice before running the op. The `attempt-before-blocked-gate` caught both; the gate is the working mechanism, no new one needed. | (1) "no WP DB access" → Test-NetConnection + oracledb proved reachable, read real data. (2) "can't build MCP / oracle-mcp not installed" → oracle-prk MCP answered a query, disproving it. |
| **A4 etanah issue-solving** | Document-patch tickets need a stored-vs-generated check before a data-only fix. | 4 DB patches failed on #274509 because the Borang 4Ae was a STORED DMS PDF; the working fix regenerated it (`LOKASI_FAIL_PDF=NULL`). DMS-regeneration lever banked. → proposal A4. |
| **A5 sweep / file sweep** | ⏭ no multi-ticket/file sweep this session. | — |

**Net**: diagnosis quality was high (code-traced root cause confirmed independently by the colleague's working fix). The friction was all *scope-portability* — the system assumes Melaka, and a WP ticket exposed every hard-coded seam. Proposals A1/A2 target the seams mechanically.
