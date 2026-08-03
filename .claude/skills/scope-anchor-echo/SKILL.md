---
name: scope-anchor-echo
description: Echo the scope-anchor reference (from quest/active.txt scope_anchor field or current plan's scope section) BEFORE any code change. Visible echo at edit-time, not silent reference. Use at every code-edit moment during Quest work. Triggers — "what's the scope", "are you in scope", "scope anchor", "before any edit echo scope", "remind me the scope", "scope check". Built Phase 4 (2026-05-23) atomic Honesty primitive.
metadata:
  type: honesty-primitive
  sub-layer: honesty
  system-layer-INDEX: system/honesty-INDEX.md
---

# scope-anchor-echo — Visible scope reference at edit-time

## When this fires

- Before any code Edit/Write during Quest work
- At Apply checkpoint in Quest workflow
- Any time Ruri is about to make a change that COULD drift beyond scope

## Steps

1. **Read scope source** — `quest/active.txt` scope_anchor field for the active quest, OR the active plan's scope section
2. **Echo the anchor** verbatim (one line) BEFORE the proposed edit
3. **State scope-fit** for the proposed edit — does this edit stay within anchor? Yes / No with reason

## Output format (mandatory before Edit)

```
═══ SCOPE ANCHOR ═══
Anchor: <verbatim from active.txt or plan>
This edit: <one-line description>
Fits scope?: ✓ yes / ⚠️ drift — <why>
═══════════════════
```

## Why echo (not just reference silently)

- Silent scope reference fails because Ruri "knows the scope" but the gate-check never visibly fires
- Echo creates a forced moment of "is this actually in scope" before the edit
- みや can spot drift in chat the instant the echo + edit don't match

## What this skill does NOT do

- Does NOT block the edit — emits visible echo so みや can intervene
- Does NOT consolidate echoes across multiple edits — each edit gets its own echo
- Does NOT skip when "the scope is obvious" — over-confident scope-knowledge IS the failure mode

## Source

- `personality.md` Communication: DO (urusan-scope-discipline rule, 2026-05-06 QA-250665)
- `improvement-audit-log.md` — scope_anchor field added to active.txt schema

## Cross-references

- `system/honesty-INDEX.md`
- `claim-verification` skill (pairs with this — claim-verification cites scope-anchor at done-time; scope-anchor-echo cites it at edit-time)
- `system/principles.md` — Honesty Invariants

---

*Atomic Honesty primitive. Built Phase 4 (2026-05-23).*
