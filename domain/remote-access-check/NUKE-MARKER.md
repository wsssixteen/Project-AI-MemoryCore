# NUKE-MARKER — remote-access-check

| Field | Value |
|---|---|
| Created  | 2026-11-01 |
| Session  | 2026-11-01 miya after the RustDesk outage: 'Why can't you make this simple check every time you boot up? I had to go to office yesterday to resolve this' |
| Files    | domain\remote-access-check\remote-access-check.check.hook.js · domain\remote-access-check\remote-access-check.eval.js · domain\remote-access-check\remote-access-check.js · diagram.html · diagram.png · README.md · settings.json SessionStart entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/remote-access-check` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-12-01 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
