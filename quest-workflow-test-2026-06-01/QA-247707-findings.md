# QA-247707 — Quest Phase 0 Workflow Test Findings (Batch-2)

> Run-tag: quest-phase0-test-batch2 · 2026-06-01 · Refinements R1-R6 applied · NO Apply, NO code changes

## Quest Preparation Verification (Stage 0)

| Context source | Loaded | Filename / path / evidence |
|---|---|---|
| active.txt block for QA-247707 | ✓ | block read from prompt; status=hold, phase=0, ticket_type=bug, env=unknown |
| Task folder + 1. 247 707.txt + 0. Brief/History.txt | ✓ (Notes EMPTY) | folder = `1. Tasks\Melaka\55. QA #247707 - PRZ - Penambahbaikan...`; `1. 247 707.txt` exists but **0 bytes** — no prior test data; `History.txt` read fully (132 lines, full Redmine journal Feb→May 2026) |
| BA attachments (photos / .pdf / .docx / video) | ✓ | `0. Brief/`: `1. QA #247707.png`, `2. QA #247707.png`, `Skrin Risalat.png`, `Description.txt`, `History.txt` — no PDF (annotations skill n/a) |
| QA-247707.md cycle-N section | ⏭ n/a | not in scope of this Phase 0 prep — would be created at Scout |
| etanah-knowledge Always tier (5 files) | ✓ | Loaded: `index.md` ✓ · `DOMAIN-GLOSSARY.md` ✓ · `MODULE-ARCHITECTURE.md` ✓ · `BUG-BESTIARY.md` ✓ · `DEFERRED-CRITICAL-ISSUES.md` ✓ (each ≥50 lines, present in worktree) |
| etanah-knowledge Conditional (per ticket layer) | ⏭ deferred | layer = Word .docx template + populator + XHTML — would load `JSF-WIRING.md` + Word-template lookup via `PelupusanWordCCMethodConstant.java`; deferred from this prep step |
| DATABASE.md loaded (DB-touching?) | ⏭ likely n/a | ticket = template phrase mapping + XHTML field + read-only behavior; DB columns probably not added (Syor Permohonan likely persisted to existing syorKeputusan/perakuan column) — confirm at Recon |
| BPMN flowable LOADED + SCOPE-CHECKED before Scout | ✓ | `MLK_PLP_PRZ.xml` loaded; all 5 tugasan kods (PRMMKNPDT, PRMMKNPTG, SRMMKNPDT, SRMMKNPTG, PRRMMKNPTG) classified as `<userTask>` → pelupusan-userTask scope; NO `MLK_TKL_*` callActivity |
| Scope (module) confirmed | ✓ | source **(a)** BPMN classification — all tugasans are `<userTask>` in MLK_PLP_PRZ.xml; reinforced by **(b)** permohonan ID `PTMLK/01/L/PRZ/2026/23` prefix from History.txt — PRZ urusan, PT/KPT/PPD/KPPD/KS/PTG peranans = all PLP-side; module = **etanah-pelupusan** |
| env-switch (`/env-check` skill) | ⏭ deferred | active.txt env=unknown; History.txt cycle-1 tested on MLKFAT; would switch to FAT at quest start (skill not invoked in this prep scope) |
| LIVE DB pengguna_semasa | ⏭ deferred | canonical SQL deferred from prep table; resolved partially at Recon (env=UAT, pengguna_semasa aborted on schema-drift) |

### BPMN classification (R4 array)

| Urusan | BPMN file cite | Kod grepped | Classification | Evidence file:line |
|---|---|---|---|---|
| PRZ (PDT — PRMMKNPDT) | MLK_PLP_PRZ.xml | PRMMKNPDT (Penyediaan Risalat MMKN - PDT) | pelupusan-userTask | MLK_PLP_PRZ.xml:285-288 — `<userTask>` name="23.0 Penyediaan Risalat MMKN - PDT" + `flowableTaskListener.receiveUserTask("PRMMKNPDT","PT",task.id)` |
| PRZ (PTG — PRMMKNPTG) | MLK_PLP_PRZ.xml | PRMMKNPTG (Penyediaan Risalat MMKN - PTG) | pelupusan-userTask | MLK_PLP_PRZ.xml:380-383 — `<userTask>` name="29.0 Penyediaan Risalat MMKN - PTG" + `receiveUserTask("PRMMKNPTG","PT",task.id,"pejabatKod=00")` |
| PRZ (Semakan PDT — SRMMKNPDT) | MLK_PLP_PRZ.xml | SRMMKNPDT (Semakan Risalat MMKN - PDT, KPT/PPD/KPPD) | pelupusan-userTask | MLK_PLP_PRZ.xml:296-308 — `<userTask>`s 24.0/25.0/26.0 Semakan + `receiveUserTask("SRMMKNPDT","KPT\|PPD\|KPPD",task.id)` |
| PRZ (Semakan PTG + Perakuan PTG) | MLK_PLP_PRZ.xml | SRMMKNPTG, PRRMMKNPTG | pelupusan-userTask | MLK_PLP_PRZ.xml:400-422 — `<userTask>`s 30.0/31.0 Semakan + 32.0 Perakuan + `receiveUserTask("SRMMKNPTG",...) / receiveUserTask("PRRMMKNPTG","PTG",...)` |

**Scope**: PLP (a — BPMN classification: all tugasans `<userTask>` in MLK_PLP_PRZ.xml + b — permohonan ID PTMLK/01/L/PRZ/2026/23 prefix confirms PRZ urusan, PLP-side)

## Scout Emit (Stage 1)

**Description**: PRZ Risalat MMKN PDT (point 5.2) Lulus/Tolak phrasing + PTGM signature panel — Vincent's 2026-04-11 fix shipped the populator `populateSyorKeputusanPDT` returning "boleh dipertimbangkan / tidak boleh dipertimbangkan" and the template binary now uses CC tag `syorKeputusanPDT`; BA's 2026-05-11 cycle-1 retest on FAT `PTMLK/01/L/PRZ/2026/23` reports both fixes failed visibly — point 5.2 still renders "diluluskan/ditolak", and the PDT step output still shows the PTG signature panel (signPTG / namaPTG / tarikhSignPTG / staticTextPTGMelaka).

