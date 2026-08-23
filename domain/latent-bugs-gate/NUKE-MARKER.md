# NUKE-MARKER — latent-bugs-gate

| Field | Value |
|---|---|
| Created  | 2026-08-23 |
| Session  | TODO(forge): one-line root symptom / quest ID / user ask that triggered this Feature |
| Files    | domain\latent-bugs-gate\latent-bugs-gate.check.hook.js · domain\latent-bugs-gate\latent-bugs-gate.eval.js · README.md · settings.json UserPromptSubmit entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/latent-bugs-gate` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-09-22 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
