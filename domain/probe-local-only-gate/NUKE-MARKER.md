# NUKE-MARKER — probe-local-only-gate

| Field | Value |
|---|---|
| Created  | 2026-09-23 |
| Session  | 2026-09-23 #280176: probe commit 3ba0dd4985 (temporary loggers) landed on the staging and internal env branches on 2026-09-22 and needed a revert merge; miya: 'do we need loggers? If yes, please add a rule we will be testing locally. That is a new rule or stopgate from now on.' |
| Files    | domain\probe-local-only-gate\probe-local-only-gate.check.hook.js · domain\probe-local-only-gate\probe-local-only-gate.eval.js · README.md · settings.json PreToolUse entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/probe-local-only-gate` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-10-23 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
