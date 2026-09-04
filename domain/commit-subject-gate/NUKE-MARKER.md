# NUKE-MARKER — commit-subject-gate

| Field | Value |
|---|---|
| Created  | 2026-09-02 |
| Session  | QA-277697 2026-09-02: five ever-longer commit-subject drafts with ';', dashes and a non-change word; miya /goal 'make it deterministic or a hard rule' |
| Files    | domain\commit-subject-gate\commit-subject-gate.check.hook.js · domain\commit-subject-gate\commit-subject-gate.eval.js · README.md · settings.json Stop entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/commit-subject-gate` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-10-02 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
