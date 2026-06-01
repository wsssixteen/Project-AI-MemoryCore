# QA-260508 — Quest Preparation Verification (Phase 0)

**Ticket:** PT/PSBS/MCL — Panel maklumat plot dikeluarkan hakmilik — Tambah medan Zone + Pengkelasan Tanah pada panel Kadar Cukai Tanah
**Run:** 2026-06-01 (Phase 0 prep verification only — NO Scout/Apply)

## Preparation Table

| # | Context source | Status | Filename / path / evidence |
|---|---|---|---|
| 1 | active.txt block for QA-260508 | OK | block provided in task prompt; status=hold, env=unknown, phase=0, ticket_type=bug |
| 2 | Task folder + Notes file | OK | `1. Tasks\Melaka\50. QA #260508 - PT-PSBS-MCL...\` exists; `1. Notes.txt` (legacy name) present, 3 test apps recorded (PT/PSBS/MCL × 1 each with pengguna) |
| 3 | History.txt + Description.txt | OK | `0. Brief/History.txt` (5,103 B) read full; `0. Brief/Description.txt` (2,262 B) read full — BA spec captured Zone + Pengkelasan Tanah field add |
| 4 | BA attachments under 0. Brief/ | OK | 3 reference PNGs (`260508_*.png`) + 4 crop PNGs (`_crop_*.png`); no PDF/.docx/video → annotations skill n/a |
| 5 | QA-260508.md cycle-N section | not found | no `QA-260508.md` under task folder; would be created by Scout familiar |
| 6 | etanah-knowledge Always tier (5 files) | OK | `index.md` ✓ · `DOMAIN-GLOSSARY.md` ✓ · `MODULE-ARCHITECTURE.md` ✓ · `BUG-BESTIARY.md` ✓ · `DEFERRED-CRITICAL-ISSUES.md` ✓ — all 5 read ≥50 lines from main-repo path |
| 7 | etanah-knowledge Conditional (per layer) | partial | DATABASE.md indicated MANDATORY (data source `tkl_a_laporan_tnh::json->>'zone'` cited in BA spec); JSF-WIRING.md applicable (panel UI fix); FLOW-TRACES.md optional. Not pre-loaded this turn — would load at Scout. |
| 8 | DATABASE.md (if DB-touching ticket) | n/a-this-turn | DB-touching YES (`tkl_a_laporan_tnh.kedudukan_tanah` JSON column read; pelupusan write path TBD) — DEFERRED to Scout; flagged as required |
| 9 | BPMN flowable LOADED + SCOPE-CHECKED | OK | `MLK_PLP_PT.bpmn20.xml` + `MLK_PLP_PSBS.bpmn20.xml` + `MLK_PLP_MCL.bpmn20.xml` all loaded. Tugasan classification: PT `14.0 Penyediaan Risalat MMKN - PDT` + `18.0 Perakuan Pentadbir Tanah` = `<userTask>` (line 357, 404). PSBS `12.0 Penyediaan Risalat MMKN - PDT (PT)` + `16.0 Perakuan Pentadbir Tanah` = `<userTask>` (line 151, 337). MCL `30/31.0 Penyediaan/Pengesahan Senarai Semak Hakmilik Sementara` + `35/36.0 Hakmilik Tetap` = `<userTask>` (line 401, 406, 453, 458). All three urusan = **etanah-pelupusan** (`<userTask>`, NOT `MLK_TKL_*`). |
| 10 | Scope (module) confirmed | OK | **etanah-pelupusan (PLP)** — disambiguation source = **(a) BPMN classification** (all 3 affected tugasan are `<userTask>` in pelupusan, NOT `<callActivity MLK_TKL_*>`). Cross-confirmed by **(b) Permohonan IDs** (`PTMLK/01/L/PT/2026/129`, `PTMLK/03/L/PSBS/2025/5`, `PTMLK/01/L/MCL/2025/9`) all PLP-side. Data source `tkl_a_laporan_tnh.kedudukan_tanah` is teknikal table READ via populator — the **fix-site (UI panel + save path) is pelupusan**. |
| 11 | env-switch (/env-check) | not run | env=unknown in active.txt; status=hold — per `feedback_uat_fat_environments.md` "hold at ticket start suppresses env switch (parallel-session safety)". /env-check NOT executed this turn (Phase 0 verification only, no live work). |
| 12 | LIVE DB pengguna_semasa | not run | status=hold + no env target → MCP query not executed this turn. SQL form ready (`UMM_A_TGSN + IND_TGSN + UMM_ALIRAN_KERJA + PCP_PENGGUNA + IND_PEJABAT` with FLAG_AKTIF='Y') — would run at Scout end. |

## Scope synthesis (one-line)

3-urusan, multi-tugasan **enhancement** (add Zone + Pengkelasan Tanah fields, editable + mandatory) on shared panel "Maklumat Plot Untuk Dikeluarkan Hakmilik" + "Kadar Cukai Tanah" + "Maklumat Cukai Tanah". Fix lives in **etanah-pelupusan** (BPMN confirms all tugasan are `<userTask>`); data read from teknikal table `tkl_a_laporan_tnh.kedudukan_tanah` JSON; write path needs Scout.

## Standing flags (cross-check against DEFERRED-CRITICAL-ISSUES.md)

None of the 6 deferred-critical entries overlap QA-260508's scope_anchor (panel field-add, PT/PSBS/MCL, Kadar Cukai Tanah / Maklumat Plot panels). No standing flags surfaced.

---

## Recon (2026-06-01) — adversarial verification of Scout

### Description
Re-checked Scout's bug-site + class chain + DB claim against live files and live UAT DB; one claim refuted (wrong xhtml file as bug-site), one verified (TAG_* JSON write-pattern analog), DB schema + content verified for `zone` source.

### Universal Checks
`env ⏭ (hold+unknown — feedback_uat_fat_environments.md) · codebase-root ✓ (etanah-pelupusan confirmed) · blast-radius ✓ (3 urusan PT/PSBS/MCL × shared composites) · sibling-read ✓ (Jenis Tanah/Kelas Kegunaan rows in mlkMaklumatKadarCukaiTanah.xhtml:33-94 inspected) · ind_skrin ⏭ (n/a — composite components, not full screens) · ind_langkah ✓ (queried — no row matches "dikeluarkan hakmilik"; "plot" matches are Kuota Bumiputera screens, NOT the bug panel — the bug panel is a composite-include, not a top-level screen, so absence is EXPECTED) · pengguna-semasa ⏭ (hold) · CC-tag ⏭ (n/a — JSF panel fix, no Word template touched) · save-path ✗ (HYPOTHESIS — not yet traced; required at Rubric) · db-probed ✓ (kedudukan_tanah JSON + zone occurrence + tkl_a_laporan_tnh schema verified)`

### Live DB query result
- `ind_langkah` symptom-lookup: 32 rows for `%plot%`; ZERO rows for `%dikeluarkan hakmilik%`. Rows are all Kuota-Bumiputera screens (`MlkMaklumatKuotaBumiputeraForm.xhtml`, `MlkSuratTemplateForm.xhtml`) — **NOT** the bug panel. Reason: bug panel is a composite-include rendered inside a dialog, not registered as a standalone `ind_skrin`. Symptom→screen DB navigator returns nothing useful for composite-include bugs.
- `tkl_a_laporan_tnh.kedudukan_tanah`: `character varying`, 2,401 rows total, 1,908 non-empty, **367 contain `zone` key** (15.3%). Live sample rows confirm JSON-as-string format: `{"jalan":"...","kampungTempat":"...","zone":"G10","tiangTNB":"110/190",...}`. **Pengkelasan only matches 1 row** (`%pengkelasan%`) → effectively NEW key, not yet stored anywhere.
- `zone` as a column anywhere in `et_main_uat`: ZERO matches (only JSON-key occurrences). DDL write-path A would need a new column or new JSON key.

### Verification table

| # | Scout claim | Verdict | Evidence |
|---|---|---|---|
| 1 | Bug-site #1 = `mlkMaklumatKadarCukaiTanah.xhtml:28-147` (panel for PT/PSBS) LACKS Zone + Pengkelasan | **VERIFIED** (file is real, fields absent) — but **scope of "bug-site"** is REFUTED below | Re-read full file (237 lines). Fields Jenis/Tujuan/Penggunaan/Kegunaan/Butiran/Cukai exist; NO `zone`, NO `pengkelasan` — `grep -inE "zone\|pengkelasan"` returned 0 lines |
| 2 | Bug-site #2 = `mlkMaklumatCukaiTanahForm.xhtml:23-56` (Senarai Semakan for MCL) LACKS the fields | **VERIFIED** | Re-read full file (59 lines). 4 viewOnly outputText fields only (Kelas/Butiran/Jenis/Cukai); NO Zone/Pengkelasan |
| 3 | Class chain hop: `MlkMaklumatTanahPlpForm.xhtml:201-227 (Maklumat Plot dialog Kemaskini) → mlkMaklumatKadarCukaiTanah` | **REFUTED** | Read MlkMaklumatTanahPlpForm.xhtml:195-235 directly — the `plotDialogID` at line 201-227 (header "Maklumat Plot Untuk Dikeluarkan Hakmilik" — EXACT ticket title match) includes `mlkMaklumatPlotForm` at :206, **NOT** `mlkMaklumatKadarCukaiTanah`. Grep across `protected/mlk/` shows `mlkMaklumatKadarCukaiTanah` is included only in `MlkMaklumatPerserahanForm.xhtml:262`, NOT in this dialog. **Real bug-site for the ticket's "Panel maklumat plot dikeluarkan hakmilik" is `mlkMaklumatPlotForm.xhtml` (476 lines, also lacks zone/pengkelasan).** Scout conflated two distinct composites |
| 4 | Data source: `et_main_uat.tkl_a_laporan_tnh.kedudukan_tanah::json->>'zone'` | **VERIFIED** | Column exists (`character varying`); 367 of 2,401 rows contain `zone` key in stringified JSON; sample row `aplikasi_id=2884263` has `"zone":"G10"` |
| 5 | TAG_* JSON write-analog at `PelupusanPendaftaranService:450-453` for write-path B | **VERIFIED** (with caveat) | Read :430-465 — `TAG_PENGGUNAAN_TANAH` :446, `TAG_KEGUNAAN_TANAH` :451, `TAG_BUTIRAN_KEGUNAAN_TANAH` :453 confirmed. **Caveat**: this is a **READ** path (`retrieveSenaraiAhliKumpulanValueInJSON` from `eachAppMohonTnh.getMaklumatTambahan()`) → reads from `umm_a_permohonan_tnh.maklumat_tambahan` JSON, NOT from `tkl_a_laporan_tnh.kedudukan_tanah`. The pelupusan write-target would be `maklumat_tambahan` (PLP side), not `kedudukan_tanah` (TKL side). Sibling pattern is sound but Scout muddled which table holds the analog vs which holds the existing zone data |
| 6 | Pengkelasan Tanah dropdown source = `JNS_TNH_BPM` Sk Kod | **AMBIGUOUS / BA-Q** | `information_schema` search for `ind_jns*`/`sk_jns*`/`jns_tnh*` returned only `ind_jns_senarai_smkn_bsyrt` (irrelevant). No `JNS_TNH_BPM` table/sk_kod found in UAT. Only 1 row in entire `tkl_a_laporan_tnh` matches `%pengkelasan%`. BA-Q required: (a) free-text or dropdown? (b) if dropdown, source list? |
| 7 | Summary: "enhancement (NOT a bug)" | **VERIFIED** | active.txt has `ticket_type=bug` but BA spec (Description.txt + BA wording "Tambah medan" = add field) is purely additive — no broken existing behavior. Reclassify to `ticket_type=enhancement` at quest-update time |

### Arrows — actual data-flow (UI → code → table)

```
[UI panel — REAL bug-site for "Maklumat Plot Dikeluarkan Hakmilik"]
   MlkMaklumatTanahPlpForm.xhtml:201-227 (plotDialogID — Kemaskini)
        |
        ↓  (composite include at :206)
   ⚠️ mlkMaklumatPlotForm.xhtml  (476 lines — LACKS Zone + Pengkelasan)
        |
        ↓  (plotVO binding via cc.attrs.plotVO)
   plotVO (Java VO — class not yet located; HYPOTHESIS: MaklumatPlotVO / KawasanVO)
        |
        ↓  (save path TBD — Recon could not trace; Rubric must)
   ❓ either   umm_a_permohonan_tnh.maklumat_tambahan (JSON, pelupusan-side, write-path B analog)
        or    new column on umm_a_* (DDL write-path A)

