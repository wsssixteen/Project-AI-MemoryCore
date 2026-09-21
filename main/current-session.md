# Current Session

## 🚀 NEXT-SESSION START PLAN — Apply the 4 verify-swept eSOKONGAN tickets

**Full per-ticket handover = each qa_doc `## 0. RESUME POINT` + `## 0b. VERIFY2`** (`projects/coding-projects/active/QA-<n>/QA-<n>.md`; also `-verify2.md` / `-wave3.md` / `-audit.md`). All on origin/main.

Apply order — each its OWN session; branch off the eSOKONGAN base FIRST (`reference_esokongan_branch_shape`, 1.6.x), never straight to int-env/stag-env:
1. **#280191** (95%) — `etanah-pelupusan\...\helper\PelupusanMaklumatPermitLesenHelper.java:3603` add `&& StringUtils.isNotBlank(maklumatTanahVO.getNomborLot())`. Test @Staging, `PTMLK/01/L/PLPS/2026/1`, `nizalarif@melaka.gov.my`, edit luas + blank No Lot + Simpan.
2. **#280176** (93%) — `etanah-pelupusan\...\service\impl\PelupusanLiteService.java:2537` add `vplList.removeIf(v -> v.getTarikhTamat()==null);`. Test @Staging, No Lesen `M081` / `PDTJ.600-2/9/79`, `nurulazura@melaka.gov.my`, Utiliti > Pengeluaran Lesen dan Permit.
3. **#280132** (95%) — `etanah-pelupusan\...\web\form\common\mlk\MlkLaporanTanahDanPelanMesyuaratForm.java:142-162` 3-swap reverse→forward finder+getter. Test **@PROD** `PTMLK/01/L/PT/2026/7`, `hafizahkasim@melaka.gov.my` (stg2 does NOT reproduce).
4. **#280166** (root 98%, fix GATED) — BEFORE coding: pull #267621 (needs `[skip-redmine-write-gate]`), confirm module (**etanah-uam** vs common) + value `perluWT ? "warta" : "TP"`. Test @Staging only (etanah-uam not on local JBoss).

Also on the plate: **#280099** (folder `216`, PROD PT "Alter Permohonan Ke Kemasukan") — retrieved, NOT swept; separate.

## 2026-09-21 (Mon, worktree `plan-handover-sweep`) — APPLIED the 4 eSOKONGAN + git-tracking incident + OneDrive worktree death

**Arc**: START PLAN executed. Applied 3 non-gated eSOKONGAN fixes, resolved the gated one, gave Redmine RC/Solution + BA explanations, then a long SourceTree/git-tracking incident and a broken worktree.

**Fixes shipped (etanah-pelupusan, isolated worktrees/clone → BOTH int-env + stag-env, compiled JDK17 via `-gt` toolchains override pointing java17 at `C:\Program Files\Java\jdk-17`)**:
- **#280191** PLPS No Lot NumberFormatException — `PelupusanMaklumatPermitLesenHelper.onSimpanTanah():3603` guard `isNotBlank(getNomborLot())`. Scope GREW per みや: + popup validation (blank No Lot **AND** blank No Lot Bersebelahan `noRujukanLokasi` → `MESEJ_NO_LOT_DAN_BERSEBELAHAN`) + Butir-butir lanjut re-populate (`PelupusanService.populateMaklumatTanahVOListByAplikasiByUrusan()` PLPS branch was missing the `KEY_BUTIR_BUTIR_LANJUT` read the PT branch had). **Now Ammar's** (reassigned; he revised guard to `NumberUtils.isParsable`, commits `522951d068`/`b10432cafe`) — merged his LATEST into both envs (stag-env tip `1c82407e2c`).
- **#280176** OMLPS Simpan NPE — `PelupusanLiteService.populateVersiPermitLesen():2537` `removeIf(getTarikhTamat()==null)`. Test staging M081 only (no LPS permit with null-tarikh versi on mlit).
- **#280132** PT bertindih dup — `MlkLaporanTanahDanPelanMesyuaratForm.initPermohonanBertindih():135` reverse→forward finder. PROD-proven (/16,/18 declare /7). Test internal PTMLK/01/L/PLPS/2026/19 (mradzi, PLT) OR PROD. Staging shows /7→/6 one row = fix works.
- **#280166** PLPS Hantar PropertyNotFoundException — GATED, NOT a pelupusan code fix. #267621 (twin) was fixed by **Aaron deploying a new flowable** (verbatim from Redmine) → 280166 = flowable/BPMN or etanah-uam Java setter, cross-module, Staging-only. `caraPenghantaran` unset → gateway `sid-AAB04183` NPE. Now Ammar's.

