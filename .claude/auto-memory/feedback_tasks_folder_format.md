---
name: Tasks folder file format
description: "CURRENT shape: 1. Brief, 2. Fix, N. Rework; minimal files; Redmine deliverables go here; quest vs task vs project folder words"
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

---

## Merged 2026-10-04: feedback_my_files_minimal (was feedback_my_files_minimal.md)

> みや's Task-folder files (txt/excel) stay MINIMAL data only — all context/reasoning goes in MY own quest md, not his files

When updating **みや's side of files** (anything in `1. Tasks\Melaka\...` — `.txt`, `.xlsx`, etc.): **MINIMAL DATA ONLY.** No context, reasoning, caveats, deploy-notes, "[resolved via…]" brackets, or explanatory prose.

- **Excel**: 1 tab. It may hold several SMALL tables, but each is minimal info. No bloated/wide tables. If context is needed to explain a cell, it goes ELSEWHERE — not his sheet.
- **Per-ticket `.txt`**: single role (e.g. Redmine paste-text, or the 3-line Notes file). No parallel-tracker duplication — one file per role.

**ALL context / reasoning / findings / caveats → MY OWN md** — the per-quest doc `projects/coding-projects/active/<KEY>/<KEY>.md` (or the relevant main md). That is where the analysis, the "why", the deploy-gate, the open-questions live. みや's files are clean data he can paste/read at a glance.

**Why** (2026-06-25, #239386 MPT): I jammed context into `MPT-checklist.txt` (the "[resolved 2026-06-25 via screen-ownership]" notes, a DEPLOY GATE paragraph, confirm-Aaron reasoning) → exactly the "too many checklists with convoluted & bloated info" + "too many tabs" みや flagged (the xlsx had 4 tabs). He: *"When you're updating MY side of files you need to follow a structure I've defined & stick to it"* + *"any context for you about the tickets/quests is to be saved in YOUR main md file."* The structure is flexible for now; the hard line is **his files = minimal, my md = context.**

**How to apply**: before writing to any Task-folder file, ask "is this minimal data, or context?" — context → my quest md; only clean data → his file. Pairs with [[feedback_tasks_folder_format]] (.txt default) + [[feedback_task_folder_ownership]] (folder roles) + [[feedback_inventory_first]] (one file per role, don't proliferate). A `task-folder-file-gate` hook (block 2nd-file-of-a-role + minimal-check) is proposed — route through system-design before building.

---

## Merged 2026-10-04: Folder vocabulary — Quest vs Task folder vs Project folder (was feedback_folder_vocabulary.md)

> Disambiguate Quest (protocol), Task folder (ticket's Windows folder), Project folder (ongoing project's folder in projects/)

These three terms get conflated and cause confusion. Lock the vocabulary:

| Term | Means | Lives at |
|---|---|---|
| **Quest** | The protocol/skill/workflow — phases, post-mortem, active.txt state | `.claude/skills/quest/` + `quest/` |
| **Quest state file** | Active ticket's current phase/status | `quest/active.txt` |
| **Task folder** | Physical Windows folder containing the ticket's files (QA notes, screenshots, fix.txt, fix report) | **Always** `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\<state>\<ticket-folder>\` — never anywhere else |
| **Project folder** | Physical folder for an ongoing coding project (Etanah-Codebase-Read, etc.) | `projects/coding-projects/active/<project-name>/` |

**Why:** みや was losing time re-clarifying which folder I meant when she said things like *"save to the project folder"*. Quest-the-protocol vs the physical folder containing ticket files are different concepts.

**How to apply:**
- When みや says **"task folder"** → she means the Windows ticket folder under `1. Tasks\Melaka\`
- When みや says **"project folder"** → she means an ongoing project folder in `projects/coding-projects/active/`
- **Quest** stays reserved for the protocol/skill — never use "quest folder" to mean the ticket's Windows folder
- When I'm uncertain, ask specifically: *"task folder (Windows ticket folder) or project folder (ongoing project)?"* rather than guessing
- **Task folder location is fixed** — always under `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\`. Never ask みや for the full path again — just confirm the ticket-specific subfolder name if ambiguous. Engraved 2026-04-15.
- **Phase 0 scope discipline**: reading the Brief folder is enough. The project folder (e.g. `projects/coding-projects/active/Etanah-Codebase-Read/`) already provides broader context. Don't drown Phase 0 in full Task folder reads.

---

## Merged 2026-10-04: feedback_redmine_deliverables_task_folder (was feedback_redmine_deliverables_task_folder.md)

> 🚨 Anything miya opens/uploads to Redmine (report, script, doc, evidence) goes ONLY to the Task folder 2. Fix/ or 3. Rework/; BANNED from projects/.../QA-NNN/ (one file there: QA-NNN.md); familiars get the Task-folder path as write target

Redmine-bound deliverables live ONLY in the Task folder (`1. Tasks\Melaka\<n>. <ticket>\2. Fix\`, or `3. Rework\` on a rework cycle). Never in `projects/coding-projects/active/QA-<NNN>/` — that folder holds exactly one file, `QA-<NNN>.md`, which carries the pointer + findings only. A copy I want for myself also goes in the Task folder.

**Why:** 2026-09-02, QA-277697 — the DOCX audit report a familiar produced was written to the quest folder; みや had to hunt for the file he needed to attach to Redmine. みや: *"anything that needs to be uploaded into redmine, I need to open, from now on, please BAN YOURSELF from adding it to quest folders. Even if you need a copy, you need to make a copy inside Task folder (Fix or Rework)."*

**How to apply:** before writing any file that is not `QA-<NNN>.md` or the notes file, ask "will みや open or upload this?" — yes → Task folder `2. Fix\`. When delegating to a familiar, pass the Task-folder path as the output target. Enforced by `pre-action-check-gate.js` v1.3 deny. Related: [[feedback_task_folder_ownership]] · (merged above) · [[feedback_script_file_naming]].
