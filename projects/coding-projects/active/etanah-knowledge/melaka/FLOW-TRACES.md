# Melaka — Flow Traces
*End-to-end traces: UI → Bean → Service → Repository → DB*

> **SCOPE**: End-to-end traces of single user actions: UI → Bean → Service → Repository → DB, entry points **confirmed via breakpoint**. One trace per confirmed happy path. Also document-generation flow rules (which tugasan triggers which document).
> **NOT FOR**: Bug patterns (→ BUG-BESTIARY.md), hypothesis-tracking (→ `quest/handoff-<qa>.md`), unverified speculation.

## Document generation rules

### Ringkasan Risalat MMKN vs Risalat MMKN PDT (added 2026-05-13)

**Plain explanation**: These are TWO different documents with confusingly-similar names. Ringkasan Risalat MMKN is a SUMMARY document generated at the PTG-side review tugasans. Risalat MMKN PDT is the actual brief generated at the PDT-side preparation tugasans. Don't conflate.

**Source of truth**: `src/main/resources/config/MLK/template.config.json` — literal tugasan-key check (NOT the lifecycle action arrays like CREATE/SEDIA/SEMAK/PERAKU; those are document-state transitions, not tugasan bindings).

| Document | Template files (per urusan) | Tugasan bindings | Document code |
|---|---|---|---|
| **Ringkasan Risalat MMKN** | `TemplateRingkasanRisalat*.docx` (default/PT/PSBS/PRZ/BPRZ/PPJK/PLTP/JKKL — 8 variants) | `PRMMKNPTG` + `PRMMKNPTGT` ONLY (PTG side + Tangguh variant) | `PLP_RNGKSN_RISALAT` |
| **Risalat MMKN PDT** | `TemplateRisalatMMKN_PDT_*.docx` (and `_PTG` variants per urusan) | `PRMMKNPDT` + variants (PDT side) | (different code — verify in template.config.json) |

**Verified via Sub-check 8c** (Recon's config-file tugasan-binding verification, added 2026-05-13): re-grepped `template.config.json` for each Ringkasan variant — all 8 variants bind ONLY to `PRMMKNPTG` + `PRMMKNPTGT`. Scout's earlier enumeration of PRMMKNPDT/SRMMKNPDT/etc. was extrapolated from the lifecycle action arrays, not from literal tugasan keys.

**Implications for tickets**:
- "Ringkasan Risalat MMKN" complaint → look at PTG-side tugasans (Penyediaan/Semakan/Perakuan Risalat MMKN PTG), NOT PDT-side
- "Risalat MMKN PDT" complaint → PDT-side tugasans
- The same .docx template can have CC tags shared across documents via the populator dispatch — but the GENERATION tugasan is template-config-bound, not populator-bound

**Reference**: `template.config.json:4151-4163` for PLTP variant; same line range pattern for other urusan variants nearby.

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