| File | Line(s) | Kind | Status | What it proves |
|---|---|---|---|---|
| etanah-pelupusan/.git log --grep=247707/247710/PRZ/Risalat MMKN | n/a | bash | PROVEN | Vincent commit `34acdd6222 #247710 & 247707` 2026-04-11 is the only commit that names QA-247707 directly; PRZ Risalat MMKN touched 12+ times since |
| etanah-pelupusan/.git show 34acdd6222 --stat | n/a | bash | PROVEN | Original diff touched: PelupusanWordCCMethodConstant.java (+58), MlkPelupusanTugasanConstant.java (+7), PelupusanPenyediaanDokumenVO.java (+42), MlkKertasTemplateForm.java (+196), MlkKertasTemplateForm.xhtml (+24), 7 `TemplateRisalatMMKN_PDT_*.docx` binaries rebuilt |
| etanah-pelupusan/.git show 34acdd6222 -- PelupusanWordCCMethodConstant.java | full diff | bash | PROVEN | Vincent added `TAG_SYOR_KEPUTUSAN_PDT="syorKeputusanPDT"` + `TAG_SYOR_KEPUTUSAN_PTG="syorKeputusanPTG"`, wired to `populateSyorKeputusanPDT` (returns "boleh dipertimbangkan"/"tidak boleh dipertimbangkan") + `populateSyorKeputusanPTG` (returns "diluluskan"/"ditolak") |
| PelupusanWordCCMethodConstant.java | 652-653, 773-774, 14240-14271, 14274-14305 | Read | PROVEN | Current state of populator confirmed unchanged since Vincent commit: `populateSyorKeputusanPDT` :14274-14291 returns the correct Lulus/Tolak phrase; legacy `populateSyorKeputusan` :14240-14272 still returns "diluluskan/ditolak" |
| MlkPelupusanTugasanConstant.java | 163-173, 179-182 | Read | PROVEN | `TGS_RISALAT_MMKN_PDT_LIST` = {PRMMKNPDT, SRMMKNPDT, PPT}; `TGS_RISALAT_MMKN_PTG_LIST` = {PRMMKNPTG, SRMMKNPTG, PRRMMKNPTG}; `TGS_RISALAT_MMKN_SHOW_SYOR_PERMOHONAN` = {Penyediaan-PDT, Penyediaan-PTG} editable; view-only set covers Semakan + Perakuan; `URUSAN_DUAL_SYOR_KEPUTUSAN_RISALAT` includes PRZ |
| TemplateRisalatMMKN_PDT_PRZ.docx (extracted document.xml) | full CC-tag list | PowerShell ZIP extract | PROVEN | Template binary contains `syorKeputusanPDT` (NOT legacy `syorKeputusan`); also contains `signPTG`, `tarikhSignPTG`, `paragraphPTGPRZ`, `staticTextPTGMelaka` — PTG-signature CC tags physically exist in PDT template body |
| TemplateRisalatMMKN_PDT_PRZ.docx body text near `syorKeputusanPDT` | offset 89514 | PowerShell text extract | PROVEN | Plain text: "...berpendapat permohonan ini `<Syor Keputusan PDT>` kerana tanah yang dipohon..." — body text correct/neutral; no hard-coded "diluluskan/ditolak" outside CC tags |
| template.config.json (MLK) | 4749-4860 | Read | PROVEN | One config block for `urusanList=["PRZ"]` uses `template=TemplateRisalatMMKN_PDT_PRZ.docx` bound to BOTH PDT-side (PRMMKNPDT/SRMMKNPDT/PPT) AND PTG-side (PRMMKNPTG/SRMMKNPTG/PRRMMKNPTG/...). PDT-side tugasan list includes `STATUS_PENYEDIAAN_BARU` BUT actions[] array only has `CREATE/SEDIA/SEMAK/PERAKU` — `STATUS_PENYEDIAAN_BARU` HAS NO entry → suspect blast-radius for issue #2 |
| template.config.json (MLK) | 4800-4834 | Read | PROVEN | `CREATE` + `STATUS_PENYEDIAAN_SEDIA` `excluded_content_control_list` exclude `signPTG/namaPTG/tarikhSignPTG/staticTextBertarikh/staticTextPTGMelaka` |
| ExtraParamMethodConstant.java | 83-91 | Grep | PROVEN | Cross-references PelupusanConstant.KEY_KEPUTUSAN_SYOR_PDT/PTG — confirms maklumatTambahan JSON-key writer uses tugasan-list-keyed routing identical to populator routing |
| PelupusanConstant.java | 290-291 | Grep | PROVEN | `KEY_KEPUTUSAN_SYOR_PDT = "KeputusanSyorPDT"`; `KEY_KEPUTUSAN_SYOR_PTG = "KeputusanSyorPTG"` |
| MlkKertasTemplateForm.java current state | n/a | not opened this session | HYPOTHETICAL | Vincent +196 lines; Recon must read syor-keputusan input handler to confirm write to `KeputusanSyorPDT` |
| MlkKertasTemplateForm.xhtml current state | n/a | not opened this session | HYPOTHETICAL | Vincent +24 lines — likely Syor-Permohonan dropdown wiring; Recon must per-file-sibling-diff |
| Server-side rendering for `STATUS_PENYEDIAAN_BARU` action | n/a | not searched | HYPOTHETICAL | Fall-through behaviour leading hypothesis for issue #2; Recon must verify |

### Git history probe

| SHA | Rel-date | Author | QA-ref | 1-line msg | Signal-tag |
|---|---|---|---|---|---|
| 34acdd6222 | 2026-04-11 | Vincent | #247710 & #247707 | original combined commit — adds populateSyorKeputusanPDT/PTG + 7 PDT docx rebuilds + +196 MlkKertasTemplateForm.java + +24 xhtml | keyword-match (247707 direct) + file-overlap (all 6 suspect files) |
| 23aa910916 | post-Apr-11 | – | QA #247710 | PRU - Risalat MMKN Item 5/6 page break dan populate Item 6 placeholders | keyword-match (Risalat MMKN) — sibling urusan PRU |
| c2fec05059 | – | – | – | Merge mlk/qa/247710 → mlk/master | keyword-match |
| ec7d236ab6 | – | – | – | Merge mlk/qa/247710v2 → mlk/master | keyword-match |
| 59b7e62c90 | – | – | QA #259702 | PRU - Both Risalat MMKN - Fix information not populating | keyword-match — PRU sibling |
| 5023fbf2fc | – | – | QA #262233 | PRZ - Ringkasan Risalat MMKN - Jabatan Teknikal fix | keyword-match — PRZ sibling (different doc) |
| 30d37f3b44 | – | – | QA #262233 | PRZ - Ringkasan Risalat MMKN - align Ulasan JT table width | keyword-match |
| 185869d863 | – | – | QA #262243 | PRZ - Surat Jabatan Teknikal - add flag adalahPemohon | keyword-match |
| 3a0a994998 | – | – | QA #260820 | PRZ - Sembunyi panel Surat Keputusan JKKL Dari PTG pada Langkah Surat Keputusan Lulus | keyword-match |
| f39224960b | – | – | QA #262869 | PPTPB - PRRMMKNPTGT - Risalat MMKN section 6 populate placeholders | keyword-match — sibling PPTPB; SAME template-shape — directly relevant to issue #2 |
| d2aa36240b | – | – | QA #261986 | PSBS - Risalat MMKN - Fix data issues & template side | keyword-match |
| 6f005892ca | – | – | QA #260876 | PLTP - Ringkasan Risalat MMKN - papar ulasan YB ADUN | keyword-match |
| 1c1e900094 | – | – | QA #262004 | PSBS - Ringkasan Risalat MMKN - betulkan CC tag & tarikan maklumat | keyword-match |
| 7fe595d75f | – | – | QA #260876 | PLTP - Ringkasan Risalat MMKN Font Ulasan Daripada dan wire Ulasan YB | keyword-match |
| 51be1068c2 | – | – | – | fix Risalat MMKN PRU duplicate doc issue | keyword-match |
| 5e86007d6d | – | – | – | finalised doc template for Risalat MMKN and Pertimbangan DO | keyword-match (timeline pre-247707) |
| c9000b099c | – | – | refs#228606 | PLPS - Perakuan Pentadbir Tanah - Dokumen Risalat MMKN PDT tidak papar tandatangan Pentadbir Tanah | keyword-match — STRONG sibling-shape precedent for signature-rendering issue on PDT |
| 7f27323f54 | – | – | refs#228597 | PLPS - Penyediaan Risalat MMKN PDT - Dokumen Risalat MMKN PDT papar nama PT | keyword-match — sibling-shape precedent |

