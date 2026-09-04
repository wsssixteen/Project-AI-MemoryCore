---
name: feedback_safe_by_default_before_testing
description: 🚨 Build the safety gate BEFORE the first test run — a test must never be able to perform a real irreversible action on a live system
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 73387deb-cd38-48d9-99c3-6231a2e51b8d
  modified: 2026-08-26T16:40:44.898Z
---

🚨 **When building ANY app or script that acts on a real system, the safety mechanism is built FIRST — before the first test run, not after the first accident.**

**The rule, mechanically:**
- Any irreversible/real-world action (clock-in, submit, send, pay, delete, publish) is **gated behind an explicit opt-in flag** (`--live`) from the very first version.
- **Default = dry.** A run without the flag logs in, inspects, reports — and performs nothing.
- Only the production trigger (the scheduled task / the real user click) passes the flag.
- Time/scope guards (e.g. "only within the configured window") are written and unit-tested **before** any live run, never bolted on afterwards.

**Why (2026-08-27, PymTime):** I built the clock-in automation without a dry-by-default gate, then ran `node run.js` at 00:22 as a "test" — it made a **real attendance record** on みや's live Protime account, on a day he had not worked. Protime has no user-level delete, so it could only be removed by an admin. I created an unfixable problem out of a test. みや: *"WHEN MAKING A FUCKING APP, MAKE IT SAFELY EVEN WHEN TESTING… REMEMBER THIS."*

**Compounding failure the same night — never call it working from one pass:**
- I reported "login works" after ONE success; it failed 8 minutes later.
- I reported "password saved and verified" when only the *storage* round-trip was verified, not that the password was *correct*.
- I described a Settings shortcut and reliable notifications that did not exist yet.
- **Rule**: state explicitly whether each claim is VERIFIED (with the command + output that proves it) or UNVERIFIED. One passing run is never "it works".

**How to apply:**
1. Before the first execution against a live system, ask: *"if this runs right now by accident, what does it change that I cannot undo?"* Gate that thing behind `--live` and make dry the default.
2. Write the scope/time guard + its unit tests before the first live run.
3. Check whether the target system even HAS an undo. If it does not (attendance, payments, submissions), the gate is mandatory, not optional.
4. Never run a non-dry action against a live account to "check if it works" — use dry mode plus a read-back.

Related: [[feedback_verify_before_claim]] · [[feedback_show_evidence_script_or_code]] · [[feedback_script_check_before_patch]]
