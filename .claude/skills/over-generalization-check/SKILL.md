---
name: over-generalization-check
description: Don't apply a prior-ticket lesson without verifying the current ticket has the same shape. Pressure-test "this is like the last one" patterns BEFORE acting on them. Use any time Ruri's first instinct is "we saw this before, so X applies here." Triggers — "didn't we see this before", "is this same as last", "you're over-applying", "different ticket, check fresh", "over-generalization", "same as QA-X", "this pattern is like". Built Phase 4 (2026-05-23) atomic Honesty primitive.
metadata:
  type: honesty-primitive
  sub-layer: honesty
  meta-layer-INDEX: meta/honesty-INDEX.md
---

# over-generalization-check — Verify shape match before reapplying lessons

## When this fires

- Ruri's first instinct: "we saw this in QA-X, applying the same fix"
- Pattern-matching across tickets where surface similarity might mask different root causes
- Any "this is like the last one" framing before acting

## Steps

1. **Detect the pattern** — Ruri is about to apply a prior-ticket lesson
2. **State the prior ticket + lesson** — "QA-X taught us Y"
3. **State the current ticket's evidence** — what we KNOW from current investigation (not what we assume)
4. **Pressure-test the match** — for each load-bearing dimension of the prior lesson, does the current ticket exhibit the same? List explicitly
5. **Only apply** if pressure-test confirms ≥3 shape dimensions match
6. **If 2 or fewer match** — treat as different shape; investigate fresh

## Output format (mandatory before applying prior lesson)

```
═══ OVER-GENERALIZATION CHECK ═══

PRIOR LESSON: QA-<X> taught: <Y>
CURRENT EVIDENCE: <what we know from current investigation>
SHAPE MATCH CHECK:
  - <Dimension 1>: prior=<X>, current=<Y>, match?
  - <Dimension 2>: prior=<X>, current=<Y>, match?
  - <Dimension 3>: prior=<X>, current=<Y>, match?
APPLY?: ✓ ≥3 match | ⚠️ <2 match — investigate fresh

═══════════════════════════════
```

## Why explicit dimension-matching

- Surface similarity (same urusan, same component) doesn't mean same root cause
- Without explicit dimension-matching, Ruri reapplies stale fixes that don't actually solve the current issue
- The check forces enumeration of what we ACTUALLY know vs what we're projecting

## Source slips

- QA-262370 → QA-262004 deferral reflex (2× Word UI avoidance after Java-first failed on different ticket shape)
- `skill-failure-log.md` 2026-05-21 — "tool-choice-skip-due-to-prev-ticket" entry, 2 occurrences

## Cross-references

- `meta/honesty-INDEX.md`
- `meta/principles.md` — Over-generalization-from-single-ticket-lesson principle (Honesty Invariant)
- `feedback_simplify_and_reference.md` rule 5a — "QA-262370 caution" framing banned

---

*Atomic Honesty primitive. Built Phase 4 (2026-05-23).*
