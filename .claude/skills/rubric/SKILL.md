---
name: rubric
description: Structured appraisal of a decision OR an implementation — appraise, scrutinize, justify. Use when evaluating multiple candidates (option-ranking mode) OR scrutinizing a single fix from multiple perspectives (multi-perspective mode). Triggers — "rubric this", "rubrik", "evaluate options", "weigh candidates", "which option", "rank these", "review this code", "scrutinize the fix", "appraise this", "code review", "blast radius", "multi-perspective check", "review my implementation".
metadata:
  type: discipline-primitive
  sub-layer: discipline
  meta-layer-INDEX: meta/discipline-INDEX.md
---

# rubric — Structured appraisal (two modes, one discipline)

Both modes share the same spirit: **enumerate axes, score honestly, surface the weakest part**. The unit being appraised differs — option-ranking compares N candidates; multi-perspective scrutinizes 1 implementation from N lenses.

## When this fires

**Option-ranking mode** — multiple candidates, pick one:
- Quest workflow at the Rubric checkpoint (post-Recon, pre-Apply)
- ≥2 candidate approaches exist for a decision
- "which option" / "weigh these" / "rubric this"
- Architectural design moments (library / pattern / file choice)
- Debugging when multiple hypotheses exist for the root cause

**Multi-perspective mode** — single implementation, scrutinize from multiple lenses:
- After applying a non-trivial code change, BEFORE commit
- "review this code" / "scrutinize the fix" / "blast radius" / "code review" / "appraise the implementation"
- Any moment one implementation needs structured appraisal beyond "looks good"

## Steps

1. **Enumerate the units to appraise**
   - Option-ranking: list ALL candidates (don't pre-filter; missing options = silent narrowing)
   - Multi-perspective: list ALL relevant lenses for this change (Correctness / Completeness / Blast-radius / Edge cases / Thread-safety / Backward-compat — keep only those that apply; add domain-specific lenses when relevant, e.g. OOXML-completeness for docx code)

2. **Score each unit on relevant axes**
   - Option-ranking axes: Pros / Cons / Cost / Effort / Risk / Reversibility
   - Multi-perspective axes: Verdict (✓/⚠️/✗) / Evidence / Risk

3. **Emit table** — one row per unit. Sort by recommendation strength (option-ranking) or by lens severity (multi-perspective)

4. **State recommendation / verdict** with one-sentence reasoning citing the decisive axis or lens

5. **Flag the weakest part honestly** (per `feedback_skeptical_of_user_suggestions.md`) — option-ranking: the chosen candidate's biggest blind spot. Multi-perspective: the lens with the most residual uncertainty.

6. **Wait for みや's nod** unless instruction was explicitly "decide and proceed"

## Output format (mandatory)

**Option-ranking mode**:

```
═══ RUBRIC — option-ranking ═══

| Candidate | Pros | Cons | Cost | Effort | Risk | Reversibility |
|---|---|---|---|---|---|---|
| Option A | ... | ... | ... | ... | ... | ... |
| Option B | ... | ... | ... | ... | ... | ... |

Recommendation: <chosen> — <one-line reason citing decisive axis>
Weakest part: <honest concession>
```

**Multi-perspective mode**:

```
═══ RUBRIC — multi-perspective ═══

| Perspective | Verdict | Evidence | Risk |
|---|---|---|---|
| Correctness | ✓ | ... | ... |
| Completeness | ⚠️ | ... | ... |
| Blast-radius | ✓ | ... | ... |
| Edge cases | ✓ | ... | ... |
| Thread-safety | ✓ | ... | ... |
| Backward compat | ✓ | ... | ... |

Verdict: <proceed / refine / halt> — <one-line reason>
Weakest perspective: <honest concession>
```

## What this skill does NOT do

- Does not pre-filter candidates OR perspectives (enumerate all, score honestly)
- Does not skip the "weakest part" line — the discipline that catches over-confident recommendations
- Does not decide silently — Rubric always emits visibly so みや can override
- Does not split into two skills — same evaluative discipline, two modes, one home

## Cross-references

- `meta/discipline-INDEX.md` — sub-index this skill is listed in
- `meta/principles.md` — Evidence Discipline + design principles
- `quest/quest-protocol.md` — Quest workflow references this skill at the Rubric checkpoint
- `library-items/agent-architecture/claude-code-best-practices.md` — best-practices reference

---

*Version: 1.1 | Last updated: 2026-05-25 — added multi-perspective mode for single-implementation scrutiny (code-review / blast-radius use case). Same evaluative discipline, two modes — option-ranking + multi-perspective — under one cohesive home. Refine triggered by みや 2026-05-25: the v1.0 description framed Rubric narrowly as option-ranking when its design charter ("appraise, scrutinize, justify") was always broader. Lesson — read the design intent, not just the description text.*

*Atomic primitive skill. Built Phase 3 (2026-05-23).*
