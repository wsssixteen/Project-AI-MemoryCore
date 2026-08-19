# NUKE-MARKER — adhoc-lifecycle

| Field | Value |
|---|---|
| Created  | 2026-08-19 |
| Session  | miya /goal: build the adhoc register's ACT side (promote/archive/sweep) after the housekeeping audit found 104 dirs in active/ + no archiver (quest/archive-quest.js never built) |
| Files    | `domain/adhoc-lifecycle/adhoc-lifecycle.js` · `adhoc-lifecycle.check.hook.js` · `adhoc-lifecycle.eval.js` · `README.md` · `log.jsonl` · `.last-sweep-week` (runtime) · settings.json SessionStart entry · `system/registry.jsonl` row |
| Rollback | `rm -rf domain/adhoc-lifecycle` · remove the SessionStart command entry `…\domain\adhoc-lifecycle\adhoc-lifecycle.check.hook.js` from `.claude/settings.json` · remove the `adhoc-lifecycle` line from `system/registry.jsonl` · `git revert <SHA>` |
| Retire   | 2026-09-18 (creation + 30 days) — remove this file if the Feature has fired ≥1× (check `log.jsonl`) AND no rollback |

## Notes

- Pure additive build; touches no existing hook. The `adhoc-register` DETECT hook is unchanged — this is its ACT complement.
- Data safety: never deletes; all moves are `active\ ↔ archive\` and reversible via `unarchive`.
