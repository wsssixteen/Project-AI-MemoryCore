---
name: feedback_permohonan_id_not_aplikasi_id
description: NEVER use aplikasi_id to refer to a permohonan in chat / replies / docs / BA-facing text — use the permohonan id (PTMLK/...). aplikasi_id belongs ONLY inside SQL scripts
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d6617a39-e51c-4896-939d-62e88a55fe11
  modified: 2026-08-27T03:15:27.586Z
---

🚨 **Refer to a permohonan by its permohonan id (`PTMLK/02/L/PRBB/2026/12`), NEVER by `aplikasi_id`** — in chat, summaries, qa_docs, register rows, BA/handoff text, everywhere a human reads.

**The ONLY place `aplikasi_id` (e.g. 3440281) is allowed = inside a SQL script** (WHERE clause, id resolution). Even there, prefer resolving via `umm_aplikasi.id_pengenalan = '<permohonan>'` so the script reads by the permohonan id too.

**Why (2026-08-27, みや, firm)**: `aplikasi_id` is an internal DB key — meaningless to BA/PDT and to みや when he reads a reply. The permohonan id is the shared identifier everyone (officer, BA, Redmine) uses. Leading with the aplikasi_id makes the reply unreadable and forces a lookup.

**How to apply**: when a DB query returns an `aplikasi_id`, translate it back to the permohonan id for the reply. Keep the aplikasi_id only in the script/evidence block, not in the prose. Pairs with [[feedback_pengguna_semasa]] (every permohonan reference also carries its current pengguna login).

enforcement: hook-pending: reply-shape gate extension (aplikasi-id-in-prose detector)