**Redmine**: RC + Solution + BA explanations delivered for 280132/280176/280191 (plain Malay, no code ids). Handover file `212. ES #280191\2. Fix\280191 - Handover.txt`.

**🚨 INCIDENT — miya's local `mlk/stag-env` showed false "19 to push"**: upstream was `origin/mlk/master` (set when branch rebuilt-from-master, reflog `@{8}`), so every stag-env commit counted vs master. Root cause NOT my commands, but my in-repo fetches/worktrees/reset-advice churned it + I burned turns theorizing instead of reading `git status -sb`/reflog turn-1. Fixed: `git branch --set-upstream-to=origin/mlk/stag-env`. Banked [[feedback_etanah_git_separate_clone]] (write-side etanah git in a SEPARATE clone `E:/Dev/etanah-work`, never miya's repo; reading his repo to diagnose is fine) + [[feedback_worktree_cleanup_after_merge]].

**🚨 INFRA — this worktree's git backing emptied by OneDrive** (`.git/worktrees/plan-handover-sweep-1e8aab` gone, not in `git worktree list`, repair failed). DE ran in the MAIN repo. Same class as the 213-folder OneDrive-worktree problem.

**Resume**: eSOKONGAN 280191/280176/280132 on both envs awaiting miya/BA test + Redmine close; 280166 handoff (flowable/uam, Ammar). #280099 retrieved not swept. Separate-clone at `E:/Dev/etanah-work/etanah-pelupusan` reusable.

## 2026-09-18 (worktree `279615-goal-quest-rework`) — ES #279615 rework close + deploy

**Arc**: /goal on ES #279615 (UPP Pembatalan langkah 2 rework). BA Nurhafizah reopened 2026-09-18 with 2 issues from MLIT: (R1) langkah-2 error still — now `isTambahKuantiti` not `isGantiHari`; (R2) Jana id UPP → GIS-null NPE.

**Done**:
- R1 root-caused (= latent-bug L8 exactly): shared `mlkMaklumatUrusanForm.xhtml:680` reads `mbb.isTambahKuantiti` (added by CR #263304), Pembatalan bean lacked the getter. MLIT has #263304 so it trips there; staging cycle-1 build did not.
- Fix `getIsTambahKuantiti()=FALSE` at `MlkMaklumatPermohonanPembatalanForm.java:937` (mirror `getIsGantiHari():933`, comment kept per みや). Commit `4903ad8b6f` on `mlk/esokongan/279615v2` → merged `mlk/stag-env` `8fd1a59e61` → cherry-picked `mlk/int-env` `8ab05689c2`. Compile-green. Phase 1 CLOSED.
- Branch ledger: `mlk/esokongan/279615` (v1) ABANDONED -NEGATIVE (render-guard, never shipped); v2 *CANONICAL.
- int-env: full merge REJECTED (drags release 1.6.0/1.6.1 + `.docx` conflict with #280029 = data-loss); cherry-pick chosen per みや.
- R2 root-caused (etanah-common `PostgresUpdateService.gisRequestService` null, POJO never wired; `e2ee7f9adc` in master+beta) → handover drafted, NOT shipped, IGNORED per みや.

**Awaiting**: deploy int-env + stag-env, then BA re-test MLIT `PTMLK/03/L/UPP/2026/1` (asikin@melaka.gov.my).
