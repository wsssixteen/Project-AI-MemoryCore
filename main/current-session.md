# Current Session

**Last Activity**: 2026-10-04 — ProTime weekly plan scheduler (`domain/protime-plan/`) built, live, and self-reporting; FIRST scheduled write is Mon 2026-10-05 08:30, not yet proven.

## Session Recap (2026-09-30 → 2026-10-04, session "Protime scheduler automation", ProTime weekly plan)
- **Ask**: fill ProTime "My Weekly Planning" from open tickets, schedule it every Monday, and record everything so success or failure names the next action.
- **Built**: Feature `domain/protime-plan/` (protime-plan.js · eval 36/36 · run-hidden.vbs · task.xml · README · NUKE-MARKER · log.jsonl) + `pymtime` skill §Weekly plan + Windows task `\MemoryCore\ProTime Weekly Plan` (Monday 08:30, at logon +10 min, retry 30 min x6, once per week). Commits ff87fc1a · 39f3ec0c · 9fff4add · 3a76a151 · 398c33ba on main.
- **Rule (miya)**: 4 tickets a day; if they cannot fill every open day at 4, then 3 a day; leftover days empty; a day with any entry is never touched; each ticket once. Board order from `quest/redmine-board.js --json`.
- **Proven**: live write + read-back by hand 2026-09-30 (Thu 1 Oct 275043·274323·246923, Fri 2 Oct 265109·244600·281324; 282587 unplaced by the rule) · Task Scheduler really ran the task once (exit 0, login + read fine, nothing to write).
- **NOT proven**: a write made by the scheduled task itself. First one = Mon 2026-10-05 08:30.
- **How we will know (either way)**: `node domain/protime-plan/protime-plan.js --status` prints a verdict (FILLED · NOTHING TO FILL · FAILED · DID NOT RUN · NOT DUE YET) and ONE next action. Also: toast on the laptop, a row in `domain/protime-plan/log.jsonl` (failed rows carry `next`), and boot CHANGE-WATCH `wmutm5ont` until resolved.
- **Next action for the next session**: after Mon 08:30 run `--status`. FILLED or NOTHING TO FILL → `node lib/watch.js resolve wmutm5ont ok --note "<the status line>"`, tell miya, done. FAILED or DID NOT RUN → do the printed `next:` action, tell miya, resolve the watch as `anomaly` only if the script itself is wrong.
- **Why the 30 Sep "planner filled Wed-Fri" was false**: that session made zero ProTime calls; it showed a fill-in table and Domain Expansion saved it as filled (diary 2026-09-30 line 11 is wrong on that point). Root cause is in the Feature README.
- **Decisions by miya**: keep the Windows task (not a Claude Desktop Routine) · do not build it into PymTime.
- **Open, his call**: 282587 was left off last week's plan · hour-estimate planning (big ticket = whole day) not designed · `core/forge.js new script` puts scripts in `lib/` against Rule 14 `domain/<feature>/` (built by hand, registry row appended by hand).
- **Slips (4, ledger)**: claim-not-verified x2 (same 30 Sep incident, before and after the cause was found) · best-practices-not-consulted (system-rules loaded late; gate caught) · misread-ask (answered cloud routines when he asked about Desktop Routines).
- **Not done this session**: boot files + session briefing were never read (audit item) · no Domain Expansion run yet.

**Last Activity**: 2026-10-04 17:30 — #282555 (PROD alter PYMB to PJTLT) Phase 2 closed and ARCHIVED; branch `claude/ticket-282555-ab97c6` merged to main (`417e4189`): redmine-write-gate v1.4 stage-only until 2026-10-30 now LIVE · Domain Expansion run.
**Last Activity**: 2026-10-04 17:10 — #282442 rework closed and ARCHIVED: `dcd4eab561` + `df981502a4` on `mlk/esokongan/282442`, int-env `29440f665b`, MLIT pass (miya 14:44), Redmine Resolved to Nurhafizah Hasan (miya 15:26, video attached). New: `quest/local-test-prep.js` + gate v3. Domain Expansion run.
**Last Activity**: 2026-10-02 18:30 — ADHOC-PLP-2026-1: AWAM `plpMaklumatUrusan.xhtml` proven dead (0 of 19 Melaka urusan tab lists) · knowledge in JSF-WIRING.md · adhoc saved 28/28 + archived · DE.

