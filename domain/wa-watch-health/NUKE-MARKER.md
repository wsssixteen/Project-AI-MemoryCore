# NUKE-MARKER — wa-watch-health

| Field | Value |
|---|---|
| Created  | 2026-11-10 |
| Session  | 2026-11-06 miya: "check if the monitoring, observability and logging for every failure is also logged"; the check found the watcher had fired 0 sessions since 2026-09-14, its login dead since 2026-10-15 and the daemon stopped since 2026-11-03, with no alarm anywhere |
| Files    | domain\wa-watch-health\wa-watch-health.check.hook.js · domain\wa-watch-health\wa-watch-health.eval.js · README.md · settings.json SessionStart entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/wa-watch-health` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-12-10 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
