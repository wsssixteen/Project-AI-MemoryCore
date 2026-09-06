# NUKE-MARKER — turn-ledger

| Field | Value |
|---|---|
| Created  | 2026-09-06 |
| Session  | 2026-09-04 miya: 'you still haven't answered the monitoring part' — no ledger can say which quest/phase a block served, whether it was true or false, or what a turn cost (reply-log = rhythm only) |
| Files    | domain\turn-ledger\turn-ledger.check.hook.js · domain\turn-ledger\turn-ledger.eval.js · README.md · settings.json Stop entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/turn-ledger` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-10-06 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