## Session Recap (2026-10-02, worktree pelupusan-template-verify-fe1bef, session 10)
- **Ask**: where is `plpMaklumatUrusan.xhtml` in AWAM and how to navigate to it; then final dead-file verification; then save, archive, DE, brief.
- **Done**: AWAM tab pages come from `etanah-awam\src\main\resources\provider\MLK\<Modul>_Provider.xls` sheet "Tab Rules" (`AwamRuleEngine.buildTabRules`) or hardcoded `BaseAwamTabForm` tabs. The file is in 0 of 30 provider sheets, 0 source refs, 0 hardcoded tabs, yet exists on master/int-env/stag-env. "Maklumat Urusan" tab = PDBB `plpMaklumatPermit.xhtml`.
- **Saved**: JSF-WIRING.md § Where tab.tabUrl comes from (+ tab-2 file per urusan table) · ADHOC-REGISTER A47 · qa_doc `projects/coding-projects/archive/ADHOC-PLP-2026-1/` · Task folder `Archive\263. AH - CODE - AWAM - plpMaklumatUrusan fail mati`.
- **Slips**: scope claim "Only PDBB has" without a count (gate caught, fixed to 1 of 19).
- **Open**: `plpMaklumatTanahDipohon.xhtml` looks equally unused, not verified.

**Last Activity (prev)**: 2026-10-02 18:20 — #244600 Kertas versi fix (our side only) committed d61fc2e611 on mlk/qa/244600v3 · int-env 5df44b12cf · miya posted Resolved to Fizah · Phase 1 CLOSED · #275043 split to Ammar · handoff-load feature built · DE.