### Class chain

```
BA test app:  PTMLK/01/L/PRZ/2026/23   (urusan=PRZ, state=PDT step on FAT)
        |
        ↓  (jana KertasRisalatMMKN.docx)
  template.config.json:4749-4860  (urusanList=["PRZ"])
        |
        ↓  selects template by tugasan-state pair
  TemplateRisalatMMKN_PDT_PRZ.docx  (single .docx serves BOTH PDT + PTG sides)
        |
        ↓  CC tag scan → populator dispatch
  PelupusanWordCCMethodConstant.java
        |
        ├──→ CC `syorKeputusanPDT`   →  populateSyorKeputusanPDT  :14274
        |          ↓  reads maklumatTambahan.KeputusanSyorPDT
        |          ↓  returns "boleh dipertimbangkan" | "tidak boleh dipertimbangkan"
        |          ✓  populator CORRECT — output phrasing matches requirement
        |
        ├──→ CC `syorKeputusanPTG`   →  populateSyorKeputusanPTG  :14293
        |          ↓  returns "diluluskan" | "ditolak"  (PTG side, OK)
        |
        └──→ CC `signPTG` / `namaPTG` / `tarikhSignPTG` / `staticTextPTGMelaka`
                   ↓  gated by excluded_content_control_list per action-state
                   ⚠️ BUG HYPOTHESIS #2: tugasanList maps PRMMKNPDT → CREATE/BARU/SEDIA
                                          actions[] defines no BARU → fallback path
                                          may bypass exclusion → PTG sig renders in PDT step

  ⚠️ BUG HYPOTHESIS #1 (issue 5.2):  source-of-truth tag is `syorKeputusanPDT` and
     populator returns the correct phrase. BA still sees "diluluskan/ditolak"
     → most likely: deployed FAT template/baseline STALE (jana-semula not run on FAT after 34acdd6222)
       Second-likeliest: a different DS_DOCUMENT_OUTPUT_TEMPLATE row on FAT pointed at the old binary.
```

**Summary**: Bug-sites (ranked): (1) Issue 5.2 phrasing: source-of-truth populator + template binary BOTH already emit the correct "boleh dipertimbangkan / tidak boleh dipertimbangkan" — BA-observed "diluluskan/ditolak" most likely traces to stale FAT-side template baseline OR a separate DS-document row on FAT still pointing at the pre-commit binary; (2) Issue PTGM-signature-on-PDT: `template.config.json` PRMMKNPDT→STATUS_PENYEDIAAN_BARU mapping at :4754-4758 has no matching actions[] entry at :4800-4859, so BARU state falls through to a default that does not apply the PTG-signature exclusion. Recon focus: (a) probe FAT DB for active template binary + jana-baseline; (b) read action-resolver in `MlkKertasTemplateForm.java`; (c) sibling-diff against PPTPB block at :4862. Per scope discipline, no Apply this phase.

**Bug site**: Primary: `src/main/resources/config/MLK/template.config.json:4749-4860` (PRZ block — tugasanList includes STATUS_PENYEDIAAN_BARU but actions[] lacks that entry; affects PTG-signature exclusion). Secondary: stale FAT deployment of `TemplateRisalatMMKN_PDT_PRZ.docx` — DB-probe needed. Populator (`PelupusanWordCCMethodConstant.java:14274-14305`) is NOT the bug-site.

**Honesty audit**: Performed: git history probe, Read of populator + Tugasan constants, PowerShell-ZIP extraction of PRZ PDT docx CC tags + body text, Read of template.config.json PRZ block + partial PPTPB block. NOT performed (Recon-owned): (a) LIVE DB probe of FAT et_main — mcp__postgres-mlkfat__query was AVAILABLE and NOT executed in Scout step; (b) Read of MlkKertasTemplateForm.java current state; (c) Read of MlkKertasTemplateForm.xhtml + per-file sibling-diff; (d) BPMN content beyond Stage-0 classification — trusted; (e) Notes file empty (no carryover); (f) etanah-knowledge Always-tier not re-loaded in Scout step (Stage-0 covered); (g) Confidence-percentage rubric is Rubric-phase concern. RecursiveLoopDetector fired once on 3rd template.config.json Read — halted that thread. Diagnoses are HYPOTHESIS-grade until Recon completes.

## Recon Emit (Stage 2)

**Description**: PRZ Risalat MMKN PDT/PTG — Scout's two-pronged theory (template-config missing STATUS_PENYEDIAAN_BARU action + stale FAT binary) is partly confirmed and partly refuted: the action-map fall-through is REAL but resolves via templateGlobalSettingsActionMap (not Collections.emptySet), and the source-side populator phrasing is already correct on mlk/master per Vincent's 2026-04-11 commit 34acdd6222.

**Universal Checks**: env ⏭ unknown(BA-Q) · codebase-root ✓ etanah-pelupusan · blast-radius ✓ PRZ+PPTPB share identical config-shape defect · sibling-read ✓ PPTPB block 4862-4969 · ind_skrin ✓ MlkKertasTemplateForm.xhtml · ind_langkah ✓ "Risalat MMKN PDT/PTG" rows returned · pengguna-semasa ⏭ aborted-after-loop-detector · CC-tag ✓ syorKeputusanPDT/syorKeputusanPTG · save-path ✓ TemplateConfig.retrieveTemplateAction:785-802 · db-probed ✓ UAT has PRZ/2026/23 aplikasi_id=2961020, FAT empty

