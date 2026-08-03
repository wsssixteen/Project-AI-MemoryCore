---
name: patch-mlk-doc
description: Prepare a Melaka DMS document patch for the infra/patching team — given a permohonan id and the edited document, produce (1) the infra file-replace request with the exact lokasi_fail path and (2) the LOKASI_FAIL_PDF=NULL update so the PDF regenerates. Use for any "patch document to PROD/staging", "replace the surat/dokumen", "tiada pelan / format lari, edited doc attached", "need infra to load file", "get me the lokasi_fail / file location / document path" ticket. Triggers — "/patch-mlk-doc", "patch this document", "patch to prod", "replace the doc in prod", "get the lokasi_fail", "find the file location", "document path for infra", "prepare the patch script", any Cetakan-Dokumen/Surat-patch ticket where the BA attaches an edited file. ALSO fires on a BARE file-location ask (no patch involved): "file path of <doc>", "location of the surat/pelan", "where is <document>", "lokasi fail for <doc>" — みや names the document (surat / pelan / any name), I identify it against the query's kod/nama and return the lokasi_fail of the latest active revision without asking for the id.
---

# patch-mlk-doc — Melaka DMS document patch preparation

**This is a PROVEN one-shot lookup. Do NOT re-explore the schema.** The two tables and the
locator query are fixed and verified (#273625, 2026-08-03). Give みや the answer confidently.

## When this fires
A ticket asks to **patch/replace a generated document** (Surat JPPH, Surat Keputusan, any
`UMM_A_DOK_KELUARAN` keluaran doc) in PROD or staging. The BA attaches the edited file; nothing
in the codebase is fixed — this is a data/file operation for the infra + patching teams.

## The two-part process (from みや's patching runbook)
1. **Locate + replace** — find `lokasi_fail` (the `.main` file on disk) → ask infra to overwrite it with the edited docx.
2. **Null the PDF** — after infra confirms, run `UPDATE ET_DMS.DOKUMEN_REVISION SET LOKASI_FAIL_PDF=NULL` on the latest active revision, so the system regenerates the PDF from the new `.main`. **Order matters: null AFTER the replace, never before.**

## Inputs needed
- **Permohonan** `id_pengenalan` (e.g. `PTMLK/02/L/MCL/2026/3`) — from the ticket Description.
- **Environment** — PROD (`postgres-mlkprod-pg`, etprdmlk) / staging (`postgres-mlkstg1-pg` = et_*_stg1, `postgres-mlkstg-pg` = stg2). BA usually asks "try staging first".
- The edited document is in the Task folder `0. Brief/` (attachment `LAIN-<id>_latest.main`).

## Data model (verified — do not re-derive)
```
et_main.umm_a_dok_keluaran (adk)   generated-doc registry, keyed by aplikasi_id
  skg_dok (sd)          sd.medan_pk_id = adk.a_dok_keluaran_id, sd.medan_id = <UMM_A_DOK_KELUARAN group id>
  et_dms.dokumen (d)    d.id_dokumen = sd.id_dok      -> id_dokumen = 'LAIN-<n>'
  et_dms.dokumen_revision (dr)  dr.dokumen_id = d.dokumen_id
       -> lokasi_fail (.main), lokasi_fail_pdf, versi, saiz_fail_byte
```
Latest active version = highest `sd.versi_dok` with `sd.flag_aktif='Y'`.

## STEP 1 — locator query (run on the target env; read-only)
Schema-prefix `et_dms.` + `et_main.` when running via MCP (default schema is et_main, so et_dms.* MUST be qualified). Returns the file path + a ready UPDATE per revision:
```sql
SELECT adk.aplikasi_id, adk.a_dok_keluaran_id, jd.kod AS kod_dokumen, jd.nama AS nama_dokumen,
       d.id_dokumen, dr.dokumen_revision_id, sd.versi_dok, sd.flag_aktif,
       dr.lokasi_fail, dr.lokasi_fail_pdf,
       ('UPDATE ET_DMS.DOKUMEN_REVISION SET LOKASI_FAIL_PDF=NULL WHERE DOKUMEN_REVISION_ID=' || dr.dokumen_revision_id || ';') AS update_stmt
FROM et_main.umm_a_dok_keluaran adk
LEFT JOIN et_main.umm_aplikasi ua ON ua.aplikasi_id = adk.aplikasi_id
LEFT JOIN et_main.rjk_senarai_ahli_kumpulan md ON md.kod = 'UMM_A_DOK_KELUARAN'
LEFT JOIN et_main.rjk_jns_dok jd ON jd.jns_dok_id = adk.jns_dok_id
LEFT JOIN et_main.skg_dok sd ON sd.medan_pk_id = adk.a_dok_keluaran_id
LEFT JOIN et_dms.dokumen d ON d.id_dokumen = sd.id_dok
LEFT JOIN et_dms.dokumen_revision dr ON dr.dokumen_id = d.dokumen_id
WHERE sd.medan_id = md.senarai_ahli_kumpulan_id
  AND ua.id_pengenalan = '<PERMOHONAN>'
ORDER BY adk.a_dok_keluaran_id, sd.versi_dok DESC;
```
Pick the row that matches the BA's document type (kod/nama) AND is the **latest active** (`flag_aktif='Y'`, highest `versi_dok`). That row's `lokasi_fail` + `dokumen_revision_id` are the deliverables.

## STEP 2 — deliverable to hand みや (Task folder `2. Fix/PATCH-REQUEST-<num>.txt`)
Two blocks he forwards:
```
STEP 1 - Hi infra, please replace this file in Melaka PROD with the attached edited doc:
<lokasi_fail>

STEP 2 - after infra confirms, patching team runs:
UPDATE ET_DMS.DOKUMEN_REVISION SET LOKASI_FAIL_PDF=NULL WHERE DOKUMEN_REVISION_ID=<id>;   -- 1 row updated
```

## Conventions (this skill is an EXCEPTION to two standing rules — audience is the patching team)
- **JOINs are allowed here** — the locator + patch queries mirror the patching team's own runbook format verbatim. The NO-JOIN rule (`convention-check-gate`) targets scripts みや reads to trace data; this output goes to infra/DBA who run it as-is. If writing to a `.sql` trips the gate, use `.txt` (matches the runbook shape) or bypass with reason.
- **The UPDATE stays schema-qualified `ET_DMS.`** — the patching team runs it connected to their own default schema; qualifying is their convention.

## Scaffolding this skill also owns
Task folder (`redmine-sync --create`) · notes file (`quest/notes.js`) · qa_doc with the deliverable · `active.txt` block `ticket_type=patch`. A patch ticket has NO code fix, NO branch, NO Scout/Recon/Rubric — it is data-only; skip the quest phases.

## Verified reference (#273625, PROD, 2026-08-03)
Permohonan `PTMLK/02/L/MCL/2026/3` -> SN_JPPH `LAIN-36816725`, rev `41110560`, versi 5 active ->
`/home/app/etanah/files/dms/SISTEM-FAIL/KELUARAN/LAIN-LAIN/2026/08/LAIN-36816725_1.main` ->
`UPDATE ET_DMS.DOKUMEN_REVISION SET LOKASI_FAIL_PDF=NULL WHERE DOKUMEN_REVISION_ID=41110560;`

> Fixture: `domain/patch-mlk-doc/eval.js` — asserts every load-bearing anchor (2 tables, join spine, both deliverables, order-guard, verified reference) still present.
