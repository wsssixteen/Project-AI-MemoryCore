# NUKE-MARKER — ownership-input-check

| Field | Value |
|---|---|
| Created  | 2026-10-01 |
| Session  | 2026-10-01 #282442: miya - audit why you missed it the first time (we called it common/GIS, GIS showed our kodPejabat was empty) |
| Files    | domain\ownership-input-check\ownership-input-check.check.hook.js · domain\ownership-input-check\ownership-input-check.eval.js · README.md · child line in domain/bundles/stop-claim-integrity.json · system/registry.jsonl line |
| Rollback | `rm -rf domain/ownership-input-check` · remove the child line from domain/bundles/stop-claim-integrity.json · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-10-31 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
