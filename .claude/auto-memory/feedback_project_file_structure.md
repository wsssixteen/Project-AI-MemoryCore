---
name: feedback_project_file_structure
description: Task folder = user-facing files; projects folder = Ruri's reference only
type: feedback
---

**Two separate spaces with different owners:**

**Task folder** (`1. Tasks\Melaka\N. <ticket>\`) — anything リドワンさん will open or use:
- Fix reports, investigation notes, SQL scripts, summary docs, screenshots
- Generated via generate_fix_report.js or written manually

**Projects folder** (`projects/coding-projects/active/QA-XXXXXX\`) — Ruri's reference only:
- Project tracking MD (status, progress log, pending items)
- Things I load to resume context — not for the user to read

Each project gets its own subfolder (never flat):
- ✅ `projects/coding-projects/active/QA-246512/QA-246512-....md`
- ❌ `projects/coding-projects/active/QA-246512-....md`

**Why:** User explicitly set this boundary — projects folder is my memory, Task folder is their workspace.

**How to apply:** Ask "will リドワンさん open this?" — yes → Task folder. No → projects folder.
