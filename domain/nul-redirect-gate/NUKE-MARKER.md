# NUKE-MARKER — nul-redirect-gate

| Field | Value |
|---|---|
| Created  | 2026-09-28 |
| Session  | Git Bash does not treat NUL as the null device, so a > NUL redirect creates a real file with a Windows-reserved name that OneDrive cannot sync |
| Files    | domain\nul-redirect-gate\nul-redirect-gate.check.hook.js · domain\nul-redirect-gate\nul-redirect-gate.eval.js · README.md · settings.json PreToolUse entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/nul-redirect-gate` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-10-28 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
