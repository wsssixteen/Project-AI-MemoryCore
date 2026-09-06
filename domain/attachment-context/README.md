goal_status: draft (derived from hook-header on 2026-09-06; promote with node lib/goal-backfill.js promote attachment-context)
symptom: not recorded at birth (pre-Rule-13 feature)
goal: attachment-context.trigger.hook.js — UserPromptSubmit hook Power: domain/attachment-context/ PURPOSE (みや 2026-06-24): when a ticket is engaged, list EVERY file in its
goal_signal: a fire on: its trigger
retention: rotate monthly
# Power: attachment-context

**UserPromptSubmit hook.** When a ticket is engaged (prompt has a ticket number with an `active.txt` block), lists EVERY file in that ticket's `0. Brief/` folder and requires a 1-line content emit per file before engaging.

- **Closes:** 2026-06-24 — skipped the MPT prototype `.docx`, missed per-urusan langkah, wrote "TBD" (a false claim).
- **Contract:** see `attachment-context.trigger.hook.js` header.
- **Log:** `log.jsonl`. **Registered:** settings.json UserPromptSubmit.
- **Eval (2026-06-24):** PASS — fires on #239386, lists all 9 attachments incl. the prototype docx.
- **Known limit:** depends on `active.txt` having the ticket's `task_folder=`. If active.txt reverts (OneDrive), it can't resolve the folder.
