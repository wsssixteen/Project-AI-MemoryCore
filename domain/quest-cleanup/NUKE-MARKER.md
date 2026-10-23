# NUKE-MARKER — quest-cleanup

| Field | Value |
|---|---|
| Created  | 2026-10-22 |
| Session  | miya #285768: quest save had no step to clean the quest's temp files, scratch drafts and work worktree |
| Files    | `lib/quest-cleanup.js` · `domain/quest-cleanup/` (README, eval.js, log.jsonl, this file) · one step 1b in `.claude/skills/close-phase/SKILL.md` · one sentence in `.claude/skills/domain-expansion/SKILL.md` step 2c · registry.jsonl row "quest-cleanup" |
| Rollback | `git rm -r lib/quest-cleanup.js domain/quest-cleanup` · delete step 1b in close-phase SKILL.md and the "Then clean up each of those quests" sentence in domain-expansion SKILL.md step 2c · remove the registry.jsonl line for "quest-cleanup" · or `git revert <SHA>` |
| Retire   | 2026-11-21 — remove this file if the Feature has fired at least once and was not rolled back |
