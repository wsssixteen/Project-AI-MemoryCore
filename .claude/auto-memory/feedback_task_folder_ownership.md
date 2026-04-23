---
name: feedback_task_folder_ownership
description: Task folder is みや's space — correct structure is 0. Brief/ subfolder + blank 1. Notes.txt; investigation findings go in project subfolder
type: feedback
originSessionId: 9afbfbca-c3a9-42e3-abbb-0d40be992410
---
Task folder is みや's space. Ruri's investigation content does NOT go there.

**Why:** みや explicitly said: "Task folder is my space Ruri." Notes.txt is his space for his own notes — don't pre-fill it. Investigation findings (detailed, Ruri's context) belong in the per-ticket project subfolder.

**Correct Task folder structure (from quest-protocol.md Phase 0):**
- `0. Brief/` — subfolder, empty at creation; みや populates with screenshots + ticket info
- `1. Notes.txt` — blank at creation; みや fills this himself
- `Fix.txt` — Ruri writes this at Phase 3 close (compact: chain + root cause + fix + verification)
- `SUMMARY.txt` — Ruri writes this at Phase 3 close (mandatory close-out template)

**How to apply:**
- At Phase 0: create `0. Brief/` subfolder + `1. Notes.txt` (blank). Do not put ANY Ruri content in the Task folder until Phase 3.
- Investigation findings (class chains, DB evidence, scope checklist) → `projects/coding-projects/active/QA-<number>/`
- Never name the Notes file `0. Notes.txt` — it is always `1. Notes.txt` per protocol.
