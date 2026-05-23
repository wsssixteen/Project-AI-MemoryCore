---
name: grep-rubric
description: After every investigative grep that will inform a fix decision — emit a 3-line box stating what the matches PROVE, what they CANNOT see (negative space), and the NEXT step. Use after running Grep/ripgrep for code investigation, dependency-finding, or call-site enumeration. Triggers — "grep rubric", "after grep show what it proves", "what does this grep mean", "what's missing from this grep", "negative space", "grep proves what", "grep judgment". NEW skill (Phase 3 of meta-layer build) — previously prose-only in improvement-audit-log.md 2026-05-06, now elevated to atomic primitive per みや's hard rule.
metadata:
  type: discipline-primitive
  sub-layer: discipline
  meta-layer-INDEX: meta/discipline-INDEX.md
---

# grep-rubric — Post-grep judgment box

## When this fires

- After any Grep tool call that will inform a fix decision or architectural claim
- After Bash `grep`/`rg` invocations for code investigation
- When matches found that look like "the answer" — discipline forces explicit articulation of what they actually prove

## Steps

1. **Read grep results** — at minimum the file paths + match contexts, not just counts
2. **State PROVES** — exactly what these matches establish (one line)
3. **State NEGATIVE** — what the grep CANNOT see (the inverse of the pattern, OR what's NOT in results, OR what dimensions aren't searched). One line
4. **State NEXT** — decision: proceed with hypothesis · broaden the search · pivot to different approach. One line
5. **Emit the box** BEFORE acting on the grep findings

## Output format (mandatory)

```
═══ GREP RUBRIC ═══
Proves:   <what matches establish — one line>
Negative: <what grep CANNOT see / inverse / dimensions not searched — one line>
Next:     <decision: proceed / broaden / pivot — one line>
═══════════════════
```

## Why "negative space" matters

- A grep for `forwardIsPLPS` only finds call-sites. It does NOT find call-sites that SHOULD exist but don't (missing wire-ins). The negative line catches this blind spot.
- A grep for `class XHandler` finds class definitions. It does NOT find usages, instantiations, or sub-classes. The negative forces enumeration of the dimensions not covered.

## What this skill does NOT do

- Does NOT skip the box because "the grep was obvious" — slips happen MOST often on obvious-seeming greps
- Does NOT proceed to a fix based on grep alone without the box (no box = no judgment surfaced = silent claim)
- Does NOT consolidate multi-pattern greps into one box — each grep gets its own box for clarity

## Cross-references

- `meta/discipline-INDEX.md`
- `improvement-audit-log.md` 2026-05-06 entry (original prose rule from みや)
- `meta/principles.md` — Evidence-before-claim + Verify-not-assume

---

*Atomic primitive skill. Built Phase 3 (2026-05-23). First-time-formalized — previously a soft prose rule that didn't fire reliably.*
