---
name: rubric
description: Structured fix-candidate or decision evaluation — enumerate options, score pros/cons/cost/effort, rank, decide. Use when evaluating multiple fix candidates, choosing between architectural options, or weighing design decisions. Triggers — "rubric this", "rubrik", "evaluate options", "pros and cons", "weigh candidates", "which option should we pick", "rank these approaches", "at the rubric checkpoint", "rubric for the fix". Hoisted from quest-protocol.md Rubric checkpoint 2026-05-23 (Phase 3 of meta-layer build) as an atomic primitive callable from any workflow, not just Quest.
metadata:
  type: discipline-primitive
  sub-layer: discipline
  meta-layer-INDEX: meta/discipline-INDEX.md
---

# rubric — Structured option evaluation

## When this fires

- Quest workflow at the Rubric checkpoint (post-Recon, pre-Apply)
- Any time ≥2 candidate approaches exist for a decision
- When みや asks "which option" / "weigh these" / "rubric this"
- Architectural design moments (which library, which pattern, which file)
- Debugging when multiple hypotheses exist for the root cause

## Steps

1. **List candidates** — enumerate ALL options (don't pre-filter; missing options = silent narrowing)
2. **Score each** on relevant axes — typically Pros / Cons / Cost / Effort / Risk / Reversibility
3. **Emit table** — one row per candidate, one column per axis. Sort by recommendation strength
4. **State recommendation** with one-sentence reasoning citing the strongest decisive axis
5. **Flag the weakest part of the recommendation** honestly (per `feedback_skeptical_of_user_suggestions.md`)
6. **Wait for みや's nod** unless instruction was explicitly "decide and proceed"

## Output format (mandatory)

```
═══ RUBRIC ═══

| Candidate | Pros | Cons | Cost | Effort | Risk | Reversibility |
|---|---|---|---|---|---|---|
| Option A | ... | ... | ... | ... | ... | ... |
| Option B | ... | ... | ... | ... | ... | ... |

Recommendation: <chosen candidate> — <one-line reason citing decisive axis>
Weakest part of this recommendation: <honest concession>
```

## What this skill does NOT do

- Does not pre-filter candidates (enumerate all, score honestly)
- Does not skip the "weakest part" line — that's the discipline that catches over-confident recommendations
- Does not decide silently — Rubric always emits visibly so みや can override

## Cross-references

- `meta/discipline-INDEX.md` — sub-index this skill is listed in
- `meta/principles.md` — Evidence Discipline + design principles
- `quest/quest-protocol.md` — Quest workflow references this skill at the Rubric checkpoint
- `library-items/agent-architecture/claude-code-best-practices.md` — best-practices reference

---

*Atomic primitive skill. Built Phase 3 (2026-05-23). Refine by adding/removing axes as evidence shows what matters most.*
