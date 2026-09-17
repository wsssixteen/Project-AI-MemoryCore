---
name: feedback_permohonan_holder_resolver
description: "🚨 The permohonan id IS a queryable column: umm_aplikasi.id_pengenalan. NEVER hand back a test-scenario login from ticket text — resolve the live holder from the DB, on the RIGHT env, every time."
metadata:
  node_type: memory
  type: feedback
---

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
- **Banned** (2026-09-17, #279711/#279787 — 5 rage rounds): a test-scenario login that was NOT returned by a live query this turn; login taken from the ticket `Env:`/reporter line; env assumed from the ticket instead of derived. Proof this works: `id_pengenalan='PTMLK/02/L/PT/2026/3'` on mlit → aplikasi 3398208, tugasan Penyediaan Laporan Pelukis Pelan, login azizah@melaka.gov.my — exactly what みや said. Pairs with [[permohonan-id-not-aplikasi-id]] and CLAUDE.md "TEST SCENARIO = LIVE TASK STATE".
