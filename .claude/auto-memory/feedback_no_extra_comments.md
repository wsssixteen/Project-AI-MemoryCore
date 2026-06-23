---
name: No extra code comments without confirmation
description: Don't add commented-out original code or "preserved for X" notes; one explanatory comment max, only when WHY is non-obvious
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
