# NUKE-MARKER — feature-creation

| Field | Value |
|---|---|
| Created  | 2026-08-19 |
| Session  | miya: "create/update/refine FEATURE should be a keyword phrase to invoke proper feature creation" (QA-275505/276181 session) |
| Files    | `domain/feature-creation/` (check.hook.js · eval.js · README.md · this file) + `settings.json` UserPromptSubmit entry `node "${CLAUDE_PROJECT_DIR}\\domain\\feature-creation\\feature-creation.check.hook.js"` + `system/registry.jsonl` row `feature-creation` |
| Rollback | `Remove-Item -Recurse -Force domain\feature-creation` · remove the settings.json UserPromptSubmit entry above · delete the registry.jsonl line for "feature-creation" |
| Retire   | 2026-09-18 (creation + 30 days) — remove this file if the Feature fired ≥1× in window AND no rollback |
