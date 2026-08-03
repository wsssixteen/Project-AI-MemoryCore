---
name: reference_dms_document_patch
description: "Melaka DMS document-patch tickets (replace a generated Surat/dokumen in PROD) are a PROVEN one-shot lookup — use the /patch-mlk-doc skill, never re-explore et_dms"
metadata: 
  node_type: memory
  type: reference
  originSessionId: e5c3e396-9026-4dc2-87da-96bb67975bef
  modified: 2026-08-03T09:34:19.452Z
---

Any "patch/replace document to PROD/staging" ticket (Cetakan Dokumen, Surat JPPH, BA attaches an edited `LAIN-<id>_latest.main`) is handled by the **`/patch-mlk-doc` skill** — do NOT re-explore the `et_dms` schema; the tables + locator query are fixed and verified.

**Trigger — auto-retrieve on ANY "file path" / "location" ask (added 2026-08-03 per みや):** whenever みや asks for a document's **"file path"**, **"location"**, **"lokasi fail"**, or **"where is the file"** AND names the specific document (a surat / pelan / any doc name), immediately run the skill's locator query for that permohonan + document and return the `lokasi_fail` — do NOT ask for the numeric id, do NOT re-explore. I identify the doc from its name (Surat JPPH → `SN_JPPH`, Surat Keputusan, pelan, etc.) against the query's `kod`/`nama` columns. Pick the latest active revision by default. This is NOT limited to patch tickets — a bare "give me the file path of X" is enough.

Two-part process:
1. Locate `lokasi_fail` (the `.main` file) → infra replaces it with the edited docx.
2. After infra confirms → patching team runs `UPDATE ET_DMS.DOKUMEN_REVISION SET LOKASI_FAIL_PDF=NULL WHERE DOKUMEN_REVISION_ID=<id>;` on the **latest active** revision (highest `sd.versi_dok`, `flag_aktif='Y'`) so the PDF regenerates. **Null AFTER the replace, never before.**

Data spine: `et_main.umm_a_dok_keluaran` → `skg_dok` (medan_pk_id) → `et_dms.dokumen` (id_dokumen `LAIN-<n>`) → `et_dms.dokumen_revision` (lokasi_fail / lokasi_fail_pdf). Full locator query + runbook in the skill.

**Why (2026-08-03, #273625)**: みや had already given me the tables and asked for this skill previously; I re-explored the DMS schema from scratch for a lookup, wasting usage. He was right — this is proven knowledge, so it must live in a skill I invoke confidently, not a fresh explore each time. Skill born via forge; eval `domain/patch-mlk-doc/eval.js` guards the anchors. See [[feedback_fix_dont_reroute]] family — deliver from proven knowledge.
