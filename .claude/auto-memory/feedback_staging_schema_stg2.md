---
name: feedback-staging-schema-stg2
description: "🚨 Melaka staging has TWO live schemas — et_main_stg1 and et_main_stg2 — and miya switches between them. CURRENT TARGET = et_main_stg2 (as of 2026-08-10, per miya). There is NO default: never assume one. Servers postgres-mlkstg1-pg=stg1, postgres-mlkstg-pg=stg2. Any SQL handed to miya must be UNQUALIFIED so it runs on whichever he is connected to."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8704a5d4-6d61-456c-8842-fb7235288a7b
  modified: 2026-08-11T03:50:40.184Z
---

**CURRENT STAGING TARGET = `et_main_stg2`** — stated by みや 2026-08-10 (*"WE HAVE SWITCHED TO STG2 FOR NOW … amend your current memory everywhere"*). This line is the live pointer; update it the moment he says otherwise, in the same turn he says it. (Was `et_main_stg1` 2026-07-27 → 2026-08-10.)

**🤖 MACHINE-READABLE SOURCE (added 2026-08-10, みや /goal) = `system/melaka-env-state.json`.** The hook `domain/staging-schema-tracker/` reads it and (A) rewrites it when みや says "we switched to stgN" / "use stgN now", (B) injects the live target + auto-verifies `standalone.xml` etanahDS matches, at every env-prep / test-scenario prompt. This prose line and the JSON must stay in sync — when one changes, change both. Built because this file's prose decayed and env was "prepared" without checking standalone against the live target (QA-273460).

**Re-confirmed 2026-08-05** (Baseline 1.3.1): both release SQL scripts (#270900, #272574) were verified-then-run against `et_main_stg1` and matched `et_main_mlit` exactly. みや the same day: *"stg1 or stg2 depends on our master memory which I will ask you to setup from time to time if we change"* — i.e. THIS pointer is the sanctioned mechanism. Any release/baseline SQL check reads this line first and never infers the schema from habit or from the last server used.

**Switched back to stg2 on 2026-08-10** (hakmilik luas work) — みや gave the switch via `/goal`: *"AMEND YOUR CURRENT MEMORY EVERYWHERE ON THIS, WE HAVE SWITCHED TO STG2 FOR NOW."* Same turn he flagged that data changes to hakmilik are a common occurrence — see [[reference_hakmilik_change_map]] for the table map. I had wrongly queried `mlit` at the start of that session out of habit (the `[[feedback_uat_fat_environments]]` "mlit is PRIMARY" line); that habit is the exact slip the live pointer exists to kill.

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
- 2026-08-11 — while capturing a Tujuan baseline for MLPS `PTMLK/02/L/MLPS/2026/1`, I asked みや "which schema — alter either" when the CURRENT TARGET pointer already said `et_main_stg2` and he'd stated stg2 the week prior. **The pointer IS the answer — read line 11 before asking.** Asking-which-schema when the pointer is set is a banned ask-back, same family as the no-asking-back rule. My stg2 reads were already correct; the ask was pure friction.

**Related failure family:** environment-driven, like [[feedback_uat_fat_environments]] — the correct DB pointer is established from the live pointer or from みや, never inferred from a tool name or a habit.
