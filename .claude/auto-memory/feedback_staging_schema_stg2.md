---
name: feedback-staging-schema-stg2
description: "🚨 Melaka staging has TWO live schemas — et_main_stg1 and et_main_stg2 — and miya switches between them. CURRENT TARGET = et_main_stg1 (as of 2026-07-27, per miya). There is NO default: never assume one. Servers postgres-mlkstg1-pg=stg1, postgres-mlkstg-pg=stg2. Any SQL handed to miya must be UNQUALIFIED so it runs on whichever he is connected to."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8704a5d4-6d61-456c-8842-fb7235288a7b
  modified: 2026-07-27T08:01:50.212Z
---

**CURRENT STAGING TARGET = `et_main_stg1`** — stated by みや 2026-07-27 (*"I already asked you to fix your memory it is stg1 currently"*). This line is the live pointer; update it the moment he says otherwise, in the same turn he says it.

**There is NO default schema.** Melaka staging runs TWO live main schemas on the same host/db (`172.30.12.202:5444` / `mlkstg`): `et_main_stg1` and `et_main_stg2`. Schema is dictated by the LOGIN USER (`et_main_stg1` → schema et_main_stg1; `et_main_stg2` → schema et_main_stg2), same password `etanah123`.

**MCP servers:**
- `postgres-mlkstg1-pg` → login `et_main_stg1` → schema **et_main_stg1**
- `postgres-mlkstg-pg`  → login `et_main_stg2` → schema **et_main_stg2**
- Both in `~/.claude.json` mcpServers; load only on Claude Code restart. If neither appears, the pg servers didn't hand-shake at boot — restart or `/mcp` reconnect. Fallback: `psycopg2` direct with the host/port/db/user/pass above.

**How to apply — the switching problem, solved structurally:**
1. **SQL handed to みや is UNQUALIFIED** (no `et_main_stg1.` prefix) — he copy-pastes the same script between schemas without amending it. Header line: `-- Run connected to the target schema.` This makes the switch a non-event for anything he runs. (CLAUDE.md §8.)
2. **Queries I run via MCP** must carry the prefix, and I pick the SERVER matching the CURRENT TARGET above — not the one I used last time.
3. **Echo `SELECT current_schema()` before trusting any staging result**, and state which schema the result came from in the reply.
4. A finding recorded on one schema does **not** transfer — a qa_doc that says "verified on stg2" is unverified on stg1. Re-run the falsifier on the current target before citing it.
5. If a staging query returns "record not found" for something BA insists exists, or a save-verify shows no change → check the schema BEFORE diagnosing.

**Why this file exists (two slips, same shape):**
- 2026-07-14 — asked to switch stg1 → stg2 weeks earlier and never applied it; read stg1 while BA's writes landed in stg2, delivered wrong analyses みや repeated to colleagues (amira-dropdown: Simpan showed zero DB change).
- 2026-07-27 — this file itself said *"if miya doesn't say, default to stg2"*. That clause is what made me assume stg2 again after he had already told me it was stg1. **A memory that carries a default re-creates the slip it was written to prevent.** The default is now deleted; the live pointer at the top replaces it.

**Related failure family:** environment-driven, like [[feedback_uat_fat_environments]] — the correct DB pointer is established from the live pointer or from みや, never inferred from a tool name or a habit.
