# Memory Index

> One line per memory. A workflow line names the skill that loads it; read the file when that workflow runs.
> BEFORE ADDING A MEMORY: inventory first (system-rules Rule 1). A rule that belongs to a workflow goes into that workflow's skill or into an existing file below, never a new file. A new line here needs no existing home.
> BEFORE MERGING, RENAMING OR DELETING A MEMORY: search the whole repo (tracked + untracked, underscore and hyphen spellings) for its name, keep or repoint every live referrer, then run the evals of every hook or skill that reads it. Show the result.

## Always on
- [simple-fix-no-probe-no-local-test](feedback_simple_fix_no_probe_no_local_test.md) — 🚨 simple 80%+ additive fix he agreed to → commit + deploy straight away; no probe loggers, no local-test ask
- [no-unrequested-fix-photo](feedback_no_unrequested_fix_photo.md) — 🚨 no fix photo or image unless miya asks; only a real after-fix screen, never a box drawn on BA's before-screenshot
- [reply-shape](feedback_reply_separation_of_concerns.md) — numbered topics, tables, 2-sentence default, shortest option, lean diagram, mark extras
- [reply-mechanics](feedback_commands_never_fenced.md) — one bash block per command, full paths, plain punctuation, show it in chat
- [hook-noise](feedback_delta_correction_on_stop_block.md) — Stop block = delta only; hidden bypass tokens; canonical formats only
- [act-dont-ask](feedback_do_dont_ask_answer_literal.md) — do the safe step, answer literally, fix not reroute, popup questions
- [verify-before-claim](feedback_verify_before_claim.md) — re-read first, diff real values, DB first, try before "blocked"
- [show-evidence](feedback_show_evidence_script_or_code.md) — every claim or fix shows a runnable script or the code lines
- [browser](feedback_browser_edge_default.md) — Edge via Claude in Chrome extension; built-in browser banned
- [bash-tool](feedback_bash_tool.md) — Bash hangs on simple shell ops here; use PowerShell or Node; scripts are mine to run
- [model-tiering](feedback_model_tiering_session.md) — Fable = judgment and planning; building and recon on Sonnet or Opus

## System design (skills: system-rules, system-design)
- [system-design-rules](feedback_inventory_first.md) — inventory first, universal + mechanical rules, top-down apps, RAM footprint
- [no-on-the-fly-artifacts](feedback_no_on_the_fly_artifacts.md) — no new file or folder shapes without a nod
- [miya-blind-to-features](user_miya_blind_to_features.md) — I own the feature audit from logs and goals, in plain words

## Quest (skill: quest)
- [fix-discipline](feedback_simplify_and_reference.md) — working analog, lifecycle first, loggers + fallbacks, run fully
- [predicate-before-fix](feedback_predicate_before_fix.md) — state the predicate + file:line evidence before proposing code
- [intake-and-knowledge](feedback_knowledgebase_during_debug.md) — bank knowledge, check archives, video URL bar, ticket TYPE
- [permohonan-reference](feedback_pengguna_semasa.md) — permohonan id + live holder from the DB, never aplikasi_id in chat
- [test-data-recency](feedback_test_data_recency.md) — test data ~2 months recent, active gov-email users
- [permohonan-health](feedback_verify_permohonan_health_before_test.md) — test permohonan must really run the target flow
- [awam](feedback_awam_test_scenario_entry_key.md) — No Resit entry key, portal logins, kaunter vs AWAM, host = WAR
- [task-folder](feedback_tasks_folder_format.md) — CURRENT shape 1. Brief / 2. Fix / N. Rework; minimal files; folder words
- [task-folder-notes-legacy](feedback_task_folder_ownership.md) — SUPERSEDED for the notes txt; keeps the 3-line test-data format
- [fix-txt](feedback_fix_txt_structure.md) — Fix.txt = 4 short sections: fix, explanation, chain, related
- [quest-closure](feedback_quest_closure_both_folders.md) — wrap a quest = update BOTH Task and project folder; "save this quest" = Redmine status picks Phase 1 or Phase 2 (`node lib/save-quest.js`)
- [code-comments](feedback_no_extra_comments.md) — one explanatory line max, no commented-out code; no person names, dates or log stamps
- [states](feedback_state_aware_knowledge_load.md) — state via lib/states.js; same knowledge file names; Melaka · Terengganu · Kedah = PostgreSQL, never Oracle; Perak · WP · Selangor = Oracle
- [terengganu](project_terengganu_active.md) — ACTIVE since 2026-10-03: knowledge, stg2 DB, trg/master
- [perak](reference_perak_codev_scope.md) — co-dev scope, Oracle, branch off origin/master, deploy via master, hotfix box

## Adhoc (skill: adhoc-save)
- [adhoc](feedback_adhoc_scaffold_delegate.md) — scaffold as a quest, ENV from URL host first, triage, reread at Redmine #

## Cross-module (skill: cross-module-check)
- [module-boundary](feedback_module_edit_boundary.md) — edit only awam + pelupusan; flag cross-module at intake; SPOC local is stale
- [handoff-artifact](feedback_cross_module_handoff_artifact.md) — other-module fix = handoff file, before-code commented above new code
- [common-line-triage](feedback_common_ticket_line_triage.md) — common ticket = 5-step line triage at Phase 0
- [other-team-message](feedback_other_team_message_not_our_issue.md) — their bug = one line + error + evidence SELECT; never guide them

