# NUKE-MARKER — archive-hold

| Field | Value |
|---|---|
| Created  | 2026-10-15 |
| Session  | miya asked to keep ADHOC-PRBB-2026-14 from being archived or auto-archived, because its Redmine ticket may be created later than usual, and to make the hold mechanical |
| Files    | `domain/archive-hold/` (archive-hold.js, archive-hold.eval.js, README.md, NUKE-MARKER.md, log.jsonl) · gate lines marked `Archive hold (2026-10-15)` / `ARCHIVE HOLD` in `quest/archive-quest.js`, `quest/delegate-quest.js`, `quest/active-cli.js`, `quest/active-trim.js`, `domain/adhoc-lifecycle/adhoc-lifecycle.js`, `lib/save-quest.js`, `lib/adhoc-save-audit.js` · eval copy lines in `quest/archive-quest.eval.js`, `quest/delegate-quest.eval.js` · fixtures E30/E31 in `lib/adhoc-save-audit.eval.js` · step 1c in `.claude/skills/adhoc-save/SKILL.md` · the Phase 2 line in `.claude/skills/close-phase/SKILL.md` · row `archive-hold` in `system/tools.json` |
| Rollback | release every hold (`node domain/archive-hold/archive-hold.js list`, then `clear <ID>`) · `git revert <SHA of the commit that added this folder>` · `Remove-Item -Recurse domain/archive-hold` · re-run the evals of the seven gated files |
| Retire   | 2026-11-14 — remove this file if the hold has refused ≥1 archive in log.jsonl and no rollback happened |
