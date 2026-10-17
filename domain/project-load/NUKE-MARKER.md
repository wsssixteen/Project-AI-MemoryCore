# NUKE-MARKER — project-load

| Field | Value |
|---|---|
| Created  | 2026-10-08 (v1) · 2026-10-17 (v2, the project system) |
| Session  | v1: 2026-10-08 miya: 'make sure everything WILL be loaded every single time we load a project'. v2: 2026-10-17 miya, Masterline brief: survive auto-compaction, load fast like a quest, decisions never forgotten |
| Files    | v1: domain\project-load\project-load.check.hook.js · project-load.eval.js · README.md · settings.json UserPromptSubmit entry · system/registry.jsonl line. v2: project.js · project-load.resume.hook.js · project-load.precompact.hook.js · project-load.save.hook.js · eval.js · templates\ · .claude\skills\project\ · settings.json SessionStart group (matcher compact\|resume) + PreCompact group · domain\bundles\stop-claim-integrity.json child · lib\save-rules.js (project-shape2, project-report-current) · system\save-rules.json v3 rules · system\INDEX.md Projects row |
| Rollback | v2 only: remove the SessionStart compact\|resume group and the PreCompact group from settings.json · remove the save hook line from stop-claim-integrity.json · `git revert <v2 SHA>` (restores the v1 prompt hook). Whole Feature: also `rm -rf domain/project-load` + the UserPromptSubmit entry + the registry line |
| Retire   | 2026-11-16 — remove this file if the v2 hooks fired >=1x in log.jsonl (compact, resumed, stop-check rows) AND no rollback |
