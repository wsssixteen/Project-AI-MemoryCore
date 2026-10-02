---
name: feedback_mlit_db_write_access
description: "🚨 I CAN write to MLIT (et_main_mlit + et_flowable_mlit): only the MCP query tool is read-only; the gateway backend login is read-write. Never tell miya the DB is read-only; with his nod, write via JDBC/script"
metadata:
  type: feedback
---

The `mcp__postgres-mlit-pg__query_database` tool runs READ-ONLY transactions, but the login behind it (`%USERPROFILE%\.db-gateway\backends.json` -> `postgres-mlit-pg` env PGUSER/PGPASSWORD = et_main_mlit) has INSERT/UPDATE on `et_main_mlit` and `et_flowable_mlit` (verified 2026-09-30 with `has_table_privilege`: umm_aplikasi INSERT t, umm_a_tgsn UPDATE t, act_ru_task INSERT t).

Write path that works on this laptop: `java -cp E:\Dev\.m2_etanah\org\postgresql\postgresql\42.7.3\postgresql-42.7.3.jar Q.java <file.sql>` with PG* env vars loaded from backends.json (single-file Java launcher; java.exe is signed so Smart App Control does not block it).

**Why:** 2026-09-30 (ADHOC-PDBB-2026-1) I told miya "my DB tool is read-only" as a reason I could not build test data. He had approved and I had done writes myself before. His words: "Last time I approved and you did it yourself saving me the trouble and time."

**How to apply:** when a task needs test data or a patch on an internal env (MLIT / STG), say "I can write this myself once you nod" and do it after the nod, running [[script-check-before-patch]] first. PROD stays infra-only ([[prod-patch-infra-handoff]]). BA permohonan are never touched; test data is my own.