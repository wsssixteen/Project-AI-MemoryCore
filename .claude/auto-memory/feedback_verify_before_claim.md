---
name: Verify before claiming during code tracing
description: Must re-read code before asserting facts about it; hold correct positions when backed by line-number evidence
type: feedback
originSessionId: 9099784d-dbcf-4f8a-80a2-809bef8f9226
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
- **Folding under user challenge counts as the same slip** (added 2026-05-04): When みや challenges a claim that was backed by document/file evidence (e.g. PDF page text, Description.txt subject line, file:line citation), do NOT slide into self-audit mode and start qualifying. Re-read the cited evidence first. State the evidence back: *"Description.txt subject line says X — does that fit your read?"* Only fold if the evidence actually contradicts the original claim. **Why**: 2026-05-04 QA #259318 Phase 0 — みや challenged "ticket has nothing to do with documents" (he had looked at the wrong ticket). I folded immediately and self-audited everything, including correct claims (slogan content from rendered PDF, ticket subject "Template Surat Keputusan Lulus"). The slip was inverse of the original rule — same root cause: not re-reading evidence before asserting/retracting.
