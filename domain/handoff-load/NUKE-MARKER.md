# NUKE-MARKER — handoff-load

| Field | Value |
|---|---|
| Created  | 2026-10-02 |
| Session  | 2026-10-02 miya #244600: 'Have you loaded how to prepare this handover to other modules?' (repeat of #256334 2026-09-28 handoff-wrong-format) |
| Files    | domain\handoff-load\handoff-load.check.hook.js · domain\handoff-load\handoff-load.eval.js · README.md · settings.json UserPromptSubmit entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/handoff-load` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-11-01 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
