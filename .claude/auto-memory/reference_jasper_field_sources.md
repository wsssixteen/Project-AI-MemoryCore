---
name: reference-jasper-field-sources
description: "Jasper $F sources; oldest duplicate kadar cukai row; doc reset tool; Utiliti Ulasan JT/JPPH screen; DMS doc patch; #246512; template/MLK move reverted"
metadata: 
  node_type: memory
  type: reference
  originSessionId: da27327e-bed1-431a-8d9c-c6c7f632107f
  modified: 2026-07-22T08:46:00.266Z
---

Where a Jasper `$F{...}` value comes from decides **who owns the fix**. Three fill paths exist in
`etanah-common\src\main\java\my\gov\etanah\common\service\impl\BaseReportService.java`:

| Method | Line | `$F{}` sourced from | Can Java format the value? |
|---|---|---|---|
| `printReport(..., JRDataSource, ...)` | :130 · :225 · :243 | bean getters / the supplied `JRDataSource` | ✅ yes — format in the VO/getter |
| `printReportUsingDataSource(...)` | :260 · :278 · :296 | same — Java-supplied datasource | ✅ yes |
| **`printReportUsingSQL(...)`** | **:459** | **the jrxml's own `<queryString>` SQL, run over a `Connection` the method opens** | ❌ **no** — Java passes only `$P{}` params |
| `printCommonReportUsingSQL(...)` | :567 | same as above | ❌ no |

**The decision rule**: find which method fills the report.
- Java-datasource path → `$F{}` maps to a bean property; **we** can fix it (format in the getter/VO).
- `…UsingSQL` path → `$F{}` maps to a **SQL column alias inside the jrxml**; the only fix is editing
  the `.jrxml` itself → **Reports team owns it**.

`JRBeanCollectionDataSource` is the usual datasource wrapper (9 files in `etanah-awam`,
e.g. `AwamCommonReportService.java:822`, `CommonReportForm.java:1844`).

## Worked case — ESOKONGAN #271721 (PRBB thousands separator, 2026-07-22)

- Symptom: Borang Permohonan PRBB printed `180000.00`; BA wanted `180,000`.
- Chain: `awamPerakuanTab.xhtml:129` "Jana Semula" → `AwamPerakuanTabForm.onGoTabPerakuan():63`
  → `AwamCommonReportService.getPelupusanReport():4624` → `PelupusanReportService.getPlpLaporanPermohonanPRBB():370`
  → **`printReportUsingSQL(...)`:378**.
- Decisive evidence: `PlpLaporanPermohonanPRBB_Sub01.jrxml:366` — `, P_PL.KUANTITI_DIPOHON AS "KUANTITI_DIPOHON"`.
  The field is a SQL column alias from the jrxml's own query, so **no Java layer can intervene**.
- みや's colleague first thought there was a Java-side way to handle it. Line 366 is what settled it:
  ticket went to the **Reports team**.
- The candidate fix (for reference) was one expression at `…_Sub01.jrxml:800`:
  `new java.text.DecimalFormat("#,###.##").format($F{KUANTITI_DIPOHON})` — pattern `#,###.##` (not
  `#,##0.00`) because BA's screenshot annotation examples carry no decimals.

**How to check fast**: grep the report-service method that names the report constant → read which
`print*` overload it calls → that single line tells you ours vs Reports team, before any deep tracing.

Related: [[flowable-node-edge-trace]] · [[feedback_verify_before_claim]]

---

## Merged 2026-10-04: kadar-cukai-duplicate-maintenance (was reference_kadar_cukai_duplicate_maintenance.md)

> PT plot "Kadar Cukai Tanah" pulls the OLDEST of duplicate maintenance rate rows (same keys, different value) — 2026-09-17 adhoc, DATA/maintenance side, future ticket possible

PT "Penyediaan Risalat MMKN - PDT" plot dialog "Maklumat Plot Untuk Dikeluarkan Hakmilik" → field "Kadar Cukai Tanah" is LIVE-COMPUTED, not stored. It pulled RM10 when BA expected RM29 because maintenance holds TWO rate rows with identical lookup keys and the code takes the earliest-created one.

