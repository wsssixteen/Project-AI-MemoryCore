---
name: layered-teaching-format
description: "5-layer teaching format for \"explain the system/ticket to me\" prompts — business story → framework translation → data flow → risk/evidence table → open-the-code checklist. みや confirmed 2026-06-11 (QA-264293 walkthrough) and flagged I keep skipping it."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4e2dfe46-0b1b-4fe7-9a77-3f26cd1a3fec
---

When みや asks to **understand a system / ticket / mechanism as a learning exercise** (triggers: "explain to someone who knows Java but not JSF/Spring", "from overview until specific", "understand the business & code logic", "teach me", "walk me through the system"), use the 5-layer format validated on QA-264293 (2026-06-11):

| Layer | Content | Register |
|---|---|---|
| 0. Business story | drawn story diagram, no code, what the office/user actually does | plain |
| 1. Framework translation | table mapping each framework (JSF/Spring/Hibernate/Flowable/Gson/Jasper) to "if you only know Java, think of it as…" + what it is IN THIS ticket | plain → technical bridge |
| 2. Data flow | vertical arrow chain UI → form bean → service → entity/table → read-back, with `file:line` on each hop | technical, bird's-eye |
| 3. Risk / findings | table: plain risk per row + the `file:line` that proves it | one register per cell |
| 4. Open-the-code checklist | table: one file per abstraction stage + what to look for + a runnable SQL row | granular |

**Why:** みや 2026-06-11: *"This is a fairly good explanation style… As always, I want it to be used but you keep skipping/ignoring it."* The format existed implicitly in CLAUDE.md §2 (1a/1b layering) but was never named, so it didn't trigger.

**How to apply:** each layer obeys register-separation ([[feedback_investigation_style]]); every layer is skimmable standalone; close with a Next-operational-step line. Don't force all 5 layers when the ask is narrow — but a full "understand the system" ask gets all 5.

**Layer 3b — SIDE-BY-SIDE COMPARISON (added 2026-06-11 after みや correction, same QA-264293 session):** when comparing ≥2 options / fixes / approaches, NEVER tell them as separate sequential stories — put them in ONE frame: two-column drawn diagram (option A spine | option B spine, same beats aligned row-by-row) or a single table where each row is one dimension and the columns are the options. For code fixes: side-by-side before/after code per edited file. みや 2026-06-11: *"You didn't do side by side comparison when telling the story."* Sequential stories force the reader to hold option A in memory while reading option B — the comparison is the reader's job instead of mine.
