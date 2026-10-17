# NUKE-MARKER — spawn-task-folder-guard

| Field | Value |
|---|---|
| Created  | 2026-10-17 |
| Session  | 2026-10-17 miya after the DawahMap folder test landed in a worktree copy: "Are you f stupid? You ran it and it failed" and "please fix this mistake so that you won't repeat it"; the spawn_task reply had said fresh worktree |
| Files    | domain\spawn-task-folder-guard\spawn-task-folder-guard.check.hook.js · domain\spawn-task-folder-guard\spawn-task-folder-guard.eval.js · README.md · settings.json PreToolUse entry · system/registry.jsonl line |
| Rollback | `rm -rf domain/spawn-task-folder-guard` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-11-16 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
