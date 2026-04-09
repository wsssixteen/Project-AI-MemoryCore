---
name: Verify before claiming during code tracing
description: Must re-read code before asserting facts about it; hold correct positions when backed by line-number evidence
type: feedback
---

Do not assert facts about code from memory or partial reasoning — re-read the relevant lines first.

**Why:** During QA #255758 tracing session (2026-04-09), three avoidable errors caused hours of wasted time:
1. Claimed a DB row was "existing" without seeing the `id` field
2. Reversed a correct suggestion (`vo.getNoRujukan()`) backed by line 15750 evidence, after a partial test that was inconclusive
3. Incorrectly described the etanah-common bug from memory instead of re-reading the code

**How to apply:**
- Before describing a bug or field access pattern, cite the exact line number. If unsure, re-read first.
- When holding a position backed by a line number, state the evidence explicitly: "Line X confirms this." Do not reverse without new code evidence.
- Treat one passing test scenario as inconclusive — say so. One scenario covering only the empty case cannot confirm correctness for all cases.
- Distinguish "I verified this at line X" from "I'm reasoning from memory" — say which one it is out loud.
