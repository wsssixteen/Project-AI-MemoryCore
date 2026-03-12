# Plan File - Sample Format
*Reference template for project plan execution files*

## Standard Plan File

```markdown
# Project Plan - [Project Name]
Created: [YYYY-MM-DD]
Source: [plan filename or "manual"]

## Instructions
- Auto-commit code after each completed todo item (chains with Auto-Commit)
- Update this file every 5 completed items (checkpoint save)
- Do not commit this plan file — it is Ruri's working reference

## Architecture
[Optional: diagrams, wireframes, ASCII art, mermaid diagrams from the original plan]
[Preserve all visual elements from the source plan — they help with context recovery]

## Implementation Plan

### Phase 1: [Phase Name]
- [ ] Task 1 description
- [ ] Task 2 description
- [ ] Task 3 description

### Phase 2: [Phase Name]
- [ ] Task 4 description
- [ ] Task 5 description
- [ ] Task 6 description

## Progress Log

[Date] - [Summary of items completed this session]
[Date] - [Summary of items completed this session]
```

---

## Checkbox Convention

| Symbol | Meaning |
|--------|---------|
| `- [ ]` | Pending — not yet started |
| `- [x]` | Completed — done and committed |
| `- [~]` | Blocked — flagged, skip for now |

## Line Limit Rule
- Maximum **1000 lines** per plan file
- When exceeded during append: archive old file as `project-plan-YYYYMMDD.md`, start fresh

## Resume Convention
After any context reset:
1. Count `[x]` items — know what is done
2. Find first `[ ]` item — know where to resume
3. Read Architecture section — restore technical context
4. Check Progress Log — understand recent session activity

---

*Plan Format Template v1.0 — Ruri's Work Plan System*
