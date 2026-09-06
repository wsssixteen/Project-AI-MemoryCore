# Feature audit — 2026-09-06 (P1 of speed-optimization plan §5)

> Generated from `system/telemetry/hook-fires*.jsonl` (30 days: 2026-08-07 → 2026-09-06, 5277 rows) + `.claude/settings.json` + `domain/*/README.md` + `system/feature-census.md`. Verdicts are PROPOSALS by fixed rules (below); nothing is removed by this file. True/false-block data does not exist yet (needs §M turn-ledger), so REVIEW/RETIRE rows wait for P5.

| Verdict | Count |
|---|---|
| FIX | 0 |
| RETIRE? | 2 |
| DEAD-DIR? | 19 |
| REFINE | 8 |
| REVIEW | 0 |
| KEEP | 119 |
| SKILL | 10 |
| CONTAINER | 5 |
| EVAL-NOISE | 1 |
| goal-less READMEs | 53 |
| READMEs without retention: | 53 |

**Verdict rules**: FIX = errors in 30d · SKILL = skill-backed feature (no hook telemetry by design) · CONTAINER = bundle manifest · RETIRE? = registered, 0 fires 30d · DEAD-DIR? = domain dir, unregistered, 0 fires · REFINE = boot hook >2 s OR ≥50% of its blocks bypassed · REVIEW = gate with ≥20 fires, 0 blocks, ≥60 s spent · KEEP = everything else.

