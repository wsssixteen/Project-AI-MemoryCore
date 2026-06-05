# 🌟 Current Session Memory - RAM

**Current session**: 2026-06-05 (Fri) — wrap ~09:49 MPST. Theme: **QA-264006 (Semua Urusan — PT follows SKM officer) committed + Phase 1 closed; officer-assignment carry-map mechanism fully traced via /workflows**. · **[+ PARALLEL session today closed QA-263921 (PLTP Risalat MMKN hang) in the `sweet-bell` worktree — see the ⫶ section at the bottom]**

## High-Level Objective (AGENT_STATE)
- QA-264006: make every PT-role tugasan carry the SKM officer (carry-map in `MlkPelupusanPegawaiAgihConstant`), test, close Phase 1.

## Current Progress (AGENT_STATE)
- **QA-264006 committed** — `MlkPelupusanPegawaiAgihConstant.java` only (+49) · commit `2a7f9bb7ce` → `origin/mlk/qa/264006` (pushed, **NOT merged to mlk/master**). Added `(PSJT→SKM)` + `(Cetakan/CT_BSC_PLP→SKM)` to 7 PDT blocks (PLPS/PRU/PT/PRZ/BPRZ/PPJK/PRBB) + new `URS_PLTP` block.
- **Mechanism settled via /workflows `weoplvbix`** (4 agents): the carry-map is read by `PelupusanService.submit():19079` on EVERY pelupusan form submit (urusan-agnostic, gated only by `!isFailInduk`) — NOT only the BPMN `mlkPelupusanUpdateNextUserService` serviceTask. → the earlier "PLTP/PRBB need a BPMN node / blocks are inert" finding is **REFUTED**; constant-only fix is sufficient. Pivot line verified by me: `FlowableTaskListener.java:94` reads `getVariables(processInstanceId)` (process-instance scope) → `nextUser<kod>` survives gateway routing.
- **Runtime proof**: PLPS app 124 PYSK(34.0) → `By Manual PTB:nizalarif`. Kod-match confirmed: `PSJT`="PSJT", `CT_BSC_PLP`="CT_BSC_PLP" (set==read).
- **⚠️ RESIDUAL (not settled)**: the change flips the 4 *working* urusans (PLPS/PRU/PT/PPJK) recovery→carry-map; narrow edge-case if the SKM officer is **reset** (inactive / pejabat-change / on-leave — `BpmCallbackService:1480/1792/1820`). The `QA264006-PROBE` test (1 PLPS + 1 PLTP) was **deferred**. Verify-before-merge item; commit on branch = reversible.

## Active Context (AGENT_STATE)
- Worktree: `hungry-bouman-42f4c8` (clean, 0-ahead of main). All MemoryCore changes are in the MAIN repo working tree.
- etanah: `mlk/qa/264006` pushed; **NOT merged to mlk/master** (awaits the probe test).

## Blockers (AGENT_STATE)
- None hard. The reset edge-case probe test is the open verify-before-merge item.

## Immediate Next Steps (AGENT_STATE) — NEXT SESSION
- **🔧 QA-260508 (IN-FLIGHT — fix APPLIED, awaiting みや test)**: rework = added Pengkelasan Tanah field NOT persisted by page-level Simpan/Seterusnya (TAK DISIMPAN). Root cause: `PelupusanService.java saveMaklumatPremiumCukai` rebuilds `umm_a_permohonan_tnh.mklmt_tmbhn` (remove-then-readd-from-VO for every Kadar-Cukai field) but pengkelasanTanah was the ONE field missing from the pattern. Fix = add `remove(TAG_PENGKELASAN_TANAH)` (~:16443) + conditional `addProperty(...getPengkelasanTanah().getKod())` (~:16493), mirroring jenisTanah. **UNCOMMITTED in `E:/Projects/Melaka/etanah-pelupusan`**. Test app `PTMLK/01/L/MCL/2026/18` (idi.fazlul@, MLKUAT, aplikasi_id 2963039). **On PASS** → Phase 1 commit `mlk/qa/260508` cycle-2 + check 2nd panel `hakmilikVO`/Senarai-Semakan-Hakmilik (`mlkMaklumatCukaiTanahForm` — separate save, ticket scope). **On FAIL** → falsifier: `premiumCukaiVO.getPengkelasanTanah()` null at save → check read-back `populatePremiumCukai:7413`. QA-260508.md written (Scout+Recon). saveMaklumatMCL needs NO edit (it merges, preserves).
- **🎯 QA-255940 — みや WANTS TO LOOK FURTHER NEXT SESSION**: PSBS wrong-unit "(Pelupusan)" vs "(Pendaftaran)"; Scout 70%; prior cycle fixed the office-axis NOT the unit-axis; lives in shared sub-process `MLK_DFT_NOTA_HKMLK` (cross-urusan blast radius); analog QA #246262 (BA-cited "sama macam"). **Fire 2 BA-Qs first** (was prior `1. Fixes/` BPMN actually redeployed to BA's re-test env? · confirm hakmilik=PD → expected Unit "Pendaftaran"). Test `PTMLK/01/L/PSBS/2026/4` (haiza@). QA-255940.md written.
- **QA-264006 close item**: run `QA264006-PROBE` on 1 PLPS + 1 PLTP **normal-submit** case → confirm carry-map doesn't mis-assign on an SKM-officer reset → then merge `mlk/qa/264006` → `mlk/master` + Phase 2 (post-mortem / KPI / archive hygiene).
- Carry-over (untouched): QA-262445 · QA-260476 · QA-260404 · criticals QA-260830 / QA-262852.
- **🆕 RETRIEVED + SCOUTED 2026-06-05 (3 tickets — `active.txt` status=hold, scout findings inlined there + `QA-NNN.md` docs written; ALL test on UAT despite 2 "FAT" labels — FAT has 0 matching apps)**:
  - **QA #262762** (OPLPS · **S** · 90% · start first) — "FONT" rework is really letter-**case**: `Maksud Pendudukan` should be ALL CAPS · `PelupusanReportMethodConstant.java:1763` missing `.toUpperCase()` (analog `:1769/:1771`) · test `PTMLK/01/L/OPLPS/2026/3`
  - **QA #245240** (RPPLP · **M** · 80% · ⭐High prio) — "Bayaran Disyorkan (RM)" no auto-populate from original permohonan + flag too narrow · `PelupusanRayuanHelper.java:332,169`, ×2 tugasans (PRMMKNPDT+PYMBPT), reconcile dup logic in `MlkSemakanPermohonanForm.java:480` · test `PTMLK/01/L/RPPLP/2026/15`
  - **QA #255940** (PSBS · **M** · 70% · BA-Q first) — wrong unit "(Pelupusan)" vs "(Pendaftaran)" · BPMN `MLK_PLP_PSBS.bpmn20.xml:701-718` + shared `MLK_DFT_NOTA_HKMLK` · prior cycle fixed office-axis not unit-axis · analog QA #246262 · **2 BA-Qs before investing** (prior BPMN redeployed? · hakmilik=PD?) · test `PTMLK/01/L/PSBS/2026/4` (haiza@)

