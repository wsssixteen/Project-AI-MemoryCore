# Power: checklist-reactivate

**Layer**: CLI invoked at **`/quest resume`** (NOT SessionStart — boot stays lean) · report-only · fail-open
**Created**: 2026-06-28 (みや) · routed through /system-design + /system-rules
**Trigger note**: first shipped as a SessionStart hook; moved to `/quest resume` same day (みや) — open-quest-surfacer already gives boot awareness, so dumping every checklist's rows at every boot was bloat. The checklist DETAIL is only needed when you re-engage a ticket. See /system-design Rule 8 (trigger-timing).

## What it does
Surfaces the **persisted Next-Steps Checklist** of a quest at the moment you resume it, so a continued session immediately sees "what's next" instead of re-deriving it item-by-item.

## The two halves (a combination)
| Half | Component | Role |
|---|---|---|
| **Persist** | `/checklist` skill | writes + maintains a `## Next-Steps Checklist` table inside each task's qa_doc (`projects/coding-projects/active/<KEY>/<KEY>.md`) |
| **Reactivate** | this CLI | READS that section + prints the still-open rows when invoked at `/quest resume` |

## Contract
- **Invoked**: by the `/quest` skill's resume step → `node domain/checklist-reactivate/checklist-show.js <QA>` (optional QA arg; no arg = all open quests).
- **Reads**: `quest/active.txt` → blocks with `status ∈ {active,hold,blocked,delegated}` AND a `qa_doc=`; opens the qa_doc, extracts the `## Next-Steps Checklist` table, prints rows whose Status is NOT done (no `✅`/"done").
- **Graceful**: prints "No persisted Next-Steps Checklist" when the quest has none.

## Files
- `checklist-show.js` — the quest-resume CLI
- `log.jsonl` — one `{ts, via, filter, quests, items}` line per run (system-rules Rule 5)

## Inventory note (system-rules Rule 1)
Complements `open-quest-surfacer.js` (boot one-liner per open quest) — does NOT duplicate it; this adds the checklist depth, on demand at resume.
