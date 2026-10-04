---
name: pengguna_semasa always paired with Permohonan ID
description: "permohonan id (never aplikasi_id) + live holder from umm_aplikasi.id_pengenalan on the right env"
type: feedback
originSessionId: ff4b3697-529c-4cc4-a23f-67b9bfa172d6
---
**Rule**: Every time a Permohonan ID is mentioned in chat (e.g. `PTMLK/01/L/PPJK/2026/11`), ALSO mention the current `pengguna_semasa` of the active tugasan attached to that aplikasi — typically the email/login (e.g. `nurulaini@melaka.gov.my`). The ID alone is incomplete; the pengguna is required for testing.

**Why** (みや 2026-05-15 on QA-260302): I proposed `PTMLK/02/L/PPJK/2026/11` as alternate test data without naming the active pengguna. みや: *"From now on, make it mandatory every time you mention a Permohonan ID to always mention who the person it is attached to currently."* Without the pengguna, みや has to context-switch to a separate DB lookup before testing — costs round-trips + breaks momentum.

**How to apply**:

| Where the ID appears | Format |
|---|---|
| Inline prose | `PTMLK/01/L/PPJK/2026/11 (as nurulaini@melaka.gov.my)` |
| Notes.txt entries | Already follows this — `<ID>` line + `<email>` line |
| Recon Test Data row | `[ <ID> — <email> — <Tugasan> ]` — already canonical per CLAUDE.md Recon rules |
| Tables in chat | Column for `Pengguna_semasa` alongside ID column |
| Audit-log + post-mortem entries citing IDs | Same pairing |

**Special case — no active tugasan**: if the aplikasi has no active tugasan (e.g. closed-state or pre-creation), state explicitly: `<ID> (no active tugasan — closed/pre-creation)`.

**Source for pengguna_semasa** (the canonical task-state query, already in CLAUDE.md): join `umm_a_tgsn` ← `pcp_pengguna` via `pengguna_semasa_id`, filter `flag_aktif='Y'`. The `nama_pengguna` column on `pcp_pengguna` holds the email-style login.

**Failure modes if dropped**: みや tests with ID alone → "tiada dalam Senarai Tugasan Pengguna ini" error → round-trip to ask "as who?" → cycle wasted. Same root cause as the BA-prep-id-priority rule (2026-05-12) — test data without the login isn't actionable test data.

---

## Merged 2026-10-04: feedback_permohonan_holder_resolver (was feedback_permohonan_holder_resolver.md)

> 🚨 The permohonan id IS a queryable column: umm_aplikasi.id_pengenalan. NEVER hand back a test-scenario login from ticket text — resolve the live holder from the DB, on the RIGHT env, every time.

🚨 The permohonan id (PTMLK/02/L/PT/2026/3) is stored, queryable, on `umm_aplikasi.id_pengenalan`. It is NOT the applicant IC. Resolving the live holder is one query — never guess `turutan`, never say "not stored", never copy the login from the ticket Description.

Canonical resolver (run on the TARGET env's MCP: mlit=postgres-mlit-pg et_main_mlit · stg2=postgres-mlkstg-pg et_main_stg2 · stg1=postgres-mlkstg1-pg · prod=postgres-mlkprod-pg):
```
SELECT a.id_pengenalan, a.aplikasi_id, u.kod AS urusan,
       tg.nama AS tugasan, t.status_tugasan, p.nama_pengguna AS login, p.nama
FROM <schema>.umm_aplikasi a
JOIN <schema>.ind_ursn u ON u.ursn_id = a.ursn_id
LEFT JOIN <schema>.umm_a_tgsn t ON t.aplikasi_id = a.aplikasi_id AND t.flag_aktif='Y'
LEFT JOIN <schema>.ind_tgsn tg ON tg.tgsn_id = t.tgsn_id
LEFT JOIN <schema>.pcp_pengguna p ON p.pengguna_id = t.pengguna_semasa_id
WHERE a.id_pengenalan = '<PTMLK/...>';
```
- `login` = `pcp_pengguna.nama_pengguna` (the email). Utiliti/Pembatalan original permohonan = `umm_a_pembatalan.justifikasi_pembatalan`. AWAM creator = `umm_p_aplikasi.created_by`.
- 0 rows on one env → try the sibling envs and say "found on X, not on Y". The env in the scenario MUST equal the env queried.
- **Banned** (2026-09-17, #279711/#279787 — 5 rage rounds): a test-scenario login that was NOT returned by a live query this turn; login taken from the ticket `Env:`/reporter line; env assumed from the ticket instead of derived. Proof this works: `id_pengenalan='PTMLK/02/L/PT/2026/3'` on mlit → aplikasi 3398208, tugasan Penyediaan Laporan Pelukis Pelan, login azizah@melaka.gov.my — exactly what みや said. Pairs with (merged above) and CLAUDE.md "TEST SCENARIO = LIVE TASK STATE".

---

## Merged 2026-10-04: feedback_permohonan_id_not_aplikasi_id (was feedback_permohonan_id_not_aplikasi_id.md)

> NEVER use aplikasi_id to refer to a permohonan in chat / replies / docs / BA-facing text — use the permohonan id (PTMLK/...). aplikasi_id belongs ONLY inside SQL scripts

🚨 **Refer to a permohonan by its permohonan id (`PTMLK/02/L/PRBB/2026/12`), NEVER by `aplikasi_id`** — in chat, summaries, qa_docs, register rows, BA/handoff text, everywhere a human reads.

**The ONLY place `aplikasi_id` (e.g. 3440281) is allowed = inside a SQL script** (WHERE clause, id resolution). Even there, prefer resolving via `umm_aplikasi.id_pengenalan = '<permohonan>'` so the script reads by the permohonan id too.

**Why (2026-08-27, みや, firm)**: `aplikasi_id` is an internal DB key — meaningless to BA/PDT and to みや when he reads a reply. The permohonan id is the shared identifier everyone (officer, BA, Redmine) uses. Leading with the aplikasi_id makes the reply unreadable and forces a lookup.

**How to apply**: when a DB query returns an `aplikasi_id`, translate it back to the permohonan id for the reply. Keep the aplikasi_id only in the script/evidence block, not in the prose. Pairs with [[feedback_pengguna_semasa]] (every permohonan reference also carries its current pengguna login).

enforcement: hook-pending: reply-shape gate extension (aplikasi-id-in-prose detector)
