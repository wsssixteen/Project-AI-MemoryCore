# NUKE-MARKER — rootcause-format

| Field | Value |
|---|---|
| Created  | 2026-09-01 |
| Session  | TODO(forge): one-line root symptom / quest ID / user ask that triggered this Feature |
| Files    | domain\rootcause-format\rootcause-format.check.hook.js · domain\rootcause-format\rootcause-format.eval.js · README.md · settings.json Stop entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/rootcause-format` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-10-01 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
