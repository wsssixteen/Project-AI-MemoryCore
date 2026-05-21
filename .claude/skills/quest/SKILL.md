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
2. Update state: `status=hold`; append `held_reason=<date+time> — <context + みや's stated intent>`
3. **Write a "Resume Point" block into `QA-NNNN.md`** — section `## 0. Resume Point` at the top of the doc. Must cover: current phase, what IS done, what is NOT done, open decisions, first-step-on-resume, and any みや-stated intent (e.g. "wants a fresh re-read from start"). The chat summary evaporates; `QA-NNNN.md` is the durable home the next-session briefing reads.
4. Summarise where we left off in one paragraph
5. Confirm: "Quest <QA-number> is on hold. Run `/quest resume` to return to it."

---

## /quest resume

1. Read `quest/active.txt`
2. If status=hold: restore context — read `QA-NNNN.md` (the `## 0. Resume Point` block FIRST), read project file, show checklist state
3. Confirm: "Resuming Quest <QA-number>. Last state: [summary]."

---

## Stop-Point Action Summary (mandatory after /quest start)

At **every** point Ruri stops and hands back to みや after `/quest start` — Recon emit, fix-shape package, a blocker, awaiting-a-nod, end of a work chunk, or a hold — the response MUST end with a compact action block:

```
▶ YOUR MOVE — QA-NNNN
  Do now:
   1. <concrete action みや can take immediately — test X / fetch Y / open screen Z>
   2. ...
  Ruri is waiting on you for:
   - <decision / nod / info Ruri needs to continue>
```

Rules:
- **Do now** = actions みや can act on without any further input from Ruri. Each is concrete (a command, a screen, a ticket to open) — never "review the analysis".
- **Waiting on you for** = the specific decisions/info that unblock Ruri's next step.
- If a row implies Ruri should do something first (run a query, spawn an agent), Ruri does it BEFORE handing back — the block lists only what genuinely needs みや.
- Complements the per-finding "Next operational step" line (amendment A9): A9 fires inline per finding; this block consolidates everything pending into one place at the hand-back, so みや never reverse-engineers his next move from prose.

## Pre-commit confirmation (Phase 1 → commit)

Before any `git commit` on a quest:
1. Confirm all checklist items are `[x]`
2. Ask みや: "Have you tested locally?" — if yes, update `local_test_confirmed=true` in `quest/active.txt`
3. Only then proceed to commit

---

*Protocol reference: `quest/quest-protocol.md`*
