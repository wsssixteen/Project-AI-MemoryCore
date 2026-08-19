# NUKE-MARKER — template-cc-preflight

| Field | Value |
|---|---|
| Created  | 2026-08-19 |
| Session  | miya goal after BA "ralat sbb maklumat tak lengkap": template tickets get a CC-tag data preflight before any test scenario (QA-275505/276181 session) |
| Files    | `domain/template-cc-preflight/` (check.hook.js · eval.js · preflight.js · README.md · log.jsonl · this file) + `settings.json` Stop entry `node "${CLAUDE_PROJECT_DIR}\\domain\\template-cc-preflight\\template-cc-preflight.check.hook.js"` + `system/registry.jsonl` row `template-cc-preflight` |
| Rollback | `Remove-Item -Recurse -Force domain\template-cc-preflight` · remove the settings.json Stop entry above · delete the registry.jsonl line for "template-cc-preflight" |
| Retire   | 2026-09-18 (creation + 30 days) — remove this file if the Feature fired ≥1× in window AND no rollback |
