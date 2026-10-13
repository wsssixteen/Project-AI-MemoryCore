# NUKE-MARKER — question-self-contained

| Field | Value |
|---|---|
| Created  | 2026-10-13 |
| Session  | he was asked in a popup to choose between lines he could not see (the table was in chat above) and about a dialog in a browser tab he was not looking at; he could not answer either and said this recurs |
| Files    | domain\question-self-contained\question-self-contained.check.hook.js · domain\question-self-contained\question-self-contained.eval.js · README.md · settings.json PreToolUse entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/question-self-contained` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-11-12 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
