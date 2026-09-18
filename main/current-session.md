# Current Session

## 🚀 NEXT-SESSION START PLAN — Apply the 4 verify-swept eSOKONGAN tickets

**Full per-ticket handover = each qa_doc `## 0. RESUME POINT` + `## 0b. VERIFY2`** (`projects/coding-projects/active/QA-<n>/QA-<n>.md`; also `-verify2.md` / `-wave3.md` / `-audit.md`). All on origin/main.

Apply order — each its OWN session; branch off the eSOKONGAN base FIRST (`reference_esokongan_branch_shape`, 1.6.x), never straight to int-env/stag-env:
1. **#280191** (95%) — `etanah-pelupusan\...\helper\PelupusanMaklumatPermitLesenHelper.java:3603` add `&& StringUtils.isNotBlank(maklumatTanahVO.getNomborLot())`. Test @Staging, `PTMLK/01/L/PLPS/2026/1`, `nizalarif@melaka.gov.my`, edit luas + blank No Lot + Simpan.
2. **#280176** (93%) — `etanah-pelupusan\...\service\impl\PelupusanLiteService.java:2537` add `vplList.removeIf(v -> v.getTarikhTamat()==null);`. Test @Staging, No Lesen `M081` / `PDTJ.600-2/9/79`, `nurulazura@melaka.gov.my`, Utiliti > Pengeluaran Lesen dan Permit.
3. **#280132** (95%) — `etanah-pelupusan\...\web\form\common\mlk\MlkLaporanTanahDanPelanMesyuaratForm.java:142-162` 3-swap reverse→forward finder+getter. Test **@PROD** `PTMLK/01/L/PT/2026/7`, `hafizahkasim@melaka.gov.my` (stg2 does NOT reproduce).
4. **#280166** (root 98%, fix GATED) — BEFORE coding: pull #267621 (needs `[skip-redmine-write-gate]`), confirm module (**etanah-uam** vs common) + value `perluWT ? "warta" : "TP"`. Test @Staging only (etanah-uam not on local JBoss).

Also on the plate: **#280099** (folder `216`, PROD PT "Alter Permohonan Ke Kemasukan") — retrieved, NOT swept; separate.

## 2026-09-18 (worktree `279615-goal-quest-rework`) — ES #279615 rework close + deploy

**Arc**: /goal on ES #279615 (UPP Pembatalan langkah 2 rework). BA Nurhafizah reopened 2026-09-18 with 2 issues from MLIT: (R1) langkah-2 error still — now `isTambahKuantiti` not `isGantiHari`; (R2) Jana id UPP → GIS-null NPE.

