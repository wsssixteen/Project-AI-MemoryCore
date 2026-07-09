---
name: feedback-bundling-before-defer
description: "When Rubric flags any BA-ask as \"defer to separate ticket\" / \"BA-Q\" / \"not this ticket\" — that IS a BUNDLING QUESTION for みや, not a Ruri decision; emit explicitly + await approval before Apply"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 5317d034-97e1-427e-b253-0825565078b0
---

At Rubric emit, if row (g) BA-Expected Alignment produces ANY of:
- `⚠ partial — gap: <quote>`
- `🚨 scope-drift`
- a candidate fix noted as `separate ticket` / `BA-Q` / `not this ticket` / `follow-up`

→ that is NOT a Ruri decision. Emit a BUNDLING QUESTION line explicitly:

```
⚠️ BUNDLING: <BA-ask verbatim>?
  (a) bundle-with-fix now
  (b) separate ticket / defer
  [awaiting みや yes/no — Apply BLOCKED]
```

Then STOP and wait. No progression to Apply until みや answers.

**Why**: 2026-07-09 QA-269437 — I deferred the auto-recompute-tempoh BA-ask ("Should we update when the user chooses End Date, it should also auto calculate the Tempoh/Duration?") as "BA-Q for separate ticket" during Rubric row (g), then shipped Bug 1 + Bug 2 without it. みや had to test → catch the missing item → tell me to bundle → I applied it → he re-tested. Cost: an entire extra test cycle for a scope decision that was mine to surface, not mine to decide.

**How to apply**:
- Rubric row (g) BA-Expected Alignment ALWAYS lists every BA-ask, verbatim, from the LATEST cycle History.txt entries + Description
- Any row where the fix does NOT cover the ask → force a BUNDLING QUESTION emit
- Session BLOCKS at Apply gate until みや answers each bundling question with a yes/no
- CRITERIA COVERAGE table must fire at Rubric emit AND at close-out (not just close-out) — so gaps surface early

**Related**: [[feedback_reassess_before_save]] · [[feedback_investigation_style]] · CLAUDE.md §10 Rubric row (g)
