# NUKE-MARKER — system-change-title

| Field | Value |
|---|---|
| Created  | 2026-10-27 |
| Session  | 2026-10-27 (286462): system-change replies listed a script, a gate, a skill line and a people row together; miya could not tell which kind of part each one was |
| Files    | domain\system-change-title\system-change-title.check.hook.js · domain\system-change-title\system-change-title.eval.js · README.md · settings.json Stop entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/system-change-title` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-11-26 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
