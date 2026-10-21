# NUKE-MARKER — prod-alter-gate

| Field | Value |
|---|---|
| Created  | 2026-10-21 |
| Session  | 2026-10-21 miya /goal: let Ruri run PROD alter tickets, each run approved by him in chat (worktree redmine-284831-audit-1038b8) |
| Files    | domain\prod-alter-gate\prod-alter-gate.check.hook.js · domain\prod-alter-gate\prod-alter-gate.eval.js · README.md · settings.json PreToolUse entry · system/registry.jsonl line · outside the repo: E:\Dev\scripts\FlowableAlter\ session.js, web.js, keeper.js, test\e2e-approval.js, alter.js edits (backup alter.js.before-approval-20261021), envs.json approval/verify keys |
| Rollback | `rm -rf domain/prod-alter-gate` · remove the settings.json entry · remove the registry.jsonl line · `git revert <birth-SHA>` |
| Retire   | 2026-11-20 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
