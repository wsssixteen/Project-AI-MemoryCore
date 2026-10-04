# Current Session

**Last Activity**: 2026-10-04 17:45 — #256334 checked on Redmine: **Closed** (2026-09-30, Anis). Phase 2 was already complete since 2026-09-29 (Task folder in Archive, block in active-archive, qa_doc in projects archive, bounty + FLOWABLE-KNOWLEDGE §13). Nothing left to archive. Domain Expansion run.

## Session Recap (opened 2026-09-25 as worktree colleague-cr-issue-ed8731, closed 2026-10-04 on main — #256334 first day + GitLab move)
- **Ask (25 Sep)**: start quest #256334 (Aaron's PDBB CR), brief the Perakuan Hantar error `Cannot resolve identifier 'urusan'`.
- **Found + fixed (our side)**: `MLK_PLP_PDBB` step 7.0 Unit Hasil did not pass `urusan` into `MLK_HSL_ISPEKS`, and passed `applicationName=etanah-pelupusan`. In parameters now: `source urusan` + `sourceExpression ${"etanah-spoc-hasil"}` (same shape as `MLK_PLP_MCL:43`). miya did it by hand in the MLIT modeler; PDBB/2026/5 migrated to v3 and reached Hasil Semakan.
- **Hasil side (not ours)**: `sis_bpm_log` 47161 FAIL for PDBB while PACT SUCCESS; `HasilSpocIntegrationService` lines 46-48 had no `@Autowired`. Later rounds live in the qa_doc + ADHOC-HSL-2026-1.
- **GitLab move (25 Sep)**: Gitolite 172.16.93.167 → `git@10.16.63.27:etanah/<repo>.git`. miya's old `.ssh` keys are unreadable by his current Windows login; new key `id_ed25519_gitlab` + `~/.ssh/config`. Steps + a handover for a colleague's Claude were given in chat.
- **Artifact**: https://claude.ai/artifact/MJkHKwSsfwf4s6jMUDinbk (PDBB Unit Hasil Handover) — miya said it did not help; he wanted the code path that reads `urusan`. Given in chat.
- **Slips this session**: handoff-babble-not-statement (prose .txt handover instead of bare before/after .java) · reused an unreadable SSH key without checking it · lecture-tone message draft for a colleague · artifact showed a diagram when he wanted the code.
- **Today (4 Oct)**: Redmine status read = Closed. Verified all Phase 2 moves on disk. No new work. The old worktree folder still exists on disk but git no longer knows it; this session's Edit tool is still pinned to it, so saves went through a script.

**Last Activity**: 2026-10-04 17:45 — #280540 (PPTPB fee unit) Phase 2 done and ARCHIVED · Redmine status at close = Closed (2026-10-01, verified with user) · Domain Expansion run.

## Session Recap (2026-09-29 → 2026-10-04, session "quest 280540 data update", #280540 → archive)
- **Ask**: reopen #280540 and answer Common ("dev kau tarik data lain") → audit our fixes → BA's last change (Lot shows "per Lot") → make the Task folder shape proper and the rework detection robust → clean up → (4 Oct) check Redmine, Phase 2, Domain Expansion.
- **Answer to Common**: PPTPB unit order = row `hsl_fi_kadar.kadar_pengiraan_id` → row `unit_luas_id` → header `hsl_fi_pejabat.unit_pengiraan_id`. The 24/09 check script showed only the header, which caused the confusion. Common's save fix (etanah-maintenance `mlk/esokongan/280540`) went to MLKIT 2026-09-29.
- **Cycle 2 fix**: `d510940da2` on `mlk/esokongan/280540` (4 lines removed in `PelupusanMaklumatBayaranHelper.getPptpbKadarBayaranFormula()`), merged to `mlk/int-env` `ff7bb7fb8c`. BA verified; Redmine Closed 2026-10-01. Not merged by us to stag-env or master.
- **System build (2538d209, on main)**: `lib/task-folder.js` · Task folder = `1. Brief` + `2. Fix` + `N. Rework\Brief` · a Rework folder is made only when we start work on a quest that already shipped a cycle (`active-cli`), never by the Redmine sync · notes txt retired, test data in the quest MD `## Test data` (`quest/notes.js` v2) · archive moves the project folder from any close path · hand-back Git table in the quest skill.
- **Cleanup 30 Sep**: 16 empty Rework folders, 67 blank notes, 7 empty `1. Simulate`, 5 archive videos deleted; 160 notes moved into quest MDs; 95+7 project folders moved to `archive\`; 76 extra files folded in by a sonnet agent.
- **Phase 2 today**: workflow-upgrade rows all ruled; Fastest Path + post-mortem + bounty in `projects/coding-projects/archive/QA-280540/QA-280540.md`; DATABASE.md §28 update line; PPTPB precedent note; test-data index; evidence-script rule in `feedback_show_evidence_script_or_code.md`. The cycle-1 archived block was merged into the live block before archiving (one block now, `closed=` + `closed_cycle2=`).
- **Slips (miya caught)**: hand-back without the Git table · rework cycle read as NEW · made `2. Fix` inside the Rework folder · acted before showing the changes.
- **Open**: 3 notes txt with no ticket id left in place (two AH folders + #165) · `archive-quest.js` fails at Step 3 when an older archived block of the same quest exists (handled by hand today; proposal logged).
**Last Activity**: 2026-10-04 17:40 — #282061 archived (Redmine Closed 2026-10-01, Baseline 1.8.0): Phase 2 + bounty done · script-check rule 9 handed to a separate session · Domain Expansion run.

## Session Recap (2026-09-30 → 2026-10-04, #282061 follow-ups + close, worktree quest-282061-rubric-7a809b, git link pruned)
- **BA questions (09-30)**: no duplicate after the patch (each number once, counter untouched) · OPPTPB not affected (own screen, own Fi branch, 0 PROD apps) · early numbers happen at any of 17 PPTPB tugasan on skrin 338, not only Kertas Pertimbangan.
- **Decision**: BA never asked for PPTPB/2026/1 to change, so the number swap was DROPPED. PROD script = delete the duplicate unpaid PPTPBL bill only. PTMLK/02/L/PPTPB/2026/5 keeps 02/2026/3.
- **Delivered**: `282061.sql` (delete-only, live-checked) · `282061-senarai.sql` (7 PROD permohonan with early numbers, for TSO) · staging + internal permit list queries for Fizah.
- **Slip**: list query filtered on staging's number format (`LIKE 'C__/____/%'`), dropped rows elsewhere. Rule 9 (portable across envs, run on 2 envs) written; worktree was pruned so it is NOT on main yet, spawn task_054d57fa lands it.
- **Closed**: QA-282061 archived (Task 238 → Archive, doc → archive/QA-282061, block → active-archive). Wrong-fix row 1 + bounty proposal tracked.
- **Open**: start the spawn chip for rule 9 · PPJK / PSBS early-number ruling (ADHOC-PERMIT-2026-1).

**Last Activity**: 2026-10-04 17:35 — ADHOC-GIT-2026-1 saved (audit 29/29): Sourcetree "Accept server's key?" for GitLab 10.16.63.27 = Sourcetree still on PuTTY with `id_rsa.ppk`; fix given (OpenSSH + `id_ed25519_gitlab`), waiting for miya's Fetch result · Domain Expansion run.
