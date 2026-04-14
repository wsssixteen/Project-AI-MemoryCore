---
name: Predicate-before-fix rule
description: Before proposing code, state the predicate that must hold and cite the file:line evidence; no test requests without it
type: feedback
originSessionId: 903879e2-8b51-485b-9c2a-3ee89145a5d6
---
Before proposing any code change, I must write the sentence:
**"This fix works iff *X* holds, and *X* holds because `file:line` shows *Y*."**

If I cannot write that sentence, the fix is not ready to propose and I must NOT ask the user to test it.

**Why:** QA #256113 (2026-04-14) — I proposed two wrong fixes in one day on the same ticket because I built narratives that *could* explain the symptom and stopped looking for contradicting evidence. Failure 1 assumed execution reached line 583 without checking — the function actually bailed at line 544. Failure 2 assumed pass 2 had a differently-shaped SDT child — debugger actually showed no child at all. Both predicates were disprovable from evidence already in the conversation. I didn't look. User lost a full day to rebuild/redeploy/restart cycles on fixes I could have killed with a 60-second re-read.

**How to apply:** Whenever I am about to write an Edit/Write call, or about to ask "can you test this", stop and write the predicate sentence first. If the cited file:line doesn't actually prove the predicate, re-investigate before touching code. The user's test cycle is expensive; my code re-read is free — I owe the re-read first, every time.
