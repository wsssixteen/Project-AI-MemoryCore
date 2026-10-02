# NUKE-MARKER — protime-plan

| Field | Value |
|---|---|
| Created  | 2026-09-30 |
| Session  | miya asked to fill ProTime weekly planning from open tickets and schedule it every Monday; rule 4 a day, else 3 a day, else empty |
| Files    | `domain/protime-plan/` (protime-plan.js · protime-plan.eval.js · run-hidden.vbs · task.xml · README.md · log.jsonl · this file) · Windows task `\MemoryCore\ProTime Weekly Plan` · `.claude/skills/pymtime/SKILL.md` §Weekly plan · `system/registry.jsonl` row "protime-plan" |
| Rollback | `schtasks /Delete /TN "\MemoryCore\ProTime Weekly Plan" /F` · `rm -rf domain/protime-plan` · remove §Weekly plan + the plan triggers from `.claude/skills/pymtime/SKILL.md` · `git revert <SHA>` |
| Retire   | 2026-10-30 — remove this file if log.jsonl shows ≥1 scheduled `mode=live result=ok` row and no rollback |
