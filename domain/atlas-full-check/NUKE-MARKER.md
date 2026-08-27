# NUKE-MARKER — atlas-full-check

| Field | Value |
|---|---|
| Created  | 2026-08-27 |
| Session  | 2026-08-27 — multi-state Atlas shipped as "verified everything" while By-Feature was empty on Perak + states never visually driven; miya: "create a deterministic checker so you don't lie even about a single alphabet" |
| Files    | domain\atlas-full-check\atlas-full-check.check.hook.js · domain\atlas-full-check\atlas-full-check.eval.js · README.md · settings.json Stop entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/atlas-full-check` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-09-26 — remove this file if `grep atlas-full-check system/telemetry/hook-fires.jsonl` shows >=1 fire AND no rollback |
