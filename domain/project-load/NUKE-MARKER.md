# NUKE-MARKER — project-load

| Field | Value |
|---|---|
| Created  | 2026-10-08 |
| Session  | 2026-10-08 miya: 'make sure everything WILL be loaded every single time we load a project'; he found the stale PymTime project folder himself |
| Files    | domain\project-load\project-load.check.hook.js · domain\project-load\project-load.eval.js · README.md · settings.json UserPromptSubmit entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/project-load` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-11-07 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
