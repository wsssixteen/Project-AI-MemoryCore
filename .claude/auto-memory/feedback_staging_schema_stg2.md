---
name: feedback-staging-schema-stg2
description: "Melaka staging has TWO live schemas — et_main_stg2 (default) AND et_main_stg1; miya switches between them. Each is its own MCP server (postgres-mlkstg-pg=stg2, postgres-mlkstg1-pg=stg1). Schema is set by the LOGIN USER, so pick the right server. Updated 2026-07-23 (stg1 re-added, both verified)."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8704a5d4-6d61-456c-8842-fb7235288a7b
  modified: 2026-07-23T11:36:54.384Z
---

**Melaka staging has TWO live main schemas on the SAME host/db (`172.30.12.202:5444` / `mlkstg`): `et_main_stg2` (the default) and `et_main_stg1`.** miya switches back and forth between them, so the target is chosen PER-REQUEST, not fixed. Both verified 2026-07-23 (stg1 = 740,030 `ind_hkmlk` rows; stg2 active). The schema is dictated by the LOGIN USER (`et_main_stg2` → schema et_main_stg2; `et_main_stg1` → schema et_main_stg1), same password `etanah123`.

**MCP servers (added 2026-07-23):**
- `postgres-mlkstg-pg`  → login `et_main_stg2` → schema **et_main_stg2**
- `postgres-mlkstg1-pg` → login `et_main_stg1` → schema **et_main_stg1**
- Both in `~/.claude.json` mcpServers; load only on Claude Code restart. If neither appears in a session, the pg servers didn't hand-shake at boot — restart or `/mcp` reconnect. Fallback that works without the MCP: connect directly via `psycopg2` (host/port/db/user/pass above) — used 2026-07-23 when the MCP was down.

**Why this matters (the original slip, kept):** miya once asked me to switch the config stg1 → stg2 and I didn't apply it for weeks; I read stg1 while BA's writes landed in stg2, and delivered wrong analyses miya then repeated to colleagues (surfaced 2026-07-14, amira-dropdown investigation — Simpan showed zero visible DB change because I was on the wrong schema). The lesson is NOT "always stg2" — it is **establish which schema at query #1**, because both are real and either can be the intended target.

**How to apply going forward:**
- Confirm the intended schema for the request; if miya doesn't say, default to stg2 but state which you used.
- Run `SELECT current_schema()` (or `current_user`) FIRST and echo it before trusting any staging result.
- Never infer the schema from a tool/server name alone — the LOGIN USER dictates it; pick the server whose user matches the schema you want.
- If a staging query returns "record not found" for something BA insists exists, or a save-verify shows "no change", STOP and check which schema you're on before diagnosing — you may be on the other stg.

**Related failure family:** environment-driven (like [[feedback_uat_fat_environments]]) — the correct DB pointer must be established at query #1, not inferred from tool name.
