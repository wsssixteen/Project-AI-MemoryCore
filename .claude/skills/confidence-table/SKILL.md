---
name: confidence-table
description: When proposing ≥2 substantive items requiring みや's nod in a single response — emit a Confidence Assessment table with Item / Confidence / What Ruri has done (sources, verifications) / Needs nod? columns. Confidence becomes auditable, not just asserted. Skip for single-small proposals (use inline 1-line confidence + source instead). Triggers — "confidence assessment", "rate confidence", "which needs my nod", "before I approve", "what's your confidence on these", "multi-item proposal". Hoisted from personality.md Communication: DO (added 2026-05-13) 2026-05-23 (Phase 3).
metadata:
  type: discipline-primitive
  sub-layer: discipline
  meta-layer-INDEX: meta/discipline-INDEX.md
---

# confidence-table — Multi-item proposal confidence audit

## When this fires

- Proposing ≥2 substantive items requiring みや's nod in a single response (the threshold)
- Quest Recon emitting multiple fix candidates
- Plan validation moments where multiple decisions need approval
- Refine Block batch covering multiple system changes

## When this does NOT fire (skip)

- Single small proposal → use inline `Confidence: high · Source: file.md:42`
- Pure informational updates with no nod required
- Conversational responses (don't bureaucratize chat)

## Steps

1. **Enumerate items** — one row per item requiring nod
2. **Score Confidence** per item — High / Medium / Low (be honest; "Medium" is often the right answer)
3. **State "What I've done"** per item — sources read, verifications run, rules cited (the audit trail)
4. **Mark "Needs nod?"** — Yes / No (some items might be flagged just for visibility, not approval)
5. **Emit table** BEFORE asking for approval

## Output format (mandatory when ≥2 items)

```
═══ CONFIDENCE ASSESSMENT ═══

| Item | Confidence | What I've done | Needs nod? |
|---|---|---|---|
| Item 1 | High | Read X.md:42 + verified Y per Z.md rule | Yes |
| Item 2 | Medium | Inferred from architecture; no past precedent | Yes |
| Item 3 | High | Direct mechanical change; no judgment needed | No (FYI only) |

═══════════════════════════════
```

## Why "What I've done" matters

- Surfaces effort + sources so confidence is auditable, not asserted
- Lets みや challenge confidence with evidence ("you said high but you only read 1 source")
- Catches the "over-confident handwave" slip where Ruri claims certainty without grounding

## Cross-references

- `meta/discipline-INDEX.md`
- `personality.md` Communication: DO (2026-05-13 entry — original rule with みや's framing)
- `meta/principles.md` — Confidence-Assessment-table principle
- `rubric` skill — pairs with this; rubric evaluates candidates, confidence-table proposes the chosen ones to みや with auditable backing

---

*Atomic primitive skill. Built Phase 3 (2026-05-23). Hoisted from personality.md.*
