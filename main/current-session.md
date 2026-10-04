# Current Session

**Last Activity**: 2026-10-04 17:40 — #256334 (PDBB CR) Phase 2 re-run and ARCHIVED · Redmine Closed (released PROD 1.8.0 on 2026-09-30) · Domain Expansion run.

## Session Recap (2026-09-30 → 2026-10-04, session "medan-agihan-kepada-bug", #256334 → archive)
- **Li Wen (Hasil) questions answered** in WhatsApp voice: Flowable Source vs Source expression · subflow End auto-resumes PDBB, `pembetulanUnit` "true" loops back to PYPDBB.
- **TKPDBB rework**: BA asked to remove Senarai Dokumen. `d3128ad449` (xhtml only) broke Hantar; `072115f762` fixed it with the TKJKKLPK analog (viewMode TRUE + view-panel exclusion). Both in mlk/master + release 1.8.0. MLIT proof PDBB/12 Tamat.
- **Close**: BA verified staging 2026-09-30, Hakiim closed same day. Quest doc got Close block + Fastest Path + post-mortem. BUG-BESTIARY pattern added. 5 re-synced videos pruned.
- **Memory**: speech style, rojak fillers and technical terms stay English (`feedback_ticket_writing_style` example 6).
- **Open**: `domain/submit-path-gate/` was queued 2026-09-30 and is NOT on main (re-logged as proposal A3) · PDBB/7 + /9 on MLIT Selesai but not Tamat (untraced) · ADHOC-HSL-2026-1 langkah N set still Hasil's.

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
