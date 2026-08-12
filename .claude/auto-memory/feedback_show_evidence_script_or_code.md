---
name: feedback_show_evidence_script_or_code
description: "Justify every claim/fix by SHOWING evidence — a runnable SQL script (DB fact, miya runs it) or the actual code lines (codebase fact) — never a bare assertion"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: bb314863-3a57-4f05-a939-94f49cf121c3
  modified: 2026-08-12T02:50:16.064Z
---

When justifying a claim, a fix, or a constant/value choice, **SHOW the evidence, don't assert it**:
- **DB fact** → give the **runnable SQL script** and let みや run it himself (he verifies). Don't say "the DB has only X" — hand him `SELECT ... WHERE ...;`.
- **Codebase fact** → paste the **actual code lines with `file:line`** — the real evidence, not a paraphrase.

**Why** (2026-08-12, QA-274318): I justified a constant fix (`ORGANISASI_KOD_JPPH_MELAKA`) by asserting "the DB only has kod JPPH". みや: *"Was it something you checked in the DB? Please just show — give the script I'll search if it is DB, just show the code if it is evidence from codebase."* He wants to verify the evidence himself, not trust a conclusion. Pairs with [[feedback_verify_before_claim]] + the DB-data SHOW rule.

**How to apply**: at every fix/claim emit, the justification carries either a `SELECT` he can run or a fenced code block with the real lines. A conclusion with no runnable/greppable evidence attached is incomplete.
