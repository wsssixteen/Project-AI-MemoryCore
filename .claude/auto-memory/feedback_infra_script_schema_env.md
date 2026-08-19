---
name: feedback_infra_script_schema_env
description: Scripts handed to Infra for execution must be schema-qualified + env-tagged in the header; the unqualified default is only for queries miya runs himself
metadata: 
  node_type: memory
  type: feedback
  originSessionId: dbced4ce-319d-4218-a515-b1ee37693d2e
  modified: 2026-08-19T13:35:12.694Z
---

🚨 A SQL script HANDED OFF for execution (Infra / PROD run, not run by miya in his own MCP session) must be **schema-qualified + env-tagged**.

- Every table carries its schema prefix: `et_main` (PROD) · `et_main_stg2` (STG) · `et_main_mlit` (MLIT).
- The header names the env, mandatory format: `-- #<ticket> (ENV: <PROD|STG|MLIT> · <schema>): <short plain explanation, no jargon>`.
- File named `patch-<ticket>.sql`, placed in the Task folder's `2. Fix\` — or the latest `Rework\` folder if one exists — never the Task-folder root.

**Why:** Infra 2026-08-19 (#275501): *"please include schema name in your script for best practice to avoid unnecessary error in DB env"*. Also lets miya see at a glance WHICH env a script targets.

**How to apply:** run SCRIPT-CHECK rules 6+7 before handing off. This SUPERSEDES the unqualified default — the unqualified form ([[feedback_never_hand_miya_a_query]] context) stays ONLY for queries miya runs himself, connected to the target schema, copy-pasting between envs.

Canonical home: `.claude/skills/script-check/SKILL.md` rules 6+7. Related: [[feedback_script_check_before_patch]] · [[feedback_readable_safe_script]].
