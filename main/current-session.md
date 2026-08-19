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
## 2026-08-18 — Ticket triage + plan; focus QA-275456 (PPTPB location blank)

**Session shape: boot → "plan today's tickets" → triage board → focus QA-275456 this session, others deferred to own sessions → save/commit/push/merge to main.**

### Plan set today
- **Focus THIS session: QA-275456** (PPTPB Maklumat Permohonan papar SELANGOR / land location blank).
- Other tickets → **each in its OWN session** (miya's "one ticket, one session"):
  - 275152 (AWAM Sistem Papar Ralat) · 275505 (PPTPB Tanah Rizab/Keadaan Blank) · 275501 (PRBB dashboard ralat) — diagnosed, apply-only, steal-risk.
  - 275475 (PLPS Tiada Rekod Bayaran) — **RETRIEVED today** (folder 153, active.txt hold, 14 journal entries); undrafted, own session.
  - 275500 (PLTP Tajuk Risalat) — already **Phase 1 CLOSED + tested**; Phase 2 (release list + archive) only. qa_doc banner-reconciled today (was stale "uncommitted/untested").

### QA-275456 — evidence hardened this session
- **All 4 `0. Brief/` attachments opened + ledgered** (attachment-ledger gate).
- 🚨 **URL-PROVEN cross-module**: symptom screen = `etanah-app.melaka.gov.my/etanah-teknikal/protected/avalon/AvalonLaporanPelukisPelanForm.xhtml` (etanah-teknikal, not deployed locally). Maklumat Pemohon = `/etanah-pelupusan/protected/mlk/common/MlkMaklumatPemohonForm.xhtml`.
- **Nuance**: BA's "real address shown" = applicant MAILING address (Durian Tunggal/Melaka); the blank is the LAND location (Alor Gajah/Padang Sebang) — different fields.
- Hakmilik popup confirms source: Daerah 03-Alor Gajah, Bandar 16-Mukim Padang Sebang → validates patch daerah_id=4 / bpm_id=87.
- **Fix direction**: data-patch (primary, PROD write — miya nod) clears the teknikal symptom without touching teknikal; awam code-harden optional (needs portal repro + #262624 read).

### QA-275456 — RESOLVED via CODE FIX (root corrected; data-patch abandoned)

🚨 **The data-patch direction above was WRONG — corrected via miya's Perserahan-Kaunter insight + a git-history probe:**
- **Root (DB-proven)**: 3413241 entered via **Perserahan Kaunter** (`umm_a_tgsn 2742297 kod PK`), NOT online. The SKM Maklumat Tanah populate reads `ahkm.getBandarPekanMukim()` (= `bandar_id`, NULL for counter) with **no hakmilik-master fallback** → daerah/bandar blank → Teknikal defaults SELANGOR. Online path populates fine (my staging test row 47279 = 3/41). The blank sits in `umm_a_hkmlk.bandar_dipohon_id=87` but never propagates.
- **The mistake I nearly shipped**: tested only the ONLINE route on staging, called it "legacy / patch enough / won't recur." Miya: *"there's a route through Perserahan Kaunter as well aside from AWAM."* → new memory `feedback_two_entry_routes_kaunter_vs_awam.md`.
- **Working analog** (found via `git log --all --grep`): **#274745** (Ridhwan, `4c3251ac34`) already fixes the SAME counter-tarik class for Tujuan Permohonan, same method `~:5218`. My earlier "274745 unfixed" was stale Redmine (fix committed after the sync).
- **FIX**: `E:\Projects\Melaka\etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\service\impl\PelupusanService.java:5242` — fallback to `mh.getBandar()` + derive daerah when `ahkm.getBandarPekanMukim()` null (in-file convention `:4122-4123`; mirrors AWAM `:4228-4232`). +6/−1.
- 🚨 **Local "test PASSED" (stg2 3413241 → 4/87 after Kemas kini+Simpan) was a FALSE POSITIVE** — the first fix used `mh.getBandar()`, but `mh` is `MaklumatHakmilik` which has NO `getBandar()`; the int-env build failed to compile → the fix NEVER ran. So the 4/87 came from something ELSE (likely the Kemas kini composite's own populate), NOT my change. Lesson: I shipped a getter I'd marked unverified in the CODE-CHECK, and a green DB read masked a non-compiling change. New main-memory row + the "one passing test is inconclusive" family.
- **Compile fix** (via isolated worktree, main checkout was miya-switched mid-op): fetch the real `Hakmilik` (`getHakmilikRepository().findByIdHakmilik(ahkm.getIdHakmilik())`, analog `:4113`) → `hkmlk.getBandar()` (analog `:4122`). Commit `b2c70a7ba5` on `mlk/esokongan/275456` → re-merged int-env `1ca36e97ad`. Broken merge dc9f9a4036 superseded.
- **Phase 1 status**: committed + pushed + int-env re-merged; **fix efficacy UNVERIFIED** (build failed before any real test). Owed: re-deploy int-env (card handed) → re-verify MY fix actually heals the page flow (or confirm Kemas kini alone already does, making the code belt-and-suspenders). Redmine planned-release list + BA test PENDING.
- **Gate gauntlet**: the edit hit 8 sequential PreToolUse gates (logic-blast-radius · convention · quest-phase · pre-code-check ×3 · branch-guard ×2) — all satisfied; yet the wrong getter still shipped because BUILD is the only real compile check and it ran on the server, not locally.

### ▶▶ NEXT (275456)
- ⬜ BA tests on int-env (deploy card handed); add #275456 to Redmine planned-release list.
- ⬜ Pre-existing 2 blank PROD counter rows (3413241, 3431713) self-heal on SKM re-save — flag to BA if they check old apps.
- Standing rules captured: `feedback_cross_module_alert_at_intake.md` (BA-Q + cross-module always-checked) · `feedback_two_entry_routes_kaunter_vs_awam.md` (two routes, test the one the app used) · `reference_awam_portal_test_users.md` (staging login + MelakaPay FPX SBI BANK A / 1234).

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

### 2026-08-18 (late) — compile-gate built + proven (session close)
- **Trigger**: QA-275456 `mh.getBandar()` shipped without compiling → int-env BUILD failed on server → mlit down. みや: "make the build mandatory before commit & deploy."
- **Built** `domain/compile-gate/` — PreToolUse Bash hook: `git commit` inside an etanah repo (cwd = etanah-pelupusan/awam/common) BLOCKS unless `compile-check.js verify <module>` is green + current. Bypass `[skip-compile-gate:]`.
- **compile-check.js**: `run <module>` (background `mvn -o -q -t <toolchains> compile` → green marker) + `verify` (marker green AND no `.java` newer than marker ts).
- **Toolchains fix**: my shell has NO JDK 8/11 at `E:\Java\java8`/`java11` — `domain/compile-gate/toolchains.xml` maps `1.8`+`11` → `C:\Program Files\Java\jdk-17`, passed via `mvn -t` (never touches ~/.m2).
- **Proven**: eval 7/7 · live-block · staleness · full `run→BUILD SUCCESS→marker→verify exit 0` (task b7kxhflxe). Committed to main `8ff0ed6` (gate) + `fd5d0f1` (toolchains fix).
- **Memory**: `reference_compile_gate_local_build`.

### ▶▶ NEXT / owed
- ⬜ **QA-275456 (own session)** — re-deploy int-env (fix now on `mlk/master` + `mlk/int-env`) + re-verify the page actually heals (efficacy UNVERIFIED — BA to test); add #275456 to Redmine planned-release list.
- ⬜ **A1 active.txt clobber** — per-block merge for concurrent-worktree writes (proposal logged in slips.jsonl).
- ⬜ **etanah Phase F DEFERRED** — `merge-to-master --ba-approved` refused: etanah tree is on branch `mlk/esokongan/275009` with LIVE uncommitted QA-275500 work (concurrent session). Did NOT stash/checkout a live tree. Run when 275009 tree is clean/committed.
- ⬜ **QA-275500 stash** — parked twice under `stash@{1}` msg `275500` (+ `stash@{0}` eclipse churn) at baseline start; a second live copy is now on branch 275009. Reconcile before popping.
- ⬜ V6b build-SHA match was skipped — superseded by BA's successful-test confirmation (stronger evidence than the footer proxy).

---

## 2026-08-14 — Worktree-sweep retrieval + quest 2 new tickets (275456 fold, 275500 Phase 0)