## Session Recap (2026-10-04, worktree redmine-282442-9258e6, #282442 rework cycle 2 → archive)
- **Ask**: retrieve #282442, start the quest again, audit why the previous fix failed → fix → deploy internal → Redmine handover → save + close quest → Domain Expansion.
- **Audit verdict**: the Jana fix (R1) did NOT fail. Fizah's blank page was the next screen (Langkah Maklumat Permohonan), already failing on PROD 25× since 22 Sep (`keputusanMMKN`), hidden for other urusan by #280895 and unreachable for PRBB until Jana worked.
- **Fixes**: R2 `dcd4eab561` add `getKeputusanMMKN()` (FALSE) to `MlkMaklumatPermohonanPembatalanForm` · R3 `df981502a4` `prbbMode="2" prbbViewOnlyAll="true"` on the Pembatalan page (the PRBB panel rendered editable and its fields update 3 panels that exist only on the permit pages). Both merged to `mlk/int-env` (`f84c6436a5`, then `29440f665b`). NOT on stag-env / master.
- **Test**: local (JBoss switched to `et_main_mlit`) 12:30 langkah 2 + 3 open · MLIT 14:44 same walk by miya, infra server log clean. `PTMLK/01/L/UPP/2026/4` @ SaffuanH@melaka.gov.my, KMPPP, Hantar NOT run (Fizah's retest case).
- **Redmine**: posted by miya 15:26 in his own numbered wording; common-side remark (Simpan on Penyediaan Dokumen does not save Agih Kepada, `CommonMaklumanPembatalanForm.saveCustomSemakanPanel():1271`, since 2022) mentioned in the note only.
- **Quest state**: QA-282442 archived (folder → `Archive\`, block → active-archive.txt, doc → `projects/coding-projects/archive/QA-282442/`). Bounty + Fastest Path + falsifier ledger (3 rows, none open) in the doc.
- **Still owed on #282442**: Fizah's retest (a return = cycle 3 on the same branch) · staging merge on miya's word · D1 (8 PROD orphan UPP rows, UPP/2026/4-11, no script yet) · planned-release list entry.
- **System (this worktree → main at DE)**: `quest/local-test-prep.js` (schema switch + fix files + JBoss restart need + log) · `domain/test-scenario-login-gate` v3 (blocks a test hand-back naming a permohonan without a fresh prep) · `domain/env-switch/README.md` + `prep.eval.js` 31/31. Known hole: no check that the compiled / deployed class carries the fix (proposal tracked, category bounty).
- **Machine changes**: `standalone.xml:219` pool-name `etanahD3` → `etanahDS3` (mlit now selectable; backup in `%TEMP%\claude\env-switch-backups\`) · local env switched to mlit for the test and BACK to stg2 (JBoss restart needed to pick it up) · my 3 uncommitted fix files removed from `E:\Projects\Melaka\etanah-pelupusan` · work-clone worktree `wt-282442` removed.
- **Knowledge**: BUG-BESTIARY follow-up under the #280895 pattern · LATENT-BUGS L21 (common Simpan no-op) + L22 (undeclared `si` on the Pembatalan page) · PRBB-TICKETS note · TEST-PERMOHONAN-INDEX (PRBB-origin UPP; stg2 has none with a tugasan).
- **Slips (8, ledger)**: test-stopped-at-fixed-step · blind-deploy-partial-scan · env-not-set-for-test · stale-build-handed-for-test · no-probe-loggers-in-fix-build · default-to-new-memory-file · reask/conversation-leaked-into-deliverable · reask/redundant.
- **Seen, not mine**: `QA244600-PROBE` loggers (commit `0d20ccc8b4`) were live on MLIT via int-env at 14:16; reported to miya.
- **Open ideas from miya (no build)**: trace the urusan end to end like the code (a banked map tugasan → langkah screen → form + composites); how far past the fixed step a test must walk. Side session running: gate for fix builds without probe loggers.
**Last Activity**: 2026-10-04 17:20 — auto-memory index consolidated in the main checkout (MEMORY.md 26,697 → 10,506 bytes, 196 → 73 memory files), regression run after miya's correction, Domain Expansion + audit of whether DE covers a one-off system improvement.

## Session Recap (2026-10-04, main checkout, auto-memory consolidation — no ticket)
- **Ask**: bring `.claude\auto-memory\MEMORY.md` under 17.1 KB without losing a rule (it was over its 24.4 KB read limit, last lines silently dropped). Then: commit, Domain Expansion, audit whether DE covers this kind of one-off system improvement.
- **Done**: 125 memory files folded whole into 71 surviving files (body kept under a dated `## Merged 2026-10-04` heading), index regrouped by workflow with the owning skill named per group, 2 OneDrive conflict copies deleted, 1 dangling index line removed (`feedback_quick_patch_steal_risk.md` never existed in git). 48 files kept as their own line because a hook, skill, library or boot file names them.
- **Skills touched (additive pointer section "Memory rules for this workflow")**: quest · close-phase · deploy · script-check · adhoc-save · bpmn-check · list-redmine.
- **miya's two corrections**: (1) workflow rules belong in the workflow that loads them, not in auto-memory, and I must check the system (system-rules / system-design) before adding anything; (2) I merged without a regression test and loaded system-design only after he said so.
- **Regression (run after correction 2)**: 530 name spellings over tracked + untracked files → 0 hooks / skills / libraries / boot files point at a deleted file; 6 live doc mentions repointed (`main\todo.md`, `main\kpi-tracker.md`, this file); 125 of 125 bodies present; 9 evals of memory-reading components green.
- **Rules now at the top of MEMORY.md**: inventory before adding a memory · full repo search + referrer evals before merging, renaming or deleting one.
- **Slips (ledger)**: `memory-instead-of-workflow` · `no-regression-before-change`.
- **Commit**: the consolidation went to main inside another session's DE commit `9cc8f31c` (authorship is not a filter). This DE's own commit follows.
- **Found, NOT fixed**: `domain\staging-schema-tracker\eval.js` is a dead eval (loads a hook file that moved) · `.claude\CLAUDE.md` and `feedback_task_folder_ownership.md` still describe the notes txt that the 2026-09-30 Task folder shape removed · no mechanical gate stops deleting a memory file something still names.
- **DE coverage audit**: see `system\agentic-ticket-workflow-assessment-2026-10-04.md` § "Session: auto-memory consolidation".
- **Open (miya's word)**: build the memory delete gate · remove the dead eval · fix the notes-file conflict · dedupe memories against skill bodies.

**Last Activity**: 2026-10-04 17:10 — probe gate session closed: `domain/predicate-box` v3 → v4.1 on main (`ed75928b`), eval 46/46; the six-kinds logger gate was dropped; nothing owed on this thread except miya's ruling on the commit-reminder gap.
