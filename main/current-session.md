# Current Session

## 2026-08-19 — ADHOC-OPRBB-2026-1 OPRBB Kuantiti Diluluskan tak papar (Carian Pintas + AWAM) → diagnosed + patch handed + archived (under another ticket)

**Session shape: adhoc from screenshots (OPRBB permit qty display) → DB spine (mlit) → root cause pinned inline (Agent tool blocked by erroring hook) → data patch handed → miya: under another ticket → Phase 2 archive + DE. Worktree claude/oprbb-quantity-display-issue-95483d.**

### The issue
- OPRBB permit C02/2026/5 (PTMLK/02/L/OPRBB/2026/5, aplikasi 3408554, mlit, "Ganti Hari"): "Kuantiti Diluluskan" = 0.00 in Carian Pintas grid + blank in AWAM "Maklumat Permohonan" popup; shows 55000 Ketul correctly in permit "Maklumat Jadual" + Borang 4Ce.

### Root cause (VERIFIED code + DB)
- OPRBB save writes approved qty to `kuantiti_pengeluaran` only, never `kuantiti_dilulus`: `etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\service\impl\PelupusanLiteService.java:1080` (URS_OPRBB branch, `setKuantitiPengeluaran(kuantitiAmbil)`, no `setKuantitiDilulus`).
- Broken surfaces read `kuantiti_dilulus` (AWAM `PenguatkuasaanService.java:1747`; staff `PelupusanMaklumatPermitLesenHelper.java:1110`). Working analog PRBB fills `kuantiti_dilulus` (`PelupusanService.java:2810`).
- DB: all 5 OPRBB permits have `kuantiti_dilulus` null, `kuantiti_pengeluaran` filled. Systematic, not one-off.

### Delivered
- Data patch `projects/coding-projects/archive/ADHOC-OPRBB-2026-1/patch-oprbb-kuantiti-dilulus.sql` (aplikasi 3408554; self-column copy pengeluaran->dilulus + unit; idempotent `IS NULL` guard; before/after SELECT).
- Code fix (add `setKuantitiDilulus` in OPRBB branch) + backfill of remaining 4 rows deferred to owning ticket.

### ▶▶ NEXT (ADHOC-OPRBB-2026-1)
- Under another Redmine ticket (number TBD by miya). When numbered: link + do the code fix at PelupusanLiteService.java:1080 + backfill 4 remaining OPRBB rows. Archived 2026-08-19.

---

## 2026-08-18 — QA-275475 PLPS "Tiada Rekod Bayaran/Resit" (flowable StaleObjectStateException) → fixed + int-env + Phase 1 closed

**Session shape: /quest resume 275475 (fresh retrieve — not drafted, absent from active.txt) → Scout+Recon+Rubric → fix applied + build-verified → commit + int-env deploy → miya ran fresh PLPS submit (works) → 100% data-loss verification → Phase 1 close → DE. Worktree claude/quest-275475-resume-5aa23e.**

### The issue (issue #2 ONLY — Anis routed to miya)
- ESOKONGAN #275475: PLPS `PTMLK/02/L/PLPS/2026/17` "Tidak Papar No Resit" in Carian Dokumen. Dev Hasil (Nor Sakinah) traced: data saved until BayaranFi only, flowable submit failed with `StaleObjectStateException` on `Aplikasi#3433478`. **Issue #1 (batal /17) = Hasil team, NOT ours.**

### Root cause (VERIFIED code)
- Flowable serviceTask `mlkPelupusanPermohonanService` (`MLK_PLP_PLPS.bpmn20.xml:102`, targets etanah-pelupusan) → `MlkPelupusanPermohonanServiceTask.process():28` → `PelupusanService.populatePejabatPermohonanAplikasi():8651` did `crudService.save(aplikasi)` at `:8672` — an UNNECESSARY write of the derived key `pjbtPermohonan` into `mklmt_tmbhn`. A concurrent tx bumped the Aplikasi version → `StaleObjectStateException` → flowable submit rollback → no receipt row → "Tiada Rekod Bayaran". **NOT AWAM code** (miya asked — the AWAM handoff is the separate `:6` `mlkSpocIntegrationService` serviceTask).

### Fix (commit `9b2d222` → int-env `ddca103`)
- Removed dead-write block `etanah-pelupusan\...\PelupusanService.java:8663-8672` (−11 lines). Method now computes+returns pejabat only. `mvn compile` = BUILD SUCCESS (pom needs a **JDK17** toolchain, not JDK8 — the `E:\Java\java8` error was a stale global toolchains ref). Branch `mlk/esokongan/275475` → merged `mlk/int-env` `ddca103` (delta = only PelupusanService.java).

### Verification (miya /goal, 100%)
- miya ran fresh PLPS `PTMLK/01/L/PLPS/2026/40` (3408548), receipt `260818BSAT00020` — **No. Resit shows**. Data-loss: `2026/40` `mklmt_tmbhn={"adalahe2e":true}` vs siblings `{"adalahe2e":true,"pjbtPermohonan":"PDT"}` — differs by EXACTLY the one derived key. `pjbtPermohonan` = **0 readers** across 4 repos (grep: 2 constant defs only, both write-only; the write is a recomputable cache of office PTG/PDT). **No PLPS data lost.**

### ▶▶ NEXT (275475)
- Phase 2 (later): Redmine #275475 → Resolved + planned-release list (int-env only, NOT master); archive folder+block. Redmine still In Progress (our code side done; BA verification pending). Root-cause comment for user (miya-approved shape): "two system processes update the same record at the same instant → DB lock clash (race condition) → submission fails; fix removes the redundant update."

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
