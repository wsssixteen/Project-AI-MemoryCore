---
name: no-names-in-comments
description: "Code comments NEVER reference a person (みや / Aaron / Vincent / anyone) or a session-specific date / server-log timestamp. Comments explain WHAT the code does + WHY (the technical condition), nothing else."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c1704434-7e73-4ad1-a4b5-cc9739ef4037
---

Code comments must describe ONLY what the code does and why it's necessary technically. Banned content:

| Banned | Examples | Replace with |
|---|---|---|
| Person names | `(みや 2026-06-30)`, `Aaron's guard at :445`, `Vincent's fix in ...` | "the existing guard at :445" / "the prior fix in ..." / omit |
| Session-specific dates | `2026-06-29`, `2026-06-30` | omit — the git blame/history carries the date |
| Server-log timestamps | `(server.log 2026-06-29 11:54:35)`, `(server.log 17:17:20)` | omit — the comment exists to explain the code, not log when it was witnessed |
| QA-ref attribution prefixes | (the `#239386` ticket ref alone is OK — it's the WHY tag, not a person) | keep ticket refs, drop person/date attribution |

**Why** (みや 2026-06-30 instruction): the comment lives in the codebase forever — a name or date or timestamp becomes noise the moment the person changes role or the session ends. The technical reason a guard exists is timeless; "Aaron found this on Monday" is not.

**How to apply**:
- Before committing any comment, grep the diff for `みや|Aaron|Vincent|Miya|\\d{4}-\\d{2}-\\d{2}|server\\.log.*\\d`. Strip every match. Keep the technical content around it.
- Ticket refs (`#239386`) are KEPT — they're the WHY-tag for code archaeology, not a person.
- File:line cross-refs (`BasePelupusanForm.java:134`) are KEPT — they're technical pointers.
- Plain English what/why is KEPT — that's the point of the comment.

**Banned at commit time too**: the `prepare-commit-trigger` Step 2.6 strips dev-time comments before commit, but person-name/date refs in NEW comments must be stripped BEFORE staging, not relied on at commit time (a comment that survives Step 2.6 still has the name in it).

**Cross-ref**: [[feedback_no_extra_comments]] (no commented-out code), [[feedback_comment_style]] (name variables + plain English + literal address cross-refs).
