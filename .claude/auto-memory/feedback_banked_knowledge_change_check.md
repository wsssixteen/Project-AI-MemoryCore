---
name: feedback-banked-knowledge-change-check
description: "For mechanisms already banked in etanah-knowledge (FLOWABLE-KNOWLEDGE.md etc.), be 100% confident and re-read the source ONLY after a cheap change-check proves the code moved — never cold re-derive"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a33c1df2-526f-458d-b2b8-b00a7858ef17
  modified: 2026-08-11T02:29:36.096Z
---

When a mechanism is already banked in etanah-knowledge (e.g. `FLOWABLE-KNOWLEDGE.md` — the InitiateBPMFlowableForm / flowable-alter page mechanics, built during #274510), TRUST it at 100%. Do NOT cold re-read the source to re-derive what is already banked.

**Why:** cold re-reading banked mechanics wastes みや's time and reads as low confidence in my own knowledge base; the banked doc IS the answer. A fresh trace can also stop halfway and report a partial rule.

**How to apply:**
1. Answer from the banked knowledge directly, cited (`FLOWABLE-KNOWLEDGE.md §N`).
2. If freshness is in doubt, run a CHEAP change-check first — `git log -1 --format=%cd -- <file>` (or diff since the banking date/commit), not a full re-read.
3. Re-read the source ONLY if the change-check shows the file moved since banking; then update the banked doc.

Genuinely-new investigation (values/data not in the banked doc — e.g. a live engine query for this app's variables) is still legitimate; this rule is about not re-deriving the *already-banked mechanism*. Hook candidate (deferred): PreToolUse reminder when Reading an etanah source file covered by a knowledge doc. Related: [[feedback-ticket-type-vocab-tracking]] · [[feedback_simplify_and_reference]] · KNOWLEDGE-FIRST (CLAUDE.md §8).
