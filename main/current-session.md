# Current Session

## 2026-08-18 — Adhoc: PT "Semakan Maklumat Bantahan" mislabel on mlit (during #275009 verify)

**Session shape: miya verifying eSOKONGAN #275009 on MLKIT → hit unexpected tugasan → "check adhoc" → 3-env DB proof → ADHOC-REGISTER A17 → DE. Worktree `semakan-maklumat-bantahan-verify-77396a`.**

### The ask
- PT `PTMLK/01/L/PT/2026/23` (aplikasi **3408515**, status *Tolak Ringkas*) on mlit: after **Penyediaan Minit Bebas** the active tugasan showed **"Semakan Maklumat Bantahan"** — miya expected **"Semakan Minit Bebas"**.

### Finding — mlit-only config-label drift, NOT a flow/code bug
- PT (ursn_id **51**) Minit-Bebas triplet: `PYMB`(tgsn 5134753) → **`SMB`(tgsn 5134754)** → `PMB`(5134755). Active `umm_a_tgsn` **2732608** binds tgsn **5134754**, kod **SMB**, peranan `-PPD-`. Flow routed correctly; that kod=SMB step **IS** the Semakan Minit Bebas review.
- **Same tgsn_id 5134754, 3-env DB-proven**: `et_main_mlit`.nama = "Semakan Maklumat Bantahan" ✗ · `et_main_stg2` = "Semakan Minit Bebas" ✓ · PROD `et_main` = "Semakan Minit Bebas" ✓.
- Sibling urusan on mlit confirm PT is the outlier: PLTP (ursn 1533, tgsn 5134704) + PPTPB (ursn 26195, tgsn 5134395) both name the kod=SMB step "Semakan Minit Bebas".
- Form binds by **kod (SMB)** not nama → clicking the mislabeled tugasan opens the real Semakan Minit Bebas screen → **#275009 still testable**. Distinct from #275009's own symptom (missing Syor Permohonan field + wrong jawatan in Kertas).

### Owed (handed to miya)
- ⬜ Optional mlit 1-row label UPDATE `ind_tgsn` tgsn 5134754 → 'Semakan Minit Bebas' (write handed; matches STG/PROD).
- ⬜ miya's call: raise Redmine # or fold under #275009.
- ⬜ Optional mlit-wide `ind_tgsn` label-drift sweep vs PROD.

---

## 2026-08-17 — Baseline Melaka Pelupusan 1.3.4 + Common 1.1.17-MLK (via release-mlk-plp skill)

**Session shape: BAQA pasted "Planned Release Melaka 17/8" → release-mlk-plp pipeline → prepared, pushed, BA-confirmed successful → DE. Worktree `melaka-baseline-deploy-1d5c45`.**

### Release prepared + PUSHED
- Branch **`mlk/release/1.3.4`** off `mlk/master` (`377580ef71`), pushed HEAD **`ce1ccd6e30`**. Common `1.1.12-MLK → 1.1.17-MLK`, module `1.3.3 → 1.3.4` (pom.xml only).
- 5 tickets merged: #272130, #274532, #274745, #271442 (Training→internal branch), #273979. verify = 0 commits missing all rows.
- **BA-confirmed baseline test SUCCESSFUL** (miya, 2026-08-17).

### #274532 — the catch (recon guess overridden by verified ledger, then ledger itself corrected)
- Recon script suggested merge **v3**; quest ledger said ship **base**; BOTH were partly wrong. Correct = **base's Java + v3's docx**.
- Verified: base Java `PelupusanWordCCMethodConstant.java` (+2/-1) exists ONLY in base; v3 has ONLY the docx. base's docx PREDATES Aaron #274838 → shipping it alone reverts Aaron's footer/pelanCC.
- Aaron **#274455 (1.3.2) + #274838 (1.3.3) ARE on `mlk/master`** now (git-verified `692432a707` is ANCESTOR of v3) → v3 docx sits on master's formatting = correct release docx.
- Merged base → docx binary-conflict → resolved by `git checkout ...274532v3 -- <docx>` (blob `152be7dc` MATCH ✓). v2 unusable (branched off int-env, 35 files).
- **Corrected the stale `QA-274532.md` ledger** (was "v2/v3 NOT for release" — now "base Java + v3 docx", git-evidence inline).

### ▶▶ NEXT / owed
- ⬜ **etanah Phase F DEFERRED** — `merge-to-master --ba-approved` refused: etanah tree is on branch `mlk/esokongan/275009` with LIVE uncommitted QA-275500 work (concurrent session). Did NOT stash/checkout a live tree. Run when 275009 tree is clean/committed.
- ⬜ **QA-275500 stash** — parked twice under `stash@{1}` msg `275500` (+ `stash@{0}` eclipse churn) at baseline start; a second live copy is now on branch 275009. Reconcile before popping.
- ⬜ V6b build-SHA match was skipped — superseded by BA's successful-test confirmation (stronger evidence than the footer proxy).

---

## 2026-08-14 — Worktree-sweep retrieval + quest 2 new tickets (275456 fold, 275500 Phase 0)
