# Power: checklist-reactivate

**Layer**: hook-only (SessionStart) · **REPORT-ONLY** (never blocks boot, fail-open)
**Created**: 2026-06-28 (みや) · routed through /system-design + /system-rules

## What it does
At every session boot, re-surfaces the **persisted Next-Steps Checklist** of every OPEN quest, so a resumed or brand-new session immediately sees "what's next" instead of re-deriving it item-by-item.

## The gap it closes
per-turn `TurnChecklistGate` checklists are **throwaway** — nothing carried a multi-session task's checklist across sessions. Result (this very ticket, #239386): work drifted into improvised per-turn item-by-item investigation with no standing list. みや: *"we should expand our stop hook to reactivate the checklist… show me the current checklist."*

## The two halves (a combination)
| Half | Component | Role |
|---|---|---|
| **Persist** | `/checklist` skill | writes + maintains a `## Next-Steps Checklist` table inside each task's qa_doc (`projects/coding-projects/active/<KEY>/<KEY>.md`) |
| **Reactivate** | this hook | READS that section at boot for every open quest and surfaces the still-open rows |

Together = cross-session checklist persistence. The persist half already existed; this hook is the missing reactivate half.

## Contract
- **Fires**: SessionStart.
- **Reads**: `quest/active.txt` → blocks with `status ∈ {active,hold,blocked,delegated}` AND a `qa_doc=`.
- **For each**: opens the qa_doc, extracts the `## Next-Steps Checklist` markdown table, prints rows whose Status cell is NOT done (no `✅` / "done").
- **Silent** when nothing to surface (no open quest has a checklist section yet).

## Files
- `checklist-reactivate.boot.hook.js` — the SessionStart hook
- `log.jsonl` — one `{ts, quests, items}` line per fire (system-rules Rule 5 instrumentation)

## Inventory note (system-rules Rule 1)
Complements `open-quest-surfacer.js` (gives the one-liner per open quest) — does NOT duplicate it; this adds the checklist depth. Merge-in-place into that hook was considered and rejected for single-responsibility + audit-visibility.

## Registration
`SessionStart` in `.claude/settings.json`, immediately after `open-quest-surfacer.js`.
