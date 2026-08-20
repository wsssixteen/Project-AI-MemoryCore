---
name: feedback_reply_separation_of_concerns
description: "Reply structure fundamental — 1. SEPARATION OF CONCERNS (numbered separate topics) 2. TABLES carry content, bullets only for extra context 3. existing rules where no clash"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1a7da135-85bf-4ba2-be65-9ff1283730e7
  modified: 2026-08-19T06:48:18.350Z
---

Reply-structure fundamentals (miya 2026-08-19, QA-274914 session — his verbatim ranking):
1. **SEPARATION OF CONCERNS** — break the reply into numbered separate topics (1, 2, 3, 4…), one concern per section, matching the user's asks.
2. **USE TABLES** — tables carry the content; bullet points ONLY for extra context around them.
3. The rest of the existing reply rules apply where they do not clash.

**Why:** he named this the fundamental he needs beside the audited shape rules, after the numbered-section replies in this session landed well.
**How to apply:** every multi-topic reply opens with numbered sections mirroring his asks (the TurnChecklistGate numbering is a good anchor); inside each section a table first, bullets only as trailing context. Canonical spec home is `.claude/reply-shape-spec.md` — fold in at the next claude-md-watch pipeline pass.
