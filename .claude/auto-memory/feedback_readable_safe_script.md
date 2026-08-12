---
name: feedback_readable_safe_script
description: Critical/PROD DB scripts must LOOK safe to a reviewer (pinned named values + before-SELECT), not just BE logically safe — safe-by-construction that reads as safe at a glance
metadata:
  type: feedback
---

🚨 When preparing a critical/PROD DB script (DELETE/UPDATE on data) for みや or any reviewer, the script must be **reviewer-obvious safe** — anyone reading it top-to-bottom instantly sees it can only touch the intended rows, WITHOUT tracing subquery logic or trusting that I verified the data first.

**Why:** みや 2026-08-10 (#273461 delete audit) — *"we need to create a script that LOOKS safe and wont alert others, just like we write code that is easy to read even though it works the same way."* A `LIKE 'A%'` or a buried `NOT IN (SELECT ...)` is logically safe but **alarms** a reviewer; safe-by-construction that reads as safe beats safe-by-prior-check. (Also: I'd wrongly dropped the orphan-check net when "pinning" — the deeper lesson is the query must prove its own safety AND read as safe.)

**How to apply:**
- Target by **pinned named values** — `WHERE no_permit_lesen IN ('A01/2026/2','A01/2026/3','A01/2026/5')` — NOT a broad pattern (`LIKE 'A%'`).
- Lead with a **BEFORE SELECT** that shows exactly the rows to be touched (reviewer eyeballs them before any mutation) — the same BEFORE/PATCH/AFTER clarity his own `patch-273956.sql` had.
- Keep guards simple + readable (`trkh_mula IS NULL`); don't bury safety in an opaque defensive subquery when a pinned list + before-SELECT achieves it.
- Enforced 3×: this memory · `patch-script-gate` CHECK 3 (deterministic hook) · quest-skill patch-rule. Related: [[feedback_never_hand_miya_a_query]] · [[feedback_simplify_and_reference]] · [[feedback_no_join_in_scripts]].
