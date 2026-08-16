# NUKE-MARKER — sweep

| Field | Value |
|---|---|
| Created  | 2026-08-16 |
| Session  | miya all-caps goal "JUST BUILD THE FUCKING SWEEP" — design existed since 2026-07-27 (18-familiar/5-ticket night), only the build was missing |
| Files    | .claude/skills/sweep/SKILL.md · domain/sweep/{eval.js, log.jsonl, NUKE-MARKER.md} · forge registry.jsonl row "sweep" · ORCH_SUPPRESS blocks in lib/hook-runtime.js + lib/dispatch-hooks.js (shared prerequisite — shipped separately 7c6cc28) |
| Rollback | rm -rf domain/sweep .claude/skills/sweep · remove "sweep" row from core registry.jsonl · git revert <this commit>; orchestration-mode blocks stay (independently evaled 4/4) |
| Retire   | 2026-09-15 — remove this file if ≥1 sweep run in log.jsonl AND no rollback |