| Verdict | Component | Event | Fires | Blocks | Bypassed | avg ms | total s | Last | Goal (README) | Why |
|---|---|---|---|---|---|---|---|---|---|---|
| RETIRE? | `deploy-guard` | PreToolUse | 0 | 0 | 0 | 0 | 0 | — | no README | 0 fires 30d |
| RETIRE? | `prod-db-confirm` | PreToolUse | 0 | 0 | 0 | 0 | 0 | — | no README | 0 fires 30d |
| DEAD-DIR? | `attachment-context` | — | 0 | 0 | 0 | 0 | 0 | — | — | unregistered, 0 fires |
| DEAD-DIR? | `batch-ask` | — | 0 | 0 | 0 | 0 | 0 | — | — | unregistered, 0 fires |
| DEAD-DIR? | `checklist-reactivate` | — | 0 | 0 | 0 | 0 | 0 | — | — | unregistered, 0 fires |
| DEAD-DIR? | `cross-module-intake` | — | 0 | 0 | 0 | 0 | 0 | — | no README | unregistered, 0 fires |
| DEAD-DIR? | `env-switch` | — | 0 | 0 | 0 | 0 | 0 | — | no README | unregistered, 0 fires |
| DEAD-DIR? | `etanah-intake-gate` | — | 0 | 0 | 0 | 0 | 0 | — | — | unregistered, 0 fires |
| DEAD-DIR? | `grep-zero-match` | — | 0 | 0 | 0 | 0 | 0 | — | no README | unregistered, 0 fires |
| DEAD-DIR? | `live-action-safety` | — | 0 | 0 | 0 | 0 | 0 | — | — | unregistered, 0 fires |
| DEAD-DIR? | `live-action-safety-gate` | — | 0 | 0 | 0 | 0 | 0 | — | no README | unregistered, 0 fires |
| DEAD-DIR? | `overview-steps` | — | 0 | 0 | 0 | 0 | 0 | — | — | unregistered, 0 fires |
| DEAD-DIR? | `patch-close-shape` | — | 0 | 0 | 0 | 0 | 0 | — | — | unregistered, 0 fires |
| DEAD-DIR? | `patch-ticket-intake-flag` | — | 0 | 0 | 0 | 0 | 0 | — | — | unregistered, 0 fires |
| DEAD-DIR? | `rootcause-format` | — | 0 | 0 | 0 | 0 | 0 | — | — | unregistered, 0 fires |
| DEAD-DIR? | `staging-schema-check` | — | 0 | 0 | 0 | 0 | 0 | — | no README | unregistered, 0 fires |
| DEAD-DIR? | `staging-schema-tracker` | — | 0 | 0 | 0 | 0 | 0 | — | no README | unregistered, 0 fires |
| DEAD-DIR? | `steal-risk-flag` | — | 0 | 0 | 0 | 0 | 0 | — | — | unregistered, 0 fires |
| DEAD-DIR? | `stop-point-todo-table` | — | 0 | 0 | 0 | 0 | 0 | — | — | unregistered, 0 fires |
| DEAD-DIR? | `ticket-close-block` | — | 0 | 0 | 0 | 0 | 0 | — | — | unregistered, 0 fires |
| DEAD-DIR? | `urusan-tickets` | — | 0 | 0 | 0 | 0 | 0 | — | — | unregistered, 0 fires |
| REFINE | `worktree-cleanup-boot` | SessionStart | 182 | 0 | 0 | 24371 | 4436 | 09-06 | no README | boot cost |
| REFINE | `open-quest-surfacer` | SessionStart | 182 | 0 | 0 | 7936 | 1444 | 09-06 | no README | boot cost |
| REFINE | `hook-syntax-check` | SessionStart | 182 | 0 | 0 | 7596 | 1382 | 09-06 | no README | boot cost |
| REFINE | `unmerged-release-boot` | SessionStart | 60 | 0 | 0 | 3787 | 227 | 09-06 | no README | boot cost |
| REFINE | `atlas-ship-gate` | Stop | 17 | 1 | 4 | 33 | 1 | 09-06 | — | bypass rate |
| REFINE | `deliverable-lands-on-main` | Stop | 47 | 6 | 6 | 7 | 0 | 09-06 | no README | bypass rate |
| REFINE | `deploy-merge-surface` | PreToolUse | 110 | 4 | 3 | 3 | 0 | 09-06 | no README | bypass rate |
| REFINE | `render-verify` | Stop | 23 | 1 | 1 | 12 | 0 | 09-06 | — | bypass rate |
| KEEP | `system-audit` | SessionStart | 182 | 0 | 0 | 828 | 151 | 09-06 | no README |  |
| KEEP | `boot-required-read-gate` | SessionStart | 182 | 0 | 0 | 767 | 140 | 09-06 | no README |  |
| KEEP | `claude-md-watch` | SessionStart | 120 | 0 | 0 | 906 | 109 | 09-06 | — |  |
| KEEP | `boot-load-verification` | SessionStart | 182 | 0 | 0 | 431 | 79 | 09-06 | no README |  |
| KEEP | `evolution-check-trigger` | SessionStart | 182 | 0 | 0 | 427 | 78 | 09-06 | no README |  |
| KEEP | `system-check-trigger` | SessionStart | 182 | 0 | 0 | 407 | 74 | 09-06 | no README |  |
| KEEP | `reply-log` | Stop | 17 | 0 | 0 | 1690 | 29 | 09-06 | no README |  |
| KEEP | `quest-doc-freshness` | Stop | 17 | 0 | 0 | 1614 | 27 | 09-06 | — |  |
| KEEP | `de-step11-verdict-gate` | Stop | 17 | 0 | 0 | 1539 | 26 | 09-06 | — |  |
| KEEP | `operational-follow-through` | Stop | 17 | 0 | 0 | 1521 | 26 | 09-06 | no README |  |
| KEEP | `deploy-proof-gate` | Stop | 17 | 0 | 0 | 1456 | 25 | 09-06 | no README |  |
| KEEP | `diagnostic-self-heal-gate` | Stop | 17 | 0 | 0 | 1391 | 24 | 09-06 | no README |  |
| KEEP | `notes-on-test-data` | Stop | 17 | 0 | 0 | 1433 | 24 | 09-06 | no README |  |
| KEEP | `quest-context-load-gate` | Stop | 17 | 0 | 0 | 1416 | 24 | 09-06 | no README |  |
| KEEP | `de-output-integrity-checker` | Stop | 17 | 0 | 0 | 1355 | 23 | 09-06 | no README |  |
| KEEP | `ask-back-gate` | Stop | 17 | 0 | 0 | 1320 | 22 | 09-06 | no README |  |
| KEEP | `quest-knowledge-save-gate` | Stop | 17 | 0 | 0 | 1302 | 22 | 09-06 | no README |  |
| KEEP | `rcrl-emit-check` | Stop | 17 | 0 | 0 | 1278 | 22 | 09-06 | no README |  |
| KEEP | `ba-understanding-table` | Stop | 17 | 0 | 0 | 1245 | 21 | 09-06 | — |  |
| KEEP | `codemap-recon-consult` | Stop | 17 | 2 | 0 | 1187 | 20 | 09-06 | — |  |
| KEEP | `convention-check-gate` | PreToolUse,PreToolUse | 67 | 0 | 0 | 295 | 20 | 09-06 | — |  |
| KEEP | `discipline` | Stop | 17 | 0 | 0 | 1190 | 20 | 09-06 | no README |  |
| KEEP | `prayer-gate` | UserPromptSubmit | 11 | 0 | 0 | 1786 | 20 | 09-06 | no README |  |
| KEEP | `patch-script-gate` | Stop | 17 | 0 | 0 | 1101 | 19 | 09-06 | no README |  |
| KEEP | `quest-deferrals-gate` | Stop | 17 | 0 | 0 | 1090 | 19 | 09-06 | — |  |
| KEEP | `predicate-box` | Stop | 17 | 2 | 0 | 1076 | 18 | 09-06 | — |  |
| KEEP | `de-run-verify` | Stop | 17 | 0 | 0 | 987 | 17 | 09-06 | no README |  |
| KEEP | `over-generalization-gate` | Stop | 17 | 0 | 0 | 920 | 16 | 09-06 | no README |  |
| KEEP | `silent-claim-drift-gate` | — | 17 | 0 | 0 | 916 | 16 | 09-06 | no README |  |
| KEEP | `ticket-gate` | UserPromptSubmit | 11 | 0 | 0 | 1456 | 16 | 09-06 | no README |  |
| KEEP | `overview-tracker.trigger` | UserPromptSubmit | 11 | 0 | 0 | 1404 | 15 | 09-06 | no README |  |
| KEEP | `MemoryClaimGate` | UserPromptSubmit | 11 | 0 | 0 | 1311 | 14 | 09-06 | no README |  |
| KEEP | `PlainFirstGate` | UserPromptSubmit | 11 | 0 | 0 | 1273 | 14 | 09-06 | no README |  |
| KEEP | `auto-skill-trigger` | UserPromptSubmit | 11 | 0 | 0 | 1269 | 14 | 09-06 | no README |  |
| KEEP | `inventory-first-gate` | UserPromptSubmit | 11 | 0 | 0 | 1293 | 14 | 09-06 | no README |  |
| KEEP | `quest-resume-preflight` | UserPromptSubmit | 11 | 0 | 0 | 1301 | 14 | 09-06 | no README |  |
| KEEP | `session-items-manager` | UserPromptSubmit | 11 | 0 | 0 | 1236 | 14 | 09-06 | no README |  |
| KEEP | `terse-gate` | — | 19 | 0 | 0 | 743 | 14 | 09-06 | — |  |
| KEEP | `veritas-claim-gate` | — | 17 | 0 | 0 | 845 | 14 | 09-06 | no README |  |
| KEEP | `TurnChecklistGate` | UserPromptSubmit | 11 | 0 | 0 | 1176 | 13 | 09-06 | no README |  |
| KEEP | `best-practices-consult-gate` | UserPromptSubmit | 11 | 0 | 0 | 1174 | 13 | 09-06 | no README |  |
| KEEP | `prose-default-gate` | UserPromptSubmit | 11 | 0 | 0 | 1167 | 13 | 09-06 | no README |  |
| KEEP | `word-ui-vocab-gate` | UserPromptSubmit | 11 | 0 | 0 | 1157 | 13 | 09-06 | no README |  |
| KEEP | `RecursiveLoopDetector` | PostToolUse | 86 | 0 | 0 | 144 | 12 | 09-06 | no README |  |
| KEEP | `domain-expansion-trigger` | UserPromptSubmit | 11 | 0 | 0 | 1049 | 12 | 09-06 | no README |  |
| KEEP | `prepare-commit-trigger` | UserPromptSubmit | 11 | 0 | 0 | 1123 | 12 | 09-06 | no README |  |
| KEEP | `show-gate` | — | 19 | 1 | 0 | 641 | 12 | 09-06 | — |  |
| KEEP | `slip-count-tracker` | PostToolUse | 86 | 0 | 0 | 139 | 12 | 09-06 | no README |  |
| KEEP | `ticket-criteria-gate` | — | 17 | 0 | 0 | 727 | 12 | 09-06 | — |  |
| KEEP | `user-side-guardrail` | UserPromptSubmit | 11 | 0 | 0 | 1071 | 12 | 09-06 | no README |  |
| KEEP | `verify-basis-gate` | — | 17 | 0 | 0 | 697 | 12 | 09-06 | — |  |
| KEEP | `batch-ask.trigger` | UserPromptSubmit | 11 | 0 | 0 | 990 | 11 | 09-06 | no README |  |
| KEEP | `branch-at-apply-gate` | PreToolUse | 46 | 0 | 0 | 234 | 11 | 09-06 | no README |  |
| KEEP | `commit-gate` | PreToolUse | 46 | 0 | 0 | 244 | 11 | 09-06 | no README |  |
| KEEP | `full-address-trace-gate` | — | 19 | 1 | 0 | 603 | 11 | 09-06 | — |  |
| KEEP | `quest-objective-anchor` | UserPromptSubmit | 11 | 0 | 0 | 991 | 11 | 09-06 | no README |  |
| KEEP | `scout-completeness-gate` | UserPromptSubmit | 11 | 0 | 0 | 1014 | 11 | 09-06 | no README |  |
| KEEP | `multi-dim-evidence-gate` | UserPromptSubmit | 11 | 0 | 0 | 893 | 10 | 09-06 | no README |  |
| KEEP | `attachment-context.trigger` | UserPromptSubmit | 11 | 0 | 0 | 861 | 9 | 09-06 | no README |  |
| KEEP | `attempt-before-blocked-gate` | Stop | 19 | 0 | 0 | 426 | 8 | 09-06 | no README |  |
| KEEP | `edit-scope-gate` | PreToolUse | 20 | 0 | 0 | 387 | 8 | 09-06 | no README |  |
| KEEP | `known-bug-surfacer` | PreToolUse | 31 | 0 | 0 | 246 | 8 | 09-06 | no README |  |
| KEEP | `mode-detector` | — | 11 | 0 | 0 | 723 | 8 | 09-06 | no README |  |
| KEEP | `no-code-comments-gate` | PreToolUse | 20 | 0 | 0 | 382 | 8 | 09-06 | no README |  |
| KEEP | `route-consult-gate` | — | 11 | 0 | 0 | 757 | 8 | 09-06 | no README |  |
| KEEP | `claude-md-edit-guard` | PreToolUse | 20 | 0 | 0 | 360 | 7 | 09-06 | no README |  |
| KEEP | `codemap-recon-consult.trigger` | — | 11 | 0 | 0 | 674 | 7 | 09-06 | no README |  |
| KEEP | `design-consult-gate` | — | 23 | 3 | 0 | 297 | 7 | 09-06 | — |  |
| KEEP | `logic-blast-radius` | PreToolUse | 20 | 0 | 0 | 342 | 7 | 09-06 | — |  |
| KEEP | `quest-active-grounding` | — | 11 | 0 | 0 | 656 | 7 | 09-06 | no README |  |
| KEEP | `quest-bounty` | PostToolUse | 44 | 0 | 0 | 149 | 7 | 09-06 | — |  |
| KEEP | `quest-phase-gate` | PreToolUse | 20 | 0 | 0 | 368 | 7 | 09-06 | — |  |
| KEEP | `skill-invocation-discipline-gate` | — | 11 | 0 | 0 | 679 | 7 | 09-06 | no README |  |
| KEEP | `pre-action-check-gate` | — | 23 | 0 | 0 | 255 | 6 | 09-06 | no README |  |
| KEEP | `system-edit-gate` | — | 23 | 2 | 0 | 252 | 6 | 09-06 | no README |  |
| KEEP | `adhoc-lifecycle` | SessionStart | 72 | 0 | 0 | 7 | 1 | 09-06 | — |  |
| KEEP | `block-child` | — | 8 | 8 | 0 | 89 | 1 | 08-24 | no README |  |
| KEEP | `compile-gate` | PreToolUse | 94 | 0 | 0 | 16 | 1 | 09-06 | no README |  |
| KEEP | `crash-child` | — | 8 | 0 | 0 | 85 | 1 | 08-24 | no README |  |
| KEEP | `de-close-gate` | Stop | 62 | 16 | 0 | 19 | 1 | 09-06 | — |  |
| KEEP | `de-knowledge-gate` | Stop | 21 | 2 | 0 | 30 | 1 | 09-06 | — |  |
| KEEP | `delegation-plan-presence` | Stop | 53 | 0 | 0 | 27 | 1 | 09-06 | no README |  |
| KEEP | `falsifier-ran-check` | Stop | 35 | 0 | 0 | 20 | 1 | 09-06 | no README |  |
| KEEP | `knowledge-first-gate` | PreToolUse | 229 | 54 | 0 | 3 | 1 | 09-06 | no README |  |
| KEEP | `pass-child` | — | 8 | 0 | 0 | 90 | 1 | 08-24 | no README |  |
| KEEP | `pre-code-check` | PreToolUse | 239 | 129 | 0 | 4 | 1 | 09-06 | no README |  |
| KEEP | `adhoc-paste-detector` | UserPromptSubmit | 13 | 0 | 0 | 4 | 0 | 09-06 | — |  |
| KEEP | `adhoc-register` | UserPromptSubmit | 18 | 0 | 0 | 4 | 0 | 09-06 | — |  |
| KEEP | `agent-spend-gate` | PreToolUse | 42 | 12 | 0 | 2 | 0 | 08-16 | no README |  |
| KEEP | `alter-ticket-gate` | UserPromptSubmit | 7 | 0 | 0 | 67 | 0 | 09-06 | — |  |
| KEEP | `atlas-full-check` | Stop | 17 | 0 | 0 | 10 | 0 | 09-06 | — |  |
| KEEP | `attachment-ledger-gate` | Stop | 2 | 0 | 0 | 2 | 0 | 08-17 | no README |  |
| KEEP | `awam-no-resit-gate` | Stop | 71 | 12 | 0 | 2 | 0 | 09-06 | — |  |
| KEEP | `bpmn-check` | PostToolUse | 18 | 0 | 0 | 3 | 0 | 09-06 | — |  |
| KEEP | `branch-guard` | PreToolUse | 100 | 0 | 0 | 3 | 0 | 09-06 | no README |  |
| KEEP | `bug-db` | UserPromptSubmit | 22 | 0 | 0 | 6 | 0 | 09-06 | no README |  |
| KEEP | `citation-cross-check` | Stop | 41 | 0 | 0 | 14 | 0 | 09-06 | no README |  |
| KEEP | `commit-subject-gate` | Stop | 10 | 0 | 0 | 32 | 0 | 09-06 | — |  |
| KEEP | `component-birth-gate` | PreToolUse | 50 | 6 | 0 | 2 | 0 | 09-06 | no README |  |
| KEEP | `familiar-nudge` | PreToolUse | 41 | 0 | 0 | 3 | 0 | 09-06 | no README |  |
| KEEP | `feature-creation` | UserPromptSubmit | 11 | 0 | 0 | 4 | 0 | 09-06 | — |  |
| KEEP | `forge` | — | 20 | 0 | 0 | 0 | 0 | 08-27 | no README |  |
| KEEP | `grep-rubric-gate` | PostToolUse | 4 | 0 | 0 | 116 | 0 | 08-28 | no README |  |
| KEEP | `knowledge-schema-audit` | PreToolUse,SessionStart | 7 | 0 | 0 | 5 | 0 | 09-06 | — |  |
| KEEP | `latent-bugs-gate` | UserPromptSubmit | 11 | 0 | 0 | 7 | 0 | 09-06 | — |  |
| KEEP | `local-deploy-gate` | UserPromptSubmit | 71 | 0 | 0 | 3 | 0 | 09-06 | no README |  |
| KEEP | `pre-reply-contract` | UserPromptSubmit | 61 | 0 | 0 | 4 | 0 | 09-06 | — |  |
| KEEP | `reask` | UserPromptSubmit | 71 | 0 | 0 | 4 | 0 | 09-06 | — |  |
| KEEP | `redmine-write-gate` | PreToolUse | 23 | 0 | 0 | 5 | 0 | 09-06 | — |  |
| KEEP | `release-mlk-plp-ask` | UserPromptSubmit | 47 | 0 | 0 | 2 | 0 | 09-06 | no README |  |
| KEEP | `release-mlk-plp-push-gate` | PreToolUse,PreToolUse | 101 | 18 | 6 | 2 | 0 | 09-06 | no README |  |
| KEEP | `release-mlk-plp-scope-gate` | PreToolUse | 200 | 96 | 12 | 2 | 0 | 09-06 | no README |  |
| KEEP | `retrieve-sync-gate` | UserPromptSubmit | 53 | 0 | 0 | 2 | 0 | 09-06 | no README |  |
| KEEP | `scope-claim-census` | Stop | 17 | 0 | 0 | 9 | 0 | 09-06 | no README |  |
| KEEP | `spawn-telemetry` | PostToolUse | 30 | 0 | 0 | 2 | 0 | 08-16 | no README |  |
| KEEP | `sql-schema-verify` | Stop | 4 | 0 | 0 | 2 | 0 | 08-10 | no README |  |
| KEEP | `stop-point-summary` | — | 2 | 0 | 0 | 96 | 0 | 08-16 | — |  |
| KEEP | `template-cc-preflight` | Stop | 17 | 0 | 0 | 21 | 0 | 09-06 | — |  |
| KEEP | `test-scenario-login-gate` | Stop | 60 | 6 | 0 | 2 | 0 | 09-06 | no README |  |
| SKILL | `agih` | — | 0 | 0 | 0 | 0 | 0 | — | no README | skill-backed, no hook telemetry |
| SKILL | `brief` | — | 0 | 0 | 0 | 0 | 0 | — | — | skill-backed, no hook telemetry |
| SKILL | `deploy` | — | 0 | 0 | 0 | 0 | 0 | — | no README | skill-backed, no hook telemetry |
| SKILL | `list-redmine` | — | 0 | 0 | 0 | 0 | 0 | — | no README | skill-backed, no hook telemetry |
| SKILL | `patch-mlk-doc` | — | 0 | 0 | 0 | 0 | 0 | — | no README | skill-backed, no hook telemetry |
| SKILL | `release-mlk-plp` | — | 0 | 0 | 0 | 0 | 0 | — | — | skill-backed, no hook telemetry |
| SKILL | `retrieve-redmine` | — | 0 | 0 | 0 | 0 | 0 | — | no README | skill-backed, no hook telemetry |
| SKILL | `review-etanah` | — | 0 | 0 | 0 | 0 | 0 | — | no README | skill-backed, no hook telemetry |
| SKILL | `scan` | — | 0 | 0 | 0 | 0 | 0 | — | — | skill-backed, no hook telemetry |
| SKILL | `sweep` | — | 0 | 0 | 0 | 0 | 0 | — | no README | skill-backed, no hook telemetry |
| CONTAINER | `domain/bundles/pretool-editwrite-gates.json` | PreToolUse | 0 | 0 | 0 | 0 | 0 | — | no README | bundle manifest |
| CONTAINER | `domain/bundles/stop-claim-integrity.json` | Stop | 0 | 0 | 0 | 0 | 0 | — | no README | bundle manifest |
| CONTAINER | `domain/bundles/stop-reply-shape.json` | Stop | 0 | 0 | 0 | 0 | 0 | — | no README | bundle manifest |
| CONTAINER | `domain/bundles/upsm-consult.json` | UserPromptSubmit | 0 | 0 | 0 | 0 | 0 | — | no README | bundle manifest |
| CONTAINER | `domain/bundles/upsm-mode.json` | UserPromptSubmit | 0 | 0 | 0 | 0 | 0 | — | no README | bundle manifest |
| EVAL-NOISE | `does-not-exist` | — | 8 | 0 | 0 | 1 | 0 | 08-24 | no README | eval fixture name |

