# Memory Index

> Regenerated 2026-07-13 (external-audit C5). 22 keep + 26 deferred = 48 live files; 23 archived to `archive/`
> (7 superseded + 16 one-liners folded into `personality.md` §Distilled one-liners). Plan + parity:
> `projects/coding-projects/archive/external-audit-2026-07/sprint-drafts/auto-memory-plan.md`.

## Feedback
- [feedback_agent_execute_in_quest.md](feedback_agent_execute_in_quest.md) — In active quest / goal-driven context: any non-destructive action helping the goal = JUST DO IT (agent, not chatbot); destructive ops still need explicit greenlight
- [feedback_bash_tool.md](feedback_bash_tool.md) — Bash tool hangs in みや's Windows env; use Glob/Read/Grep/PowerShell instead
- [feedback_folder_vocabulary.md](feedback_folder_vocabulary.md) — Quest (protocol) vs Task folder (Windows ticket folder) vs Project folder (ongoing project folder)
- [feedback_my_files_minimal.md](feedback_my_files_minimal.md) — みや's Task-folder files (txt/excel) = MINIMAL data only (xlsx 1 tab, small tables); ALL context/reasoning → my own quest md, never his files
- [feedback_naming_japanese.md](feedback_naming_japanese.md) — Use みや outside work hours even in work mode; Japanese acknowledgments in office context
- [feedback_stay_in_module.md](feedback_stay_in_module.md) — default scope = etanah-pelupusan/src ONLY. Cross-module suggestions BANNED unless みや opens scope. A survey question ≠ permission to enumerate out-of-scope options. Pre-answer self-grep for red flags.
- [feedback_ba_facing_reply_plain.md](feedback_ba_facing_reply_plain.md) — Question relayed from a BA/colleague → give みや the sendable plain-language message, never a dev report with file:line + tables
- [feedback_two_sentence_default.md](feedback_two_sentence_default.md) — Default answer length is 2 sentences; long tables/diagrams for a simple question = rule violation; みや will ask for more if he wants it
- [feedback_model_tiering_session.md](feedback_model_tiering_session.md) — Fable = judgment tier (assessments + planning/design/architecture); building/mechanical on Sonnet/Opus; session model named in first briefing line (session-model counterpart of Delegation Economy)
- [feedback_uat_fat_environments.md](feedback_uat_fat_environments.md) — mlit is PRIMARY (mkit/et_main_mlit, bare `etanahDS`); UAT + FAT decommissioned & deleted; only 3 pgEdge MCP remain (mlit/stg/prod) — legacy server-postgres client GONE, never re-add; `permission denied for schema` = missing grant, not a connection fault
- [feedback_staging_schema_stg2.md](feedback_staging_schema_stg2.md) — 🚨 Melaka STG has TWO live schemas (et_main_stg2 default + et_main_stg1); miya switches between them. Servers: postgres-mlkstg-pg=stg2, postgres-mlkstg1-pg=stg1 (added 2026-07-23). Schema set by LOGIN USER — `SELECT current_schema()` first, echo which you used
- [feedback_commands_never_fenced.md](feedback_commands_never_fenced.md) — 🚨 Commands miya must RUN go one-per-line as plain bullets with inline backticks; NEVER a code fence (he copies one at a time, can't double-click out of a fence) — 3rd strike 2026-08-04
- [feedback_per_env_separate_tables.md](feedback_per_env_separate_tables.md) — 🚨 Multi-env / multi-source finding → ONE separate table PER env (env named in heading), state which env each conclusion is from up-front; never merge envs into one table or prose; use tables generously (265414, 2026-08-18)
- [feedback_show_diagram_for_issues.md](feedback_show_diagram_for_issues.md) — When explaining WHERE an issue lives, LEAD with ASCII story diagram (working-path vs broken-path, boxed FullClass.method():line nodes, arrows carry data, ? at suspects); NEVER prose-walk a flow — surfaced 2026-07-14 amira-dropdown after prose explanations were called "bad explanation"
- [feedback_untracked_confidential.md](feedback_untracked_confidential.md) — Untracked files in main repo (etanah-knowledge, QA-* diagnostics) are intentionally confidential; don't flag or push to commit
- [feedback_verify_before_claim.md](feedback_verify_before_claim.md) — Re-read code before asserting; hold positions backed by line evidence; one passing test is inconclusive
- [feedback_fix_dont_reroute.md](feedback_fix_dont_reroute.md) — 🚨 Broken thing reported → FIX IT; never hand him a new workflow that dodges it, never suggest Maven Update/Clean/republish (he's always tried them)
- [feedback_full_path_always.md](feedback_full_path_always.md) — 🚨 Every file named gets its FULL absolute path in plain text; markdown links to Task/projects folders are dead because they resolve against the worktree cwd — not OneDrive's fault
- [feedback_no_name_in_branches.md](feedback_no_name_in_branches.md) — 🚨 BANNED — never put my name ("ruri"/any form) in a git ref (branch OR tag), even local-only safety/checkpoint refs; rely on reflog, name by purpose
- [feedback_never_hand_miya_a_query.md](feedback_never_hand_miya_a_query.md) — 🚨 Never hand miya a SELECT to run — I hold mlit/stg1/stg2/prod MCP access, so I run it; only writes and unreachable schemas get handed over
- [feedback_readable_safe_script.md](feedback_readable_safe_script.md) — 🚨 Critical/PROD DB scripts must LOOK safe to a reviewer (pinned named IN-values + before-SELECT, no broad LIKE / buried NOT-IN) — safe-by-construction that reads as safe, not safe-by-prior-check; triple-enforced (memory + patch-script-gate CHECK 3 + quest-skill rule 6)
- [feedback_never_delete_ind_tables.md](feedback_never_delete_ind_tables.md) — 🚨 PILLAR: never DELETE from ind_* (registry/master) tables — an ind_ row = succeeded to daftar / permanent (Aaron #273461); default cleanup resets umm_a_* application side only, leaves registry intact; enforced by patch-script-gate CHECK 4 (bypass [skip-ind-delete:])
- [feedback_ticket_type_vocab_tracking.md](feedback_ticket_type_vocab_tracking.md) — Tag each ticket with a TYPE (template / document-reset / etc.) + track how different individuals word the same style; stay provisional until fluent (miya: "you're new")
- [feedback_banked_knowledge_change_check.md](feedback_banked_knowledge_change_check.md) — 🚨 Banked etanah-knowledge (FLOWABLE-KNOWLEDGE.md etc.) = trust at 100%; re-read source ONLY after a cheap change-check (git log on the file) proves it moved — never cold re-derive banked mechanics
- [feedback_show_evidence_script_or_code.md](feedback_show_evidence_script_or_code.md) — 🚨 Justify every claim/fix by SHOWING evidence — a runnable SQL script (DB fact, miya runs it himself) or the actual code lines with file:line (codebase fact); never a bare assertion
- [feedback_watch_video_url_first.md](feedback_watch_video_url_first.md) — 🚨 Phase 0 MANDATORY: extract frames from every video/screen-recording + READ THE URL BAR; the URL's .xhtml path IS the authoritative screen identity; a UI-render fix is BANNED until the exact form is confirmed from the URL, never guessed (QA-274318: guessed 3 wrong forms while the video URL named the real one)
- [feedback_url_host_identifies_war.md](feedback_url_host_identifies_war.md) — 🚨 URL host prefix identifies the WAR: AWAM portal (etanah-stg) vs apps/pelupusan-staff (etanah-appstg) are SEPARATE WARs with independent baselines; field on one surface but not the other for the same DB row = version skew, not data loss; DB timing forensics (created_by/version) settle data-loss-vs-display in one query (ad-hoc A12, 2026-08-12)
- [feedback_cross_module_handoff_artifact.md](feedback_cross_module_handoff_artifact.md) — Fix in a module we don't own (etanah-common) or "pass to X team / not our domain / cross-module" → produce a handoff artifact WITH before-code commented above new-code in-file (recipient compares before/after up-down); deliver in Task 2. Fix/; comments allowed here [comment-ok]
- [feedback_cross_module_alert_at_intake.md](feedback_cross_module_alert_at_intake.md) — 🚨 At ticket RETRIEVAL + Phase 0, scan Description+History for CROSS-MODULE (our issue or Common / pass to team / utiliti-screen) + PRIORITY (PROD/urgent) signals → flag LOUDLY as the FIRST line of quest MD; NEVER write "ownable-<module>" before confirming the screen's repo by file location (QA-274318 cost days: ignored BA's "our issue or Common?")
- [feedback_template_ticket_data_patch.md](feedback_template_ticket_data_patch.md) — 🚨 Template .docx ticket where a CC renders DATA → fixing the tag is only half; ALSO hand miya a raw VERIFY SELECT of the CC's data rows + a PATCH script if test data is thin (multi-row case), + state the coverage gap. Banned: shipping a data-rendering CC fix with no data script (QA-273921)
- [feedback_delta_correction_on_stop_block.md](feedback_delta_correction_on_stop_block.md) — 🚨 Stop-hook block → emit ONLY the delta (token + one-line fix), never re-emit the reply; hook noise never narrated (miya 2026-08-16, 2nd ask after 2026-07-28)
- [feedback_no_on_the_fly_artifacts.md](feedback_no_on_the_fly_artifacts.md) — 🚨 BANNED: new file/folder shapes in MemoryCore outside designed homes without miya nod (bulk ≠ new artifact shape) (miya 2026-08-16)
- [feedback_hold_background_results.md](feedback_hold_background_results.md) — 🚨 Non-urgent background results HOLD until miya's next message; fold in, never a surprise reply with new decision material (miya 2026-08-16)
- [feedback_adhoc_scaffold_delegate.md](feedback_adhoc_scaffold_delegate.md) — 🚨 Adhoc with real investigation (PTMLK permohonan-ID / "check adhoc" / live error) = scaffold as a quest (Task folder + active.txt block) and DELEGATE the setup to a subagent; never inline-diagnose without scaffolding (miya 2026-08-17, PPTPB Hantar-error). Root: quest ticket-gate force-injects on Redmine QA numbers only, not PTMLK IDs
- [feedback_quick_patch_steal_risk.md](feedback_quick_patch_steal_risk.md) — 🚨 A diagnosed patch-only ticket left idle is a STEAL-RISK (colleague applies it, books the KPI); grab-risk beats age — do flagged quick-wins FIRST. Boot board prints a QUICK-WIN banner (`domain/steal-risk-flag`). Root: lost 275587 this way (miya 2026-08-17)
- [feedback_attempt_before_claiming_blocked.md](feedback_attempt_before_claiming_blocked.md) — 🚨 NEVER declare blocked/can't/unavailable/missing-config from a PROXY check (ls a config file, the loaded-tool roster) — RUN the actual operation first; absence of a proxy ≠ absence of capability; only the op's real failure output is valid evidence. Enforced by `domain/attempt-before-blocked-gate` (Stop, BLOCKS; bypass `[verified-blocked: <cmd> -> <error>]`). Built 2026-08-13 after #275009/275152 false-"blocked" (assume-not-verify 30d=25 🚨)

## User
- [user_career_vision.md](user_career_vision.md) — 3-phase career vision: Personal Excellence → Team Contribution → Company Impact
- [user_gender.md](user_gender.md) — みや is male; don't default to "she" in diary/narration; no retroactive edits
- [user_learning_jsf_tracing.md](user_learning_jsf_tracing.md) — Struggling with cross-file tracing + JSF concepts; explain navigation chain WHY not just findings; analogize JSF to OO terms
- [user_work_environment.md](user_work_environment.md) — Work laptop: Edge + Chrome browsers, Eclipse IDE; Zen Browser is personal only

## Project — Environment
- [project_local_deploy_hibernate_overlay.md](project_local_deploy_hibernate_overlay.md) — 🚨 Local deploy fails w/ `ClassNotFoundException org.hibernate.HibernateException` (or Spring `HttpRequestHandlerServlet`) → `jboss-deployment-structure.xml` missing from deployed war; lives ONLY in etanah-common overlay via `M2_REPO`. Read DEV-TESTING-HACKS.md FIRST
- [project_jboss_launched_by_eclipse.md](project_jboss_launched_by_eclipse.md) — JBoss EAP 7.4 (E:/Dev/jboss-7.4-plp-melaka) launched by Eclipse JBossTools; standalone.conf.bat IGNORED; JVM args go in Eclipse Server Launch Config → VM arguments
- [project_work_setup.md](project_work_setup.md) — Dev codebase at E:\Projects\Melaka (NOT OneDrive copy which is stale)
- [project_onedrive_migration.md](project_onedrive_migration.md) — Auto-memory syncs via OneDrive; autoMemoryDirectory setup per machine
- [project_onedrive_branch_refs.md](project_onedrive_branch_refs.md) — Deleted claude/* branches can reappear (OneDrive re-syncs .git/refs); surfacer flags it, re-delete after git-cherry check

## Project
- [project_aunt_slides.md](project_aunt_slides.md) — Future project: help aunt with presentations using Claude + Marp
- [project_qa_255773_spoc.md](project_qa_255773_spoc.md) — Held SPOC mirror-copy ticket; load handoff-255773.md on any SPOC/flowable/pihak_bkptg mention
- [project_etanah_organize.md](project_etanah_organize.md) — etanah-organize-alpha: organize etanah-knowledge/melaka into guidebook → Phase 2 office-day verification → Phase 3 website; activation: Bankai 蒼穹宝典; alpha-1 complete 2026-05-14 (115-item ledger)

## Reference
- [reference_baseline_release_servers.md](reference_baseline_release_servers.md) — Baseline build server 172.16.100.162 · deploy 172.30.12.203 · ssh user `app`; the gitignored servers.local.json does NOT travel between machines, this does
- [reference_etanah_bpmn_source.md](reference_etanah_bpmn_source.md) — Flowable BPMN lives in main-repo etanah-knowledge/.../flowables-bpmn/ (absent from worktrees); read parsed bpmn_flow.json not raw XML; latest at mlit flowable-ui modeler
- [reference_esokongan_branch_shape.md](reference_esokongan_branch_shape.md) — eSOKONGAN release tickets don't always live on mlk/esokongan/<num> (#271639 was mlk/internal/); ls-remote verify every branch, tracker→shape is only a hint
- [reference_melaka_env_deploy_paths.md](reference_melaka_env_deploy_paths.md) — Melaka env-deploy routes: internal/mlit = ONE function on 172.16.100.162 deployment-scripts/mlit; staging = build .162 then deploy 172.30.12.203; only 2 IPs; use `/deploy`
- [reference_multi_ticket_sweep.md](reference_multi_ticket_sweep.md) — the `/sweep` design + evidence lives in FIVE places (DESIGN · PRIOR-ART · audit log ×2 · todo Q1 ×2 · current-session); cite all five, never just todo
- [reference_dms_document_patch.md](reference_dms_document_patch.md) — DMS document-patch tickets (replace generated Surat in PROD) = proven one-shot lookup via /patch-mlk-doc skill; never re-explore et_dms; 2-part (infra replaces .main → patching team nulls LOKASI_FAIL_PDF on latest active revision)
- [reference_qa246512_containment.md](reference_qa246512_containment.md) — #246512 PPJK/PTG template fixes are in master + all releases 1.1.0→1.3.1 + int-env; BUT the 06-26 "missing points PTG template ppjk" commit was REVERTED same day → that change is live nowhere
- [reference_hakmilik_change_map.md](reference_hakmilik_change_map.md) — Hakmilik data-change map: id_hkmlk→hkmlk_pelbagai_id (1:1) across ind_hkmlk/ind_hkmlk_pelbagai/ind_mklmt_hkmlk; LUAS+unit_luas_id live in ind_mklmt_hkmlk (not the other two); registry-side = fatmk.hakmilik.luas+kod_uom; unit codes per-schema
- [reference_jasper_field_sources.md](reference_jasper_field_sources.md) — Jasper `$F{}` from SQL-in-jrxml (`printReportUsingSQL`) vs Java datasource (`printReport`/`printReportUsingDataSource`) — decides whether a report fix is ours or the Reports team's; #271721 settled by jrxml:366
- [reference_pelupusan_doc_reset_tool.md](reference_pelupusan_doc_reset_tool.md) — To re-test a regenerated Pelupusan doc (L1e/4Ae/surat), "reset" = DELETE the related generated docs via PelupusanMaintenanceForm.xhtml; NOT status_id=NULL SQL (that's #273956 template letters), NOT the pembetulan flow auto-delete; provisional (miya, #273621)
- [reference_petaling_flowable_deployments.md](reference_petaling_flowable_deployments.md) — Past Flowable/BPMN deployment diagrams archived on the Petaling server at `/home/ftpuser/files/flowable-diagrams`; check here before concluding a corrected BPMN "was never deployed" or preparing a redeploy
- [reference_utiliti_ulasan_jt_jpph_screen.md](reference_utiliti_ulasan_jt_jpph_screen.md) — BA "Utiliti" = Pelupusan sidebar menu; "Kemaskini Ulasan JT/JPPH" = etanah-common protected/jpph/UtilitiKemaskiniUlasanJPPHForm (bean + xhtml), NOT the pelupusan tugasan forms; a utiliti-reported bug → look in etanah-common Utiliti*Form first

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
- [feedback_stash_naming_convention.md](feedback_stash_naming_convention.md) — Stash messages are `stash <ticket-number>` and nothing else; one ticket per stash, find by message grep, context lives in the quest MD
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
