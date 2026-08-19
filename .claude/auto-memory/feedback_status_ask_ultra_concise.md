---
name: feedback_status_ask_ultra_concise
description: "When miya asks 'anything else left to do' / 'what's left' / 'are we done' → VERY CONCISE, bullet points ONLY (no tables, no prose, no DO-THIS block unless a real action remains)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 1a7da135-85bf-4ba2-be65-9ff1283730e7
  modified: 2026-08-19T13:37:39.912Z
---

Trigger: miya asks a status/wrap question — "anything else left to do", "what's left", "are we done", "anything else", "what remains".

Response shape (miya 2026-08-19, QA-274914):
- VERY CONCISE — bullet points ONLY.
- No tables, no story diagram, no prose paragraphs.
- One item per bullet; only genuinely-remaining work.
- If nothing remains → say so in one line.

**Why:** at a task's tail he wants a fast residual-checklist, not a full report. Related: [[feedback_two_sentence_default]] · [[feedback_reply_separation_of_concerns]].
