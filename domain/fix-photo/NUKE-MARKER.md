# NUKE-MARKER — fix-photo

| Field | Value |
|---|---|
| Created  | 2026-09-28 |
| Session  | 2026-09-28 #256334 miya: 'include the fix photo with red box you add into fix folder ... a step/behaviour you always do when talking about the UI, especially since BA have already provided the photos' |
| Files    | domain\fix-photo\ (fix-photo.check.hook.js · fix-photo.eval.js · mark.py · README.md · log.jsonl) · settings.json Stop entry · system/registry.jsonl line · .claude/skills/quest/SKILL.md pre-emit row 🖼️ UI fix |
| Rollback | `rm -rf domain/fix-photo` · remove the settings.json Stop entry for fix-photo.check.hook.js · remove the registry.jsonl line for "fix-photo" · `git revert <birth-SHA>` |
| Retire   | 2026-10-28 — remove this file if the Feature fired >=1x in hook-fires telemetry AND no rollback |
