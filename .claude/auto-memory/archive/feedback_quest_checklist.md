---
name: Keiro — parse ticket into checklist before coding
description: For enhancement tickets, always build a scope checklist from QA notes before touching code
type: feedback
---

For enhancement tickets (as opposed to pure bug fixes), always parse the full QA notes into a deliverable checklist at the start of Phase 0 before any code work begins.

**Why:** QA-246512 — missed enhancement (b) (Syor Permohonan disabled on Semakan/Perakuan) because we started coding without a checklist. Only caught it at the end of the session.

**How to apply:** On ticket load, extract every sub-item (a, b, c per tugasan) from the QA text → build a table with Status column → save to QA project file → work through it in order. Mark done only when verified in code. Skip for single-root-cause bug fix tickets.