### Live DB query

- Attempted: true via mcp__postgres-mlkuat__query + mcp__postgres-mlkfat__query
- SQL: `(1) ind_langkah.nama symptom lookup for '%risalat MMKN%' → returned 30+ rows all pointing to /protected/mlk/common/MlkKertasTemplateForm.xhtml. (2) UAT umm_aplikasi WHERE id_pengenalan ILIKE 'PTMLK/01/L/PRZ/2026/%' → PRZ/2026/23 found, aplikasi_id=2961020. (3) FAT same id_pengenalan → EMPTY. (4) Pengguna-semasa join attempted but errored 'column ak.tgsn_id does not exist' — schema column is ursn_id+aplikasi_id, not tgsn_id; loop-detector hook fired before retry — left as BA-Q.`
- Result: Env = UAT (BA test app PTMLK/01/L/PRZ/2026/23 exists on UAT only, absent on FAT). JSF view confirmed = /protected/mlk/common/MlkKertasTemplateForm.xhtml. Pengguna-semasa pending due to schema column drift + circuit-breaker.

### Composite-include fallback (R5)

- ind_langkah returned useful: true
- xhtml-grep fallback taken: false
- Fallback target: n/a — ind_langkah.nama lookup for 'Risalat MMKN' returned the canonical jsf_view (/protected/mlk/common/MlkKertasTemplateForm.xhtml) on first attempt

### Verification

| # | Scout claim | Verdict | Evidence (file:line + quoted) | Honesty tag |
|---|---|---|---|---|
| 1 | template.config.json:4749-4860 PRZ block — tugasanList.PRMMKNPDT includes STATUS_PENYEDIAAN_BARU but actions[] lacks it | **CONFIRMED** | template.config.json:4754-4757 lists `["CREATE","STATUS_PENYEDIAAN_BARU","STATUS_PENYEDIAAN_SEDIA"]`; actions[] at 4800-4859 contains only CREATE/SEDIA/SEMAK/PERAKU — no BARU entry | VERIFIED |
| 2 | Populator (PelupusanWordCCMethodConstant.java:14274-14305) NOT the bug-site; PDT returns correct "boleh dipertimbangkan / tidak boleh dipertimbangkan" | **CONFIRMED** | `:14289` `return Boolean.TRUE.equals(lulus) ? "boleh dipertimbangkan" : "tidak boleh dipertimbangkan";` `:14303` PTG returns "diluluskan/ditolak" | VERIFIED |
| 3 | Action-resolver: when action type not in local actions[], falls through to empty set (signPTG/namaPTG NOT excluded) | **REFUTED (mechanism wrong, outcome similar)** | TemplateConfig.java:785-802 retrieveTemplateAction has 3-tier lookup: templateProperty.actionMap → templateActionMap → **templateGlobalSettingsActionMap** (:797-798). global_settings.actions has STATUS_PENYEDIAAN_BARU (template.config.json:62-71) with `flag_insert_all=true` excluding only `[namaSignature, maklumatPengguna, qrKod]` — NOT signPTG/namaPTG. Outcome: PTG fields ARE included on PDT BARU step, via global fallback (not empty set) | VERIFIED |
| 4 | PPTPB sibling block has identical defect shape | **CONFIRMED** | template.config.json:4866-4870 PPTPB.PRMMKNPDT lists BARU; actions[] at 4913-4967 contains only CREATE/SEDIA/SEMAK/PERAKU — same missing-BARU shape | VERIFIED |
| 5 | Stale FAT deployment hypothesis for Issue 5.2 phrasing | **AMBIGUOUS / BA-Q** | Vincent's commit 34acdd6222 (#247710 & 247707, 2026-04-11) on mlk/master added populateSyorKeputusanPDT with correct phrasing. mlk/master HEAD = 4c2eff023e (2026-05-29). Cannot probe FAT JBoss runtime binary. BA env = UAT (PRZ/2026/23 lives on UAT only). If BA tested on UAT and saw wrong phrasing, FAT-stale theory does not apply. | HYPOTHESIS → BA-Q |
| 6 | env=unknown in active.txt | **BA-Q resolved → UAT** | UAT contains PTMLK/01/L/PRZ/2026/23 (aplikasi_id=2961020); FAT does not. | VERIFIED |
| 7 | jsf_view = MlkKertasTemplateForm | **CONFIRMED** | ind_langkah join → /protected/mlk/common/MlkKertasTemplateForm.xhtml | VERIFIED |

### Data flow

UI → code → table flow (PTG-signature-on-PDT defect):

```
BA test app: PTMLK/01/L/PRZ/2026/23 (UAT, aplikasi_id=2961020)
      |
      ↓  (BA clicks Jana on Risalat MMKN PDT step, state=STATUS_PENYEDIAAN_BARU)
ind_langkah.nama="Risalat MMKN PDT" → ind_skrin.jsf_view=/protected/mlk/common/MlkKertasTemplateForm.xhtml
      |
      ↓  (form invokes template generation with action=STATUS_PENYEDIAAN_BARU)
TemplateConfig.retrieveTemplateAction() :785
      |
      ↓  (templateProperty.actionMap lookup — PRZ block actions[] :4800-4859 has no BARU)
templateProperty.getTemplateActionMap() :793  — also no BARU
      |
      ↓  (FALLBACK)
⚠️ templateGlobalSettingsActionMap :797-798  — global STATUS_PENYEDIAAN_BARU :62-71
      |
      ↓  (flag_insert_all=true, excludes only [namaSignature, maklumatPengguna, qrKod])
TemplateRisalatMMKN_PDT_PRZ.docx renders WITH signPTG / namaPTG / tarikhSignPTG / staticTextPTGMelaka populated
      |
      ↓  populator dispatch via PelupusanWordCCMethodConstant
populateSyorKeputusanPDT :14274 returns "boleh dipertimbangkan / tidak boleh dipertimbangkan" (source-correct)
populateSyorKeputusanPTG :14293 returns "diluluskan / ditolak"
      |
      ↓  output to user
BA observes: PDT cell shows PTG signature block (bug confirmed by mechanism) + phrasing may be stale-binary issue
```

### Scout claims audit

