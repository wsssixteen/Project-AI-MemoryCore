# NUKE-MARKER — save-quest

| Field | Value |
|---|---|
| Created  | 2026-10-04 |
| Session  | miya 2026-10-04: "when I say save this quest, you will automatically decide based on redmine status to simply close (phase 1) or if the status is Closed in Redmine ... run Phase 2". Two quests had been archived before Redmine closed them (#281638 on 2026-09-28, #282198 on 2026-10-04). |
| Files    | `lib/save-quest.js` · `lib/save-quest.eval.js` · `domain/save-quest/` (README.md, eval.js, NUKE-MARKER.md; log.jsonl lives in the main checkout) · in `.claude/skills/close-phase/SKILL.md`: description triggers, Step 0 item 3, the "Save-quest mode" section, the Redmine check that opens Phase 2, two memory pointers, the 2026-10-04 history note · one sentence in `.claude/skills/quest/SKILL.md` "Vocabulary — save everything" · one row in `.claude/save-commands.md` · one paragraph in `.claude/auto-memory/feedback_quest_closure_both_folders.md` + its `MEMORY.md` line · `fetchIssue` and `OWNER_ID` added to the exports of `quest/redmine-status-check.js` · `system/registry.jsonl` rows "save-quest" (birth commit `a78885ea`) and the two refine-opened rows |
| Rollback | `git revert` the build commit, then delete `lib/save-quest.js` (born in `a78885ea`) and its registry.jsonl line. No settings.json entry, no hook. The export added to `quest/redmine-status-check.js` is harmless to leave. |
| Retire   | 2026-11-03 — remove this file if `domain/save-quest/log.jsonl` shows at least one real "save this quest" run in the window and the feature was not rolled back |
