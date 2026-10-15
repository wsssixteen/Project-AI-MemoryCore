goal: a held quest or adhoc stays live (Task folder, active.txt block, project folder) whatever archive path runs, until the hold is cleared or its ticket arrives
goal_signal: every archive mover refuses a held id and names the hold; `archive-hold.js list` shows each hold with its reason
retention: keep (the field lives on the block); log.jsonl rotate monthly
footprint: on-demand: 1 node process per call, reads quest/active.txt, about 0.1 s; nothing running otherwise
symptom: 2026-10-15 miya: "put an alert to not be archived or auto-archived ... a ticket might be created later than usual" (ADHOC-PRBB-2026-14)

# archive-hold

**Born** 2026-10-15. **Kind** Tool (picked up on purpose) + a gate inside every archive mover. **state-scoped: no** (active.txt holds every state's blocks; the hold is per id).

## What it is

One field on the quest's `quest/active.txt` block:

```
archive_hold=2026-10-15: waiting for the Redmine ticket
```

While it is there, nothing archives that quest or adhoc. Clearing it is the only release, except that `adhoc-lifecycle promote` releases it by itself when the ticket it waited for arrives.

## Commands

| Do | Command |
|---|---|
| Set a hold | `node domain/archive-hold/archive-hold.js set <ID> --reason "<why it must stay open>"` |
| Release it | `node domain/archive-hold/archive-hold.js clear <ID>` |
| Is it held? | `node domain/archive-hold/archive-hold.js check <ID>` (exit 3 = held) |
| All holds | `node domain/archive-hold/archive-hold.js list` |

## Every archive path, and what the hold does there

| Path | What it moves | With a hold |
|---|---|---|
| `quest/archive-quest.js` (adhoc closing round, close-phase Phase 2, save-quest Phase 2) | Task folder → `Archive\`, block → active-archive.txt, project folder → `archive/` | refuses, exit 3, names the hold (Step -2); dry-run reports it |
| `quest/delegate-quest.js` | Task folder → `Archive\`, block → active-archive.txt | refuses, exit 3 |
| `quest/active-cli.js archive` | block → active-archive.txt | refuses (exit 1, names the hold) |
| `quest/active-trim.js --apply` | every non-open block → active-archive.txt | keeps the held block in active.txt, prints `HELD kept` |
| `domain/adhoc-lifecycle/adhoc-lifecycle.js archive` | register row → OWNED-ELSEWHERE, qa_doc → `archive/` | refuses, exit 3 |
| `adhoc-lifecycle.js sweep` (weekly, propose-only) | lists terminal rows to archive | lists the held row under `heldRows`, not `terminalRows` |
| `adhoc-lifecycle.js promote` (ticket arrived) | register row → TICKETED, qa_doc → `archive/` | releases the hold first: the ticket came |
| `lib/save-quest.js` (decides, "save this quest", DE step 2d) | — | a Phase 2 verdict becomes `HELD` |
| `lib/adhoc-save-audit.js` (decides) | — | a held adhoc is not told to archive; FAILs if its folder sits in `Archive\` |

`quest/redmine-sync.js` only moves a folder OUT of `Archive\` (reopen), so it needs no gate.

## Files

| File | Role |
|---|---|
| `archive-hold.js` | the CLI + `holdIn()` / `heldByRegisterRow()` / `releaseByRegisterRow()` / `refusal()` used by the movers |
| `archive-hold.eval.js` | 27 fixtures in temp dirs: field round trip, archive-quest, active-cli, adhoc-lifecycle, save-quest |
| `log.jsonl` | one row per call: ts, cmd, id, outcome, dur_ms |
| `NUKE-MARKER.md` | how to remove it |