| Claim | Verdict | Evidence |
|---|---|---|
| Primary bug-site: template.config.json:4749-4860 PRZ block — tugasanList includes STATUS_PENYEDIAAN_BARU but actions[] lacks that entry | CONFIRMED | template.config.json:4754-4757 (tugasanList.PRMMKNPDT includes BARU) vs :4800-4859 (actions[] only CREATE/SEDIA/SEMAK/PERAKU) |
| Populator (PelupusanWordCCMethodConstant.java:14274-14305) NOT the bug-site | CONFIRMED | :14289 returns 'boleh dipertimbangkan / tidak boleh dipertimbangkan'; :14303 returns 'diluluskan / ditolak' — matches BA-stated requirement; introduced by 34acdd6222 (2026-04-11) |
| Stale FAT-side template baseline / DS-document row causes Issue 5.2 | AMBIGUOUS | Cannot probe runtime binary from Recon. UAT contains PRZ/2026/23; FAT does NOT — env=UAT, not FAT, so FAT-stale theory may not apply. Needs BA-Q + Rubric scope for ds_document row inspection. |
| Action-resolver falls through to default not applying signPTG/namaPTG/tarikhSignPTG/staticTextPTGMelaka exclusion | AMBIGUOUS (mechanism refined) | TemplateConfig.java:785-802 — falls to templateGlobalSettingsActionMap (:797), which DOES have STATUS_PENYEDIAAN_BARU (template.config.json:62-71) with flag_insert_all=true. Global excludes [namaSignature, maklumatPengguna, qrKod] only — signPTG/namaPTG NOT excluded, so they render. Outcome matches Scout's defect; path differs. |
| Sibling-diff PPTPB block exhibits same shape | CONFIRMED | template.config.json:4862-4969 PPTPB block — tugasanList.PRMMKNPDT (:4867-4870) includes BARU, actions[] (:4913-4967) lacks BARU entry. Systemic config-shape defect. |

### Predicate Diagram (R2)

```
            ┌──────────────────────────────────────────────────┐
            │  ASSUMPTION                                      │
            │  TRUE IF: PRZ + PPTPB blocks need an explicit    │
            │  STATUS_PENYEDIAAN_BARU action with PTG-field    │
            │  exclusions to prevent PTG signatures showing    │
            │  on the PDT-side render.                         │
            └────────────────────┬─────────────────────────────┘
                                 │
                                 ↓
            ┌──────────────────────────────────────────────────┐
            │  EVIDENCE                                        │
            │  PROVED BY:                                      │
            │  - template.config.json:4754-4757 (BARU listed)  │
            │  - template.config.json:4800-4859 (BARU absent)  │
            │  - TemplateConfig.java:785-802 (3-tier resolver) │
            │  - template.config.json:62-71 (global BARU does  │
            │    NOT exclude signPTG/namaPTG/etc.)             │
            └─────────┬─────────────────────────┬──────────────┘
                      │                         │
                  matches                  contradicted by
                      │                         │
                      ↓                         ↓
        ┌─────────────────────┐   ┌───────────────────────────┐
        │  APPLY (Rubric)     │   │  FALSIFIER                │
        │  Add STATUS_PENYE-  │   │  If BA reports PTG signa-  │
        │  DIAAN_BARU action  │   │  tures STILL appear after  │
        │  to PRZ + PPTPB     │   │  adding the action — then  │
        │  actions[] arrays   │   │  the doc is served stale   │
        │  with PTG-field     │   │  from ds_document and the  │
        │  exclusion set.     │   │  config-fix never re-ran.  │
        │                     │   │  → STOP, Rubric checks DS  │
        │                     │   │  row + jana-semula path.   │
        └─────────────────────┘   └───────────────────────────┘
```

### Sibling-diff line (R3)

`template.config.json:4749-4860 (PRZ block) ← sibling template.config.json:4862-4969 (PPTPB block): urusanList ✓ · tugasanList.PRMMKNPDT-includes-BARU ✓ (identical shape both blocks) · actions[]-missing-BARU ✓ (identical defect both blocks) · template-filename divergence (PRZ→TemplateRisalatMMKN_PDT_PRZ.docx vs PPTPB→TemplateRisalatMMKN_PDT_PPTPB.docx — expected). Conclusion: systemic config-shape defect, NOT PRZ-localized.`

**Summary**: Scout's primary mechanism (PRZ tugasanList includes BARU, actions[] omits it) is VERIFIED + extends to PPTPB sibling (systemic config-shape across multiple urusan, not PRZ-specific). However, the fall-through code path is REFUTED-with-refinement: it lands in templateGlobalSettingsActionMap (template.config.json:62-71), not Collections.emptySet — global STATUS_PENYEDIAAN_BARU action sets flag_insert_all=true and excludes ONLY [namaSignature, maklumatPengguna, qrKod], which is why PTG signature fields render on the PDT step. Populator phrasing on mlk/master is already correct per Vincent's 34acdd6222 (2026-04-11); if BA still sees "diluluskan/ditolak" on PDT cell, defer to Rubric to investigate either (a) DS-document stored binary still serving pre-commit output, or (b) template CC tag mis-binding to syorKeputusanPTG vs syorKeputusanPDT.

## Rubric Emit (Stage 3)

**Description**: Rubric for QA-247707 PRZ Risalat MMKN — config-shape defect: PRZ + PPTPB template blocks declare STATUS_PENYEDIAAN_BARU in tugasanList.PRMMKNPDT but omit it from actions[]. Result: STATUS_PENYEDIAAN_BARU resolves via templateGlobalSettingsActionMap fallback (excludes only namaSignature/maklumatPengguna/qrKod) which renders signPTG/namaPTG/tarikhSignPTG/staticTextPTGMelaka — fields BA wants excluded at PDT-BARU stage. Populator (syorKeputusanPDT/PTG) is NOT the bug-site.

### (a) Blast radius

| Blast radius | Shared constants the fix may silently miss |
|---|---|
| Same defect across urusan | **PRZ block (4749-4860)** AND **PPTPB block (4862-4969)** in `template.config.json` — identical config-shape miss (BARU in tugasanList, missing from actions[]). PPTPB likely needs same fix or BA-confirm out-of-scope. |
| Same defect across tugasan inside PRZ | Within PRZ block, BARU declared only on `PRMMKNPDT` tugasanList (4754-4758); `PRMMKNPTG` (4767-4770) and `PRMMKNPTGT` (4779-4782) declare SEDIA only — no BARU symptom. Single tugasan PRMMKNPDT in scope. |
| URS_FOR_DOK_PLP_PELANRIZAB (`PelupusanUrusanConstant.java:179`) | `ImmutableSet.of(URS_PRZ)` — single-urusan, no co-listed tugasan to silently miss. |
| URUSAN_PERIZABAN_LIST (`PelupusanUrusanConstant.java:90`) | `{ PRZ, PPJK, BPRZ }` — PPJK + BPRZ do NOT appear in the PRZ template block, so config-fix does not implicitly touch them. |
| Populator-side blast (`PelupusanWordCCMethodConstant.java:14274,14293`) | `populateSyorKeputusanPDT` / `populateSyorKeputusanPTG` — NOT touched by this fix (returns requirement-correct phrasing). Out of fix scope. |

