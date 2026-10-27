# NUKE-MARKER — handover-check-gate

| Field | Value |
|---|---|
| Created  | 2026-10-27 |
| Session  | 286462 (2026-10-27): the hand-over check existed only as a skill line, so nothing forced it to run; the note also went to the Reports PIC, not TL Nurhayati Abdul Razak |
| Files    | domain\handover-check-gate\handover-check-gate.check.hook.js · domain\handover-check-gate\handover-check-gate.eval.js · README.md · settings.json Stop entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/handover-check-gate` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-11-26 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