[UI panel — Scout's original bug-site, separate from ticket symptom]
   mlkMaklumatKadarCukaiTanah.xhtml:28-147 (PT/PSBS panel) +
   mlkMaklumatCukaiTanahForm.xhtml:23-56 (MCL Senarai Semakan)
        |
        ↓  also lack Zone + Pengkelasan — likely IN-SCOPE per BA wording "Kadar Cukai Tanah" panel
        ↓  but distinct from "Panel maklumat plot dikeluarkan hakmilik"
   premiumCukaiVO / hakmilikVO

[Read-source for default value — VERIFIED in DB]
   tkl_a_laporan_tnh.kedudukan_tanah (varchar holding JSON)
        |
        ↓  ::json->>'zone'  (367/2401 rows have it)
   "G10" / "abcd" / free-text
```

### Summary

Scout had the right intuition (ABSENCE bug, 3 affected urusan, teknikal JSON as source) but cited the **wrong primary bug-site file**. The ticket symptom "Panel maklumat plot dikeluarkan hakmilik" maps to the `plotDialogID` dialog → `mlkMaklumatPlotForm.xhtml`, NOT `mlkMaklumatKadarCukaiTanah.xhtml`. Both files lack the fields, so the Rubric must decide whether BA wants the fields on (a) the Plot dialog only, (b) the Kadar Cukai panel only, or (c) both. The TAG_* JSON write-pattern at `PelupusanPendaftaranService:450-453` is a confirmed working analog but writes to `maklumat_tambahan`, not `kedudukan_tanah` — Rubric option B needs to mirror that, not pull directly from teknikal. Pengkelasan Tanah's source (dropdown vs free-text vs `JNS_TNH_BPM`) is BA-Q.

---

## Scout Emit (Stage 1) — recap from prior stage

**Description**: Scout located the panel XHTMLs, the VO (PelupusanMaklumatPremiumCukaiVO + PelupusanMaklumatPendaftaranHakmilikVO), the populator (PelupusanPendaftaranService.populateMaklumatPendaftaranHakmilik + PelupusanService.populatePremiumCukai*), the save sink (PelupusanService:4979-4996 writes to AppPermohonanTanah / umm_a_permohonan_tnh), and confirmed via LIVE UAT DB that (a) `tkl_a_laporan_tnh.kedudukan_tanah` holds JSON with optional "zone" key (samples 2962955/2962966/2962778), (b) NO existing zone/pengkelasan column anywhere in `et_main_uat`, (c) NO existing zone/pengkelasanTanah field in the VO — confirming NEW fields. BA's 3 test apps lack "zone" in `kedudukan_tanah` today (PT 2962184 = 8 other keys no zone; PSBS 2900183 = `{}`; MCL 2902384 = NULL) — fix must default-handle missing key.

### Scout file-reads table (17 cites, PROVEN/HYPOTHETICAL marked)

| # | file | line | kind | what-it-shows | verdict |
|---|------|------|------|---------------|---------|
| 1 | `mlkMaklumatKadarCukaiTanah.xhtml` | 1-237 | file-read | Kadar Cukai Tanah panel composite (PT/PSBS :28-147, MCL :149-235); ZERO zone/pengkelasan | PROVEN |
| 2 | `mlkMaklumatCukaiTanahForm.xhtml` | 1-58 | file-read | Senarai Semakan Pendaftaran panel (view-only, hakmilikVO); NO zone | PROVEN |
| 3 | `mlkMaklumatPlotForm.xhtml` | 1-120, 120-369, 400-475 | file-read | Plot dialog composite; calls mlkMaklumatKadarCukaiTanah at :432 + :445; plotVO.premiumVO bound | PROVEN |
| 4 | `MlkMaklumatTanahPlpForm.xhtml` | 200-227 | file-read | plotDialog wrapper "Maklumat Plot Untuk Dikeluarkan Hakmilik" — BA's "Klik Kemaskini → dialog" entry | PROVEN |
| 5 | `mlkMaklumatPendaftaranHakmilik.xhtml` | 1-43 | file-read | Senarai Semakan wrapper; calls mlkMaklumatCukaiTanahForm at :31 | PROVEN |
| 6 | `PelupusanMaklumatPremiumCukaiVO.java` | 20-90 | file-read | Panel-side VO; NO `zone`/`pengkelasanTanah` field — confirms NEW | PROVEN |
| 7 | `PelupusanMaklumatPendaftaranHakmilikVO.java` | 14-260 | grep | Senarai Semakan VO; setKelasTanah/setButiranKelasTanah/setKadarCukaiTanah; NO zone setter | PROVEN (grep-cite) |
| 8 | `PelupusanPendaftaranService.java` | 362, 442-456 | file-read | Senarai Semakan populator; :450/:452 uses retrieveSenaraiAhliKumpulanValueInJSON with TAG_KEGUNAAN_TANAH — analog for TAG_ZONE/TAG_PENGKELASAN | PROVEN |
| 9 | `PelupusanService.java` | 486, 4758-4761, 4979-4996, 6878-6960 | grep | Save sinks; :4979 setButiranKelasTanah; :4996 setKelasTanah from kawasanVO.getPremiumVO() | PROVEN (cite); HYPOTHETICAL (body context) |
| 10 | `AppLaporanTanahRepository.java` | 1-12 | file-read | findByAplikasi(Aplikasi) → AppLaporanTanah; entity on separate `domain` branch | PROVEN |
| 11 | `PelanTanahVO.java` (etanah-common) | 32, 213-217 | grep | Has `kedudukanTanah` String + setter; JSON-parsing analog | PROVEN |
| 12 | `et_main_uat.tkl_a_laporan_tnh` | columns | DB-MCP | `kedudukan_tanah` = character varying; samples confirm JSON shape; BA's PT 2962184 has NO zone key | PROVEN |
| 13 | `et_main_uat` full schema scan | – | DB-MCP | NO zone column anywhere — confirms NEW column/JSON-tag required | PROVEN |
| 14 | BA's 3 test apps `kedudukan_tanah` values | – | DB-MCP | PT 2962184: missing zone key; PSBS 2900183: `{}`; MCL 2902384: NULL — all 3 BA apps lack source data today | PROVEN |
| 15 | `mlkMaklumatPlotForm.xhtml` usages | – | grep | 9 forms (MlkMaklumatTanahPlpForm direct + 8 others) — composite blast radius | PROVEN |
| 16 | git log -20 of two suspect files | – | git-log | Recent QA-refs: #259342, QA #260955, #257239 (kadar-cukai churn area) — none on zone topic | PROVEN |
| 17 | etanah-pelupusan grep `zone\|pengkelasan\|kedudukanTanah` | – | grep | NO matches in pelupusan source — fields don't exist; must be added | PROVEN |

### Git history probe (Scout Step 0.5)

| SHA | rel-date | QA-ref | 1-line msg | signal-tag |
|-----|----------|--------|-----------|------------|
| ad5394b0af | recent | #256602 | mlkMaklumatPlotForm touch | file-overlap |
| e8489bb343 | older | UAT-CR #236562 | enhance formula pilihan premium | file-overlap |
| a5db50017d | older | #223344 | mlkMaklumatPlotForm touch | file-overlap |
| 3841ee0558 | recent | #259342 | mlkMaklumatKadarCukaiTanah touch | file-overlap |
| 01834057a5 | recent | QA #260955 | mlkMaklumatKadarCukaiTanah touch | file-overlap |
| 59015c69bf | recent | #257239 | 50% of #257239 | file-overlap |
| b74b23aeab | older | #259342 | mlkMaklumatKadarCukaiTanah touch | file-overlap |
| 326e96ffa4 | older | #256871 | rework | file-overlap |
| 46afc6288a | older | #256871 | kadar cukai touch | file-overlap |
| 49ed23eaaa | older | UAT-CR #236562 | enhance for urusan PT | file-overlap |
| – | – | none | git log --grep "260508" | none |
| – | – | none | git log --grep "dikeluarkan hakmilik" | none |

Recon should check whether #259342 or QA #260955 introduced structural change relevant to new-field convention.

### Class chain

```
                  ┌────────────────────────────────────────────────────────────────┐
                  │   PRESENTATION  (PT / PSBS / MCL)                              │
                  └────────────────────────────────────────────────────────────────┘
                                            │
        MlkMaklumatTanahPlpForm.xhtml:201-227   (Maklumat Plot dialog "Kemaskini")
                                            │
                                            ↓  (includes mlkMaklumatPlotForm)
        mlkMaklumatPlotForm.xhtml:430-451      (Maklumat Plot composite)
                                            │
                                            ↓  (calls mlkMaklumatKadarCukaiTanah twice — PT :445, NOT-PT :432)
        ⚠️ mlkMaklumatKadarCukaiTanah.xhtml:28-147   (NO Zone · NO Pengkelasan)
            │
            ↓  (parallel — Senarai Semakan path for MCL)
        MlkSenaraiSemakanPendaftaranHakmilikForm  →
        mlkMaklumatPendaftaranHakmilik.xhtml:30-34 →
        ⚠️ mlkMaklumatCukaiTanahForm.xhtml:23-56     (NO Zone · NO Pengkelasan)
                                            │
                  ┌────────────────────────────────────────────────────────────────┐
                  │   POPULATOR (read-path)                                        │
                  └────────────────────────────────────────────────────────────────┘
                                            │
        PelupusanService.populatePremiumCukai*
        PelupusanPendaftaranService.populateMaklumatPendaftaranHakmilik:362
                                            │
                                            ↓  (analog at :450-453: TAG_KEGUNAAN_TANAH JSON)
        retrieveSenaraiAhliKumpulanValueInJSON(eachAppMohonTnh.getMaklumatTambahan(), TAG_*)
                                            │
                                            ↓  (alt path — BA hint)
        AppLaporanTanahRepository.findByAplikasi(aplikasi)
                                            │
                                            ↓  (parse kedudukan_tanah::json->>'zone')
        ⚠️ NEW JSON-parse — must handle missing "zone" key (BA test apps lack it)
                                            │
                  ┌────────────────────────────────────────────────────────────────┐
                  │   PERSISTENCE (write-path)                                     │
                  └────────────────────────────────────────────────────────────────┘
                                            │
        PelupusanService:4979-4996          (apt.setButiranKelasTanah / setKelasTanah / setKadarCukaiTanah)
                                            │
                                            ↓
        et_main_uat.umm_a_permohonan_tnh    (NO zone column, NO pengkelasan column)
                                            │
                                            ↓  TWO candidate write paths:
        path A: DDL — add columns zone / pengkelasan to umm_a_permohonan_tnh
        path B: REUSE maklumat_tambahan JSON via new TAG_ZONE / TAG_PENGKELASAN
                                            │
                                            ↓
        ⚠️ Path B = smallest-change + in-file-convention (Etanah Non-Negotiable #2)
```

**Bug site**: `mlkMaklumatKadarCukaiTanah.xhtml:28-147` (PT/PSBS panel) + `mlkMaklumatCukaiTanahForm.xhtml:23-56` (MCL Senarai Semakan) — both LACK Zone + Pengkelasan entirely. Bug-site is ABSENCE, not breakage. Source data lives at `et_main_uat.tkl_a_laporan_tnh.kedudukan_tanah::json->>'zone'` (DB-confirmed). NOTE: Recon refuted this as the PRIMARY bug-site for the ticket title "Panel maklumat plot dikeluarkan hakmilik" — the real primary is `mlkMaklumatPlotForm.xhtml` (Scout conflated two distinct composites).

**Honesty audit**: Files actually Read (full or partial): mlkMaklumatKadarCukaiTanah.xhtml (full 237), mlkMaklumatCukaiTanahForm.xhtml (full 58), mlkMaklumatPlotForm.xhtml (~340 of 475), MlkMaklumatTanahPlpForm.xhtml (180-240 partial), mlkMaklumatPendaftaranHakmilik.xhtml (full 43), PelupusanMaklumatPremiumCukaiVO.java (1-90), AppLaporanTanahRepository.java (full 12), PelupusanPendaftaranService.java (420-480). Grep-only (NOT body-read): PelupusanService.java (cite PROVEN at line, body HYPOTHETICAL), PelupusanMaklumatPendaftaranHakmilikVO.java (grep-only), MlkSenaraiSemakanPendaftaranHakmilikForm.java (filename + grep — role INFERRED). Domain entities NOT read (separate `domain` branch). BPMN files relied on Stage 0 classification. RecursiveLoopDetector fired 2× — judged noise (legitimate chain-trace + SQL column-correction). Canonical auto-pengguna SQL did NOT execute successfully (3 column-name errors; stopped retrying since Notes file already had BA-provided logins).

**Summary**: Enhancement (not bug — pure additive). Recon focus: (1) write-path A vs B decision; (2) read source — pure teknikal pull vs editable-with-default; (3) Pengkelasan dropdown source (JNS_TNH_BPM was BA's hint); (4) sibling-check Jenis/Kelas rows at mlkMaklumatKadarCukaiTanah.xhtml:33-94 as new-field wiring template.

---

## Rubric Emit (Stage 3) — recap (NOTE: prior stage output was truncated mid-table — full content not available)

**Description**: Read-path traced (pelupusan reads JSON tags from `umm_a_permohonan_tnh.maklumat_tambahan` via `retrieveSenaraiAhliKumpulanValueInJSON`); write-path traced (`PelupusanService.savePermohonanTanah` → `JsonObject.addProperty` → `apt.setMaklumatTambahan` via `GsonUtil.convertToJson` at :622). Sibling-pattern for new field wiring = the kategoriTanah/kelasTanah/butiranKelasTanah trio (`TAG_PENGGUNAAN_TANAH` / `TAG_KEGUNAAN_TANAH` / `TAG_BUTIRAN_KEGUNAAN_TANAH`) — ~90% analog. Pengkelasan Tanah dropdown source REFUTED for the `JNS_TNH_BPM` hypothesis; no `rjk_senarai_kumpulan` group matches → BA-Q required. Scope category = PLP (pelupusan).

### Rubric (a) Blast Radius — affected constants

| Constant (file:line) | Members | Relevance |
|---|---|---|
| `URUSAN_VIEW_PLOT_SECTION_PANEL_LIST` (PelupusanUrusanConstant.java:99-105) | PSBS, PT, PS, PLPS, MLPS, PRU, PRBB, OPLPS, OMLPS, OPRU, OPRBB, OPLBP, OPPJK, OPLPRU, PRZ, BPRZ, PLTP, UPL, UPP (19) | Composite renders for ALL 19; fix MUST urusan-branch with PT/PSBS/MCL to avoid silent exposure in 16 others |
| `URUSAN_PEMBERIMILIKAN_PERSERAHAN_LIST` (:110-111) | PSBS, PT, PLTP, MCL (4) | Closer semantic match — includes 3-of-3 ticket urusan + PLTP. Possibly cleaner branch-list pending BA confirm on PLTP |
| `URUSAN_RELATED_DATA_GIS_LIST` (:107-108) | PSBS, PT (2) | If Zone is GIS-sourced, natural read-side overlap; MCL NOT in it → MCL's Zone source differs from PT/PSBS GIS feed → BA-Q for MCL |

Silent-miss risk (17 urusan): PS, PLPS, MLPS, PRU, PRBB, OPLPS, OMLPS, OPRU, OPRBB, OPLBP, OPPJK, OPLPRU, PRZ, BPRZ, PLTP, UPL, UPP. **Verdict**: branch by `cc.attrs.mbb.aplikasi.urusan.kod in (PT, PSBS, MCL)` directly in xhtml, NOT a constant set (narrow ad-hoc scope; new shared constant invites future drift).

### Rubric (b) Sibling working analog (file:line read)

| Sibling | What it does | Why ~90% analog |
|---|---|---|
| `mlkMaklumatKadarCukaiTanah.xhtml:32-94` | Renders Jenis Tanah / Tujuan / Penggunaan / Kegunaan Tanah (selectOneMenu, listener=#{cc.attrs.helper.onChangeKadarCukai}, process=@this, update=..., required=true, mode-conditional isMandatory/viewOnly) bound to `#{cc.attrs.premiumCukaiVO.<field>}` | Identical JSF discipline — direct copy-template for two new selectOneMenu rows; `Kegunaan Tanah` (:84-91) is the most polished |
| `PelupusanPendaftaranService.java:445-453` | Read-path: `vo.setKategoriTanah(retrieveSenaraiAhliKumpulanValueInJSON(eachAppMohonTnh.getMaklumatTambahan(), PelupusanConstant.TAG_PENGGUNAAN_TANAH))` + siblings for `TAG_KEGUNAAN_TANAH` (:451) + `TAG_BUTIRAN_KEGUNAAN_TANAH` (:453) | Direct ~90% analog: same util reads from `maklumat_tambahan` JSON; need NEW `TAG_ZONE` + `TAG_PENGKELASAN` constants on same pattern |

**NOTE — full Rubric truncated**: prior-stage output cut mid-table-(b). Candidate fix table (c) (2-5 options w/ CHOSEN), Falsifier+Logger row (d), Confidence% justification (e), and Stopping state were NOT captured in the upstream JSON. They are flagged as **incomplete-rubric** in the compliance matrix below.

**Chosen candidate** (inferred from Recon + Rubric direction): write-path B (TAG_ZONE / TAG_PENGKELASAN under `umm_a_permohonan_tnh.maklumat_tambahan` JSON), xhtml branching by urusan-kod directly, sibling-mirror Kegunaan Tanah row pattern. Pengkelasan source = BA-Q (free-text vs dropdown).

**Confidence**: ~70% (inferred — explicit justification missing from upstream Rubric). Not-higher reason: Pengkelasan dropdown source unresolved (BA-Q); BA's 3 test apps all lack source data in `kedudukan_tanah`. Not-lower reason: bug-site, sibling analog, read+write path all verified against live code and live DB.

**Falsifier**: Not emitted in upstream Rubric (gap).
**Logger spec**: Not emitted (gap).

**Stopping state**: hold — BA-Q (Pengkelasan source + scope confirmation Plot-dialog vs Kadar-Cukai panel vs both) outstanding before any Apply.

**Summary**: Rubric direction is sound (write-path B + urusan-kod branching + sibling-mirror) but the Stage 3 output is incomplete — Falsifier, Logger one-liner, Confidence% justification, and final candidate table were truncated/not produced. Apply is correctly blocked pending BA-Q.

---

## Compliance Matrix (Stage 4 audit)

Canonical template parts per `quest-protocol.md` §10 Canonical Phase Emit Template: **Description / Table / Arrows / Summary**. Plus 4 quest-protocol asks: Predicate Diagram · Per-file sibling-diff line · Falsifier+Logger row · Confidence% justified.

| Phase | Description | Table | Arrows | Summary | Predicate Diagram | Sibling-diff line | Falsifier+Logger | Confidence% justified |
|---|---|---|---|---|---|---|---|---|
| Stage 0 — Quest Preparation Verification | ✓ | ✓ (12-row prep table) | n/a | ✓ (scope synthesis one-line) | n/a (no edit) | n/a (no edit) | n/a | n/a |
| Stage 1 — Scout | ✓ | ✓ (17-row file-reads + git-probe table) | ✓ (vertical class chain w/ ⚠️) | ✓ | ✗ (no Predicate Diagram — even placeholder shape) | ⚠ (Recon refuted bug-site — Scout did NOT diff vs sibling include before claiming primary file) | n/a (Scout phase) | n/a (Scout phase) |
| Stage 2 — Recon | ✓ | ✓ (7-row verification + scout-claims-audit) | ✓ (UI→code→table two-flow) | ✓ | ✗ (no Predicate Diagram emitted) | ⚠ (sibling Read happened — Jenis/Kegunaan rows at :32-94 — but the emit-line verbatim `<file:line> ← sibling <file:line>: attrs ✓ · listener-sig ✓ · VO-instance ✓ · lifecycle ✓` was NOT produced) | n/a (Recon phase) | n/a (Recon phase) |
| Stage 3 — Rubric | ✓ | ⚠ (blast-radius + sibling rows present; candidate-fix row (c) + Falsifier+Logger row (e) + Confidence% row (f) TRUNCATED in upstream output) | ⚠ (only inherited from Recon — no Rubric-specific arrows) | ⚠ (truncated) | ✗ (no Predicate Diagram emitted — Rubric should have produced the 3-node ASCII before Apply, even though Apply was banned) | ✗ (sibling-diff verbatim line NOT emitted) | ✗ (Falsifier + `QA260508-PROBE:` logger one-liner missing) | ✗ (no explicit % + "why this, not higher / not lower" rationale in captured output) |

**Predicate Diagram present?** ✗ across all stages — even the placeholder shape (`[ASSUMPTION placeholder] → [EVIDENCE placeholder] → [FALSIFIER placeholder]`) per the v1.48 rule was not emitted. Hardest miss.

**Per-file sibling-diff line emitted?** ✗ — neither Scout nor Recon nor Rubric produced the canonical verbatim line. Scope was Phase 0 (no Apply) which softens this slightly, but the rule per CLAUDE.md is per-file at edit-time AND the rule explicitly says "archived-ticket/compliance/audit mode does NOT exempt".

**Falsifier+Logger row present?** ✗ — Rubric row (e) missing.

**Confidence% justified?** ✗ — Rubric row (f) missing; inferred 70% by Stage 4 audit from available evidence.

## Aggregate Observations

### Hook taxonomy

Tally across 4 stages' tool_call_log (~70 logged tool calls):

| Judgment | Count | Notable instances |
|---|---|---|
| **silent** | ~55 | Bulk of Read / Grep / DB queries — hooks did not fire / no injected guidance. Expected behaviour for routine reads. |
| **helpful** | 7 | (a) DB error text "column id_pengenalan does not exist" guided correct retry (Recon); (b) DB schema/sample probes that surfaced "BA's 3 test apps lack zone key in JSON today" (Scout) — a real adversarial finding; (c) MCP postgres error on tkl_a_laporan_tnh column-name confusion guided correction; (d) grep on PelupusanService :4979-4996 mapped save sinks; (e) PelupusanPendaftaranService :450-453 grep surfaced TAG_KEGUNAAN_TANAH analog. |
| **noise** | 4 | (a) MCP server instructions + Auto Mode banner injected AFTER first Bash result (Stage 0) — late injection makes early-plan factoring harder; (b) RecursiveLoopDetector fired on legitimate chain-trace across DIFFERENT files (Scout) — false positive; (c) RecursiveLoopDetector fired on SQL column-name correction loop — true positive but redundant since Notes file already had BA logins; (d) PelupusanConstant.java grep at guessed path failed — "No such file" was non-blocking but added noise. |
| **interfered** | 1 | `codegraph_search` against E:\Projects\Melaka\etanah-pelupusan returned "not initialized" (Recon) — CLAUDE.md preaches codegraph-first but etanah isn't indexed; forced fallback to Read/Grep. Not blocking but adds latency + cognitive overhead. |

### Redundancy signals

- **etanah-knowledge Always-tier load**: Stage 0 read all 5 files (≥50 lines each). Stage 1 (Scout) did not re-read them but neither did it cite them explicitly — risk of "loaded but unused" tier load. Stages 2+3 also did not re-engage Always-tier despite each phase's nominal independence.
- **BPMN classification**: Stage 0 loaded + grepped all 3 BPMN files. Stages 1-3 did not re-verify but correctly inherited the classification — efficient reuse, no redundancy here.
- **`mlkMaklumatKadarCukaiTanah.xhtml`**: Read by Scout (1-237 full) AND re-read by Recon (full 237) to refute Scout's bug-site claim. Recon's re-read was necessary for adversarial verification — not wasteful redundancy, but a *protocol-justified* re-read.
- **`tkl_a_laporan_tnh` column schema**: Queried by Scout (column list + samples) AND by Recon (COUNT + zone-occurrence + pengkelasan-occurrence). Different angles, not redundant per se — Scout focused on shape, Recon on statistical prevalence (367/2401).
- **`MlkMaklumatTanahPlpForm.xhtml:201-227`**: Scout cited it as part of class chain WITHOUT actually reading it. Recon then Read 195-235 directly to refute Scout's "→ mlkMaklumatKadarCukaiTanah" hop. This is exactly the failure mode "Scout cited what it didn't read" — should have surfaced in Scout's honesty audit (it did, partially — Scout noted MlkMaklumatTanahPlpForm.xhtml as "180-240 partial").

### Friction points

- **CodeGraph not initialized for etanah codebase** — global CLAUDE.md says "prefer codegraph over grep" but the etanah subdirs (etanah-pelupusan/teknikal/awam/common) aren't indexed. Every codegraph_* call in etanah work will return "not initialized" and force Read/Grep fallback.
- **Domain entities on separate git branch** — `AppLaporanTanah`, `AppPermohonanTanah`, `AppMohonTanah` live on a `domain` branch of etanah-common, absent from the working tree. "Entity-first SQL" rule per CLAUDE.md §9 effectively cannot be satisfied for these classes without a `git show domain:path/Entity.java` step.
- **Canonical auto-pengguna SQL columns don't match `et_main_uat`** — Scout hit 3 column-name errors trying to run the canonical join (umm_aliran_kerja has no a_tgsn_id; umm_a_tgsn has pengguna_semasa_id not pengguna_id; pcp_pengguna has no email_rasmi). Canonical SQL needs a schema-validation pass.
- **`ind_langkah` symptom→screen navigator is bounded to top-level screens** — Recon ran the v1.48 navigator query (`%dikeluarkan hakmilik%` + `%plot%`) and got zero useful rows because the bug panel is a composite-include rendered inside a dialog, not a standalone `ind_skrin`. Navigator's utility for composite-include bugs is nil.
- **3-urusan ticket → multi-BPMN classification** — Stage 0 had to load + grep 3 separate BPMN files because the ticket spans PT/PSBS/MCL, each with different tugasan keywords. First MCL grep used PT/PSBS keywords and returned zero matches — could have led to false `bpmn-not-found` if Stage 0 had stopped there.
- **Stage 3 (Rubric) output truncated in upstream JSON** — final candidate-fix table, Falsifier+Logger row, and Confidence% justification not captured. Either Rubric never produced them (a real gap) or transport truncation lost them (a harness gap). Either way, Stage 4 cannot grade what isn't there.
- **`ticket_type=bug` in active.txt is wrong** — BA spec is purely additive ("Tambah medan"). Phase 0 + Recon both flagged for reclassification to `enhancement`; no automated path to flip it without an active.txt edit (banned this run).
- **BA's 3 test apps all lack source data today** — fix that "tarik dari teknikal" will display blank/null for all 3 BA-provided test permohonan IDs unless test cycle pre-populates `kedudukan_tanah.zone` first. Cross-stage finding the protocol doesn't have a structural place to surface.

### Refinement candidates

1. **Force Predicate Diagram emit at Recon and Rubric phases, not only at pre-Edit** — even in audit/compliance/Phase-0-only runs, emit the 3-node placeholder shape per v1.48 rule. Add to the forced-emit gate so it's mandatory in `quest-phase0` workflow runs.
2. **Force the verbatim sibling-diff line at every phase that names a sibling** — Recon named `mlkMaklumatKadarCukaiTanah.xhtml:32-94` as the JSF analog and Rubric named `PelupusanPendaftaranService:445-453` as the read-path analog. Both qualified for the verbatim emit-line `<file:line> ← sibling <file:line>: attrs ✓ · listener-sig ✓ · VO-instance ✓ · lifecycle ✓` and neither produced it. Make this a hard gate at Rubric close.
3. **Add multi-urusan branch to BPMN-FIRST rule** — current §10 phrasing "BPMN file matching the urusan code" implies single-urusan. For 2+ urusan tickets, mandate loading ONE BPMN per urusan and classifying ALL their tugasan separately (Stage 0 did this correctly by initiative but the protocol didn't explicitly require it).
4. **Add real-data-presence adversarial check at Recon** — "when BA names a source field, query a real-data sample to confirm the field is actually populated in the test apps". This Recon check would have surfaced "BA's 3 test apps lack the zone key" earlier and converted it into a Recon falsifier rather than a buried Scout footnote.
5. **Schema-validate the canonical auto-pengguna SQL OR mark it as schema-of-record drift** — Scout hit 3 column-name errors. Either fix the canonical SQL in CLAUDE.md §10 against actual `et_main_uat` columns, or add a "auto-pengguna SQL is schema-drift-sensitive; verify columns before first execution" note.
6. **Soft-skip auto-pengguna SQL when Notes file is fresh and logins are populated** — Scout correctly stopped retrying after 3 errors because Notes had BA logins; codify this as "auto-pengguna SQL is skippable when Notes file ≤1d old AND login fields populated".
7. **Stage 3 Rubric must always emit all 6 sub-rows** — current upstream truncation suggests Rubric stopped mid-table-(b). Either harden the Rubric template to "all 6 rows or fail" or add a structural validator at the Rubric close gate.

## Harness Health

**Verdict: PARTIAL**

Reasoning:
- ✓ Stage 0 + 1 + 2 produced canonical 4-part template emits cleanly; banned tool calls (Edit on source/active.txt/git mutating ops) stayed banned across all 4 stages.
- ✓ BPMN-FIRST module-scope check (v1.48 hard rule) executed correctly at Stage 0 — disambiguation source named (a=BPMN primary + b=Permohonan ID cross-confirm), all 3 BPMN files loaded + classified.
- ✓ Adversarial Recon worked as designed — refuted Scout's bug-site claim with file-Read evidence, caveated TAG_* analog, marked Pengkelasan source as BA-Q rather than fabricating.
- ✓ Honesty primitives held — Stage 1 explicit honesty_audit listed grep-only vs Read; Stage 2 marked save-path as HYPOTHESIS; Pengkelasan dropdown source called BA-Q not invented.
- ⚠ Stage 3 Rubric output truncated mid-table — either Rubric phase produced incomplete emit (real gap) or pipeline truncation lost rows (harness gap). Stage 4 cannot distinguish without re-running.
- ⚠ Predicate Diagram missing from ALL stages (Recon + Rubric should have at least placeholder shapes per v1.48 rule).
- ⚠ Verbatim sibling-diff line missing from all stages despite siblings being named explicitly in Recon + Rubric.
- ⚠ CodeGraph not initialized for etanah codebase — global CLAUDE.md guidance routinely fails for this codebase; not the harness's fault but the harness didn't pre-empt the friction.

Net: workflow harness COMPREHENDED guardrails and BANNED operations stayed banned (good); canonical 4-part template substantially honoured Stage 0-2 (good); Stage 3 Rubric incomplete + v1.48 Predicate Diagram + sibling-diff verbatim line gaps across phases pull this from PASS to PARTIAL.
