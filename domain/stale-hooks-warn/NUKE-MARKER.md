# NUKE-MARKER — stale-hooks-warn

| Field | Value |
|---|---|
| Created  | 2026-10-30 |
| Session  | 2026-10-30 miya: 'I already asked you to fix this behaviour yesterday'; the fix existed on main since 2026-10-29 but this session ran its stale copy |
| Files    | domain\stale-hooks-warn\stale-hooks-warn.check.hook.js · domain\stale-hooks-warn\stale-hooks-warn.eval.js · README.md · domain/bundles/upsm-mode.json child · system/registry.jsonl line |
| Rollback | `rm -rf domain/stale-hooks-warn` · remove the domain/bundles/upsm-mode.json child · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-11-29 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
