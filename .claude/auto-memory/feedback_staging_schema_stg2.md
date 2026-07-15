---
name: feedback-staging-schema-stg2
description: "Melaka staging DB — the LIVE schema is et_main_stg2, NOT et_main_stg1. Always use stg2 for any staging analysis. mcp postgres-mlkstg was misconfigured to stg1 for weeks; corrected 2026-07-14."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8704a5d4-6d61-456c-8842-fb7235288a7b
---

**The active Melaka staging schema is `et_main_stg2`, not `et_main_stg1`.** Every DB read for anything BA is testing on `etanah-appstg.melaka.gov.my` MUST hit stg2.

**Why:** miya asked me to switch the MCP config from stg1 → stg2 **weeks ago**. I never applied it. Across those weeks I ran queries against stg1 and delivered analyses based on stale/parallel data — miya then used those (wrong) conclusions in discussions with colleagues. The failure surfaced 2026-07-14 during the amira-dropdown-missing investigation when BA's Simpan actions produced zero visible DB changes — because writes were landing in stg2 (where I couldn't see) while I read stg1.

**Corrective action taken 2026-07-14:**
- Updated `C:\Users\Ridhwan\.claude.json:2655` — connection string user from `et_main_stg1` → `et_main_stg2` (same DB `mlkstg`, same host `172.30.12.202:5444`, same password `etanah123`).
- MCP config only reloads on Claude Code restart — the change takes effect next session.

**How to apply going forward:**
- Any query on staging via `mcp__postgres-mlkstg__query` → verify current_schema returns `et_main_stg2` FIRST (`SELECT current_schema()`) before trusting results.
- If it still returns stg1, restart Claude Code (or ask miya to).
- Never assume "postgres-mlkstg" = correct schema — the connection USER dictates the default schema; both stg1 and stg2 exist on the same DB and my user historically only had access to stg1.
- If a staging query returns "record not found" for something BA insists exists (e.g. `PTMLK/01/L/PLTP/2026/4` in 2026-07-14 session), STOP and check schema before diagnosing a missing record.
- If a save-verify shows "no change" in staging DB, STOP and check schema before concluding the write failed — most likely I'm reading the wrong schema.

**Related failure family:** environment-driven (like [[feedback_uat_fat_environments]]) — the correct DB pointer must be established at query #1, not inferred from tool name.
