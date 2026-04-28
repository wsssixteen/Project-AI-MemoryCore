---
name: feedback_diary_check
description: How to correctly check if a diary entry exists for today — grep across all active diary files, not by filename glob
type: feedback
originSessionId: 649d6a5d-8f52-4cfa-afc3-e6c44aa44b1f
---
Do NOT use Glob to check for today's diary entry by date in the filename. The diary is stored in numbered files (`Daily-Diary-001.md`, `Daily-Diary-002.md`, etc.) that are NOT named by date. Glob on date strings in filenames will always return no matches.

**Correct approach (interim):** Grep inside ALL top-level `daily-diary/Daily-Diary-*.md` files for today's date string. Only flag ⚠️ if NONE of them contain the date. Currently active files: `Daily-Diary-001.md` (979 lines, narrative format) and `Daily-Diary-002.md` (58 lines, structured format, started 2026-04-23).

**Proper fix (queued in todo.md Q2):** At boot, `Glob daily-diary/Daily-Diary-*.md` (top-level only, not inside `archived/`) → grep ALL matched files for today's date → only flag if none match. Also investigate whether `daily-diary/current/*.md` (last entry: 2026-04-20.md) is still being written or is a retired format.

**Why (original, 2026-04-07):** Glob on date-named files always returned no results, causing false ⚠️ flags.

**Why (updated, 2026-04-27):** Hardcoded to `Daily-Diary-001.md` — diary overflowed into `Daily-Diary-002.md` (~2026-04-23). Boot check became blind to 002 entries, causing false flags even when entries exist.

**How to apply:** At session boot, grep across all `Daily-Diary-*.md` files in `daily-diary/` root before flagging "no diary entry today."
