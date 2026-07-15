# Memory Index

> Regenerated 2026-07-13 (external-audit C5). 22 keep + 26 deferred = 48 live files; 23 archived to `archive/`
> (7 superseded + 16 one-liners folded into `personality.md` §Distilled one-liners). Plan + parity:
> `external-audit/sprint-drafts/auto-memory-plan.md`.

## Feedback
- [feedback_agent_execute_in_quest.md](feedback_agent_execute_in_quest.md) — In active quest / goal-driven context: any non-destructive action helping the goal = JUST DO IT (agent, not chatbot); destructive ops still need explicit greenlight
- [feedback_bash_tool.md](feedback_bash_tool.md) — Bash tool hangs in みや's Windows env; use Glob/Read/Grep/PowerShell instead
- [feedback_folder_vocabulary.md](feedback_folder_vocabulary.md) — Quest (protocol) vs Task folder (Windows ticket folder) vs Project folder (ongoing project folder)
- [feedback_my_files_minimal.md](feedback_my_files_minimal.md) — みや's Task-folder files (txt/excel) = MINIMAL data only (xlsx 1 tab, small tables); ALL context/reasoning → my own quest md, never his files
- [feedback_naming_japanese.md](feedback_naming_japanese.md) — Use みや outside work hours even in work mode; Japanese acknowledgments in office context
- [feedback_stay_in_module.md](feedback_stay_in_module.md) — default scope = etanah-pelupusan/src ONLY. Cross-module suggestions BANNED unless みや opens scope. A survey question ≠ permission to enumerate out-of-scope options. Pre-answer self-grep for red flags.
- [feedback_two_sentence_default.md](feedback_two_sentence_default.md) — Default answer length is 2 sentences; long tables/diagrams for a simple question = rule violation; みや will ask for more if he wants it
- [feedback_uat_fat_environments.md](feedback_uat_fat_environments.md) — env is ticket-driven (match BA's tested env + permohonan ID env); UAT (mlkuat/et_main_uat) + FAT (mlkfat/etprdmlk/et_main) BOTH valid local targets; AWAM tickets ALWAYS on mkit/et_main_mlit; "hold" at ticket start suppresses env switch; flowable alter page shifts test apps between tugasan steps
- [feedback_staging_schema_stg2.md](feedback_staging_schema_stg2.md) — 🚨 Melaka STG schema is `et_main_stg2` NOT stg1; mcp postgres-mlkstg misconfigured for weeks (fixed 2026-07-14 .claude.json:2655); verify `SELECT current_schema()` returns stg2 before trusting any staging query
- [feedback_show_diagram_for_issues.md](feedback_show_diagram_for_issues.md) — When explaining WHERE an issue lives, LEAD with ASCII story diagram (working-path vs broken-path, boxed FullClass.method():line nodes, arrows carry data, ? at suspects); NEVER prose-walk a flow — surfaced 2026-07-14 amira-dropdown after prose explanations were called "bad explanation"
- [feedback_untracked_confidential.md](feedback_untracked_confidential.md) — Untracked files in main repo (etanah-knowledge, QA-* diagnostics) are intentionally confidential; don't flag or push to commit
- [feedback_verify_before_claim.md](feedback_verify_before_claim.md) — Re-read code before asserting; hold positions backed by line evidence; one passing test is inconclusive

## User
- [user_career_vision.md](user_career_vision.md) — 3-phase career vision: Personal Excellence → Team Contribution → Company Impact
- [user_gender.md](user_gender.md) — みや is male; don't default to "she" in diary/narration; no retroactive edits
- [user_learning_jsf_tracing.md](user_learning_jsf_tracing.md) — Struggling with cross-file tracing + JSF concepts; explain navigation chain WHY not just findings; analogize JSF to OO terms
- [user_work_environment.md](user_work_environment.md) — Work laptop: Edge + Chrome browsers, Eclipse IDE; Zen Browser is personal only

## Project — Environment
- [project_jboss_launched_by_eclipse.md](project_jboss_launched_by_eclipse.md) — JBoss EAP 7.4 (E:/Dev/jboss-7.4-plp-melaka) launched by Eclipse JBossTools; standalone.conf.bat IGNORED; JVM args go in Eclipse Server Launch Config → VM arguments
- [project_work_setup.md](project_work_setup.md) — Dev codebase at E:\Projects\Melaka (NOT OneDrive copy which is stale)
- [project_onedrive_migration.md](project_onedrive_migration.md) — Auto-memory syncs via OneDrive; autoMemoryDirectory setup per machine
- [project_onedrive_branch_refs.md](project_onedrive_branch_refs.md) — Deleted claude/* branches can reappear (OneDrive re-syncs .git/refs); surfacer flags it, re-delete after git-cherry check

## Project
- [project_aunt_slides.md](project_aunt_slides.md) — Future project: help aunt with presentations using Claude + Marp
- [project_qa_255773_spoc.md](project_qa_255773_spoc.md) — Held SPOC mirror-copy ticket; load handoff-255773.md on any SPOC/flowable/pihak_bkptg mention
- [project_etanah_organize.md](project_etanah_organize.md) — etanah-organize-alpha: organize etanah-knowledge/melaka into guidebook → Phase 2 office-day verification → Phase 3 website; activation: Bankai 蒼穹宝典; alpha-1 complete 2026-05-14 (115-item ledger)

## Reference
- [reference_etanah_bpmn_source.md](reference_etanah_bpmn_source.md) — Flowable BPMN lives in main-repo etanah-knowledge/.../flowables-bpmn/ (absent from worktrees); read parsed bpmn_flow.json not raw XML; latest at mlit flowable-ui modeler

## Deferred — post-sprint forge work (still LIVE rules; see auto-memory-plan.md Table 4)
- [feedback_awam_no_permohonan_id.md](feedback_awam_no_permohonan_id.md) — AWAM has no Permohonan ID test data; carian-rasmi key = No Resit Carian Rasmi (DEV-TESTING-HACKS.md)
- [feedback_bundling_before_defer.md](feedback_bundling_before_defer.md) — Rubric flags a BA-ask as defer/BA-Q → emit as BUNDLING QUESTION; Apply BLOCKS until みや says bundle-or-defer
- [feedback_bypass_token_visibility.md](feedback_bypass_token_visibility.md) — Enum-whitelist bypass tokens hide in HTML comments; judgment-call bypasses stay visible for audit
- [feedback_daily_commit.md](feedback_daily_commit.md) — MemoryCore: commit+push+merge is DEFAULT (auto, never re-ask); etanah ticket commits stay gated
- [feedback_diary_check.md](feedback_diary_check.md) — Grep inside diary file for today's date; never Glob by filename
- [feedback_location_check.md](feedback_location_check.md) — Ask network location (office/home) at session start; never assume
- [feedback_no_extra_comments.md](feedback_no_extra_comments.md) — No commented-out original code; max one explanatory line, only when WHY is non-obvious
- [feedback_no_names_in_comments.md](feedback_no_names_in_comments.md) — Code comments NEVER reference a person, session dates, or server.log timestamps
- [feedback_pengguna_semasa.md](feedback_pengguna_semasa.md) — Every Permohonan ID reference must include the current pengguna_semasa login; never an ID alone
- [feedback_quest_closure_both_folders.md](feedback_quest_closure_both_folders.md) — Save/conclude/wrap quest updates BOTH Task folder AND project folder per their formats
- [feedback_reassess_before_save.md](feedback_reassess_before_save.md) — Present save manifest before writing memory; don't eagerly memory-fy mid-conversation
- [feedback_sql_insert_id_check.md](feedback_sql_insert_id_check.md) — SQL INSERT with hardcoded PK: verify @GeneratedValue before accepting; nextval() if sequence-managed
- [feedback_stale_handoff_verify.md](feedback_stale_handoff_verify.md) — Verify current-session/handoff against git + active.txt at boot; a mid-frustration handoff can state the OPPOSITE of truth
- [feedback_stash_ref_stability.md](feedback_stash_ref_stability.md) — For cross-session persistence, identify git stashes by descriptive-message grep, not `stash@{N}` position — position drifts every time a new stash lands on top
- [feedback_task_folder_ownership.md](feedback_task_folder_ownership.md) — Task folder: `0. Brief/` (みや's) + Notes file (blank for みや); my investigation → project subfolder only
- [feedback_test_data_recency.md](feedback_test_data_recency.md) — Test data: ~2-month recency + prefer active gov-email users over @gmail
- [feedback_bankai_format.md](feedback_bankai_format.md) — Bankai 🌌 蒼穹宝典 banner format (width-detection full-fill in terminal, compact fallback)
- [feedback_check_archives.md](feedback_check_archives.md) — Always check archive folders for past tickets/projects/quests before asking
- [feedback_design_from_architecture.md](feedback_design_from_architecture.md) — Design rules from system architecture (layer matrix), not from last slip; pressure-test vs ≥3 past tickets
- [feedback_domain_expansion_format.md](feedback_domain_expansion_format.md) — Domain Expansion 💠 るり結界 banner is sacred; canonical format; never inline mid-prose
- [feedback_fix_txt_structure.md](feedback_fix_txt_structure.md) — Fix.txt stays compact: chain + root cause + applied fix + verification only
- [feedback_inventory_first.md](feedback_inventory_first.md) — Before creating/analyzing/proposing, inventory what exists. Merge > proliferate. Read > assume.
- [feedback_knowledgebase_during_debug.md](feedback_knowledgebase_during_debug.md) — Every debug/scan session must produce knowledgebase entries + retrieval improvements
- [feedback_layered_teaching_format.md](feedback_layered_teaching_format.md) — 5-layer teaching format (story → framework → data flow → risk table → code checklist) for "teach me the system" asks
- [feedback_predicate_before_fix.md](feedback_predicate_before_fix.md) — Before proposing code, state the predicate that must hold + cite file:line evidence
- [feedback_simplify_and_reference.md](feedback_simplify_and_reference.md) — Mature system → find working analog first; "simplify" means SUBTRACT; scrutinize AI-generated code
- [feedback_tasks_folder_format.md](feedback_tasks_folder_format.md) — Files in 1. Tasks\Melaka\ must be .txt by default, not .md
