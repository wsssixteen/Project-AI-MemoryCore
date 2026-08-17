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

**Session shape: retrieve → check Redmine updates → /quest 2 new tickets → save → DE. Autonomous /goal.**

### Retrieval (worktree-retrieve)
- The 08-13 sweep docs are NOT stranded — OneDrive replicated the gitignored `projects/` dir, so main holds all qa_docs (274532/274914/275009/275152/274740 + ADHOCs). `git cherry` branches all share main HEAD.
- Surfaced post-sweep Redmine updates: **275009** gained relations `#274461` + `#233646` (08-14) and its real scope is **3 issues** not 2 (sweep missed the Jana-button-removal + framed template-sign-count as "jawatan salah"); **274532** re-opened 08-14 (extra blank page mid-Surat JPPH). Board grew to 7 mine (275500/275505/275501 new).

### Quested 2 new tickets
- **275456** = ad-hoc **A13 / ADHOC-PPTPB-2026-1** (identical permohonan `PTMLK/03/L/PPTPB/2026/4` @ eddie, same symptom). **Folded, not re-Scouted** — Recon-done, DB-proven. Root: daerah/bandar never captured at AWAM land entry → `umm_p_permohonan_tnh` blank → pra→app copy → Teknikal defaults Selangor. Register row A13 updated `TICKETED → #275456`. qa_doc written.
- **275500** = PLTP Risalat **tajuk papar satu pemohon sahaja** (app `PTMLK/02/L/PLTP/2026/6` @ faridmajid). Phase 0 → Rubric **90%**. Root (direct read): every `generateDefaultRisalat<URUSAN>` in `PelupusanService.java` builds pemohon from **`apbList.get(0)`** — first pihak berkepentingan only; PLTP at `:14151`, tajuk string `:14225`. **No multi-pemohon analog exists** among the 6 builders → fix is new join-logic (1→as-is, 2→` DAN `, >2→comma + ` dan ` before last). Blast radius: all 6 urusan share the bug (BA confirms general). qa_doc written, active.txt active, notes written.

### Saved
qa_docs `QA-275456.md` + `QA-275500.md` (durable main path) · active.txt both active · notes both · ADHOC-REGISTER A13 row.

### ▶▶ NEXT
- 275500 Apply (on `mlk/master`): add `buildSenaraiPemohonRisalat` helper + rewrite `:14225`; confirm >2 casing ("dan" lc) w/ BA; regen to verify; offer sibling-urusan blast-radius fix.
- 275456: portal repro to pin AWAM save method · data-patch 3413241 (+3431713) on nod · confirm QA-274740 relation.
- Still open on board: 274914 (BPMN, nearest deadline 20 Aug), 275009 (3-issue rewrite), 275152 (commit existing guard), 275505 + 275501 (not drafted).

---

## 2026-08-13 (274532 rework) — PLTP Surat Nilaian JPPH tajuk justify: int-env merge had dropped the fix

**Rework cycle 2, heated. Root cause: the 08-12 justify fix survived on master/ticket but a binary `.docx` merge into `mlk/int-env` kept int-env's copy (`jc=left`) — and BA tests on int-env.**

- **Diagnosis**: extracted `<w:jc>` per git ref → master/ticket=`both`, int-env=`left`. int-env template diverges 206 lines (Aaron **#274455/#274838** footer/SLOGAN content) — surfaced those as the clash source for miya↔BA.
- **My verify miss (slip logged, category=verification)**: miya's footer-blanking via `<w:titlePg/>` moved the kop to page 2; I verified by XML-diff and called it "clean" — **XML-diff cannot see pagination**. miya caught it on render, re-fixed. Final `44ad939ef5` on `mlk/esokongan/274532v2` → int-env `c78bdd729c`.
- **Base-branch deviation (miya flagged)**: I branched v2 off `int-env` (not master) to keep Aaron's content → it's an int-env-only patch; release path = original `mlk/esokongan/274532` (already `jc=both`).
- **Prevention built**: `quest/verify-docx-across-refs.ps1` — destination-branch binary-template verify (proves bytes, NOT pagination — pair with a render check).
- **Phase 1 CLOSED**, local test PASS (miya, MLIT `PTMLK/02/L/PLTP/2026/3`). ⚠️ Redmine still `Rework` — needs status update + planned-release listing.
