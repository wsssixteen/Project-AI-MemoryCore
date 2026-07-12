---
name: Quest Workflow
description: Miya's 3-phase work ritual for formal Etanah/Redmine tasks — Accept/Execute/Reflect. Renamed from Keiro 2026-04-02. Phase 2 (Report) removed 2026-04-29 — `.docx` generation discontinued in favour of overview/architectural reports (DB ERD, etc.).
type: project
originSessionId: 9a250643-8b07-48d4-8408-3e2fb4b02911
---
Quest — the 3-phase work ritual for formal job tasks.

**Phases:**
0. **Accept** — read Task folder, build scope checklist, confirm before coding
1. **Execute** — solve the ticket; mandatory Fix Walkthrough after each code edit batch
2. **Reflect** — on "wrap up" / "post-mortem": write SUMMARY.txt, learnings, knowledgebase updates, KPI tagging, close quest

**Triggers:**
- `QA #<number>` or "I have a task/ticket/bug to debug" → Phase 0
- "Wrap up" / "Post-mortem" / "What did we learn" → Phase 2

**Why:** Maps daily task execution to the 3-phase career vision (Personal Excellence → Team Contribution → Company Impact). Knowledge is a side-effect of Reflect (Phase 2), not the main output.

**How to apply:** Activate automatically on work triggers. Protocol file: `quest/quest-protocol.md`. Per-ticket `.docx` reports were retired 2026-04-29 — overview/architectural reports (DB ERD, MODULE-ARCHITECTURE.md, BUG-BESTIARY.md patterns) replace them.
