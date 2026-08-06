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

---

## Gantung blocks tugasan ENTRY — `status_proses` is a hard gate, not a label (2026-08-06, PROD)

**Symptom the officer sees**: the tugasan row IS in Senarai Tugasan, green and selectable, but
clicking it shows a yellow **Perhatian — "Permohonan ini digantung sementara menunggu keputusan
permohonan"** and the screen never opens.

**The gate** — `etanah-common\src\main\java\my\gov\etanah\common\notification\service\impl\DashboardService.java:1829-1851`:

```java
if (!MODUL_PENDAFTARAN.equals(modulKod)
    && StringUtils.isNotBlank(statusProses)
    && StatusProsesConstant.GANTUNG.equalsIgnoreCase(statusProses)   // <-- the gate
    && StringUtils.isNotBlank(taskCode)
    && !StringUtils.contains(taskCode, "PTB")) {
        MessageUtil.addFacesMessage("Perhatian", "Permohonan ini digantung sementara ...");
        return;                                  // HARD RETURN - langkah never opens
}
```

The `return` is the point. `umm_aplikasi.status_proses = 'Gantung'` **prevents entry** into any
non-Pendaftaran tugasan whose taskCode does not contain `PTB`. Do not dismiss it as a display value.

### How an application gets stranded there

```
UPP (Utiliti Pembatalan Permohonan) started on the parent
  MlkUtilitiPembatalanPermohonanForm.java:52
  -> BasePembatalanPermohonanForm.java:259-262
  -> CommonService.processGantungAplikasi():631   CommonService.java:652  SET Gantung

...officer completes only KMPPP (Kemasukan Maklumat Pembatalan) and the UPP flow ENDS
   (status Tamat / keputusan Batal) without reaching CommonMaklumanPembatalanForm

  -> CommonService.processDalamProsesAplikasi():709  CommonService.java:719  NEVER RUNS
  -> parent stays Gantung forever
```

**The clearer** is `CommonService.processDalamProsesAplikasi():709` (sets `statusProses` +
`statusKeputusan` + re-activates AppTugasan). Reachable from only three triggers, ALL on the
pembatalan flow: `CommonMaklumanPembatalanForm.java:732` / `:907`,
`PembatalanPermohonanService.processPembatalan():416`,
`ProcessBatalTarikBalikService.process():151`.

### Why the init-alter page cannot fix it

`InitiateBPMFlowableForm.bypassPermohonan():1022` works by `submitBpmOutcome(task)` — it completes an
EXISTING task. Once the UPP application is `Tamat`, there is no task left to submit, so the clearer
is unreachable. Re-initiating the flow on the PARENT creates another tugasan row and still writes
nothing to `status_proses` (that bean has no path to the column).

### Diagnosis recipe — no login needed

| Question | Query |
|---|---|
| stuck? | `SELECT status_proses, status_keputusan, version FROM umm_aplikasi WHERE id_pengenalan = '<PTMLK/...>';` |
| live task? | `SELECT a_tgsn_id, flag_aktif, status_tugasan, id_bpm_task FROM umm_a_tgsn WHERE aplikasi_id = (...) AND status_tugasan <> 'Selesai';` |
| which flow? | `SELECT aliran_kerja_id, process_instance_id, created_by, created_date FROM umm_aliran_kerja WHERE aplikasi_id = ...;` |
| who holds it? | `SELECT nama, nama_pengguna FROM pcp_pengguna WHERE pengguna_id = <pengguna_semasa_id>;` |
| which UPP suspended it? | match `umm_a_tgsn.last_modified_date` on the suspended row against the UPP application's `created_date` — they are the SAME SECOND |

**Two live `umm_aliran_kerja` rows on one application** = the flow was re-initiated. The old
`process_instance_id` may still be live in the Flowable engine, which is a SEPARATE datasource — no
`ACT_*` tables exist in the eTanah DB, so engine state cannot be checked from SQL.

### Fix

Revert-shape, single column, idempotent:

```sql
UPDATE umm_aplikasi
SET    status_proses = 'Awalan'
WHERE  id_pengenalan = '<PTMLK/...>'
AND    status_proses = 'Gantung';
-- 1 row updated
```

