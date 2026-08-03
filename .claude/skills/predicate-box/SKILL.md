---
name: predicate-box
description: Before any code Edit while debugging — emit a TRUE IF / PROVED BY / FAILED WHEN box stating exactly what the fix assumes + the proof. Use when in debug mode, before proposing or applying any fix to code. Triggers — "predicate box", "what's the predicate", "what must be true for this fix to work", "state your assumption", "before any edit prove", "debug mode predicate", "debugging gate", "pre-edit gate". Hoisted from Debug Mode Ritual 1 (quest-protocol.md) 2026-05-23 (Phase 3) as an atomic primitive — applicable beyond debug, to any high-confidence claim about code behavior.
metadata:
  type: discipline-primitive
  sub-layer: discipline
  system-layer-INDEX: system/discipline-INDEX.md
---

# predicate-box — Pre-Edit assumption + proof emission

## When this fires

- Debug Mode active: before ANY fix-proposing Edit while debugging
- Any "this fix should work because X" claim about code behavior
- Pre-Apply checkpoint in Quest workflow
- When みや asks "what makes you think this works"
- Any time a code change is about to ship that depends on an unverified assumption

## Steps

1. **State the predicate** — the single claim the fix relies on, in one sentence. Format: "TRUE IF: <condition>"
2. **Cite the proof source** — exact file:line OR test output OR DB query result that establishes the predicate
3. **State the failure mode** — what specifically breaks IF the predicate is false. Format: "FAILED WHEN: <symptom>"
4. **Emit the box** (mandatory format below) BEFORE the Edit
5. **Only THEN propose the edit** — the box is the gate; emit first, edit second

## Output format (mandatory)

```
═══ PREDICATE BOX ═══

TRUE IF:    <one-sentence claim the fix depends on>
PROVED BY:  <file:line citation OR test result OR query result>
FAILED WHEN: <what symptom emerges if predicate is false>

═══════════════════
```

## What this skill does NOT do

- Does NOT replace `system-design` skill (which evaluates architecture-level decisions)
- Does NOT skip evidence — "I think" or "probably" or "should work" without file:line citation = predicate not yet proved → BANNED
- Does NOT consolidate multiple predicates into one box — if the fix has 2 independent assumptions, emit 2 boxes

## Failure modes this catches

- "Phantom predicate" — claim made without ANY proof source cited
- "Stale predicate" — proof source cited but from old code/state, not current
- "Implicit predicate" — fix proposed with no predicate stated at all (most common slip)

## Cross-references

- `system/discipline-INDEX.md`
- `quest/quest-protocol.md` Debug Mode Rituals section — original home (this skill is the hoisted atomic version)
- `system/principles.md` — Evidence-before-claim, Verify-not-assume

---

*Atomic primitive skill. Built Phase 3 (2026-05-23). Originally Debug Mode Ritual 1; promoted to standalone primitive for use beyond debug.*
