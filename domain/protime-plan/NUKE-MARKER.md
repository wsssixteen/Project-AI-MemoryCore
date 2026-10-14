# NUKE-MARKER — protime-plan

| Field | Value |
|---|---|
| Created  | 2026-09-30 |
| Session  | miya asked to fill ProTime weekly planning from open tickets and schedule it every Monday; rule 4 a day, else 3 a day, else empty |
| Files    | `domain/protime-plan/` (protime-plan.js · protime-plan.eval.js · eval.js · redmine-read.js · sessions.js · naming-cases.json · run-hidden.vbs · task.xml · README.md · log.jsonl · this file) · `.claude/skills/protime-plan/` (2026-10-14) · Windows task `\MemoryCore\ProTime Weekly Plan` · `.claude/skills/pymtime/SKILL.md` §Weekly plan pointer · `system/registry.jsonl` rows "protime-plan" |
| Rollback | `schtasks /Delete /TN "\MemoryCore\ProTime Weekly Plan" /F` · `rm -rf domain/protime-plan .claude/skills/protime-plan` · remove the §Weekly plan pointer from `.claude/skills/pymtime/SKILL.md` · `git revert <SHA>` |
| Retire   | 2026-10-30 — remove this file if log.jsonl shows ≥1 scheduled `mode=live result=ok` row and no rollback |
