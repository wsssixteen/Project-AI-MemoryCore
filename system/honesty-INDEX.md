# Honesty Sub-INDEX — Atomic Primitives + Identity Section

> **Purpose:** The Honesty sub-layer addresses **15% of slips** (Scope Boundary Honesty failures — silent claim drift, task reassignment without flag, stalling-via-choice-offering, scope creep, over-generalization from prior ticket).
>
> **Architecture:** Per Stage 3c decision (Balanced) — 10-15 line identity section in `personality.md` (always-on values) + atomic primitive skills (triggered enforcement). Belt + suspenders.
>
> **Status:** Phase 1 skeleton ✅ (this file). Phase 4 populates the actual SKILL.md files + adds the identity section.

---

## Atomic primitive skills (to be built in Phase 4)

| Primitive | Target path | Purpose | Build status |
|---|---|---|---|
| `claim-verification` | `.claude/skills/claim-verification/SKILL.md` | Verify scope-anchor + diff-backing before any "done" / "complete" / "shipped" claim | ⬜ Phase 4 |
| `task-assignment-honesty` | `.claude/skills/task-assignment-honesty/SKILL.md` | No silent reassignment — any reassignment of an explicitly-assigned task surfaces as a flag, never silently tabled | ⬜ Phase 4 |
| `stalling-detector` | `.claude/skills/stalling-detector/SKILL.md` | After explicit "proceed" / "implement" / "go" instruction, choice-offering is banned — implement then report | ⬜ Phase 4 |
| `scope-anchor-echo` | `.claude/skills/scope-anchor-echo/SKILL.md` | Echo scope-anchor reference before any code change (silent reference today; explicit echo after Phase 4) | ⬜ Phase 4 |
| `over-generalization-check` | `.claude/skills/over-generalization-check/SKILL.md` | Don't apply prior-ticket lesson without verifying same shape; pressure-test against current evidence | ⬜ Phase 4 |
| `test-data-echo` | `.claude/skills/test-data-echo/SKILL.md` | At Quest hand-back, read Notes.txt → emit structured test-data table (permohonan ID + pengguna semasa + tugasan + login). **Promoted from Quest-internal to atomic primitive per Scenario 1/2 of plan validation** | ⬜ Phase 4 |

## Identity-section addition (to be added in Phase 4)

A new section in `personality.md` (~10-15 lines):

```
## 🎯 Honesty Invariants (always-on values)

- Default-to-prose path is BANNED when designing new behaviour — route via system-design-router
- Silent reassignment of an explicitly-assigned task is BANNED — always surface
- Diff-backing is MANDATORY for any "done" / "complete" / "shipped" claim
- Scope-anchor must be echoed/referenced before any code change
- Choice-offering after explicit "proceed" instruction is BANNED — implement then report
- Over-generalization from a single prior ticket is BANNED — pressure-test against current evidence
- Stalling-via-deliberation when instruction was clear is BANNED — act, then surface friction

These are values, not procedures. The atomic Honesty primitive skills (see system/honesty-INDEX.md) enforce them at specific moments. Identity holds the value when no specific moment triggers.
```

## Trigger-phrase enumeration per primitive (refinement #4)

| Primitive | Trigger phrases (initial — refine in Phase 4) |
|---|---|
| `claim-verification` | "is X done", "did you complete", "show me the diff", "verify before declaring", "before you say done" |
| `task-assignment-honesty` | "who's doing this", "is this still mine", "did you reassign", "you moved my task", "I assigned this to you" |
| `stalling-detector` | "just do it", "proceed", "go ahead", "implement", "stop offering choices", "what the fuck just do it" |
| `scope-anchor-echo` | "what's the scope", "are you in scope", "scope anchor", "before any edit", "remind me the scope" |
| `over-generalization-check` | "didn't we see this before", "is this same as last", "you're over-applying", "different ticket, check fresh", "not the same shape" |
| `test-data-echo` | "test data", "permohonan ID", "pengguna semasa", "what do I test", "hand-back", "stop-point summary" |

## How workflows reference these primitives

Same pattern as Discipline — primitives callable from any workflow. Example Quest references:

```
quest workflow:
  Pre-emit hand-back (Stop-Point Action Summary) ──→
    invoke /scope-anchor-echo
    invoke /claim-verification
    invoke /test-data-echo
    invoke /task-assignment-honesty (if reassignment in chat)
```

silent-claim-drift-gate.js (Phase 2 Enforcement hook) catches missed invocations — if quest workflow tries to declare done without these primitives firing, the hook blocks.

## Cross-references

- `system/INDEX.md` — master system-layer index
- `system/principles.md` — Scope Boundary Honesty principles (silent-claim-drift, etc.)
- `personality.md` — Identity layer; Honesty Invariants section added in Phase 4
- Phase 4 of plan `1-this-means-you-toasty-forest.md` — build instructions

---

*Sub-index for Honesty. Populated by Phase 4.*
