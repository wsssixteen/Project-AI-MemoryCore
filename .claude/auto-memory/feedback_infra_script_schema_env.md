---
name: feedback_infra_script_schema_env
description: Scripts handed to Infra for execution must be schema-qualified + env-tagged in the header; the unqualified default is only for queries miya runs himself
metadata: 
  node_type: memory
  type: feedback
  originSessionId: dbced4ce-319d-4218-a515-b1ee37693d2e
  modified: 2026-08-27T10:37:59.461Z
---

🚨 A SQL script HANDED OFF for execution (Infra / PROD run, not run by miya in his own MCP session) must be **schema-qualified**. The env/context goes in the **chat handoff message — NEVER as comments inside the `.sql`**.

- Every table carries its schema prefix: `et_main` (PROD) · `et_main_stg2` (STG) · `et_main_mlit` (MLIT) · `ET_MAIN` (Perak Oracle PROD).
- 🚫 **EVERY statement in the `.sql` ends with its expected-outcome annotation, both mandatory: DML → `-- N rows {updated|deleted|inserted}` · SELECT → `-- N rows, <expected state>`. Nothing else.** BANNED: header comment · env line · table description · column-mapping (`LOKASI = Tempat`) · run-order · any explanation. (2026-08-27, #275847 — miya was furious I piled a header + table description + mapping + run-order into a patch; keep the mandatory annotations he did NOT ask to remove.) The prior "env-tagged header comment" mandate is **WITHDRAWN**.
- The env · ticket · schema · one-line what-it-does belong in the **chat handoff message** (the `feedback_prod_patch_infra_handoff` format), not the file.
- File named `<ticket>.sql` (per [[feedback_script_file_naming]]), placed in the Task folder's `2. Fix\` — or the latest `Rework\` folder if one exists — never the Task-folder root.

**Why:** Infra 2026-08-19 (#275501) wanted schema prefixes to avoid env errors — that part stays. But the header-comment part became a comment-noise generator; miya 2026-08-27 (#275847): *"I FUCKING HATE YOU ADD FUCKING STUFFS TO IT"*. Schema-qualify the tables; put every word of context in the message, not the script.

**How to apply:** run SCRIPT-CHECK rules 6+7 before handing off. This SUPERSEDES the unqualified default — the unqualified form ([[feedback_never_hand_miya_a_query]] context) stays ONLY for queries miya runs himself, connected to the target schema, copy-pasting between envs.

Canonical home: `.claude/skills/script-check/SKILL.md` rules 6+7. Related: [[feedback_script_check_before_patch]] · [[feedback_readable_safe_script]].