## Git, commit, deploy (skills: close-phase, deploy, release-mlk-plp)
- [etanah-git](feedback_etanah_git_separate_clone.md) — separate clone, ticket branch first, hotfix off master, --no-ff, stash naming
- [rework-branch](feedback_rework_commit_on_existing_ticket_branch.md) — rework commits on the existing ticket branch, never a vN branch
- [esokongan-branch-shape](reference_esokongan_branch_shape.md) — branch name not guaranteed; verify with git ls-remote
- [commit-and-deploy](feedback_commit_deploy_runbook.md) — 6-step ceremony, subject shape, staging implies internal, probes local only, servers

## SQL and data patch (skills: script-check, patch-mlk-doc)
- [patch-script-rules](feedback_readable_safe_script.md) — SCRIPT-CHECK, looks-safe script, never DELETE ind_*, scope sweep, I run SELECTs
- [script-file-naming](feedback_script_file_naming.md) — <ticket>.sql = the update, <ticket>-check.sql = one combined check; never -2/-3
- [sql-insert-id](feedback_sql_insert_id_check.md) — INSERT with hardcoded PK: check @GeneratedValue first
- [infra-requests](feedback_prod_patch_infra_handoff.md) — PROD patch message format; server log one-liner, no path
- [infra-script-format](feedback_infra_script_schema_env.md) — Infra/PROD scripts schema-qualified, BEFORE/UPDATE/AFTER

## Databases and environments (skill: env-check)
- [staging-and-db-access](feedback_staging_schema_stg2.md) — stg2 current, never assume; MLIT/STG writable; MCP timeout is not VPN
- [environments](feedback_uat_fat_environments.md) — UAT + FAT gone; env table, datasource naming (mlit-primary line is stale)
- [db-gateway](project_db_gateway.md) — one gateway 127.0.0.1:7411; fix = schtasks /run /tn "DB Gateway"
- [local-dev](project_jboss_launched_by_eclipse.md) — E:\Projects\Melaka, JBoss from Eclipse, hibernate overlay error, GitLab 10.16.63.27
- [location-check](feedback_location_check.md) — ask office or home before any network diagnosis; never assume

## Flowable (skill: bpmn-check)
- [flowable](feedback_flowable_node_edge_trace.md) — trace real flows before picking a node; admin app; BPMN source; Petaling archive

## Redmine and writing for people (skills: list-redmine, redmine-phase1-prefill)
- [redmine-board](feedback_esokongan_means_tracker.md) — eSOKONGAN = tracker; board script first; shared filter; BA vs TSO; delegated quests
- [redmine-write-nod](feedback_redmine_write_needs_nod.md) — Redmine writes are under miya's name; exact text + nod first; one standing exception: New to In Progress at quest start
- [redmine-sla](reference_redmine_sla_hours.md) — Priority = SLA hours: Critical 1, High 6, Medium 22
- [redmine-rootcause](feedback_redmine_rootcause_format.md) — cause only, max 2 plain-Malay sentences, no fix line
- [ticket-writing-style](feedback_ticket_writing_style.md) — miya's plain ticket voice; BA reply first; junior gets hints only
- [template-junior-builds](feedback_template_work_junior_builds.md) — template .docx: junior builds, I draft the guide, ask first

## Etanah facts
- [hakmilik-change-map](reference_hakmilik_change_map.md) — hakmilik table map; luas + unit in ind_mklmt_hkmlk
- [etanah-facts](reference_jasper_field_sources.md) — Jasper $F sources, kadar cukai duplicates, doc reset tool, DMS patch, #246512
- [multi-ticket-sweep](reference_multi_ticket_sweep.md) — the /sweep design + evidence lives in five places; cite all five

## MemoryCore repo and rituals (skill: domain-expansion)
- [memorycore-repo](project_onedrive_worktrees.md) — no worktrees in OneDrive; hooks may run from MAIN; untracked = confidential
- [daily-commit](feedback_daily_commit.md) — MemoryCore commit at save is the default; push depends on context
- [domain-expansion-banner](feedback_domain_expansion_format.md) — Domain Expansion banner, canonical format only
- [bankai-banner](feedback_bankai_format.md) — Bankai banner format; never referenced casually
- [project-name](project_name_lapis_lazuli.md) — project = "Lapis Lazuli"; "Ruri" = my name only; physical rename not done
- [installed-skills](project_installed_skills.md) — third-party skills (wayfinder); record every install here
- [artifact-registry](reference_artifact_registry.md) — every published artifact + link; update by link, never a second copy
- [observatory](reference_observatory.md) — diagnose first with node lib/observatory.js --brief; app on :7790

## Tools and side projects
- [wa-read](project_wa_read.md) — WaRead WhatsApp reader at E:\Dev\scripts\WaRead; relink number 60186669566, never ask
- [whatsapp-rules](feedback_whatsapp_read_rules.md) — READ ONLY, paraphrase, no sender names, never the desktop app
- [pymtime](project_pymtime.md) — PymTime clock-in app: read projects/coding-projects/active/PymTime/PROJECT.md first; remote skip, colleague handover loop, v18 roadmap
- [side-project-folder](feedback_side_project_folder.md) — 🚨 every project gets projects/coding-projects/active/<Name>/ (PROJECT.md index + VERSIONS, ARCHITECTURE, PROOFS, ROADMAP); update at every bulk change; memory = pointer
- [arabic-review](project_arabic_review.md) — /arabic daily vocab review, seconds to 2 minutes in chat; meanings are my job
- [art-and-media](feedback_verify_generated_art_externally.md) — external art check; samples are the spec; MAS animation; Drive video download
- [parked-projects](project_etanah_organize.md) — etanah-organize, aunt slides, held #255773 SPOC handoff

## User
- [user-profile](user_career_vision.md) — career vision; male; learning JSF tracing; みや + Japanese acknowledgments
