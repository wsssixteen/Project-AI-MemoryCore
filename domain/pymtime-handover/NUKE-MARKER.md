# NUKE-MARKER — pymtime-handover

| Field | Value |
|---|---|
| Created  | 2026-09-28 |
| Session  | 2026-09-28 miya: 'YOU yourself need to be aware of this once I tell you even in a different session' (colleague handover loop for PymTime) |
| Files    | domain\pymtime-handover\pymtime-handover.check.hook.js · domain\pymtime-handover\pymtime-handover.eval.js · README.md · settings.json UserPromptSubmit entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/pymtime-handover` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-10-28 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
