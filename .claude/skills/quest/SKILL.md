---
name: quest
description: Quest workflow management — accept, hold, or resume a QA ticket quest
argument-hint: "start <QA-number> <task-folder-path> | hold | resume"
allowed-tools: Read, Glob, Write, Bash
---

# Quest — Work Ticket Execution System

ARGUMENTS: $ARGUMENTS

## /quest start <QA-number> <task-folder-path>

Phase 0 — Accept the Quest:

1. Read every file in the provided task folder path (Glob + Read all)
2. Parse: ticket description, bug/enhancement details, scope items, screenshots notes
3. Build scope checklist table:

| Item | Description | Status |
|---|---|---|
| 1a | [from ticket] | ⬜ |

4. Save checklist to project file at `projects/coding-projects/active/<QA-number>/`
5. Write quest state to `quest/active.txt`:
   ```
   qa=<number>
   task_folder=<path>
   phase=1
   local_test_confirmed=false
   ```
6. Present checklist to みや — wait for confirmation before touching any code

Only proceed to Phase 1 after explicit confirmation.

---

## /quest hold

1. Read `quest/active.txt` to get current quest
2. Update state: `status=hold`
3. Summarise where we left off in one paragraph
4. Confirm: "Quest <QA-number> is on hold. Run `/quest resume` to return to it."

---

## /quest resume

1. Read `quest/active.txt`
2. If status=hold: restore context, read project file, show checklist state
3. Confirm: "Resuming Quest <QA-number>. Last state: [summary]."

---

## Pre-commit confirmation (Phase 1 → commit)

Before any `git commit` on a quest:
1. Confirm all checklist items are `[x]`
2. Ask みや: "Have you tested locally?" — if yes, update `local_test_confirmed=true` in `quest/active.txt`
3. Only then proceed to commit

---

*Protocol reference: `quest/quest-protocol.md`*
