---
name: feedback_my_files_minimal
description: "みや's Task-folder files (txt/excel) stay MINIMAL data only — all context/reasoning goes in MY own quest md, not his files"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c1704434-7e73-4ad1-a4b5-cc9739ef4037
---

When updating **みや's side of files** (anything in `1. Tasks\Melaka\...` — `.txt`, `.xlsx`, etc.): **MINIMAL DATA ONLY.** No context, reasoning, caveats, deploy-notes, "[resolved via…]" brackets, or explanatory prose.

- **Excel**: 1 tab. It may hold several SMALL tables, but each is minimal info. No bloated/wide tables. If context is needed to explain a cell, it goes ELSEWHERE — not his sheet.
- **Per-ticket `.txt`**: single role (e.g. Redmine paste-text, or the 3-line Notes file). No parallel-tracker duplication — one file per role.

**ALL context / reasoning / findings / caveats → MY OWN md** — the per-quest doc `projects/coding-projects/active/<KEY>/<KEY>.md` (or the relevant main md). That is where the analysis, the "why", the deploy-gate, the open-questions live. みや's files are clean data he can paste/read at a glance.

**Why** (2026-06-25, #239386 MPT): I jammed context into `MPT-checklist.txt` (the "[resolved 2026-06-25 via screen-ownership]" notes, a DEPLOY GATE paragraph, confirm-Aaron reasoning) → exactly the "too many checklists with convoluted & bloated info" + "too many tabs" みや flagged (the xlsx had 4 tabs). He: *"When you're updating MY side of files you need to follow a structure I've defined & stick to it"* + *"any context for you about the tickets/quests is to be saved in YOUR main md file."* The structure is flexible for now; the hard line is **his files = minimal, my md = context.**

**How to apply**: before writing to any Task-folder file, ask "is this minimal data, or context?" — context → my quest md; only clean data → his file. Pairs with [[feedback_tasks_folder_format]] (.txt default) + [[feedback_task_folder_ownership]] (folder roles) + [[feedback_inventory_first]] (one file per role, don't proliferate). A `task-folder-file-gate` hook (block 2nd-file-of-a-role + minimal-check) is proposed — route through system-design before building.
