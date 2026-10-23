# NUKE-MARKER — kpi

| Field | Value |
|---|---|
| Created  | 2026-10-23 |
| Session  | miya 2026-10-23: a Feature that records KPI / appraisal moments while quests run, with a quest-workflow step that invokes its skill (Appraisal-2026 evidence had to be mined after the fact) |
| Files    | `domain/kpi/` (README · NUKE-MARKER · kpi.js · kpi.eval.js · rules.json · log.jsonl) · `.claude/skills/kpi/SKILL.md` · `main/kpi-moments.jsonl` · `main/kpi-tracker.md` (now generated) · `.gitattributes` union line · rows/notes in `.claude/skills/quest/SKILL.md`, `.claude/skills/close-phase/SKILL.md`, `.claude/skills/verify/SKILL.md`, `quest/quest-protocol.md` (v3.9), `system/INDEX.md`, `system/FOLDER-STRUCTURE.md`, `system/tools.json` · `system/registry.jsonl` line "kpi" |
| Rollback | `git revert <birth-SHA>` restores every file above, including the hand-written `main/kpi-tracker.md`; or `rm -rf domain/kpi .claude/skills/kpi main/kpi-moments.jsonl` + `git checkout 8e5ef28a -- main/kpi-tracker.md` + remove the rows named above + the registry line |
| Retire   | 2026-11-22 — remove this file if `log.jsonl` shows ≥1 real `add` and no rollback |