### (b) Sibling table

| Sibling cite (read this turn) | What it proves |
|---|---|
| `template.config.json:2806-2823` (SuratJPPH multi-urusan block incl. PRZ) | Sibling block with PSJT.STATUS_PENYEDIAAN_BARU in tugasanList AND no explicit BARU in actions[] — relies on global fallback. Convention exists for "tugasanList declares BARU + actions omits it" — but those templates do NOT need PTG-signature exclusion (different shape; not a clean analog). |
| `template.config.json:62-71` (templateGlobalSettings STATUS_PENYEDIAAN_BARU) | Global default action used when local actions[] omits a status: `flag_insert_all=true`, excludes only `[namaSignature, maklumatPengguna, qrKod]`. Renders signPTG/namaPTG/tarikhSignPTG/staticTextPTGMelaka — proves the BA-reported leak source. |
| `template.config.json:4818-4834` (PRZ block, STATUS_PENYEDIAAN_SEDIA action — in-file existing entry) | **In-file convention to extend**: SEDIA action already excludes exactly the fields BA needs hidden — `namaPTD, tarikhSignPTD, signPTD, daerahPejabat, signPTG, namaPTG, tarikhSemasa, namaSignature, tarikhSignPTG, staticTextBertarikh, staticTextPTGMelaka`. Fix-shape: add a sibling `STATUS_PENYEDIAAN_BARU` action whose `excluded_content_control_list` mirrors this SEDIA entry. |

### (c1) Read-path

| Read path | UI label → JSF view → action resolver → effective action |
|---|---|
| **Risalat MMKN PDT** dropdown on `/protected/mlk/common/MlkKertasTemplateForm.xhtml` → user enters PRMMKNPDT tugasan at status BARU → `TemplateConfig.retrieveTemplateAction(negeri=MLK, templateProperty=PRZ-PRMMKNPDT, action=STATUS_PENYEDIAAN_BARU)` (`TemplateConfig.java:785`) → searches local PRZ block actions[] (4800-4859) — no match for BARU → falls to `templateGlobalSettingsActionMap` (`:797`) → resolves to global BARU entry (`template.config.json:62-71`) → effective excluded list = `[namaSignature, maklumatPengguna, qrKod]` (signPTG/namaPTG/tarikhSignPTG/staticTextPTGMelaka NOT excluded → leak into rendered Word). |

### (c2) Write-path

| Write path | Generated docx → DMS persistence column |
|---|---|
| Effective action's `flag_insert_all=true` + minimal excluded list → docx renderer fills all CC tags including signPTG/namaPTG/tarikhSignPTG/staticTextPTGMelaka → output binary streamed into DMS via `ds_document.binary_content` (BYTEA column on `et_main_uat.ds_document`, joined to `umm_a_dok_keluaran.dms_document_id` keyed on `aplikasi_id=2961020`). Fix writes nothing new; it changes which CC tags get populated BEFORE the bytes hit `ds_document.binary_content`. No DB schema/column change. |

### (d) Candidate fix table

| # | Candidate | Pros | Cons | Verdict |
|---|---|---|---|---|
| A | **Add local `STATUS_PENYEDIAAN_BARU` action to PRZ block actions[] (4800), mirroring the sibling SEDIA entry's excluded_content_control_list** | Surgical; in-file convention (extends existing block, mirrors SEDIA action `:4818-4834`); zero blast outside PRZ; respects working-analog rule | Must also apply to PPTPB block (4913) if BA confirms PPTPB-scope — else PPTPB silently keeps the leak | **CHOSEN** |
| B | Patch global `STATUS_PENYEDIAAN_BARU` (`:62-71`) to add signPTG/namaPTG/tarikhSignPTG/staticTextPTGMelaka to excludes | One-line fix | **HUGE blast radius** — global BARU is fallback for every urusan/tugasan that omits local BARU; would suppress those CCs system-wide. Rejected. |
| C | Remove `STATUS_PENYEDIAAN_BARU` from PRZ tugasanList.PRMMKNPDT (`:4756`) | Cuts the offending path | BA expects template generation at BARU status — breaks the intended workflow. Rejected. |
| D | Change PRMMKNPDT default status (Flowable BPMN side) so BARU never reaches the template | Different layer fix | Wrong layer (out of Word-template scope); risks Flowable regression on other tugasan. Rejected. |
| E | Patch populator `populateSyorKeputusanPDT/PTG` | – | Populator already correct (returns "boleh dipertimbangkan" / "diluluskan" per BA); CONFIRMED in Recon. Not the bug-site. Rejected. |

### (e) Falsifier + Logger

- Falsifier: If TemplateActionJson resolved for (urusan=PRZ, tugasan=PRMMKNPDT, action=STATUS_PENYEDIAAN_BARU) actually contains signPTG/namaPTG/tarikhSignPTG/staticTextPTGMelaka in excluded_content_control_list BEFORE the fix, then Candidate A's predicate is wrong (some other code path already excludes them; the leak is elsewhere — perhaps a docx renderer-side override or a stale ds_document binary). Conversely, if the field is `STATUS_PENYEDIAAN_SEDIA` (not BARU) at the time of render, the urusan→status assumption is wrong.
- Logger at: `E:/Projects/Melaka/etanah-pelupusan/src/main/java/my/gov/etanah/pelupusan/config/TemplateConfig.java:802` (immediately before the resolved TemplateActionJson is returned at end of retrieveTemplateAction)
- Logger string: `log.info("QA247707-PROBE: urusan={} tugasan={} actionRequested={} resolvedType={} flagInsertAll={} excluded={} source={}", negeri, templateProperty.getKodUrusan(), action, templateAction.getType(), templateAction.isFlagInsertAll(), templateAction.getExcludedContentControlList(), (templateAction == localMatch ? "local" : "globalFallback"));`

### (f) Confidence

