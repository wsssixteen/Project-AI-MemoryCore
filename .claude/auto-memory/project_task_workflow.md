---
name: Quest Workflow
description: Miya's 4-phase work ritual for formal Etanah/Redmine tasks — Accept/Execute/Report/Post-Mortem. Renamed from Keiro 2026-04-02.
type: project
---

Keiro (径) — the 3-phase work ritual for formal job tasks.

**Phases:**
1. **Execute** — follow DEBUGGING-PLAYBOOK.md, track findings silently, solve the ticket
2. **Report** — on "create the report": ask output path + screenshot paths → run `node quest/generate_fix_report.js`
3. **Post-Mortem** — on "wrap up" / "post-mortem": learnings, DEBUGGING-PLAYBOOK.md pattern updates, quick save

**Triggers:**
- `QA #<number>` or "I have a task/ticket/bug to debug" → Phase 1
- "Create the report" → Phase 2
- "Wrap up" / "Post-mortem" / "What did we learn" → Phase 3

**Why:** Maps daily task execution to the 3-phase career vision (Personal Excellence → Team Contribution → Company Impact). Knowledge is a side-effect (phase 3), not the main output.

**How to apply:** Activate automatically on work triggers. Protocol file: `quest/workflow-protocol.md`. Report generator: `quest/generate_fix_report.js` (Node.js). Report path is asked every time — never assume. Screenshots are provided by Miya as file paths or null for placeholders.
