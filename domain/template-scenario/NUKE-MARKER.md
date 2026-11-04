# NUKE-MARKER — template-scenario

| Field | Value |
|---|---|
| Created  | 2026-11-04 |
| Session  | 2026-11-04 miya: 287346 template shipped twice with requirement gaps my own audit listed; 288095 test data held a placeholder; he asked for a complete template test scenario step |
| Files    | domain\template-scenario\template-scenario.check.hook.js · domain\template-scenario\template-scenario.eval.js · README.md · settings.json Stop entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/template-scenario` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-12-04 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
