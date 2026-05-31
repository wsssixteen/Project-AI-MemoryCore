---
name: Tasks folder file format
description: Task folder structure, file format, and rework folder convention for 1. Tasks\Melaka\
type: feedback
originSessionId: 2d6b5b34-1a73-4255-9713-7b3e34579056
---
Always create `.txt` files inside the Tasks folder (`1. Tasks\Melaka\...`), not `.md`.

**Why:** Tasks folders are simple working folders — plain text is the default. Only use a different format if みや explicitly requests it.

**How to apply:** Any time Phase 0 creates files in the Task folder (Brief, notes, references), use `.txt` extension unless told otherwise.

**Folder structure (added 2026-04-23):** Create all standard folders and files at quest start, even if empty:
```
0. Brief\
1. Simulate\
2. Fix\
3. Rework\
1. <NNN NNN>.txt   ← blank, for みや to fill (legacy folders: `1. Notes.txt`; renamed 2026-05-31)
```

**Rework folder rule:** `3. Rework\` is only created when a quest is re-opened. All investigation and fix files produced during the rework go inside `3. Rework\` — not in `2. Fix\`.

**Why:** Consistent structure from the start means nothing is missing when needed. Rework folder separation keeps the original fix artifacts clean and distinguishable from rework artifacts.