**Root cause (DATA, not code)** — MLKSTG et_main_stg2, Mukim Ayer Panas:
- `ind_kadar_cukai_bpm` has two rows, same keys, different value:
  - bpm 6143 = RM10.00 (created admin 2026-05-24 22:43:57)
  - bpm 6226 = RM29.00 (created admin 2026-05-24 22:45:29)
- Identical keys on both: bandar_pekan_mukim_id=41, jns_tnh_id=9957 (Tanah Desa), kegunaan_tnh_id=38426 (BANGUNAN), btrn_kegunaan_tnh_id=38456 (TUJUAN KEDIAMAN), warta_id=1, flag_kadar_awal=N, kadar_cukai_sebelum=null.
- User ADDED a second row (RM29) instead of EDITing the existing RM10. Screen allowed the duplicate.

**Why RM10 wins** — lookup at `E:\Projects\Melaka\etanah-common\src\main\java\my\gov\etanah\common\service\cukai\CukaiCalculationService.java:207`: `.where(mukim, jenisTanah, kegunaanTanah, butiranKegunaanTanah, adalahKadarAwal=FALSE [, warta if set] [, kadarCukaiSebelum if set]).orderBy(kadar_cukai_bpm_id ASC).limit(1)` → duplicate keys → 2 rows → picks lowest id (6143, RM10). Context built at `E:\Projects\Melaka\etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\service\impl\PelupusanService.java:10908` (onCalculateCukaiTanah); PT does NOT set warta and sets adalahMCL=false.

**Amount formula** — for unit "per 100 meter persegi": nilai = ceil(luas ÷ 100) × kadar, then floored to Melaka minimum RM50 (non-MCL) / RM25 (MCL) at CukaiCalculationService.java:505. "Pengkelasan Tanah" (DESA II) is NOT a lookup key and does not affect the amount.

**The two original screens (why they did not tally)** — different luas, not different setting:
- PROD lot 13102, apl 3422294, luas 967 m² → RM100.00 (`umm_a_permohonan_tnh.jumlah_cukai_tnh`).
- STAGING PTMLK/02/L/PT/2026/29, apl 3433210, luas 100 m² → RM50.00 (floored).

**Data map**: `umm_aplikasi.id_pengenalan` = the PTMLK/.../PT/YEAR/N id. Plot rows in `umm_a_permohonan_tnh` (no_lot, luas_dipohon, kadar_cukai_tnh, jumlah_cukai_tnh, aplikasi_id).

**Fix / handback**: BA removes or edits the duplicate so ONE kadar row per (mukim + jenis + kelas + butiran + warta). Verdict = maintenance-data cleanup, no code change. PROD not yet checked for the same duplicate. If ticketed, start here (already root-caused + DB-proven on stg2).

---

## Merged 2026-10-04: pelupusan-doc-reset-tool (was reference_pelupusan_doc_reset_tool.md)

> To re-test a regenerated Pelupusan document (L1e/4Ae/surat etc.), the \"reset\" = DELETE the related generated documents via PelupusanMaintenanceForm.xhtml — not SQL, not the flow auto-delete

For "reset the generated document so it regenerates on re-test" on Pelupusan tickets, the reset is: **delete the related generated documents** using the internal maintenance tool at
`https://etanah-app.melaka.gov.my/etanah-pelupusan/protected/internal/PelupusanMaintenanceForm.xhtml`
(per みや, QA-273621, 2026-08-11).

Two mechanics I earlier proposed and みや corrected — do NOT default to them for this family:
- `status_id=NULL` SQL patch on `umm_a_dok_keluaran` — that was **#273956**, a *template-letter* (generateSurat) mechanic, a DIFFERENT ticket type.
- `pembetulan=true` flow auto-delete (`MlkLaporanL1eForm.overridePostSubmitMethod:207-211`) — inferred from code, NOT the operative test-reset みや uses.

⚠️ Provisional — みや flagged I'm new to this ticket family and told me not to be over-sure. Confirm the tool's exact delete scope before asserting it in a fix/hand-back. Related: [[Knowledgebase enrichment during debugging]] · (merged above).

---

## Merged 2026-10-04: reference_utiliti_ulasan_jt_jpph_screen (was reference_utiliti_ulasan_jt_jpph_screen.md)

