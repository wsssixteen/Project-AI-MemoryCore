# NUKE-MARKER — skill-invocation-log

| Field | Value |
|---|---|
| Created  | 2026-09-06 |
| Session  | DE 12.5 skill-load counter suspended since 2026-08-16: skill invocations are unlogged (named observability hole) |
| Files    | domain\skill-invocation-log\skill-invocation-log.check.hook.js · domain\skill-invocation-log\skill-invocation-log.eval.js · README.md · settings.json PostToolUse entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/skill-invocation-log` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-10-06 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
