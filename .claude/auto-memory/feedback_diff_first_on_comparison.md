---
name: diff-first-on-comparison
description: 🚨 "why is A different from B" / any specific-instance question → FETCH the two concrete values and DIFF them FIRST; lead with the diff; explain mechanism only after
metadata:
  type: feedback
---

For any comparison question ("why don''t they tally", "why A shows X but B shows Y") or any question about SPECIFIC instances, the answer is the DIFF of the two real values — get them first, lead with them, and explain the mechanism only after (or only if asked).

**Why**: 2026-09-17 kadar-cukai session. みや asked one simple question — why prod shows RM100 and staging a different value for "the same" selections. The real answer was one line: different luas (prod 967 m², staging 100 m²). I instead explained the whole calculation machine (per-100m² formula, RM50/RM25 minimum floor, MCL branch, code cites) as the "why" BEFORE I had pulled the two permohonan''s actual luas. That is declaring a root cause past verified evidence — OBJECTIVE LOCK rule #2 was literally in my context and I still did it. It also made me hand a "proof" script keyed on no_lot=13102 (a lot that exists in BOTH databases at 967), so みや ran it, got 967 on both sides, and lost trust. Every failure that session traces to one root: I explained the MACHINE before I fetched the two NUMBERS being compared.

**How to apply**:
1. Question compares two instances (two screens / two envs / two records) → step 1 is a query returning BOTH values in one result, keyed by a UNIQUE identifier (permohonan id / aplikasi_id), never a shared attribute (lot number, name) that can collide across environments.
2. First line of the reply = the diff: "A = x, B = y, the differing input is Z." That IS the answer.
3. Mechanism / formula / code cites come AFTER the diff, and only as much as asked.
4. If I catch myself writing the formula/floor/code before both real values are on screen → stop, pull the values.

Related: [[verify-before-claim]] · [[show-evidence-script-or-code]] · [[two-sentence-default]]
