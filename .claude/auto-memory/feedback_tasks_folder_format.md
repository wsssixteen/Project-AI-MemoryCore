---
name: Tasks folder file format
description: 🚨 Task folder shape v2026-09-30 — 1. Brief · 2. Fix · N. Rework\Brief only for OUR deploy cycles; no notes txt, no 1. Simulate; test data in quest MD
type: feedback
originSessionId: 2d6b5b34-1a73-4255-9713-7b3e34579056
---
Task folder (`1. Tasks\<State>\<n>. <tracker> #<num> - ...\`) shape, per みや 2026-09-30 (#280540):

```
1. Brief\        BA files · History.txt · Description.txt   (old folders keep 0. Brief — never renamed)
2. Fix\          our cycle-1 fixes / scripts / photos
3. Rework\       our cycle-2 deploy
   Brief\        BA's new files for that cycle only
   1. … 2. …     our fixes / scripts / photos, loose in the rework root
```

- **No** notes txt (`1. NNN NNN.txt`) and **no** `1. Simulate\` — test data goes to the quest MD `## Test data` via `node quest/notes.js --qa <num>`.
- **A Rework folder = a separate change WE deployed.** Never made from a Redmine status change or a colleague's rework. Created by `quest/active-cli.js` (→ `lib/task-folder.js ensureCycleFolder`) when the quest goes `status=active` and the block has more `closed*=` stamps than Rework folders.
- **Banned**: `2. Fix\` inside a Rework folder · empty Rework folders · a notes txt.
- Files in the Task folder are `.txt`, not `.md` (unchanged).

**Why:** status-driven creation made 16 empty Rework folders (#244600 had 3–7. Rework, all empty); 67 blank notes files; みや wants folders "cleaner & leaner", and the rework history only needs to track OUR separate deploys.

**How to apply:** read/write through `lib/task-folder.js` (briefDir · latestBriefDir · allBriefDirs · ensureCycleFolder); never hardcode `0. Brief`.