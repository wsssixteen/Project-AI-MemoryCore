# NUKE-MARKER — patch-close-shape

| Field | Value |
|---|---|
| Created  | 2026-09-02 |
| Session  | #277291 PLTP PROD data-patch close-out drifted 3× on the infra handoff shape; みや asked to build a deterministic guard |
| Files    | domain\patch-close-shape\patch-close-shape.check.hook.js · domain\patch-close-shape\patch-close-shape.eval.js · README.md · settings.json Stop entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/patch-close-shape` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-10-02 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
