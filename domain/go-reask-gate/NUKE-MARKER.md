# NUKE-MARKER — go-reask-gate

| Field | Value |
|---|---|
| Created  | 2026-10-30 |
| Session  | 2026-10-30 miya, angry at the repeat (287186): after his "approve A1E3-7EAD, submit it" I asked him to approve the Redmine note again |
| Files    | domain\go-reask-gate\go-reask-gate.check.hook.js · domain\go-reask-gate\go-reask-gate.eval.js · README.md · domain/bundles/stop-reply-shape.json child · system/registry.jsonl line |
| Rollback | `rm -rf domain/go-reask-gate` · remove the domain/bundles/stop-reply-shape.json child · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-11-29 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
