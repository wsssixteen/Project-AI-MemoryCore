---
name: feedback_diary_check
description: How to correctly check if a diary entry exists for today — grep inside the file, not by filename
type: feedback
---

Do NOT use Glob to check for today's diary entry. The diary is a single append file (`daily-diary/Daily-Diary-001.md`), not date-named files. Glob will always return no matches and trigger a false "no diary entry" flag.

**Correct approach:** Grep inside `daily-diary/Daily-Diary-001.md` for today's date string (e.g. `Apr  7` or `2026-04-07`) to confirm an entry exists.

**Why:** Learned 2026-04-07 — Glob search returned no results for `daily-diary/*2026-04-07*`, causing a false ⚠️ flag in the session briefing even though Entry 003 for that date had already been written in the same session.

**How to apply:** At session boot, after getting today's date, grep the diary file for the date before flagging "no diary entry today."
