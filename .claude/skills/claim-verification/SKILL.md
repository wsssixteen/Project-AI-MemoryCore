---
name: claim-verification
description: Before any "done" / "complete" / "shipped" / "fixed" claim — verify diff-backing (cite file paths edited + commit SHA if committed) + scope-anchor reference (what was the agreed scope; how does the diff stay within it). Use at every Phase 1 close-out, every "task completed" emit, every multi-file change confirmation. Triggers — "is X done", "did you complete", "show me the diff", "verify before declaring", "before you say done", "diff-back this claim", "is it shipped", "claim verification". Built Phase 4 (2026-05-23) atomic Honesty primitive.
metadata:
  type: honesty-primitive
  sub-layer: honesty
  system-layer-INDEX: system/honesty-INDEX.md
---

# claim-verification — Pre-claim diff + scope verification

## When this fires

- Any "done" / "complete" / "shipped" / "fixed" claim in chat or commit message
- Phase 1 close-out in Quest workflow
- Multi-file change emit
- Task#N completion in TaskList

## Steps

1. **Detect the claim** — explicit ("Phase X done") or implicit ("now it should work")
2. **Gather diff evidence** — list file paths edited this session; reference commit SHA if committed
3. **Reference scope-anchor** — read `quest/active.txt` scope_anchor field OR the plan's scope section; cite it
4. **Verify diff fits scope** — for each file edited, does it stay within the scope anchor? Flag any drift
5. **Emit verified-done block** (mandatory format below) BEFORE the claim text

## Output format (mandatory before any "done" claim)

```
═══ CLAIM VERIFICATION ═══

CLAIM: <what is being declared done>
SCOPE ANCHOR: <verbatim from active.txt or plan>
DIFF: <files edited this session — paths>
COMMIT (if any): <SHA + branch>
SCOPE FIT: ✓ all changes within anchor | ⚠️ drift in <files> — explain

═══════════════════════════
```

## What this skill does NOT do

- Does NOT block the claim outright — emits visible verification so みや can spot drift
- Does NOT skip diff listing because "it's obvious what changed" — silent backing = silent claim
- Does NOT consolidate per-file fits into one line if drift exists — drift gets named per-file

## Source slip (2026-05-22 QA-261986)

Ruri claimed "§6 premium un-blanked" while §6 block was untouched. The change was a single-line removal elsewhere. みや: "I felt betrayed & lied." A claim-verification gate at emit time catches this — the scope claim ("§6 fixed") doesn't fit the diff (single line elsewhere) → drift flagged.

## Cross-references

- `system/honesty-INDEX.md`
- `silent-claim-drift-gate.js` (Phase 2 hook) — fires on Stop event; this skill is the in-Ruri primitive that gate enforces
- `system/principles.md` — Evidence-before-claim, Verify-not-assume, Scope-anchor invariant

---

*Atomic Honesty primitive. Built Phase 4 (2026-05-23).*
