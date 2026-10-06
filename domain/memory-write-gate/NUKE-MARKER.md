# NUKE-MARKER — memory-write-gate

| Field | Value |
|---|---|
| Created  | 2026-10-05 |
| Session  | 2026-10-05 miya: 'feedback_ is not enough ... a gate to stop you BEFORE or WHEN you wanted to add feedback_' (commit-subject language slip on #244600 answered with a memory line only) |
| Files    | domain\memory-write-gate\memory-write-gate.check.hook.js · domain\memory-write-gate\memory-write-gate.eval.js · README.md · settings.json PreToolUse entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/memory-write-gate` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-11-04 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
