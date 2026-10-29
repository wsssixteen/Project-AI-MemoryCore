---
name: system-change
description: The one route for EVERY change to MemoryCore itself (any of the seven kinds on system/INDEX.md). ALWAYS invoke before changing a rule, a workflow step, a memory rule, a skill, a hook, a Feature, a Tool or Kernel code. Triggers — "/system-change", "update CLAUDE.md", "update anything in CLAUDE.md", "change something in a workflow", "refine something about our memory system", "create a new function", "build a new hook / skill / feature", "go" on an audit finding, "check the audit logs and slip logs and act on it", a correction that becomes a rule. Ends the same turn with commit, push, land on main and both SHAs shown.
---

# /system-change — runs the change route

The steps are NOT here. They live in `system/INDEX.md` §The change route, owned by Rules (ruling 13). This skill only runs them in order.

1. Read `system/INDEX.md` §The change route now, the whole section.
2. Put its 8 steps on the turn's task list, in order. The trigger picks the lane for step 4 (lane table in that section).
3. Run them in order. Step 7 (land on main) is never skipped and never left for Domain Expansion.
4. A route paused across turns writes `system-change step N` into `main/current-session.md`; resume from there.

**Banned**: copying the steps into this file or into a lane · ending a system change without the GitHub main SHA and the main-folder SHA in the reply.

symptom: 2026-10-28 miya: every change takes its own path and none ends with commit + push + land on main; a core change is a security update
goal: every system change, whatever started it, ends on GitHub main and in the main folder in the same turn, recorded where INDEX says
goal_signal: the reply after a system change shows the GitHub main SHA and the main-folder SHA, and the change record rows exist
retention: keep
footprint: on-demand: no process; loaded when a system change starts
