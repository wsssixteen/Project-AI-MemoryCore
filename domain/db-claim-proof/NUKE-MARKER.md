# NUKE-MARKER — db-claim-proof

| Field | Value |
|---|---|
| Created  | 2026-09-24 |
| Session  | 2026-09-24 #281392: miya - you failed again on your global rule, you claimed but did not provide script |
| Files    | domain\db-claim-proof\db-claim-proof.check.hook.js · domain\db-claim-proof\db-claim-proof.eval.js · README.md · settings.json Stop entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/db-claim-proof` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-10-24 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
