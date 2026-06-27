---
name: feedback-stale-handoff-verify
description: Verify current-session.md / any handoff against git log + active.txt before trusting it at boot — a handoff written mid-frustration can state the OPPOSITE of ground truth
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 13ec2dfe-0eb6-4508-9fab-3334312bcd3b
---

At session boot, `current-session.md` (and any handoff) is a CLAIM, not ground truth — cross-check it against git (`git log`, branch state) + `quest/active.txt` before building a briefing on it.

**Why:** 2026-06-27 — my boot briefing said QA-267382 was still open and warned "don't re-assert resize", all lifted verbatim from a stale `current-session.md` written during an angry 06-26 session. The ticket was actually Phase-1 closed (fix `05e631671e`). I delivered a confident briefing built on a draft I never verified; only みや's correction caught it.

**How to apply:** when a handoff says a quest is open/blocked/contested, confirm against the actual signals — is there a close commit? does active.txt say `status=closed`? is the branch merged? A mid-frustration or pre-compaction handoff is exactly when the recorded state is most likely to be wrong or inverted. Pairs with [[feedback-verify-before-claim]] (same shape, applied to a handoff instead of code).
