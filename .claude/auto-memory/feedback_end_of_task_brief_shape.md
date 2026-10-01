---
name: feedback-end-of-task-brief-shape
description: "🚨 End of a long quest/task, or \"brief me\" → per item: one plain answer line, short-sentence bullets, then a steps-only table; nothing else"
metadata:
  node_type: memory
  type: feedback
  originSessionId: ae68e0b6-5869-4251-828e-51a0b4458694
  modified: 2026-10-01T08:42:49.098Z
---

At the end of a long quest or task, at a multi-ticket review, and whenever miya asks to be briefed, reply in this shape:

- One plain sentence answering the ask.
- One numbered section per ticket/item (`## 1. #<num> <urusan>`).
- Inside each: 3-7 bullets, one short sentence each, one fact per bullet. No sub-bullets, no file:line, no tables of evidence.
- Then one table per item: `| # | Step |` — steps only, in order, with the login/ID inline when a step is a test.
- No "Notes", no "Why", no evidence tables, no pass-note drafts unless he asked for them.

**Why:** 2026-10-01, Farah review of #264355 + #274266. The first hand-back had verdict tables, test tables, pass notes, a script and a 5-column Next-steps table. He asked for "bullet points only, short sentences... then table for each one for next steps. Steps only", then said "Perfect. Please remember to use this structure when replying at the end of long quests/tasks/when I ask you to brief me."

**How to apply:** this outranks the 4-column Next-steps table from the pre-reply contract for these moments. The detail (evidence, scripts, pass notes) goes into the qa_doc, and is shown only when he asks for it. Pairs with [[feedback-status-ask-ultra-concise]] and [[feedback-reply-separation-of-concerns]]. A deterministic build (gate + eval across quest / brief / stop-point-summary / sweep) was spawned as its own session on 2026-10-01.
