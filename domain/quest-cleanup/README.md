# quest-cleanup

Removes one quest's temp leftovers at quest save. Engine: `lib/quest-cleanup.js`. Eval: `node domain/quest-cleanup/eval.js`.

symptom: 2026-10-22 miya #285768: "check if you've added into quest save that you will always clean all the temp files, a general cleanup of the session related to the quest"
goal: every quest save leaves no temp file, scratch copy or work worktree of that quest behind unless it is listed as kept on purpose
goal_signal: quest-save replies carry a QUEST-CLEANUP line with removed and kept counts
goal_signal_regex: QUEST-CLEANUP: QA-\d+ · (applied|listed only) · removed \d+ · kept \d+
retention: rotate monthly
footprint: on-demand: one node process under 1 second per quest, ~40 MB; nothing at boot, per prompt or per session
state-scoped: no for TEMP, scratchpad and Task folder (paths come from the quest block); the work root `E:\Dev\etanah-work` is one shared clone root for every state

## When it runs

| Moment | Call |
|---|---|
| "save this quest" (close-phase Save-quest mode, step 1b) | `node lib/quest-cleanup.js <QA> --apply` |
| Domain Expansion step 2c, per quest touched | same |
| miya says yes to removing a work worktree | `node lib/quest-cleanup.js <QA> --apply --drop-worktree` |

## What it touches

| Kind | Where | Action |
|---|---|---|
| temp | `%TEMP%\*<num>*` (the number stands alone in the name) | removed |
| scratch | `%TEMP%\claude\*\*\scratchpad\*<num>*` | removed |
| junk | Task folder `~$*` · `*.bak*` · `*.tmp` | removed |
| worktree | `E:\Dev\etanah-work\wt-*<num>*` + its local branch | kept, unless `--drop-worktree` |
| anything touched in the last 30 min | any of the above | kept (may belong to a live session) |

Never touched: Task folder deliverables, the quest doc, active.txt, Redmine, miya's repos under `E:\Projects`.

Log: `domain/quest-cleanup/log.jsonl`, one row per run (ts, qa, apply, removed, kept, listed, failed).
