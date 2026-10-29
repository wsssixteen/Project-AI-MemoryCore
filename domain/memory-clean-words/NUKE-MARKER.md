# NUKE-MARKER — memory-clean-words

| Field | Value |
|---|---|
| Created  | 2026-10-27 |
| Session  | miya 2026-10-28: sanitize all memory of swearing; remember it as him being angry or frustrated wanting Ruri to be better; gate it |
| Files    | domain\memory-clean-words\memory-clean-words.check.hook.js · domain\memory-clean-words\memory-clean-words.eval.js · README.md · settings.json PreToolUse entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/memory-clean-words` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-11-26 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
