---
name: feedback_infra_script_schema_env
description: Infra/PROD handed .sql uses the fixed canonical format — concise header block (Ticket/Env/Permohonan/Fix) + schema-qualified BEFORE/UPDATE/AFTER, each DML annotated; the excess (column-mapping/run-order/descriptions) stays banned
metadata:
  node_type: memory
  type: feedback
  originSessionId: dbced4ce-319d-4218-a515-b1ee37693d2e
  modified: 2026-09-03T01:35:29.644Z
---

🚨 A SQL script HANDED OFF for infra/PROD execution follows THIS EXACT format (canonical 2026-09-02, #277291 — miya shared it twice: *"follow this format from now on… don't go back to your fuck face format"*). This SUPERSEDES the 2026-08-27 #275847 "no header at all" wording.

```
-- Ticket: <ticket ref>
-- Env: <env> (<host>) — schema <schema>
-- Permohonan: <id_pengenalan> (aplikasi_id <n>)
-- Fix: <plain what + why, max ~3 lines>

<SELECT (before) …>;

<UPDATE …>;
-- N rows updated
```

**Rules:**
- Tables schema-qualified: `et_main` (Melaka PROD) · `et_main_stg2` (STG) · `et_main_mlit` (MLIT) · `ET_MAIN`/`et_main` (Perak Oracle PROD, ETPRDPK).
- Concise header block: `Ticket` · `Env — schema` · `Permohonan (aplikasi_id)` · `Fix` (plain what+why, ~3 lines). Blank line, then the statements.
- ONE SELECT (before), then the UPDATE. NO after-SELECT, NO trailing COMMIT-note line.
- The UPDATE ends with `-- N rows {updated|deleted|inserted}`. Nothing after it.
- Pin the WHERE by `id_pengenalan` subquery, never a broad `LIKE`.
- File named `<ticket>.sql` in the Task folder `2. Fix\` (or the latest `Rework\`).
- 🚨 This is the FILE format only. The infra HANDOFF MESSAGE is a separate section with a different shape — DML + `-- N rows` only, no header, no before-SELECT (2026-09-03 #277346; see [[feedback_prod_patch_infra_handoff]]).

**🚫 STILL BANNED (the #275847 excess miya hated — NOT the concise header):** column-mapping comments (`LOKASI = Tempat`) · table descriptions · run-order narration · per-line step comments (`-- 1) BEFORE …`). The header's 4 lines + the `Fix` summary are the ONLY prose; nothing per-statement beyond its `-- N rows` annotation.

**Why:** the two rages reconcile — #275847 was fury at EXCESS (header + table-desc + column-mapping + run-order piled together); #277291 confirms the CONCISE header (Ticket/Env/Permohonan/Fix) IS wanted. The env/ticket also go in the chat handoff message ([[feedback_prod_patch_infra_handoff]]); the file additionally carries the concise header.

Canonical home: `.claude/skills/script-check/SKILL.md`. Related: [[feedback_script_check_before_patch]] · [[feedback_readable_safe_script]] · [[feedback_script_file_naming]].
