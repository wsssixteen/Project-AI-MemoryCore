# Current Session

## 2026-08-20 (eve) — #276504 int-deploy + #276074/#276349 AWAM fixes → int-env (BA test) + code-check audit/de-bloat

**Recap**: 3 AWAM things to `mlk/int-env` for BA testing (all uncommitted-to-master; Redmine planned-release owed):
- **#276504** (Alex's PraHakmilik-bandar fix, HASIL receipt NPE) — cherry-picked to int-env (was release/1.7.0-based; merge would drag 15 tickets).
- **#276074** — `AwamCommonService.saveDokumenDisertakan` PRADLL numbering count→max-based (elak duplicate kod → SPOC kaunter "Duplicate key PRADLL3"). Branch `mlk/esokongan/276074` @`2060baad8a`.
- **#276349** (= ADHOC-PPJK-2026-1, A18) — PPJK Senarai Warta 3-part: `PelupusanService.findMaklumatPerizabanVOByNoWartaAndTarikhWarta:10232` return **List** (was last-only) · form `addAll` + `onGoNext` honors `selectedMaklumatWartaVOList` + empty-guard ralat "Sila pilih Senarai Warta yang terlibat untuk meneruskan permohonan" · xhtml `nextProcessBtn:178` `update="@this"` → +growl (else message never renders). Branch `mlk/esokongan/276349` @`9c5afea5c5`.
- BA test data (mlit): #276349 warta `NO. 86`/`27/02/2025` (3 lots 15193-95, verified) · #276074 No Resit Carian Rasmi `260820BSAT00019` (MCL entry) · login SAMSIAH BINTI JAAMAT.

**System work this session**:
- Banked `feedback_awam_test_scenario_entry_key.md` — AWAM test-scenario ENTRY KEY is per-urusan (carian-rasmi MCL/PSBS/PLTP/PPTPB/PRBB → No Resit; PPJK → No Warta+Tarikh; Pelupusan → Permohonan ID+login).
- **code-check audit + de-bloat**: added `msg-render` row → miya flagged bloat → REVERTED, FOLDED into `sibling-diff` guidance (growl-in-`update`). `audit.js` 5/5 · fixture 14/14 · mutation 5/5 · variation battery 10/10. LOG-PROVEN: `msg-render` caused **9/31** pre-code-check blocks in one session (self-inflicted).
- Slip logged (convention): commit messages ignored team format (`AWAM` caps + over-segmented; convention = `Ref #<n> - <Urusan|Awam> - <action>`).

**Improvable gate frictions (7.5 proposals logged)**: compile-gate marker main-repo-vs-worktree path · compile-gate `"commit"` substring false-positive on echo · branch-at-Apply gate mis-scoped to unrelated QA-274740.
## 2026-08-20 (late) — Flowable knowledge lookup: which Java class sends permohonan id to next tugasan

**Session shape: single knowledge Q ("what Java class makes Flowable send the permohonan id to the next tugasan?") → answered from banked FLOWABLE-KNOWLEDGE.md §4/§5 → miya asked for a handover → wrote one to scratchpad. No quest moved, no repo code changed. Worktree `flowable-permohonan-id-tugasan-0b7480`.**

- **Answer (banked, not re-derived)**: permohonan id rides the Flowable process var `aliranKerjaId` (→ `umm_aliran_kerja.aplikasi_id`), NOT a raw value. Chain: `CommonBPMServiceClient.startProcess():105` sets var at `:208` → BPMN `<userTask>` `create`-listener fires `FlowableTaskListener.receiveUserTask():62` (`etanah-common\src\main\java\my\com\marcus\etanah\common\flowable\FlowableTaskListener.java`) → `BpmCallbackService.handleAssignationSynchronized():201` (`etanah-common\...\service\BpmCallbackService.java`) → `AppTugasanService.createAppTugasan():806` writes the next `umm_a_tgsn` row linked back via `aliranKerjaId`. Class miya asked for = **`FlowableTaskListener`**; class that materializes the next tugasan = **`BpmCallbackService`**.
- **Source**: `projects\coding-projects\active\etanah-knowledge\melaka\FLOWABLE-KNOWLEDGE.md` §4 (lifecycle L85-116) + §5 (variables L121-134), verified stg1 process 6912622 (PT). Line numbers are the knowledge doc's; etanah Java source lives at `E:\Projects\Melaka` (absent from this worktree).
- Handover written to scratchpad (temp, not repo): `HANDOVER-flowable-permohonan-id-to-next-tugasan.md`.
- Bounty pending (unrelated, from boot): QA-275501 — park until next natural stop.

