# NUKE-MARKER — kpi-pending

| Field | Value |
|---|---|
| Created  | 2026-10-23 |
| Session  | 2026-10-23 miya (#262027 Datuk salutation): 'add this into session start to always check & will only be removed after you confirmed the ticket has been verified and no mention of our particular change on this (meaning it passes)' |
| Files    | domain\kpi-pending\kpi-pending.check.hook.js · domain\kpi-pending\kpi-pending.eval.js · README.md · settings.json SessionStart entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/kpi-pending` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-11-22 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
