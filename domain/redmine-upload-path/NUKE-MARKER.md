# NUKE-MARKER — redmine-upload-path

| Field | Value |
|---|---|
| Created  | 2026-10-27 |
| Session  | Redmine uploads not kept in the Task folder |
| Files    | domain\redmine-upload-path\redmine-upload-path.check.hook.js · domain\redmine-upload-path\redmine-upload-path.eval.js · README.md · settings.json PreToolUse entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/redmine-upload-path` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-11-26 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
