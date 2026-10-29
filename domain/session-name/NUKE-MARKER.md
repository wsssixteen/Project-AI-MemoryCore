# NUKE-MARKER — session-name

| Field | Value |
|---|---|
| Created  | 2026-10-28 |
| Session  | 2026-09-23 miya: 'Can I make you check something ... to name that session so that I don't keep having to rename it?'; 2026-10-28 format ruled: '<date> - <title keyword/ticket number>' |
| Files    | domain/session-name/ (hook · eval · README · diagram · this file) · domain/bundles/upsm-mode.json child line + `budget_ms` · domain/bundles/stop-reply-shape.json child line · .claude/settings.json PreToolUse group `mcp__ccd_session__start_session\|mcp__ccd_session__hand_off_to_session` · .gitignore line `domain/session-name/.seen.json*` · system/registry.jsonl lines · v2 shared edits: lib/dispatch-hooks.js `budget_ms` + eval F7/F8 · lib/hook-runtime.js `meta.input` |
| Rollback | `rm -rf domain/session-name` · remove the session-name line from domain/bundles/upsm-mode.json and stop-reply-shape.json · remove the PreToolUse group from .claude/settings.json · remove the .gitignore line · remove the registry.jsonl lines · or `git revert <birth-SHA>` and `git revert <v2-SHA>` (v2 keeps `budget_ms` harmless when no manifest sets it) |
| Retire   | 2026-11-27 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
