---
name: logger-three-layers
description: 🚨 any test miya runs gets loggers for EVERY scenario I can think of, at least 3 layers deep, before the hand-back
metadata:
  type: feedback
---

Before miya runs any test (local or server), the build carries loggers for **every scenario I can think of**, and each failure point is caught by **at least 3 layers**, so a failed test always says why (miya 2026-10-04, #244600).

The 3 layers, per failure point:
1. **Point logger**: at the exact step (the read, the compare, the delete, each skip branch).
2. **Outer logger that still fires when the point one does not**: entry and exit of the handler, the result line, a catch-all error line with stack trace.
3. **Evidence outside the log**: database rows / the error store, read by me after the test, so a missing or filtered log still leaves an answer.

How to apply:
- Emit the PROBE COVERAGE MATRIX (every writer, every skip branch, one FALLBACK row) BEFORE handing him a test scenario, not after he asks.
- For each row state all 3 layers. A row with fewer than 3 is a gap to close or to name.
- Each "if it fails" row names the next fix it would confirm.
- Key lines at ERROR when the server log level is not verified.
- No document or personal text in a shared log: mask it or print structure only.

**Why:** I handed him a local test with ONE logger (compare only) while the hook entry, three skip branches, the outcome and the page-load save were silent. He had already set exhaustive-branch logging on 2026-07-27 (QA-265537, quest SKILL.md "EXHAUSTIVE-BRANCH LOGGING"). His words: "if you're going to put loggers, put even layers and backups if the first logger doesn't trigger", then "at least 3 layers I believe", then "covering every scenarios you can think of is also a good universal rule". My interpretation of the 3 layers is the split above; he did not spell them out.

Related: [[probe-builds-local-only]] (exception only on his explicit word) · [[verify-before-claim]]
