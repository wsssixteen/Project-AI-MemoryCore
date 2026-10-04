---
name: No extra code comments without confirmation
description: "one explanatory line max, no commented-out code; no person names, dates or log stamps"
type: feedback
originSessionId: 9099784d-dbcf-4f8a-80a2-809bef8f9226
---
When making code edits, default to writing NO comments. The codebase auto-loaded rule from `.claude/CLAUDE.md` already says: *"Default to writing no comments. Only add one when the WHY is non-obvious."*

**Specifically forbidden without explicit confirmation:**
- Commented-out original code as "preservation" — git history already preserves it
- Side-notes like "// Original framework default below preserved for state projects that need <variant>"
- Speculative cross-state guidance comments

**One comment is fine** — and only if the WHY (e.g. *"BA convention treats N-year tempoh as INCLUSIVE"*) is non-obvious from the code itself.

**Why:** 2026-05-04 QA #259318 — added a 4-line comment block to `PelupusanWordCCMethodConstant.populateSewaTahunanRM` and `PelupusanMaklumatPermitLesenHelper.updateBayaran`, including commented-out original return statements. みや asked: *"please assess first if the code is obvious or not and confirm with me. I don't think we need to add any extra comments aside from the first one."* He cleaned up the surplus himself.

**How to apply:** Before adding any comment beyond a single one-line explanation, ask: *"Want a comment here, or is the code self-evident?"* If unsure, ask. Default to NO comment over excess. The first comment line stays only when WHY is non-obvious.

**Concision rule (added 2026-05-04)**: When みや confirms a comment is wanted, keep it to **issue + how it happens / what's missing**. Skip workaround steps and fix candidates — those belong in tickets, not code. People can understand the rest from the code itself. Two lines max ideally. Any "Workaround:" or "Fix candidate:" line in a code comment is overload — strip it.

**🆕 Dev-time vs commit-time (added 2026-06-22 per みや — reconciles the above; the rules apply to DIFFERENT phases, no contradiction)**: the "no comments" rule governs **COMMITTED** code. **DURING development** (active quest, before commit): put a **short explanatory comment on EVERY code addition/deletion** so みや can review at a glance what each change does. These dev-time comments are **STRIPPED before commit** by `prepare-commit-trigger.js` Step 2.6 (v1.5). Net flow: *comment-liberally-while-building → strip-all-at-commit → zero comments pushed*. Front-end reminder fires on every etanah code edit during a quest via `convention-check-gate.js` v1.4. Exception: みや says "keep this comment" → it survives the strip (per Step 2.6's existing exception).

---

## Merged 2026-10-04: no-names-in-comments (was feedback_no_names_in_comments.md)

> Code comments NEVER reference a person (みや / Aaron / Vincent / anyone) or a session-specific date / server-log timestamp. Comments explain WHAT the code does + WHY (the technical condition), nothing else.

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