## Skills (64) — no invocation telemetry exists; listed for the P5 pass

`agih`, `annotations`, `appraise`, `auto-skill-on-mistake`, `bankai`, `bpmn-check`, `brief`, `checklist`, `claim-verification`, `close-phase`, `confidence-table`, `deploy`, `domain-expansion`, `domain-modeling`, `env-check`, `etanah-knowledge-graph-build`, `etanah-rahsia-bypass`, `evaluator-optimizer`, `familiar`, `git-health`, `grep-rubric`, `grill-me`, `grill-with-docs`, `grilling`, `i-have-adhd`, `kowalski`, `learn-from-fix`, `list-redmine`, `logic-blast-radius`, `multi-dim-evidence`, `over-generalization-check`, `patch-mlk-doc`, `pre-action-check`, `predicate-box`, `prototype`, `quest`, `quest-bounty`, `quest-knowledge-save`, `quest-objective-anchor`, `redmine-phase1-prefill`, `release-mlk-plp`, `research`, `retrieve-redmine`, `review-etanah`, `scan`, `scope-anchor-echo`, `script-check`, `setup-matt-pocock-skills`, `skill-invocation-discipline`, `stalling-detector`, `stop-point-summary`, `sweep`, `sycophancy-circuit-breaker`, `system-check`, `system-design`, `system-rules`, `task-assignment-honesty`, `test-data-echo`, `usage-guidance`, `verify`, `video-frames`, `video-trim`, `wayfinder`, `worktree-retrieve`

## Bundles → members
- `pretool-editwrite-gates.json`: pretool-editwrite-gates
- `stop-claim-integrity.json`: stop-claim-integrity
- `stop-reply-shape.json`: stop-reply-shape
- `upsm-consult.json`: upsm-consult
- `upsm-mode.json`: upsm-mode