`Awalan` not `Dalam Proses`: `status_keputusan` stays `Awalan` (it never became Gantung), and
`Dalam Proses` appears on 2 rows in all of PROD vs `Awalan` on 9,335 of 9,347 PT applications.
Do NOT bump `version` — a running app may hold the entity at its current version.

**Companion check before patching**: the suspended tugasan row is usually already `flag_aktif='N'`
and a fresh active row already exists, so no companion write is needed. Verify, do not assume.

---

## PT Maklumat Tanah — the officer render chain, and why the LIST is not the DIALOG (2026-08-06, #273455)

**Screen**: `etanah-pelupusan\src\main\webapp\protected\mlk\common\MlkMaklumatTanahPemberimilikanForm.xhtml`
(the URL BA screenshots show). Appears at SKM, PSJT, PGSJT — the langkah is shared, so a fix here
lands on every tugasan that mounts it.

```
MlkMaklumatTanahPemberimilikanForm.xhtml
      |
      v  page load
PelupusanExcelReaderHelper.java:672-674          <- URS_PT branch
      |    :646-652 PSBS branch ALSO copies list.get(0) into maklumatTanahVO
      |    :672-674 PT branch does NOT. It fills maklumatTanahVOList ONLY.
      v
PelupusanService.populateMaklumatTanahVOListFromAppHakmilik():5093
      |    :5103 praAplikasi resolved
      |    :5105-5107 praMohonTanahList = PraPermohonanTanah   <- NOT PraHakmilik
      |    :5124 vo.setSempadanTanahList(populateSempadanJsonIntoVO(app row))
      v
populateSempadanJsonIntoVO():4335
      |    :4341 sempadanList key present -> parse the array
      |    :4373 key ABSENT -> populateMaklumatSempadanTanahVODirect():13116
      |         which needs legacy keys smpdnUtara/smpdnSelatan/smpdnTimur/smpdnBarat
      |         -> those keys do not exist on modern rows -> EMPTY LIST
      v
officer clicks "Kemas kini" on the lot row
      |
      v
PelupusanExcelReaderHelper.onKemaskiniPermohonanTanah():4229
      |    :4235-4236 maklumatTanahVO = tanahVO   <- REFERENCE assignment, not a copy
      |    :4242-4243 if row list non-empty -> copy into maklumatTanahVO
      |    :4244 else -> fall back to the legacy smpdn* keys
      v
mlkMaklumatTanahV3.xhtml:244
      #{cc.attrs.helperForm.maklumatTanahVO.sempadanTanahList}
```

### The three traps

1. **The dialog binds the SINGULAR `maklumatTanahVO`, not the list.** For PT nothing copies list ->
   VO at page load (`:674`), so anything you inject into the list rows is invisible **until the officer
   clicks Kemas kini**. A test scenario that says "open the panel" will show nothing and read as a
   failed fix. Always instruct the row click.
2. **`maklumatTanahVO = tanahVO` at `:4235` is a reference, not a copy** — so edits in the dialog
   mutate the list element directly. That is why the save works: `onSimpanTanah():3646` swaps the VO
   back into the list at `:3660-3664` and the PT branch at `:3675-3677` persists the whole list via
   `PelupusanService.saveMaklumatTanahVOIntoAppHakmilik():4434` -> `:4510` -> `:4518-4519`.
3. **An empty sempadan list is a real signal, not a default.** `populateSempadanJsonIntoVO` returns
   empty only when BOTH the `sempadanList` key and the legacy `smpdn*` keys are absent — which is
   exactly the counter-paid shape. `CollectionUtils.isEmpty(vo.getSempadanTanahList())` is therefore a
   safe guard for a read-side fallback.

### Blast radius of that populate method

**18 call sites** — 6x `PelupusanWordCCMethodConstant` (Word populators), 2x
`PelupusanExcelReaderHelper` (`:648` PSBS, `:674` PT), `PelupusanService:3780`, the interface, and
**2 TRG forms** (`web\form\common\trg\TrgSenaraiHakmilikTerlibatForm.java:57` and
`TrgKemasukanMaklumatLautForm.java:112`). TRG is hard-excluded from Melaka work, so any change here
needs an urusan gate. `PelupusanService` has **no** `PraHakmilik` access of its own by default — only
`PraHakmilikLain` is imported; the repository accessor exists on the locator
(`PelupusanSpocService.java:236` uses it) but the import must be added.
