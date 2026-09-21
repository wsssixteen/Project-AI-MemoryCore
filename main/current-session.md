# Current Session

## 🚀 NEXT-SESSION START PLAN — Apply the 4 verify-swept eSOKONGAN tickets

**Full per-ticket handover = each qa_doc `## 0. RESUME POINT` + `## 0b. VERIFY2`** (`projects/coding-projects/active/QA-<n>/QA-<n>.md`; also `-verify2.md` / `-wave3.md` / `-audit.md`). All on origin/main.

Apply order — each its OWN session; branch off the eSOKONGAN base FIRST (`reference_esokongan_branch_shape`, 1.6.x), never straight to int-env/stag-env:
1. **#280191** (95%) — `etanah-pelupusan\...\helper\PelupusanMaklumatPermitLesenHelper.java:3603` add `&& StringUtils.isNotBlank(maklumatTanahVO.getNomborLot())`. Test @Staging, `PTMLK/01/L/PLPS/2026/1`, `nizalarif@melaka.gov.my`, edit luas + blank No Lot + Simpan.
2. **#280176** (93%) — `etanah-pelupusan\...\service\impl\PelupusanLiteService.java:2537` add `vplList.removeIf(v -> v.getTarikhTamat()==null);`. Test @Staging, No Lesen `M081` / `PDTJ.600-2/9/79`, `nurulazura@melaka.gov.my`, Utiliti > Pengeluaran Lesen dan Permit.
3. **#280132** (95%) — `etanah-pelupusan\...\web\form\common\mlk\MlkLaporanTanahDanPelanMesyuaratForm.java:142-162` 3-swap reverse→forward finder+getter. Test **@PROD** `PTMLK/01/L/PT/2026/7`, `hafizahkasim@melaka.gov.my` (stg2 does NOT reproduce).
4. **#280166** (root 98%, fix GATED) — BEFORE coding: pull #267621 (needs `[skip-redmine-write-gate]`), confirm module (**etanah-uam** vs common) + value `perluWT ? "warta" : "TP"`. Test @Staging only (etanah-uam not on local JBoss).

Also on the plate: **#280099** (folder `216`, PROD PT "Alter Permohonan Ke Kemasukan") — retrieved, NOT swept; separate.

## 2026-09-21 (Mon, session `ammar-mlk-esokongan-280029`) - QA-280029 rework review + font fix to int-env

**Arc**: /goal - review Ammar's latest #280029 fix (Surat Ulangan JT), appraise the common-side font issue, deploy to internal.

**Reviewed 3 Ammar commits** on `mlk/esokongan/280029`: v1 `6771d16ca7` (idHakmilikTanah + tarafMilikHakmilik CC tags + docx), rework `11e561852a` (lokasi fallback), font `5ccbb0613c` (`PelupusanWordEditorUtil` restores CC font/size).

**Confirmed 100% (staging `et_main_stg2`)**:
- BA #3 Status Pegangan = "Selama-lamanya" -> hakmilik `040201GM00000004` `ind_mklmt_hkmlk.taraf_milik` = **"Selama-lamanya"**. The hakmilik screen LABELS `taraf_milik` as "Jenis Pegangan" -> Ammar's `getTarafMilik()` is CORRECT. (I first mis-flagged it as the wrong field; the DB query retracted that.)
- Original permohonan `PTMLK/02/L/PPTPB/2026/1` (apl 3396320) links hakmilik `040201GM00000004` -> papar-hakmilik correct.

**Common-side appraisal - does NOT need fixing**: common word-fill ignores the CC's control-level (sdtPr) font -> renders Calibri 11 default. Ammar's pelupusan-side guarded fallback is the right in-boundary fix (module-boundary + system-wide blast-radius rule out a common change). Latent common gap = handoff note only.

**Deploy**: int-env had rework `6a74597c85` (my 09-18 merge) but not the font fix. Brought `5ccbb0613c` onto int-env; final tip `01c501634c` (compile-green, sanctioned toolchains). Reworded a jargon commit message (removed `rPrOrSdtPrFallback`/`sdtPr` -> plain English) via `--force-with-lease`.

**Mistake owned**: a `git reset` landed on `mlk/stag-env` (miya had switched the checkout to it) not int-env. Restored stag-env exactly to `8fd1a59e61` (9 unpushed staging merges intact) and fixed int-env via `git branch -f`. Nothing pushed wrong, nothing lost.

**Awaiting**: deploy int-env build (`deploy-pelupusan.sh` -> `mlk/int-env`) + BA regen Surat Ulangan JT on internal, check the 3 fields + font.

## 2026-09-18 (worktree `279615-goal-quest-rework`) — ES #279615 rework close + deploy

**Arc**: /goal on ES #279615 (UPP Pembatalan langkah 2 rework). BA Nurhafizah reopened 2026-09-18 with 2 issues from MLIT: (R1) langkah-2 error still — now `isTambahKuantiti` not `isGantiHari`; (R2) Jana id UPP → GIS-null NPE.

**Done**:
- R1 root-caused (= latent-bug L8 exactly): shared `mlkMaklumatUrusanForm.xhtml:680` reads `mbb.isTambahKuantiti` (added by CR #263304), Pembatalan bean lacked the getter. MLIT has #263304 so it trips there; staging cycle-1 build did not.
- Fix `getIsTambahKuantiti()=FALSE` at `MlkMaklumatPermohonanPembatalanForm.java:937` (mirror `getIsGantiHari():933`, comment kept per みや). Commit `4903ad8b6f` on `mlk/esokongan/279615v2` → merged `mlk/stag-env` `8fd1a59e61` → cherry-picked `mlk/int-env` `8ab05689c2`. Compile-green. Phase 1 CLOSED.
- Branch ledger: `mlk/esokongan/279615` (v1) ABANDONED -NEGATIVE (render-guard, never shipped); v2 *CANONICAL.
- int-env: full merge REJECTED (drags release 1.6.0/1.6.1 + `.docx` conflict with #280029 = data-loss); cherry-pick chosen per みや.
- R2 root-caused (etanah-common `PostgresUpdateService.gisRequestService` null, POJO never wired; `e2ee7f9adc` in master+beta) → handover drafted, NOT shipped, IGNORED per みや.

**Awaiting**: deploy int-env + stag-env, then BA re-test MLIT `PTMLK/03/L/UPP/2026/1` (asikin@melaka.gov.my).