**Done**:
- R1 root-caused (= latent-bug L8 exactly): shared `mlkMaklumatUrusanForm.xhtml:680` reads `mbb.isTambahKuantiti` (added by CR #263304), Pembatalan bean lacked the getter. MLIT has #263304 so it trips there; staging cycle-1 build did not.
- Fix `getIsTambahKuantiti()=FALSE` at `MlkMaklumatPermohonanPembatalanForm.java:937` (mirror `getIsGantiHari():933`, comment kept per みや). Commit `4903ad8b6f` on `mlk/esokongan/279615v2` → merged `mlk/stag-env` `8fd1a59e61` → cherry-picked `mlk/int-env` `8ab05689c2`. Compile-green. Phase 1 CLOSED.
- Branch ledger: `mlk/esokongan/279615` (v1) ABANDONED -NEGATIVE (render-guard, never shipped); v2 *CANONICAL.
- int-env: full merge REJECTED (drags release 1.6.0/1.6.1 + `.docx` conflict with #280029 = data-loss); cherry-pick chosen per みや.
- R2 root-caused (etanah-common `PostgresUpdateService.gisRequestService` null, POJO never wired; `e2ee7f9adc` in master+beta) → handover drafted, NOT shipped, IGNORED per みや.

**Awaiting**: deploy int-env + stag-env, then BA re-test MLIT `PTMLK/03/L/UPP/2026/1` (asikin@melaka.gov.my).

## 2026-09-18 (continues worktree `esokongan-tracker-tickets-save-3ddcc8`) — /goal S2: VERIFY sweep on the 4 eSOKONGAN tickets (expected-behaviour-with-evidence)

**Arc**: /goal — re-sweep the 4 (280132/166/176/191) to VERIFY the fixes, pin the EXPECTED behaviour WITH EVIDENCE, re-score confidence; then /quest save + audit + improve sweep + DE. 4 opus verify2 familiars (one/ticket) each read the sweep-1 qa_doc + wave3 + audit and re-derived independently.

**Verify2 verdicts (all CONFIRM root cause; one fix revised)**:
- **#280132** CONFIRM 95% (unchanged). Analog corrected: real proof = `onCariPermohonanBertindih():209-212` (NOT TamatAplikasiServiceTask). Expected display DB-proven: PROD /7 → {/16,/18} each once; stg2 /7 → {/6}. New flag: IF/ELSE is either-or, not union.
- **#280176** CONFIRM 85→93% (+8). Closed residual: reconciler `!found` → `createNewVersiPermitLesenDataEntry` writes fresh 2026 versi; 6506 preserved (pulled before delete `:2593`); no secondary NPE. Code-only; W3's data-patch REFUTED.
- **#280191** CONFIRM 90→95% (+5). Save path traced: kemaskini `:19189` re-fetches + preserves `no_lot=223`; Tambah-Tanah INSERT `:19373` null-safe. Silent guard right, validator wrong.
- **#280166** CONFIRM root 98%, 🚨 FIX REVISED. Missing-branch REFUTED (gateway warta+default-End complete). Flat "TP" UNSAFE (kills Warta branch) → DERIVE `perluWT ? "warta" : "TP"`. Module etanah-common → likely **etanah-uam**. Still gated on #267621 diff.

**Improved the sweep**: W4 wave now requires EXPECTED-behaviour-WITH-EVIDENCE + verify-fix-produces-it (`.claude/skills/sweep/SKILL.md`, eval 13/13 green). The `--verify` pass = re-run W4-with-expected-behaviour on diagnosed tickets. Proposal logged (A5).

**Save**: 4 `QA-<n>-verify2.md` + a `## 0b. VERIFY2` addendum per qa_doc; synced worktree→main; active.txt phases bumped. Audit: 16 artifacts present in main.

**Resume**: unchanged from S1 — Apply each in its own session. #280166 now carries the REVISED fix (derived value + etanah-uam) + the #267621 gate.

## 2026-09-17 (Thu ~18:50–19:55, worktree `esokongan-tracker-tickets-save-3ddcc8`) — /goal: retrieve 4 eSOKONGAN tickets → full sweep (W1–W4) → save → audit → DE

**Arc**: /goal — retrieve the 4 eSOKONGAN tickets in a photo, full sweep, save all quests, DE, "so I can continue them in another session; audit the save before DE commit/push". Retrieved via `redmine-sync.js --create`: **#280166 · #280176 · #280191 · #280132** (folders 212–215) + bonus **#280099** (folder 216, PROD PT alter, NOT in photo, held not swept). Ran `/sweep` full 4-wave ladder — 16 familiars (sonnet W1–W3, opus W4), orchestration-mode flag on→off, 61 orch-suppressed rows, ledger `domain/sweep/log.jsonl`.

**4 verdicts (all CONFIRMED, Phase-0, NOT applied — each Apply in its OWN session)**:
- **#280132** PT bertindih dup — **95%**. `etanah-pelupusan MlkLaporanTanahDanPelanMesyuaratForm.initPermohonanBertindih():142-162` reverse-finder + `getAplikasiBertindih()` renders current app as its own bertindih; PROD apps /16+/18 declare /7 → 2 identical rows (DB-proven). Fix = W3's 3-swap to forward `findAppPermohonanByAplikasi`/`getAplikasi` (analog `TamatAplikasiServiceTask.java:70`). W4 caught W2's ELSE-getter error. Test on PROD (stg2 forward-only).
- **#280176** OMLPS Simpan NPE — **85%**. `PelupusanLiteService.populateVersiPermitLesen:2537` `removeIf(versiDok!=0)` leaves null-tarikh orphan `ind_versi_permit_lesen` 6506 → NPE :2553. Fix = CODE-ONLY additive `removeIf(getTarikhTamat()==null)`; NO data patch (6506 hollow orphan 0 links; real data on 6505 which #279882 patched PROD). Same M081 as #279882/#279709.
- **#280191** PLPS Maklumat Tanah Simpan NumberFormatException — **90%**. `PelupusanMaklumatPermitLesenHelper.onSimpanTanah:3603` unguarded `Integer.valueOf(getNomborLot())`; No Lot optional/null. Fix = `isNotBlank` guard. NOT the BA-suspected Butir-butir lanjut (that is `keteranganLain`). Long-standing latent (since 2025-08-08).
- **#280166** PLPS Hantar PropertyNotFoundException — root **96%** (DB-proven ACT_RU_VARIABLE), **fix-layer 70% GATED**. `caraPenghantaran` bpm var never set → gateway `sid-AAB04183` NPE. Fix = Java setter etanah-common `CommonPenerimaanBuktiPenyampaianForm.onSubmit` value "TP" (analog `BaseTindakanBuktiPenyampaianForm.java:1085`). 🚨 Cross-module (etanah-common/etanah-uam, NOT pelupusan), NOT locally testable, GATED on #267621 pull (redmine-write-gate blocked my read GET → needs みや/bypass) + module-ownership decision.

**Save**: each qa_doc got `## 0. RESUME POINT` (verdict · exact fix · banked proof · test data · residuals). 12 artifacts (4 doc + 4 wave3 + 4 audit). active.txt 4 blocks phase=Rubric-done. 🚨 **Untracked-strand catch**: `projects/` + `quest/active.txt` gitignored (untracked-confidential) → qa_docs were worktree-only; COPIED to main so next boot sees them (worktree is 0-ahead → auto-reaped). git-history probe clean (no existing fix / no regression) on all 4.

**Resume**: 4 tickets Rubric-done — resume each from its qa_doc `## 0. RESUME POINT`. #280166 blocked on #267621 pull + fix-layer nod. #280099 retrieved not swept (folder 216).