- **88%** — Config-shape defect is directly proven by reading `template.config.json:4754-4859` — BARU declared in tugasanList, absent from actions[]. Global fallback path traced at `TemplateConfig.java:785-802` and `template.config.json:62-71` shows the exact CC fields that leak. Sibling in-file SEDIA action (:4818-4834) gives the verbatim excluded-list pattern to copy. Populator audited and ruled out.
- Why not higher: Two unknowns prevent 95%+: (1) BA-Q open on whether PPTPB block needs same fix (Scope ambiguity); (2) UAT vs FAT env confusion — UAT has the test app PTMLK/01/L/PRZ/2026/23 (aplikasi_id=2961020); FAT empty — ambiguous-claim from Recon about stale FAT-side binary cannot be resolved without runtime probe. Logger probe at TemplateConfig.java:802 would close both gaps to ~96%.
- Why not lower: All file:line evidence cited is from actually-read code this turn (template.config.json:4749-4969, PelupusanUrusanConstant.java:31/90/179, MlkPelupusanTugasanConstant.java:18/27, PelupusanWordCCMethodConstant.java:14274-14305, TemplateConfig.java:785). Mechanism (fallback to global) is deterministic per code path; sibling-diff yields exact fix shape. Not <85% because the in-file working analog (SEDIA action) is unambiguous.

### Predicate Diagram (R2)

```
            ┌────────────────────────────────────────────────────────────────┐
            │  ASSUMPTION                                                    │
            │  TRUE IF: At PRMMKNPDT-BARU stage, signPTG/namaPTG/             │
            │  tarikhSignPTG/staticTextPTGMelaka render in the docx because   │
            │  PRZ block actions[] omits STATUS_PENYEDIAAN_BARU → resolver    │
            │  falls back to global BARU (excludes only namaSignature/        │
            │  maklumatPengguna/qrKod).                                       │
            └─────────────────────────────┬──────────────────────────────────┘
                                          │
                                          ↓
            ┌────────────────────────────────────────────────────────────────┐
            │  EVIDENCE                                                      │
            │  template.config.json:4754-4757 (tugasanList.PRMMKNPDT lists   │
            │  BARU) · :4800-4859 (PRZ actions[] = CREATE/SEDIA/SEMAK/PERAKU,│
            │  no BARU) · TemplateConfig.java:785-802 (local-then-global     │
            │  resolver) · :62-71 (global BARU excludes only 3 CCs).         │
            └──────────────┬─────────────────────────────────┬───────────────┘
                           │                                 │
                       matches                          contradicted by
                           │                                 │
                           ↓                                 ↓
        ┌──────────────────────────┐      ┌──────────────────────────────────┐
        │  APPLY                   │      │  FALSIFIER                       │
        │  Candidate A — add local │      │  If logger at TemplateConfig.    │
        │  STATUS_PENYEDIAAN_BARU  │      │  java:802 shows resolved action  │
        │  to PRZ block actions[]  │      │  already excludes signPTG/       │
        │  with excluded list      │      │  namaPTG/tarikhSignPTG, fix      │
        │  mirroring SEDIA entry   │      │  predicate wrong → STOP, rerun   │
        │  (:4818-4834)            │      │  Recon on renderer-side override │
        │                          │      │  / stale ds_document binary.     │
        └──────────────────────────┘      └──────────────────────────────────┘
```

### Sibling-diff line (R3)

`template.config.json:4800 ← sibling template.config.json:4818: attrs ✓ · listener-sig n/a (JSON config, no listener) · VO-instance n/a (JSON, no VO binding) · lifecycle ✓ (same PRZ urusan block, sibling action under same actions[] array, same resolver path TemplateConfig.java:785-802)`

**Chosen candidate**: Candidate A — add local STATUS_PENYEDIAAN_BARU action to PRZ block actions[] at template.config.json:4800, mirroring the sibling STATUS_PENYEDIAAN_SEDIA action's excluded_content_control_list verbatim (:4818-4834).

**Stopping state**: needs-logger-runtime-evidence

**Arrows**: UI: Risalat MMKN PDT dropdown (`MlkKertasTemplateForm.xhtml`) → Form: `MlkKertasTemplateForm` (status=STATUS_PENYEDIAAN_BARU at first render) → Config resolver: `TemplateConfig.retrieveTemplateAction(MLK, PRZ-PRMMKNPDT, BARU)` (`TemplateConfig.java:785`) → ⚠️ local PRZ actions[] (`template.config.json:4800-4859`) — no BARU match → fallback `templateGlobalSettingsActionMap` (`TemplateConfig.java:797`) → global BARU (`template.config.json:62-71`, excludes only `[namaSignature, maklumatPengguna, qrKod]`) → docx renderer fills `signPTG, namaPTG, tarikhSignPTG, staticTextPTGMelaka` (LEAK) → bytes → `ds_document.binary_content` (`umm_a_dok_keluaran` keyed on aplikasi_id=2961020)

**Summary**: PRZ Risalat MMKN PDT leaks signPTG/namaPTG/tarikhSignPTG/staticTextPTGMelaka at BARU stage because the PRZ template block (`template.config.json:4749-4860`) declares `STATUS_PENYEDIAAN_BARU` in `tugasanList.PRMMKNPDT` (`:4754-4757`) but the local `actions[]` array (`:4800-4859`) has no `STATUS_PENYEDIAAN_BARU` entry. The resolver `TemplateConfig.retrieveTemplateAction` (`:785-802`) falls through to the global default (`:62-71`) whose excluded list does not cover the PTG-signature CCs. Fix-shape: add a sibling `STATUS_PENYEDIAAN_BARU` action inside the PRZ block, mirroring the verbatim `excluded_content_control_list` of the existing in-block `STATUS_PENYEDIAAN_SEDIA` action (`:4818-4834`). Populator out of scope. PPTPB block exhibits the identical defect (`:4862-4969`) — BA-Q whether scope extends there. Env: UAT.

## Compliance Matrix (Stage 4 audit)

| Stage | Description | Table | Arrows | Summary | R1 (6 Rubric sub-rows) | R2 (Predicate Diagram) | R3 (Sibling-diff verbatim) |
|---|---|---|---|---|---|---|---|
| Scout (S1) | ✓ | ✓ (file_reads + git history) | ✓ (class chain vertical) | ✓ | n/a (Rubric-only) | n/a (debug Edit gate only) | n/a |
| Recon (S2) | ✓ | ✓ (verification + scout-audit) | ✓ (UI→code→table) | ✓ | n/a | ✓ (present) | ✓ (present, sibling block comparison) |
| Rubric (S3) | ✓ | ✓ (blast + sibling + candidate + read + write) | ✓ (UI→code→table) | ✓ | ✓ (a blast / b sibling / c1 read / c2 write / d candidates / e falsifier+logger / f confidence — all 6 + chosen + stopping) | ✓ (present) | ⚠ (present but listener-sig/VO-instance marked n/a — JSON-config variant; semantically correct, schema gap flagged) |

## Aggregate Observations

### Hook taxonomy

