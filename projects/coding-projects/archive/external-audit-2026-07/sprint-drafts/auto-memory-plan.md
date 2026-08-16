# Auto-Memory Refactor — Execution Plan (audit C5)

Source: `external-audit/sprint-analysis/auto-memory-classify.json` (71 files — task brief said 75; actual count verified via grep is 71, no files missing from the classify pass).

Spot-checked 8 files directly against `.claude/auto-memory/`: `feedback_investigation_style.md`, `feedback_two_sentence_default.md`, `feedback_no_extra_comments.md`, `feedback_task_folder_ownership.md`, `feedback_stay_in_module.md`, `feedback_simplify_and_reference.md`, `project_planning_threads.md`, `feedback_bundling_before_defer.md`. 2 of 8 produced a disagreement — see bottom.

---

## Table 1 — MOVE-TO-ARCHIVE (7 files, `stale-delete` class)

| File | What supersedes it |
|---|---|
| `feedback_investigation_style.md` | CLAUDE.md §2 (register/depth rules, SHOW-DON'T-EXPLAIN pillar) + `feedback_two_sentence_default.md` — **caveat**: its DB-data SHOW rule sub-section is NOT duplicated elsewhere, see Disagreements |
| `feedback_project_file_structure.md` | `feedback_folder_vocabulary.md` + `feedback_task_folder_ownership.md` (both more detailed, more recent) |
| `feedback_quest_checklist.md` | `/checklist` skill + CLAUDE.md Rubric row (g) BA-Expected Alignment |
| `feedback_standalone_db.md` | `feedback_uat_fat_environments.md` + `/env-check` skill |
| `feedback_work_patterns.md` | CLAUDE.md §2 table/diagram-default rules + `feedback_stay_in_module.md` (scope half) |
| `project_planning_threads.md` | Mostly checked off; C6 already re-opened as its own tracked project — **caveat**: C7/C8 + 4 Deferred items are still-open, unresolved TODOs, see Disagreements |
| `project_task_workflow.md` | CLAUDE.md Quest Workflow section (Scout→Recon→Rubric→Apply engine) + `quest` skill |

---

## Table 2 — STYLE-ONE-LINERS (16 files, `style-one-liner` class)

| File | The one line | Target home |
|---|---|---|
| `feedback_comment_style.md` | Code comments: name actual vars + plain English + literal cross-ref, max 2 lines; never rewrite みや's own comments | personality.md / convention-check-gate |
| `feedback_complete_before_deliver.md` | Never deliver a placeholder script — ask for missing values first, deliver complete | personality.md deliverable-completeness |
| `feedback_defensive_tone.md` | Never say "that's not a [me] problem" — own gaps directly or push back honestly, no polite middle | personality.md banned-phrases |
| `feedback_directness.md` | みや's direct questions are not frustration — don't apologize or go tentative in response | personality.md tone section |
| `feedback_full_names.md` | Always use full file/class/method names + full paths, never an invented shorthand | CLAUDE.md §2 explanation-discipline |
| `feedback_gestures_combine.md` | Match gesture/laughter energy to context; never use "lol" (chuckle/giggle instead) | personality.md gestures section |
| `feedback_knowledgebase_tiers.md` | Remind みや when second-tier info should be saved to knowledgebase — never silently skip | personality.md (merge w/ knowledgebase_during_debug) |
| `feedback_locator_single_cell.md` | file:line / class:line locators go in ONE table cell, never split File/Line columns; no parenthetical padding | CLAUDE.md §2 TABLE FOCUS RULE |
| `feedback_measure_before_verdict.md` | Never call output "low-res"/"compressed" from a guess — measure DPI or reproduce first | personality.md (merge w/ visual_fidelity_no_excuses) |
| `feedback_personal_expression.md` | Personal/reflective moments: process out loud, don't deliver a polished essay | personality.md personal-expression section |
| `feedback_self_reference.md` | Always say "I", never "it", when referring to myself | personality.md |
| `feedback_share_content_in_chat.md` | Share full file content in chat, not just a path/link, for anything actionable | CLAUDE.md §2 / personality.md output rule |
| `feedback_skeptical_of_user_suggestions.md` | Apply the same rigor to みや's suggestions as to my own claims — don't validate just because he proposed it | personality.md honesty-invariants |
| `feedback_ticket_cadence.md` | 3 tickets/day; spread difficulty, don't cherry-pick easiest; fix only BA-highlighted items | personality.md work-pattern / CLAUDE.md quest-scope |
| `feedback_visual_fidelity_no_excuses.md` | Ban "I can't see rendering" excuses when みや shared visual evidence — measure positional cues instead | personality.md honesty-invariants (merge w/ measure_before_verdict) |
| `feedback_writer_before_reader.md` | When a reader sees wrong/missing state, audit the WRITER that produced the input before patching the reader | personality.md debugging-discipline |

---

## Table 3 — KEEP (22 files, `keep-as-memory` class)

| File | Why |
|---|---|
| `feedback_bash_tool.md` | Environment-specific tool-quirk fact (Bash hangs on this machine) — persistent, not a style rule |
| `feedback_folder_vocabulary.md` | Standing glossary fact (Quest vs Task folder vs Project folder) — referenced repeatedly |
| `feedback_my_files_minimal.md` | Standing file-ownership convention; overlaps `feedback_task_folder_ownership.md` — merge candidate for a human editor later, not now |
| `feedback_naming_japanese.md` | Conditional naming convention tied to time-of-day/doc-type — too nuanced for a one-liner, no deterministic hook trigger |
| `feedback_stay_in_module.md` | Recent (12d), specific scope-guardrail with a concrete red-flag table — carries real judgment content |
| `feedback_two_sentence_default.md` | Recent (7d), high-priority override of default verbosity — must stay visible as its own memory, not mergeable without weakening it |
| `feedback_uat_fat_environments.md` | Dense env/infra reference table (hosts, schemas, JNDI) that `/env-check` consults — too data-dense for a one-liner |
| `feedback_untracked_confidential.md` | Standing repo-hygiene fact preventing false-positive drift flags — not mechanically hookable without risking hidden real drift |
| `feedback_verify_before_claim.md` | Foundational honesty-discipline memory (re-read before asserting, hold under challenge) — requires judgment, not hookable |
| `MEMORY.md` | The index itself — excluded from classification, required to keep |
| `project_aunt_slides.md` | Genuine low-priority standing project reminder |
| `project_etanah_organize.md` | Active project-tracking pointer with resume instructions |
| `project_jboss_launched_by_eclipse.md` | Non-obvious environment-quirk fact with a documented past failure |
| `project_onedrive_branch_refs.md` | Non-obvious environment behavior (OneDrive re-syncs `.git/refs`) that would otherwise be repeatedly misdiagnosed |
| `project_onedrive_migration.md` | One-time-setup reference needed whenever a new machine is added |
| `project_qa_255773_spoc.md` | Held-ticket pointer with live unresolved hypotheses (H5) |
| `project_work_setup.md` | Critical non-obvious path-correctness fact with a documented past failure |
| `reference_etanah_bpmn_source.md` | Non-obvious location/format guidance (worktrees don't see BPMN) preventing repeated wasted searches |
| `user_career_vision.md` | Standing user-context fact used as a decision filter |
| `user_gender.md` | Simple, important, genuine user fact |
| `user_learning_jsf_tracing.md` | Standing user-context fact shaping long-term explanation style |
| `user_work_environment.md` | Simple, non-obvious, previously-mis-assumed environment fact |

---

## Table 4 — DEFER (26 files, post-sprint forge work — nothing gets hookified tonight)

### 4a. `mechanical-hookable` (15) — deterministic trigger exists, candidate for a Stop/PreToolUse hook or skill-template extension

| File | Target hook/skill |
|---|---|
| `feedback_awam_no_permohonan_id.md` | test-data-echo skill (AWAM branch) / quest-phase-gate |
| `feedback_bundling_before_defer.md` | quest-phase-gate / Rubric emit gate |
| `feedback_bypass_token_visibility.md` | bypass-token formatting convention in each Stop-hook's emit template |
| `feedback_daily_commit.md` | ruri-skills:auto-commit / DE expansion-protocol |
| `feedback_diary_check.md` | SessionStart diary-check hook |
| `feedback_location_check.md` | SessionStart hook (session-briefing) |
| `feedback_no_extra_comments.md` | already implemented — `prepare-commit-trigger.js` Step 2.6 + `convention-check-gate.js` (memory is now redundant docs) |
| `feedback_no_names_in_comments.md` | `prepare-commit-trigger.js` / `convention-check-gate.js` (extend regex) |
| `feedback_pengguna_semasa.md` | test-data-echo skill |
| `feedback_quest_closure_both_folders.md` | close-phase / quest-bounty skill |
| `feedback_reassess_before_save.md` | save-memory skill / auto-skill-on-mistake gate |
| `feedback_sql_insert_id_check.md` | convention-check-gate.js SQL branch |
| `feedback_stale_handoff_verify.md` | SessionStart boot-verification hook |
| `feedback_task_folder_ownership.md` | already implemented — `quest/notes.js` is the generator (memory is now docs of an existing mechanical process) |
| `feedback_test_data_recency.md` | quest skill test-data query template / test-data-echo |

### 4b. `procedural-skill` (11) — multi-step procedure, candidate to fold into an existing skill's SKILL.md

| File | Target skill |
|---|---|
| `feedback_bankai_format.md` | bankai skill (format spec section) |
| `feedback_check_archives.md` | quest skill (Phase 0 checklist step) |
| `feedback_design_from_architecture.md` | system-design skill |
| `feedback_domain_expansion_format.md` | domain-expansion skill (format spec section) |
| `feedback_fix_txt_structure.md` | quest / close-phase skill (Task-folder templates) |
| `feedback_inventory_first.md` | system-rules skill |
| `feedback_knowledgebase_during_debug.md` | quest skill / learn-from-fix skill |
| `feedback_layered_teaching_format.md` | kowalski skill or a new teaching-mode skill |
| `feedback_predicate_before_fix.md` | predicate-box skill (background/why section) |
| `feedback_simplify_and_reference.md` | already CLAUDE.md's canonical citation target — no structural change needed, just formalize the pointer |
| `feedback_tasks_folder_format.md` | quest skill (Phase 0 folder-creation step) |

---

## Disagreements with the classification (2 of 8 spot-checked)

1. **`feedback_investigation_style.md`** — classed `stale-delete`, but the file's final section ("🆕 DB-data SHOW rule", added 2026-06-22) is a distinct, load-bearing rule — every data-touching code change must ship with a companion runnable SQL query — that is NOT duplicated in CLAUDE.md §2 or `feedback_two_sentence_default.md`. Archiving the whole file as-is would silently drop this rule. **Recommendation**: extract that one rule into Table 2 (STYLE-ONE-LINERS) targeting CLAUDE.md §9 DB & Entity Resolution / test-data-echo, THEN archive the rest of the file.

2. **`project_planning_threads.md`** — classed `stale-delete`/archive, correctly so for the checked-off items (A1/A2/B3-5/C6). But C7 ("Validation step for Gemini outputs — NEXT DISCUSSION"), C8 ("Session-notes promotion workflow"), and all 4 "D — Deferred" items (career planning dump, "good practices from Claude's creator — REMIND MIYA", Gemini-restricted fallback, session-notes-promotion-after-C8) are still open and not confirmed tracked anywhere else in the corpus. **Recommendation**: before archiving, carry C7/C8/D forward into a live todo/reminder location (e.g. `main/todo.md`) so they aren't silently lost — pure archive-and-forget would drop 4+ open action items みや hasn't resolved.

The other 6 spot-checked files (`feedback_two_sentence_default.md`, `feedback_no_extra_comments.md`, `feedback_task_folder_ownership.md`, `feedback_stay_in_module.md`, `feedback_simplify_and_reference.md`, `feedback_bundling_before_defer.md`) matched their classification on direct read — no changes.
