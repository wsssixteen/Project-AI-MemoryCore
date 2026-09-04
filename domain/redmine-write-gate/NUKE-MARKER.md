# NUKE-MARKER — redmine-write-gate

| Field | Value |
|---|---|
| Created  | 2026-09-04 |
| Session  | #275847 — note posted to Redmine without miya's review ("Start with Salam Amar" read as approval); miya: "Create a stophook now for me to review your comments first next time" |
| Files    | domain\redmine-write-gate\redmine-write-gate.check.hook.js · redmine-write-gate.eval.js · README.md · NUKE-MARKER.md · log.jsonl · settings.json PreToolUse (Bash\|PowerShell) entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/redmine-write-gate` · remove the settings.json PreToolUse entry `node "${CLAUDE_PROJECT_DIR}\\domain\\redmine-write-gate\\redmine-write-gate.check.hook.js"` · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-10-04 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