## 2026-08-20 — "Finish all in-progress tickets": PPTPB bundle (275505+276181+276182) + PT NPE (276422) CLOSED + deployed to int-env

**Session Recap for next start**: 4 tickets closed + deployed to `mlk/int-env` (BA testing). Branches pushed: `mlk/esokongan/275505` (eae4c59d0a — 275505+276181+276182 doc: Jenis Tanah CC move + Keadaan tanah populate + Meter Persegi + Arial 11 + remove `<ID PERMOHONAN>`), `mlk/esokongan/276182` (d15563430e Tajuk-luas stage-aware code + **6db3725b0c backward-compat overload**), `mlk/internal/276422` (cdb242bf09 PT SKM NPE null-guard). int-env tip `e5d2994b73`. **NOT on mlk/master** — Redmine planned-release list still owed for all 4.

### What shipped (per ticket)
- **275505** PPTPB Kertas Pertimbangan: (Java) `PelupusanWordCCMethodConstant.populateKeadaanTanah:3175` delegate to `populateTanahTek` + prefix "tanah "; (docx) 4 `status<Arah>` CCs moved from No.Lot/PT cell → Jenis Tanah 2700-dxa cell.
- **276181** PPTPB: (Java) `populateLuasSyor:15224` unit `.toUpperCase()` → `PelupusanUtil.captializeOnlyAllFirstLetter` (→ "Meter Persegi"); (docx) styles.xml docDefaults Times→Arial + Normal sz 24→22 (Arial 11).
- **276182** PPTPB Tajuk Risalat: (docx) removed literal `<ID PERMOHONAN>` para; (Java) `MlkMaklumatTanahLesenPendudukanForm.initMaklumatRisalat` placeholder-only refresh + extracted `generateDefaultRisalatByUrusan()`; `generateDefaultRisalatPPTPB` made stage-aware (`useDipohonLuas` = tugasan==SKM → dipohon; PKPPT/PRMMKNPDT onward → siasatan/disyor).
- **276422** PT SKM Seterusnya NPE: `PelupusanMaklumatPemohonHelper.initPemohon:2192` null-guard on `KEY_TEMPAT_TINGGAL_ALAMAT` (= ADHOC-PT-2026-4).

### Load-bearing lessons this session
- **compile-gate caught a would-be mlit outage**: int-env had a 2nd caller `MlkKertasTemplateForm.java:1729` (4-arg `generateDefaultRisalatPPTPB`) that master lacks; my breaking 5-arg signature change failed the int-env build. Fix = additive **4-arg overload** (default `false`=disyor, correct for the doc-gen caller) — added to the 276182 branch too so master stays consistent. A blind push would have taken mlit down (QA-275456 class).
- **cherry-pick, not merge, for a diverged int-env** (878 ahead / 18 behind master): merge dragged in unrelated `MlkSuratTemplateForm`/`pom.xml` conflicts from the master-catch-up delta; cherry-picking our 4 commits applied only our changes clean.
- **board = Redmine first, not active.txt**: opened by listing ~14 "open" from active.txt incl. Redmine-closed 274740; miya caught it. Banked `feedback_board_from_redmine_first.md`.
- **stray hunk in a recovered stash**: `stash@{0}` (275505 Java) carried an undocumented `SRT_SN_JPPH` filter removal at `:7811` — miya caught it in the diff; reverted to HEAD.
- commit-approval flag failed to auto-write (approval fired before `local_test_confirmed` set) → recorded manually per branch.

## 2026-08-19/20 — Baseline 1.3.5 + PROD-regression incident + recovery + release-gate hardening

**Session shape: BAQA baseline ask (7 tickets, Pelupusan 1.3.5 + Common "1.2.1-MLK") → prepared+pushed → release team BLOCKED deploy (Domain 1.0.5 > DB 1.0.4) → common reverted (wrong target 1.1.24 → correct 1.1.17 per release/1.3.4) → DISCOVERED 1.3.4 never merged to master → 1.3.5 shipped to PROD missing 1.3.4's 5 fixes (live regression) → recovery merge (miya's sequence: 1.3.4 in FIRST) → pushed cde4ed3ab9 → audit loop closed every gate hole. Worktree pelupusan-baseline-deploy-1acf39.**

