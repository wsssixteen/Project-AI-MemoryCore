# NUKE-MARKER — stg1-block

| Field | Value |
|---|---|
| Created  | 2026-10-14 |
| Session  | miya 2026-10-14: 'I thought I already asked you to add a note to remember we are not using stg1' then '/goal fix your self why such a simple instruction needs so many times' |
| Files    | domain\stg1-block\stg1-block.check.hook.js · domain\stg1-block\stg1-block.eval.js · README.md · settings.json PreToolUse entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/stg1-block` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-11-13 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
