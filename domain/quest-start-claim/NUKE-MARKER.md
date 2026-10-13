# NUKE-MARKER — quest-start-claim

| Field | Value |
|---|---|
| Created  | 2026-10-07 |
| Session  | miya 2026-10-07: "add a background run during start quest ... straight away update the Redmine ticket's Status as In progress IF the status is New. This is to avoid people stealing our tickets due to mistake." Replay: #282723 and #282721 stayed New overnight on 2026-10-02 and a colleague took both. |
| Files    | `lib/quest-start-claim.js` (forge-born) · `domain/quest-start-claim/` (README.md, eval.js, NUKE-MARKER.md; log.jsonl lives in the main checkout) · in `quest/active-cli.js`: `shouldClaim()`, `claimOnStart()`, one call in `cmdStart`, one in `cmdUpdate`, `shouldClaim` in the exports · `REDMINE_HOST` and `REDMINE_KEY` added to the exports of `quest/redmine-status-check.js` · in `domain/redmine-write-gate/`: `CLAIM_SCRIPT`, `WORKTREE_SEG`, `isStandingClaim()`, the `standing` branch, fixtures F74 to F87, README v1.5 · `.claude/skills/quest/SKILL.md` step 6b · the "One standing exception" paragraph in `.claude/auto-memory/feedback_redmine_write_needs_nod.md` + the `redmine-write-nod` line in `.claude/auto-memory/MEMORY.md` · `system/registry.jsonl` row "quest-start-claim" |
| Rollback | Fastest stop, no code change: nothing to unregister (no hook). Remove the two `claimOnStart(...)` calls in `quest/active-cli.js`, or `git revert` the build commit. Then delete `lib/quest-start-claim.js` and its registry.jsonl line. The gate exemption and the two exports are harmless to leave. One ticket only: `node quest/active-cli.js update <QA> redmine_claim=off`. |
| Retire   | 2026-11-06 — remove this file if `domain/quest-start-claim/log.jsonl` shows at least one real `set` in the window and the feature was not rolled back |