### Release 1.3.5 — FINAL STATE
- `origin/mlk/master` = `origin/mlk/release/1.3.5` = **`cde4ed3ab9`** — ALL 10 tickets (1.3.5's: #274318-via-common · #275009 · #275500 · #276004 · #275475 · #275456 [#274914 flowable-only, excluded] + 1.3.4's restored: #273979 · #271442 · #274745 · #274532 · #272130) + common **1.1.17-MLK** (= domain 1.0.4 = DB V_DOMAIN) + module 1.3.5.
- Local `mvn compile` BUILD SUCCESS on `cde4ed3ab9` (569 sources, JDK-17 toolchain). miya ALSO built it on the LOCAL server successfully (check-build only).
- 🚨 **PROD REDEPLOY PENDING**: prod still runs old `3aec2cab01` (missing 1.3.4's 5 fixes — live regression until redeployed). Undo tag `mlk/prod-1.3.5` @ `3aec2cab01` pushed. Next: server build `mlk/release/1.3.5` → checkout SHA must = `cde4ed3ab9` → release team redeploys → BA smoke-test one 1.3.4 fix (#274532 tarikh) + one 1.3.5 fix.
- Sheet: Common `1.1.17-MLK` · Module `1.3.5` · Branch `mlk/release/1.3.5` · SQL cell empty.

### Incident root causes (both mine)
1. **1.3.4's Phase-F merge-to-master skipped** (2026-08-17) → master stale at 1.3.3-era → 1.3.5 branched without 1.3.4.
2. **Common set from BA's chat word** (1.2.1) with zero validation → domain 1.0.5 > DB 1.0.4 → deploy blocked. Correct = 1.1.17 (what release/1.3.4 shipped; common 1.1.17 + 1.1.24 BOTH ship domain 1.0.4; #274318 = the ticket needing the bump; common 1.1.17 was released for #272295).

### Gates built + PROVEN this session (all eval-pinned, commits 67c7a03 · 7e21e91 · 016b7df)
- `runCompatGate` (bump-common): BLOCKS common whose etanah-domain > DB `V_DOMAIN` (rjk_parameter_sistem kod V_DOMAIN) or ≠ prev release's domain; `--db-domain`/`--domain-ack`.
- `assertMasterReflectsPrevRelease` (branch): BLOCKS baseline off stale master; `--stale-master-ack`.
- `unmerged-release-boot.js` (SessionStart, registered): screams until every release branch ∈ master. **First run found stranded `release/1.0.0` (15 files) + `release/1.0.7` (6 files) — TRIAGE PENDING on miya's word.**
- push-gate v2: PowerShell tool inspected + manual `mlk/master` push BANNED + fixed birth-defect regex (`git -C … push` never matched). Eval 12/12.
- `status --verify`: state-vs-origin drift (state was hand-edited 2× during incident).
- bump-common commit verb direction-aware: `increase to` (Aaron's exact) / `revert to` (miya's). Skill: 20-failure-mode audit → 7-row FAILURE-MODE CHECKLIST (terminology-verbatim · undo-tag-before-force-push · pom-diff nod · footer check · explicit build target · worktree preflight · visible BUILD SUCCESS).

### Also this session
- Agihan-Kepada BA question (PT PYMB Jasin): traced to capaian — `MlkPelupusanPegawaiAgihService.java:268-273` targets PPD; 9-join capaian query → 0 users with urusan PT at Jasin (m.azlan had PRBB/PPTPB only); miya patched capaian to test then a change landed (created_by admin 18:34) — NOT a baseline bug, NOT 275475 (pjbtPermohonan has 0 readers). ⚠️ my first two answers (config table / "no active PPD") were WRONG and retracted — flag_aktif is 'Y'/'N' not boolean.
- ADHOC-PT-2026-4 (PT SKM Seterusnya NPE, twin of #275152): folder 156, patch preserved in `2. Fix\`, active.txt block written, branch mlk/esokongan/275152 deleted per miya (separate ticket pending from BA).
- Slips logged: release/stale-master-version-drift · instruction/substituted-own-plan (3× repeats forced) · evidence/thin-proof · release/invented-terminology · reask/redundant ×2 · evidence/thin-proof; principle #7 (state-continuity verified at boundary) added to system/principles.md.