> The Pelupusan \"utiliti\" screens (sidebar menu) live in etanah-common protected/jpph/ — \"Kemaskini Ulasan Jabatan Teknikal / JPPH\" = UtilitiKemaskiniUlasanJPPHForm, NOT the pelupusan tugasan forms

When the BA says **"Utiliti"** they mean the **PELUPUSAN sidebar menu** items (e.g. "KEMASKINI ULASAN JABATAN TEKNIKAL/JPPH", "PROSES PEMBATALAN PERMOHONAN", "PENGELUARAN LESEN DAN PERMIT"), NOT a tugasan panel.

**"Kemaskini Ulasan Jabatan Teknikal / JPPH" utiliti** (confirmed QA-274318):
- View: `etanah-common\src\main\webapp\protected\jpph\UtilitiKemaskiniUlasanJPPHForm.xhtml` (deploys via the etanah-common overlay war; only in `target/` under etanah-pelupusan, `src/` lives in etanah-common)
- Bean: `etanah-common\src\main\java\my\gov\etanah\common\web\form\UtilitiKemaskiniUlasanJPPHForm.java` (`@ManagedBean utilitiKemaskiniUlasanJPPHForm`)
- Radio "Ulasan": Jabatan Teknikal (`ulasanJPPH=false`) vs JPPH (`ulasanJPPH=true`)
- Two lists: JPPH panel → `appJabatanTeknikalVOs`; Jabatan Teknikal panel → `appJabatanTeknikalNonJPPHVOs`
- Populate: `onChangeJenisUlasan()`. Save: `onSave()` → `saveUlasan()` (JPPH rows) + `saveAppJabatanTeknikalVOs()` (JT rows). All ulasan rows persist to one table `umm_a_jabatan_teknikal`; the discriminator is JSON `KEY_FLAG_FROM` in `mklmt_tmbhn` (`utilitiUlasanJPPH` vs teknikal tags).

**NOT this screen**: pelupusan `MlkUlasanJPPHForm` / `MlkJabatanTeknikalTerlibatForm` are **tugasan** forms (workflow steps), a different code path with its own JPPH save. Don't fix a utiliti-reported bug in the pelupusan tugasan forms. **Rule**: a BA "utiliti" report → look in etanah-common `protected/<area>/Utiliti*Form` FIRST. Pairs with [[feedback_module_edit_boundary]] + the BPMN module-scope check.

---

## Merged 2026-10-04: reference_dms_document_patch (was reference_dms_document_patch.md)

> Melaka DMS document-patch tickets (replace a generated Surat/dokumen in PROD) are a PROVEN one-shot lookup — use the /patch-mlk-doc skill, never re-explore et_dms

Any "patch/replace document to PROD/staging" ticket (Cetakan Dokumen, Surat JPPH, BA attaches an edited `LAIN-<id>_latest.main`) is handled by the **`/patch-mlk-doc` skill** — do NOT re-explore the `et_dms` schema; the tables + locator query are fixed and verified.

**Trigger — auto-retrieve on ANY "file path" / "location" ask (added 2026-08-03 per みや):** whenever みや asks for a document's **"file path"**, **"location"**, **"lokasi fail"**, or **"where is the file"** AND names the specific document (a surat / pelan / any doc name), immediately run the skill's locator query for that permohonan + document and return the `lokasi_fail` — do NOT ask for the numeric id, do NOT re-explore. I identify the doc from its name (Surat JPPH → `SN_JPPH`, Surat Keputusan, pelan, etc.) against the query's `kod`/`nama` columns. Pick the latest active revision by default. This is NOT limited to patch tickets — a bare "give me the file path of X" is enough.

Two-part process:
1. Locate `lokasi_fail` (the `.main` file) → infra replaces it with the edited docx.
2. After infra confirms → patching team runs `UPDATE ET_DMS.DOKUMEN_REVISION SET LOKASI_FAIL_PDF=NULL WHERE DOKUMEN_REVISION_ID=<id>;` on the **latest active** revision (highest `sd.versi_dok`, `flag_aktif='Y'`) so the PDF regenerates. **Null AFTER the replace, never before.**

Data spine: `et_main.umm_a_dok_keluaran` → `skg_dok` (medan_pk_id) → `et_dms.dokumen` (id_dokumen `LAIN-<n>`) → `et_dms.dokumen_revision` (lokasi_fail / lokasi_fail_pdf). Full locator query + runbook in the skill.

