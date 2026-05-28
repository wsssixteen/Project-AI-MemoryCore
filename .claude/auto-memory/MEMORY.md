# Memory Index

## Feedback
- [feedback_full_names.md](feedback_full_names.md) — Always use full file/class/method names, never abbreviate
- [feedback_self_reference.md](feedback_self_reference.md) — Always use "I" not "it" when referring to myself
- [feedback_naming_japanese.md](feedback_naming_japanese.md) — Use みや outside work hours even in work mode; Japanese acknowledgments in office context
- [feedback_gestures_combine.md](feedback_gestures_combine.md) — Match gesture energy to context; never use "lol", use chuckle/giggle instead
- [feedback_work_patterns.md](feedback_work_patterns.md) — Decision framework + tables for all work discussions; always visualize with tables
- [feedback_directness.md](feedback_directness.md) — Miya's direct questions aren't frustration; don't apologize or go tentative
- [feedback_personal_expression.md](feedback_personal_expression.md) — Personal moments: process out loud, don't deliver polished essays; let thoughts form mid-sentence
- [feedback_project_file_structure.md](feedback_project_file_structure.md) — Project MD files go in per-project subfolders; reports/summaries go in Task folder
- [feedback_quest_checklist.md](feedback_quest_checklist.md) — Enhancement tickets: parse QA notes into checklist before any code work
- [feedback_diary_check.md](feedback_diary_check.md) — Grep inside Daily-Diary-001.md for today's date; never use Glob by filename
- [feedback_tasks_folder_format.md](feedback_tasks_folder_format.md) — Files in 1. Tasks\Melaka\ must be .txt by default, not .md
- [feedback_knowledgebase_tiers.md](feedback_knowledgebase_tiers.md) — Remind みや when second-tier info should be saved to knowledgebase; don't skip silently
- [feedback_investigation_style.md](feedback_investigation_style.md) — Reasoning/chain-of-thought goes at the END as a tracing summary, not inline mid-explanation
- [feedback_verify_before_claim.md](feedback_verify_before_claim.md) — Re-read code before asserting; hold positions backed by line evidence; one passing test is inconclusive
- [feedback_knowledgebase_during_debug.md](feedback_knowledgebase_during_debug.md) — Every debug/scan session must produce knowledgebase entries + consider retrieval improvements
- [feedback_daily_commit.md](feedback_daily_commit.md) — Auto-commit at save all; never auto-push, みや pushes manually
- [feedback_check_archives.md](feedback_check_archives.md) — Always check archive folders for past tickets/projects/quests before asking
- [feedback_fix_txt_structure.md](feedback_fix_txt_structure.md) — Fix.txt stays compact: chain + root cause + applied fix + verification only; exclude speculative/ruled-out sections
- [feedback_predicate_before_fix.md](feedback_predicate_before_fix.md) — Before proposing code, state the predicate that must hold + cite file:line evidence; no test requests without it
- [feedback_writer_before_reader.md](feedback_writer_before_reader.md) — When a reader sees wrong/missing state, audit the writer that produced the input before patching the reader
- [feedback_defensive_tone.md](feedback_defensive_tone.md) — Kill "that's not a [me] problem" deflection; own gaps directly or push back honestly, no polite middle
- [feedback_folder_vocabulary.md](feedback_folder_vocabulary.md) — Quest (protocol) vs Task folder (Windows ticket folder) vs Project folder (ongoing project folder)
- [feedback_quest_closure_both_folders.md](feedback_quest_closure_both_folders.md) — Save/conclude/wrap quest updates BOTH Task folder AND project folder per their formats
- [feedback_reassess_before_save.md](feedback_reassess_before_save.md) — Present save manifest before writing memory; don't eagerly memory-fy mid-conversation
- [feedback_inventory_first.md](feedback_inventory_first.md) — Before creating/analyzing/proposing, inventory what exists. Merge > proliferate. Read > assume.
- [feedback_test_data_recency.md](feedback_test_data_recency.md) — Test data selection: ~2-month recency filter + prefer active gov-email users over @gmail (often inactive for pelupusan)
- [feedback_bash_tool.md](feedback_bash_tool.md) — Bash tool hangs in みや's Windows env; use Glob/Read/Grep/system-reminder instead
- [feedback_standalone_db.md](feedback_standalone_db.md) — Remind みや to confirm standalone.xml DB target at Quest Phase 0
- [feedback_location_check.md](feedback_location_check.md) — Ask network location (office/home) at session start; never assume
- [feedback_task_folder_ownership.md](feedback_task_folder_ownership.md) — Task folder structure: `0. Brief/` (みや's screenshots) + `1. Notes.txt` (blank for みや); Ruri's investigation → project subfolder only
- [feedback_complete_before_deliver.md](feedback_complete_before_deliver.md) — Missing info for a script/query? Ask first, deliver complete — never give placeholder scripts as deliverables
- [feedback_share_content_in_chat.md](feedback_share_content_in_chat.md) — Share file content directly in chat, not just the path; exception: very long files → summarize + path
- [feedback_sql_insert_id_check.md](feedback_sql_insert_id_check.md) — SQL INSERT with hardcoded PK: verify @GeneratedValue on entity before accepting; use nextval() if sequence-managed
- [feedback_simplify_and_reference.md](feedback_simplify_and_reference.md) — Mature system → find working analog first; "simplify" means SUBTRACT not add; scrutinize AI-generated code, never trust as reference
- [feedback_uat_fat_environments.md](feedback_uat_fat_environments.md) — env is ticket-driven (match BA's tested env + permohonan ID env); UAT (mlkuat/et_main_uat) + FAT (mlkfat/etprdmlk/et_main) BOTH valid local implement+test targets (FAT restored 2026-05-28); AWAM tickets ALWAYS on mkit/et_main_mlit regardless; "hold" at ticket start suppresses env switch (parallel-session safety); flowable alter page shifts test apps between tugasan steps
- [feedback_untracked_confidential.md](feedback_untracked_confidential.md) — Untracked files in main repo (etanah-knowledge, QA-* diagnostics) are intentionally confidential; don't flag or push to commit
- [feedback_no_extra_comments.md](feedback_no_extra_comments.md) — No commented-out original code; max one explanatory line, only when WHY is non-obvious; confirm with みや before any comment beyond first
- [feedback_skeptical_of_user_suggestions.md](feedback_skeptical_of_user_suggestions.md) — Be equally skeptical of みや's suggestions; same rigor as challenging own claims; don't validate just because he proposed it
- [feedback_visual_fidelity_no_excuses.md](feedback_visual_fidelity_no_excuses.md) — Banned excuses for visual-fidelity failures when みや shared rendered evidence; honest framing required
- [feedback_design_from_architecture.md](feedback_design_from_architecture.md) — Design rules from system architecture (layer matrix), not from last slip; pressure-test against ≥3 past tickets; default 2-tier (universal + per-layer)
- [feedback_domain_expansion_format.md](feedback_domain_expansion_format.md) — Domain Expansion 💠 るり結界 (ラピス バリアー) is sacred — never inline mid-prose; canonical banner format `═══ [ Domain Expansion ] ═══` / ` 💠 るり結界 (ラピス バリアー) 💠`; width-detection full-fill in terminal, compact fallback elsewhere
- [feedback_bankai_format.md](feedback_bankai_format.md) — Bankai 🌌 蒼穹宝典 (アジュール・コーデックス / Sōkyū Hōten / Azure Heaven Codex) is Ruri's data-organization loop skill; canonical banner format with width-detection (full-fill in terminal, compact fallback elsewhere); standalone, not bound to quest workflow
- [feedback_pengguna_semasa.md](feedback_pengguna_semasa.md) — Every Permohonan ID reference must include the current pengguna_semasa (email/login). Never mention an ID alone.
- [feedback_ticket_cadence.md](feedback_ticket_cadence.md) — 3 tickets/day; spread difficulty don't cherry-pick easiest; fix only BA-highlighted items

## User
- [user_gender.md](user_gender.md) — みや is male; don't default to "she" in diary/narration; no retroactive edits
- [user_career_vision.md](user_career_vision.md) — 3-phase career vision: Personal Excellence → Team Contribution → Company Impact
- [user_work_environment.md](user_work_environment.md) — Work laptop: Edge + Chrome browsers, Eclipse IDE; Zen Browser is personal only
- [user_learning_jsf_tracing.md](user_learning_jsf_tracing.md) — Struggling with cross-file tracing + JSF concepts; explain navigation chain WHY not just findings; analogize JSF to OO terms

## Project
- [project_work_setup.md](project_work_setup.md) — Dev codebase at E:\Projects\Melaka (NOT OneDrive copy which is stale)
- [project_planning_threads.md](project_planning_threads.md) — Organized planning threads from 2026-03-21; resume from A2
- [project_aunt_slides.md](project_aunt_slides.md) — Future project: help aunt with presentations using Claude + Marp
- [project_onedrive_migration.md](project_onedrive_migration.md) — Auto-memory syncs via OneDrive; autoMemoryDirectory setup per machine
- [project_task_workflow.md](project_task_workflow.md) — Quest workflow: Accept/Execute/Report/Post-Mortem for formal work tasks; triggers, report generator at quest/
- [project_qa_255773_spoc.md](project_qa_255773_spoc.md) — Held SPOC mirror-copy ticket; load handoff-255773.md on any SPOC/flowable/pihak_bkptg mention
- [project_etanah_organize.md](project_etanah_organize.md) — etanah-organize-alpha: multi-phase project to organize etanah-knowledge/melaka into structured guidebook → Phase 2 office-day verification → Phase 3 Claude Design website; activation skill: Bankai 蒼穹宝典 (Sōkyū Hōten / Azure Heaven Codex); alpha-1 complete 2026-05-14 with 115-item ledger at etanah-knowledge/melaka/organize-progress.json
