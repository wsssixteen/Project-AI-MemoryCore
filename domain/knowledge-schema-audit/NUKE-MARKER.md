# NUKE-MARKER — knowledge-schema-audit

| Field | Value |
|---|---|
| Created  | 2026-09-04 |
| Session  | miya /goal: keep etanah-knowledge folder structure + MD naming identical across states so the Quest workflow works between states; build the memory + audit it. Same session: perak `PERAK-FACTS.md` / wp `TEST-DATA-AND-ACCESS.md` legacy names, kedah with no `index.md`, a `CON\` flowables folder that broke OneDrive sync |
| Files    | domain\knowledge-schema-audit\knowledge-schema-audit.js · knowledge-schema-audit.check.hook.js · knowledge-schema-audit.write.hook.js · knowledge-schema-audit.eval.js · README.md · settings.json SessionStart entry + PreToolUse Edit\|Write entry · system/registry.jsonl line · projects/coding-projects/active/etanah-knowledge/KNOWLEDGE-SCHEMA.json (untracked, main repo) |
| Rollback | `rm -rf domain/knowledge-schema-audit` · remove both settings.json entries · remove the registry.jsonl line · `git revert <birth-SHA>` · the schema JSON may stay (inert without the hooks) |
| Retire   | 2026-10-04 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
