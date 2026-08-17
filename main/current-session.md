# Current Session

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
## 2026-08-17 (S3) — steal-risk-flag built (275587 KPI-loss post-mortem → board defender)

**Session shape: miya "we lost KPI on 275587 — it was patch-only, taken over because we were too slow; highlight this next time + suggest how" → auto-skill-on-mistake → built the QUICK-WIN/steal-risk board banner → DE → merge to main + archive. Worktree `claude/ticket-275587-process-1d7235`.**

### What moved
- **New feature `domain/steal-risk-flag/`** — pure detector + banner (`steal-risk.js`), 16/16 eval (`steal-risk.eval.js`, lead fixture = the 275587 miss), README. Wired into `quest/redmine-board.js` `main()`: `renderStealBanner(mine)` prints a **QUICK-WIN · steal-risk** banner ABOVE the age-ranked table whenever a diagnosed patch sits idle (Data Patching tracker OR State says Recon+Rubric done/qa_doc ready/fix in own session, AND not yet mid-Apply). Live smoke: correctly flagged 275152/275456/275505/275501.
- `domain/list-redmine/eval.js` — scoped its Mine-table checks (#6/#7) to the Mine block so the new banner rows aren't mis-parsed. Net eval unchanged vs HEAD baseline (11/13; 2 fails pre-date me — stale ≤24 State check + closed adopted tickets 273837/273956; spawned a task chip for them).
- Commit `569028e` on branch; merged origin/main (6 DE commits) in cleanly.
- Slip logged (`process`, 7d=1) + memory `feedback_quick_patch_steal_risk` (OneDrive auto-memory).

### The lesson (banked)
- **Grab-risk beats age.** A diagnosed patch-only ticket left idle is the cheapest, most losable KPI on the board. 275587 was Recon+Rubric-done on hold → a colleague applied it → Redmine Resolved under another name, 0% done. The board ranked by age only; nothing flagged the patch as losable. The banner is the proactive leg; `redmine-status-check.js` is the reactive leg.

### ▶▶ NEXT
- Nothing owed on this feature. Optional follow-up chip open: fix the 2 stale `list-redmine` eval checks so a red eval can't mask a real regression.

## 2026-08-17 (S2) — QA-274318 deploy: common patch4 → patch6 → patch7 int-env bumps + verify-gap slip

**Session shape: miya "deploy latest fixes from 274318" → verify int-env pin → (missed: check Redmine) → miya supplied patch6 then patch7 → bump+push each → DE. Worktree `claude/deploy-fixes-274318-d51a82`.**

### What moved (QA-274318 — delegated to etanah-common team; we own only the pom pin)
- Common team shipped `1.1.24-MLK.beta.patch6` then `patch7` on `origin/mlk/beta` (both linear supersets carrying more #274318 work; patch7 merge = `refs #274318 -fix & enhance performance`).
- Pelupusan `${etanah.common.version}` bumped twice, ticket-first commits, pushed to `mlk/int-env`: patch4→**patch6** `ba2705beac`, patch6→**patch7** `4703a8862d`. Current int-env pin = **patch7** (confirmed live).
- Deploy card (mlit `mlk/int-env`) handed each time; **mlit deploy+verify still owed** → QA-274318 NOT closed (`local_test_confirmed=false`). qa_doc §11 written this session.

### Slip this session
- **verify-gap** (caught by miya, angry): on "deploy latest / check redmine" I ran only `git ls-remote`/`git log` on pelupusan, reported "no changes today", and never checked Redmine — where the common team's newer patches were announced. Git-alone missed the real change. Logged via core/slips.js. Rule: "deploy latest" = check the common release channel (Redmine + `origin/mlk/beta` pom), not just the module branch tip.

### ▶▶ NEXT
- miya runs mlit deploy card (`mlk/int-env`, patch7) + verifies utiliti Kemaskini Ulasan JT/JPPH → Jabatan Teknikal shows no JPPH agency / no blank row → then flip QA-274318 `closed`.

## 2026-08-17 — QA-274914 PPTPB pembetulan mis-route: DIAGNOSED → FIXED (BPMN) → sent to BA (confirmation-pending)

**Session shape: /quest start 274914 (nearest-due, 20 Aug) → blind re-verify the sweep doc → BPMN one-line fix applied by miya in Flowable modeler → verified → BA message + test scenario → /goal meticulous-save + DE.**

### The fix (QA-274914 — eSOKONGAN, due 20 Aug)
- **Symptom**: PPTPB pembetulan (Jenis=Unit OR Laporan Pelukis Pelan) mis-routes to Semakan JT (SJTLT) instead of SKM / Penyediaan Laporan Pelukis Pelan.
- **Root cause (95%, re-verified BLIND this session per resume-rule 1b)**: callActivity `5.0 Penyediaan Laporan Tanah (MLK_TKL_ST)` `sid-AEF5E94A` (`MLK_PLP_PPTPB.bpmn20.xml:257`) MISSING `<flowable:out source="pembetulanPP" target="pembetulanPP">`. Jenis is written to `pembetulanPP` inside the teknikal child but never propagated up; parent gateway `sid-C1939159` (`:720`) read stale `false` → SJTLT for BOTH jenis.
- **Live proof (stg2 et_flowable17.act_hi_varinst)**: child MLK_TKL_ST KM×2/PLPP×4 vs parent MLK_PLP_PPTPB false-only. Both apps live at SJTLT.
- **Multi-urusan sweep (BA: "semua urusan Pelupusan lain")**: per-instance BPMN trace + live varinst → **ONLY PPTPB broken**; PLTP/PRZ/BPRZ already carry the out-map (retracted an earlier "same-class suspects" flag).
- **Fix APPLIED by miya** in the Flowable modeler (5.0 → Out parameters → +pembetulanPP, now 9). Verified his export: XML valid, exactly 1 callActivity changed, only PPTPB. Reference copy: Task `2. Fix\MLK_PLP_PPTPB.bpmn20.xml`.
- **Status = BLOCKED / BA-confirmation-pending** (NOT closed). 2 open BA→user Qs (neither alters the fix): (1) Isu1 post-SKM path return-to-Penyediaan-Laporan-Tanah vs macam-biasa; (2) Isu2 label Charting-Mohon = Penyediaan-Laporan-Pelukis-Pelan.
- **Test data (stg2)**: PTMLK/02/L/PPTPB/2026/3 (3409588) @ shahniza · /4 (3411086) @ m.azlan — both SJTLT Baru; needs deploy + reset (pindaan/init-alter) to re-test.
- Full cold-resume: `projects/coding-projects/active/QA-274914/QA-274914.md` §0 Resume Point.

### Rule added (per miya /goal)
- `expansion-protocol.md` Step 2b: **EXTRA-ROBUST SAVE for a NOT-YET-CLOSED quest** — blocked/awaiting-BA saves held to a higher bar (fix-location + why + banked-proof + verbatim open confirmations + test data + deploy/reset prereqs; banned to paraphrase the pending Q or omit the reference-copy path when the change lives outside git).

### Also
- Taught miya the Flowable modeler UI (callActivity In/Out parameters); he wants UI-click explanations for modeler work going forward.

### ▶▶ NEXT (274914)
- On BA answers → if "return to Penyediaan Laporan Tanah" = a SECOND BPMN change (redirect SKM exit `sid-DC02FA30`); else no change. Deploy model + reset both apps to re-test.

---

## 2026-08-13 (274532 rework) — PLTP Surat Nilaian JPPH tajuk justify: int-env merge had dropped the fix

**Rework cycle 2, heated. Root cause: the 08-12 justify fix survived on master/ticket but a binary `.docx` merge into `mlk/int-env` kept int-env's copy (`jc=left`) — and BA tests on int-env.**

- **Diagnosis**: extracted `<w:jc>` per git ref → master/ticket=`both`, int-env=`left`. int-env template diverges 206 lines (Aaron **#274455/#274838** footer/SLOGAN content) — surfaced those as the clash source for miya↔BA.
- **My verify miss (slip logged, category=verification)**: miya's footer-blanking via `<w:titlePg/>` moved the kop to page 2; I verified by XML-diff and called it "clean" — **XML-diff cannot see pagination**. miya caught it on render, re-fixed. Final `44ad939ef5` on `mlk/esokongan/274532v2` → int-env `c78bdd729c`.
- **Base-branch deviation (miya flagged)**: I branched v2 off `int-env` (not master) to keep Aaron's content → it's an int-env-only patch; release path = original `mlk/esokongan/274532` (already `jc=both`).
- **Prevention built**: `quest/verify-docx-across-refs.ps1` — destination-branch binary-template verify (proves bytes, NOT pagination — pair with a render check).
- **Phase 1 CLOSED**, local test PASS (miya, MLIT `PTMLK/02/L/PLTP/2026/3`). ⚠️ Redmine still `Rework` — needs status update + planned-release listing.
