# NUKE-MARKER — disk-cleanup

| Field | Value |
|---|---|
| Created  | 2026-10-14 |
| Session  | miya, C: at 0.2 GB free: "we have a lot of things to delete in onedrive and Claude VM and Genshin clips to upload to YouTube I feel like we should create a workflow" |
| Files    | `domain/disk-cleanup/` (catalog.json · disk-cleanup.js · disk-cleanup.eval.js · README.md · log.jsonl · this file) · `.claude/skills/disk-cleanup/SKILL.md` · `system/registry.jsonl` row "disk-cleanup" · `system/slips.jsonl` upgrade row "disk-cleanup born via forge" |
| Rollback | `rm -rf domain/disk-cleanup .claude/skills/disk-cleanup` · remove the two jsonl rows · `git revert <birth-SHA>` (no settings.json entry, no scheduled task) |
| Retire   | 2026-11-13 — remove this file if log.jsonl shows ≥1 real run (`cmd` act or clip, `outcome` ok) and no rollback |