- **silent (~30 calls)** — vast majority of Read/Grep/Glob/Bash routine calls produced no hook output; clean baseline.
- **helpful (~12 calls)** — RecursiveLoopDetector fired correctly at Stage-1 3rd template.config.json Read (prompted consolidation); Stage-2 file-does-not-exist errors surfaced cwd/path drift quickly; Read on empty Notes file warned of 0-line content; Glob fallback after wrong-path Read corrected to my.gov.etanah package; mcp__postgres-mlkfat empty result on PRZ/2026/23 quickly proved env=UAT-not-FAT; schema-drift error on `ak.tgsn_id` surfaced canonical SQL drift.
- **noise (~6 calls)** — MCP-server instructions (codegraph + 3 postgres) + Auto-Mode reminder injected mid-batch tool results across all 3 stages (notably during parallel git-log batch in S1, oversized ind_langkah query in S2, and Java-grep in S3). Boilerplate context not load-bearing for any decision; tripled noise per turn after one oversized MCP query.
- **interfered (~3 calls)** — (S1) bash-inline-PowerShell `$`-variable parse error broke first ZIP-extract attempt (corrected by switching to native PowerShell tool); (S2) RecursiveLoopDetector tripped over-cautiously on 4× distinct postgres queries (symptom lookup → app exists → app range → schema introspect — all genuinely different); (S3) same detector fired on 3rd Read of distinct template.config.json ranges.

### Redundancy signals

- Stage 1 + Stage 2 + Stage 3 each independently re-read `template.config.json:4749-4860` (PRZ block) and `PelupusanWordCCMethodConstant.java:14274-14305` (populator). The populator confirmation in S2 + S3 is mostly re-verification; S1 had already PROVEN it.
- Stage 1 git-history probe surfaced commit 34acdd6222 + 17 sibling commits; S2 + S3 re-cited 34acdd6222 by SHA from S1's table without re-running git. Good propagation. No re-run.
- Sibling PPTPB block was discovered at S1 (mentioned in honesty audit), CONFIRMED at S2 (verification row #4), and CHOSEN as blast-radius row at S3. Clean handoff, no rework.
- Predicate Diagram emitted at S2 + S3 — S3 diagram is a richer/refined version of S2's (same shape, more evidence detail). Acceptable for the rule (Recon + Rubric both required); minor duplication.

### Friction points

- Notes file is empty (0 bytes) on a Rework ticket; canonical 3-line test-data block was never populated by cycle-1 dev. History.txt carries the test ID but no auto-promotion path exists from History → Notes on Rework resume.
- Canonical task-state SQL in CLAUDE.md uses `ak.tgsn_id` but actual `umm_aliran_kerja` schema has `ursn_id + aplikasi_id` (no `tgsn_id`). Documented-vs-real drift — slip-log candidate.
- RecursiveLoopDetector threshold is conservative on distinct queries that share tool name + table prefix; flagged at 3-4 calls even when each had distinct WHERE-clause + purpose.
- MCP server instructions + Auto-Mode reminders injected mid-tool-result block (not at session start) — easy to miss as protocol context vs noise.
- Scout's class chain output was truncated mid-arrow in the prompt passed to Recon (only narrative summary complete) — Recon verified mostly from narrative.
- env=unknown in active.txt required cross-DB existence check to resolve to UAT (a preflight auto-resolution step would close this).
- JSON-config sibling-diff has no native variant — listener-sig / VO-instance fields marked n/a honestly; schema (designed for JSF coupling) does not cleanly apply.

### Refinement candidates (for Batch-3)

1. **Promote History.txt → Notes file on Rework resume** — `quest/notes.js` should auto-extract BA-supplied permohonan IDs from History.txt and seed Notes file cycle-1 entries when Notes is empty AND ticket_type=rework. Closes the silent-skip identified at S0 + S2.
2. **Fix canonical task-state SQL** — `umm_aliran_kerja` does NOT have `ak.tgsn_id`; rewrite the canonical SQL in CLAUDE.md to join via `umm_a_tgsn.aliran_kerja_id` (or whatever the real bridge column is). Update slip-log. This blocked pengguna_semasa Universal Check at S2 + Rubric inherited the hole at S3.
3. **Auto-resolve env via cross-DB existence check** — add a preflight step that, when `env=unknown` in active.txt + a permohonan ID is present, runs `SELECT 1 FROM et_main_uat.umm_aplikasi` and `SELECT 1 FROM et_main.umm_aplikasi` to set env automatically. Removes one BA-Q at Phase 0.
4. **Tune RecursiveLoopDetector for SQL/Read distinctness** — compare WHERE-clause / file-range / arg-suffix similarity, not just tool name. Currently fires false-positives on serial DB facts + distinct config-range reads.
5. **Defer MCP server instructions to session start (or a dedicated tool_result)** — stop interleaving with unrelated tool stdout; reduces context noise across stages.
6. **JSON-config sibling-diff variant** — add a sub-rule for JSON-config edits: replace `attrs/listener-sig/VO-instance/lifecycle` schema with `urusanList ✓ / tugasanList ✓ / actions[] ✓ / template-binding ✓` (or similar). Closes the n/a gap caused by applying JSF-coupling schema to JSON-config fixes.

## Harness Health

**Verdict**: PASS

**Reasoning**: All 3 stages produced the canonical 4-part template (description / table / arrows / summary). R1 (Rubric all 6 sub-rows): VERIFIED — Stage 3 emitted blast-radius, sibling, read-path, write-path, candidate-fix table, falsifier+logger, confidence — plus chosen-candidate + stopping-state. R2 (Predicate Diagram at Recon + Rubric): VERIFIED — both stages emitted the 3-node ASCII diagram, S3's is a refined version of S2's. R3 (sibling-diff verbatim line at Recon + Rubric): VERIFIED at S2 (block-to-block JSON comparison), PARTIALLY at S3 (line present but listener-sig/VO-instance n/a — JSON-config schema gap honestly flagged, not fabricated). R4 (BPMN classification array): VERIFIED at S0 — all 5 tugasan kods classified with file:line evidence; bare-form file naming (`MLK_PLP_PRZ.xml`) applied cleanly. R5 (composite-include fallback explicit): VERIFIED at S2 — `ind_langkah_returned_useful=true`, no xhtml-grep fallback needed; explicit field captured. R6 (live DB attempt + result captured honestly): VERIFIED at S2 — multiple SQL ran, results captured, schema-drift failure on pengguna_semasa honestly disclosed (not fabricated). Compared to Batch-1 PARTIAL baseline: all R1-R6 fired this run; the single ⚠ on R3 at Rubric is a known schema-gap (JSON-config not JSF), flagged in refinement candidates #6. No fabrication detected; honesty primitives held across all 3 stages.
