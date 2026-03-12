---
name: work-plan
description: "MUST use when user says 'copy plan', 'append plan', 'resume plan',
             'load plan', 'start the plan', 'continue the plan', 'execute plan',
             'run the plan', 'pick up where we left off', or when the AI exits
             plan mode and needs to transfer the plan into execution format. This
             skill manages the full lifecycle of project plans — from plan output
             to tracked checkbox execution with per-todo commits."
---

# Work — Plan Execution Skill
*Plan lifecycle management with tracked execution and context recovery*

## Activation

Three commands, each with its own activation message:

| Command | Activation Message |
|---------|-------------------|
| **Copy Plan** | `Copying plan to execution format...` |
| **Append Plan** | `Appending to existing plan...` |
| **Resume Plan** | `Resuming plan execution...` |

## Context Guard

| Context | Status |
|---------|--------|
| **User says "copy plan", "start the plan"** | ACTIVE — copy and begin execution |
| **User says "append plan"** | ACTIVE — append to existing plan |
| **User says "resume plan", "continue the plan"** | ACTIVE — resume from checkpoint |
| **AI exits plan mode with approved plan** | READY — suggest "copy plan" to user |
| **After context reset in a project with plan file** | READY — suggest "resume plan" |
| **No project context** | DORMANT — no plan action |
| **Personal/casual conversation** | DORMANT — no plan action |

## Configuration

- **Plan location**: `Project Resources/project-plan.md`
- **Plan source path**: `C:\Users\vice4\.claude\plans\`
- **Line limit**: 1000 lines (auto-rotates on exceed)
- **Commit chain**: Yes — Auto-Commit installed, fires after each completed todo

## Command Dispatch

| Command | What It Does |
|---------|-------------|
| `"copy plan"` | Copy latest plan to `Project Resources/project-plan.md` (fresh start) |
| `"append plan"` | Append latest plan to existing `project-plan.md` (add sections) |
| `"resume plan"` | Resume execution after context reset (pick up from next `[ ]`) |

---

## Copy Plan

### Step 1: Find Latest Plan
- [ ] Scan `C:\Users\vice4\.claude\plans\` for plan files
- [ ] Sort by modification date, pick most recently modified
- [ ] If no plan files found: ask Miya to specify a plan file path or enter plan mode first

### Step 2: Transform to Project Plan Format
- [ ] Convert plan steps/items into `- [ ]` checkbox todo items
- [ ] Preserve all architecture diagrams (ASCII, mermaid) from the original plan
- [ ] Add standard instructions header (see `Project Resources/plan-format.md`)
- [ ] Maintain logical phase/section grouping from the original plan
- [ ] No emoji in the plan file — clean, parseable markdown only

### Step 3: Write Project Plan
- [ ] Check if `Project Resources/` folder exists — create if needed
- [ ] Write to `Project Resources/project-plan.md` (overwrite if exists)
- [ ] Report: "Plan copied — [X] todo items ready for execution"

### Step 4: Begin Execution
- [ ] Execute the **Shared Execution Loop** (see below)

---

## Append Plan

### Step 1: Find Latest Plan
- [ ] Same as Copy Plan Step 1

### Step 2: Transform to Project Plan Format
- [ ] Same as Copy Plan Step 2

### Step 3: Check Existing Plan + Line Limit
- [ ] Read current `Project Resources/project-plan.md`
- [ ] Count total lines in the existing file
- [ ] If appending would NOT exceed 1000 lines:
  - Append new content with a date separator
  - Report: "Plan extended — [X] new items added, [Y] total items"
- [ ] If appending WOULD exceed 1000 lines:
  - Rename current file to `project-plan-YYYYMMDD.md` (archived)
  - Create fresh `project-plan.md` with the new content only
  - Report: "Previous plan archived, new plan created"

### Step 4: Begin Execution
- [ ] Execute the **Shared Execution Loop** (see below)

---

## Resume Plan

### Step 1: Read Current Project Plan
- [ ] Read `Project Resources/project-plan.md`
- [ ] If file not found: report "No plan found — use 'copy plan' to create one"

### Step 2: Parse Progress
- [ ] Count `[x]` items (completed)
- [ ] Count `[ ]` items (pending)
- [ ] Count `[~]` items (blocked)
- [ ] Identify the next pending `[ ]` item as the resumption point
- [ ] Read the Architecture section to restore technical context

### Step 3: Report Status
- [ ] Display progress summary:
  ```
  Plan Status: [X] completed, [Y] pending, [Z] blocked
  Current Phase: [phase name]
  Next Task: [description of next pending item]
  ```

### Step 4: Resume Execution
- [ ] Execute the **Shared Execution Loop** from the next pending item

---

## Shared Execution Loop

```
For each [ ] todo item in order:
  1. Execute the task (write code, create files, make changes)
  2. Auto-Commit fires → structured commit for this completed item
  3. Mark the item as [x] in the plan file
  4. Every 5 completed items → save/update the plan file (checkpoint)
  5. Move to the next [ ] item
  6. If item is [~] (blocked) → skip and continue to next
```

### Key Behaviors
- **Per-task commits** — each completed todo gets its own commit (not batched)
- **Checkpoint saves** — plan file updated every 5 items
- **Skip blocked items** — `[~]` items are flagged and skipped
- **Miya can pause** — if Miya says "stop" or "pause", halt at current item

---

## Mandatory Rules

1. **Commit chain per-todo** — every completed todo triggers Auto-Commit. Not batched — every single one.
2. **Never commit plan files** — `project-plan*.md` stays local as working reference only.
3. **Preserve diagrams** — all visual elements from the original plan must carry over.
4. **No emoji in plan files** — clean, parseable markdown only.
5. **Line limit enforcement** — rotate at 1000 lines during append.
6. **Recovery-first design** — the plan file IS the recovery mechanism after any reset.
7. **Skip blocked items** — mark `[~]`, flag to Miya, continue to next.
8. **Checkpoint discipline** — update plan file every 5 completed items.

## Edge Cases

| Situation | Behavior |
|-----------|----------|
| **Plan file not found** | "No plan found — use 'copy plan' to create one" |
| **All items completed** | "Plan complete! All [X] items done." |
| **Blocked task** | Mark `[~]`, flag to Miya with reason, continue |
| **Miya says "stop"** | Halt, save plan file, report progress |
| **Plan exceeds line limit** | Archive old file, start fresh |
| **No plan source files found** | Ask Miya to enter plan mode first |
| **Context reset mid-execution** | Miya says "resume plan" to continue |

## Level History

- **Lv.1** — Base: Three commands (copy/append/resume) + shared execution loop + per-todo commit chain + 1000-line rotation + recovery mechanism + checkpoint saves. (Origin: ruri-skills v1.0, 2026-03-11)