## 🎯 Session Recap (for AI restart)
2026-06-05: committed QA-264006 carry-map fix (constant-only, `2a7f9bb7ce` → `origin/mlk/qa/264006`, unmerged). The session was mostly tracing the officer-assignment mechanism: the carry-map (`By Manual PTB`) is set by `PelupusanService.submit()` on every form submit (urusan-agnostic) — refuting the prior "needs a BPMN serviceTask / inert on PLTP/PRBB" finding (workflow `weoplvbix` + my verify of `FlowableTaskListener:94` process-scope read). PYSK runtime proof on app 124. Residual: the change flips 4 working urusans recovery→carry-map (narrow reset edge-case); probe test deferred = verify-before-merge. **Misses this session**: gave wrong flowable-alter stop-checkpoints 3× (didn't re-read the BPMN before answering routing), broke app 124's task list with a bad live `UPDATE` (deactivated wrong row against unverifiable flowable state), committed before re-reading the full QA-264006 doc (missed the 2026-06-04 keep-vs-revert note). Branch unmerged — safe to sit until the probe test.

---

## ⫶ Parallel session today — QA-263921 (PLTP Risalat MMKN-PDT hang) — `sweet-bell` worktree

> A SECOND session ran in parallel today (worktree `sweet-bell-562a44`) on QA-263921 and closed it Phase 1. The QA-264006 record above is from the `hungry-bouman` session; both wrapped ~09:50.

- **QA-263921 Phase-1-CLOSED.** Root cause = QA-253053 regression (`e40d1a66fe`): delete-on-entry of the Risalat MMKN doc but regenerate only on Simpan → screen-entry left the doc deleted (no `skg_dok` row) → Kemas kini → WordEditorServlet **500** → etanahv3 client saved the error page as .docx → "Sedang Dikemaskini" hung. Fix = 1 line `super.populatePenyediaanDokumenByDocumentMode();` after the entry-delete (`MlkKertasTemplateForm:~1089`, mirrors Simpan :1296-1297). Commit **`e3d9c1f53d`** on `mlk/qa/263921` (rebased onto current master `b32921bcd6` = #264071 + #246512), pushed. active.txt closed, local_test_confirmed=true.
- **Verified live**: statusCode 200 (was 500), fresh `KertasRisalatMMKN.docx` in skg_dok, Word editor opens.
- **Built / pushed to main `980add0`**: **Logic Blast Radius** (Rubric step — みや's concept) + **Fastest-Path Retrospective** (Phase 2 Step 1b) + **`/close-phase` skill**.
- **🚨 Slip (RECURRING — 2nd same day)**: Phase 1 close pull-skip — Session 1 (QA-246949) this morning + QA-263921 tonight, both = branch off stale master without pulling. Defender: `/close-phase` (deterministic close sequence).
- **Env note**: Smart App Control (Win11) blocks the unsigned `PocWordEditor.exe` → error 4551 — machine issue → DEV-TESTING-HACKS.
- **Next (QA-263921)**: BUG-BESTIARY pattern #1 update (stale QA-262495 attribution + the recipe) · register `/close-phase` in the skill catalog · Phase 2 archive when Redmine wrapped.

**Memory Type**: RAM | **Last Activity**: 2026-06-05 18:13 MPST — **PM session**: retrieved QA-260508 (rework) → Scout+Recon → **fix applied** (`saveMaklumatPremiumCukai` pengkelasanTanah remove+readd; UNCOMMITTED, awaiting みや test). **Next session: 260508 test-result → commit, then 255940 deep-dive (みや's pick).** Also pending: QA #262762 (a parallel session is on it — 2 uncommitted hook `.js` rewrites for QA-262762 in main repo working tree, that session's to commit) · QA #245240. (AM: QA-264006 + QA-263921 both Phase-1-closed + DE'd.)