**Why (2026-08-03, #273625)**: みや had already given me the tables and asked for this skill previously; I re-explored the DMS schema from scratch for a lookup, wasting usage. He was right — this is proven knowledge, so it must live in a skill I invoke confidently, not a fresh explore each time. Skill born via forge; eval `domain/patch-mlk-doc/eval.js` guards the anchors. See [[feedback_do_dont_ask_answer_literal]] family — deliver from proven knowledge.

---

## Merged 2026-10-04: reference_qa246512_containment (was reference_qa246512_containment.md)

> #246512 (PTG/PPJK template fixes) containment — in master + all releases 1.1.0→1.3.1 + int-env; BUT the 06-26 \"missing points PTG template ppjk\" commit was REVERTED same day so that one change is live nowhere

**#246512** = a series of Melaka pelupusan **PPJK/PTG Word-template** fixes (KeputusanSyorPTG not displayed, template PPJK numbering, "ppjk tolak"). Branches: `mlk/qa/246512` + `mlk/qa-246512` … `v6` (etanah-pelupusan). Verified 2026-08-10.

**Containment** (by branch-tip ancestry, per BRANCH-AND-DEPLOY §3 — never hunt the env merge commit):
- Main body of fixes (merged Apr 7 → Jun 22, through v5 + the 06-22 "template ppjk tolak" fix): **in `mlk/int-env`, `mlk/master`, and every release `1.1.0`→`1.3.1`.** Any PROD build ≥ release 1.1.0 (built 2026-07-28+) carries them.
- 🚨 **The v6 tip `83e1427f` "#246512 - missing points PTG template ppjk" (2026-06-26) was REVERTED the SAME DAY by `b1ee3c12`.** Both the commit and its revert propagated everywhere, so the *net effect* = that specific change is **live in no environment**. If the "missing points on PTG template PPJK" symptom resurfaces, know the prior fix for it was pulled — it is NOT a regression of shipped code, it was never shipped.

**How re-checked**: `git merge-base --is-ancestor <sha> origin/mlk/<branch>` for each env/release tip; `git log --grep=246512` on master/int-env. Effective PROD state = everything through v5 + 06-22 fix, minus the reverted 06-26 change.

---

## Merged 2026-10-04: project_mlk_template_state_folder_move (was project_mlk_template_state_folder_move.md)

> RESOLVED 2026-09-03 — the #277697 template/MLK → template/state/MLK move was REVERTED on int-env; Melaka pelupusan templates stay at template/MLK/ everywhere. Kept as history in case the move is re-attempted.

✅ RESOLVED / REVERTED 2026-09-03. The landmine below is CLOSED — kept only as history.

**What happened**: ticket **#277697** ("Template Logo / State code issue") briefly restructured Melaka pelupusan templates `template/MLK/…` → `template/state/MLK/…` and cherry-picked that onto `mlk/int-env`. On 2026-09-03 Aaron said "remove terengganu, undo the rest" — the state/MLK move was **reverted** (commits `19219814bb` + `cfd472a6d9`), and only the TRG-removal was re-applied (`ef67f4a4c1`, branch `mlk/internal/277697v3`).

**Current truth (verified 2026-09-03, `origin/mlk/int-env` = `d8b6cd20c1`)**:
- All Melaka pelupusan templates live at `template/MLK/…` + `template/MLK/references/…` on **both** `mlk/master` AND `mlk/int-env`.
- `template/state/MLK/` is **gone** (0 files).
- So a template ticket branched off `mlk/master` needs **no path relocation** to reach int-env — paths already match.

**If the state/MLK move is ever re-attempted** (watch for a fresh `template/state/MLK/` folder on int-env), the old trap returns: a master-based template ticket's files would land at the dead `template/MLK/` path and never be served. The fix then was `git mv` each touched template + reference file to `template/state/MLK/` before the int-env merge, and confirm with `git ls-tree -r origin/mlk/int-env --name-only | grep <TemplateName>`.

**#277295 outcome** (PRBB Lampiran A/B): cherry-picked clean to int-env (`c27700141e`) at `template/MLK/` — no relocation needed, because the revert had already restored that path.

Related: [[feedback-commit-deploy-runbook]] · [[feedback-commit-deploy-runbook]].
