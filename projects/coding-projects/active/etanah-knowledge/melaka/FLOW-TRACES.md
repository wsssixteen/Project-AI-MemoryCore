# Melaka — Flow Traces
*End-to-end traces: UI → Bean → Service → Repository → DB*

> **SCOPE**: End-to-end traces of single user actions: UI → Bean → Service → Repository → DB, entry points **confirmed via breakpoint**. One trace per confirmed happy path.
> **NOT FOR**: Bug patterns (→ BUG-BESTIARY.md), hypothesis-tracking (→ `quest/handoff-<qa>.md`), unverified speculation.

> Each trace follows one user action through the full stack.
> This is the core learning output from ticket-driven work (Phase 5).

## Trace Template
```
### [Trace Name]
**Trigger**: [user action / page / button]
**XHTML**: [page file]
**Bean**: [managed bean class]
**Service**: [service method]
**Repository**: [repository call]
**DB**: [table(s) affected]
**Flow**: [step-by-step]
**Notes**: [anything surprising or non-obvious]
```

## Completed Traces

### Surat Jabatan Teknikal (SRTJK) — Word Template Population
**Trigger**: Officer generates Surat Jabatan Teknikal at PSJT/PGSJT step
**ACTUAL Entry Point** (confirmed via breakpoint 2026-04-10):
```
MlkSuratTemplateForm.initData() :184
  → BasePelupusanDokumenForm.populatePenyediaanDokumenByDocumentMode() :266
    → BasePenyediaanDokumenForm.initPenyediaanDokumen() :2227
      → initDokumen() :2254 → initPenyediaanMode() :2354
        → BasePelupusanDokumenForm.initNewDokumenList() :385
          → BasePelupusanDokumenForm.processTemplateList() :397
            → PelupusanTemplateUtil.processTemplatePropertyListConcurrently() :84
              → processTemplate() :317 → populateTemplate() :333
```
**⚠️ NOT the penyediaan surat strategy pattern** — `MlkPelupusanPenyediaanSuratStrategy` / `CommonPLPandBGNSuratStrategy` are NEVER called for SRTJK on this page.
**Template Config**: `config/MLK/template.config.json` — two SRTJK entries (general + PPTPB-specific using `TemplateSuratJabatanTeknikalPPTPB.docx`)
**CC Method Map**: `PelupusanWordCCMethodConstant.java` line 978 — maps `TAG_ALAMAT_JT` ("alamatJabatanTeknikal") → `populateAlamatJabatanTeknikal()`
**Address Render**: `populateAlamatJabatanTeknikal()` (line 11866) — reads `ajtList` → `ajt.getAgensi().getAlamat()` → builds `PelupusanWordStyleVO` array
**DB Tables**: `umm_a_jabatan_teknikal` (FK `aplikasi_id`, `agensi_id`) → `rjk_agensi` (has `alamat`, `alamat2-4`, `poskod`, FK `bandar_id`/`negeri_id` → `rjk_senarai_ahli_kumpulan`)
**Word Tag**: Content control = `"alamatJabatanTeknikal"` (despite displaying "Alamat Pemohon" text in template)
**Flow**:
1. `MlkPelupusanPenyediaanSuratStrategy` builds strategy list → SRTJK routed to `MlkPelupusanSuratStrategy(templateProperty)`
2. `PelupusanSuratStrategy.populateTemplate()` populates `ajtList` from UI jabatanVOList or DB fallback
3. `PelupusanTemplateUtil.retrieveContentControlMap()` builds CC map from `PelupusanWordCCMethodConstant`
4. `populateAlamatJabatanTeknikal()` reads `templateProperty.getAjtList()` → iterates agensi → builds alamat array
5. Word template `alamatJabatanTeknikal` tag gets populated

**Notes**:
- **CRITICAL**: `CommonPLPandBGNSuratStrategy` CANNOT handle SRTJK — no template mapping, and populates `"alamatJT"` tag (wrong). Only `PelupusanSuratStrategy` populates `"alamatJabatanTeknikal"` (correct).
- **Confusing constant names**: `TAG_ALAMAT_JT` = `"alamatJabatanTeknikal"` vs `TAG_ALAMAT_JABATAN_TEKNIKAL` = `"alamatJT"` — names are SWAPPED vs intuition.
- Two strategies exist: `CommonPLPandBGNSuratStrategy` (etanah-common, simpler, limited doc types) vs `PelupusanSuratStrategy` (etanah-pelupusan, uses TemplateConfig + CC method map, richer).
- Commit `c5229d6d32` (#241311, aaron, 2025-12-27) replaced TemplateConfig with hardcoded list using CommonPLPandBGN for 5 doc types. SRTJK was not in scope of that ticket.
- **FAT-OR #255637 fix**: Re-added SRTJK via TemplateConfig path alongside existing CommonPLPandBGN strategies.

---
*Last updated: 2026-03-24 (initial structure)*
