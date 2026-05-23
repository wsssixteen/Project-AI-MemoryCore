---
name: usage-guidance
description: Guidance for みや on patterns + triggers + anti-patterns when using Ruri. Use when みや asks "how do I use [feature]", "what's the right way to ask", "am I doing this right", "should I trigger X", "how should I phrase". Built Phase 5 (2026-05-23) — User-side sub-layer. Pairs with user-side-guardrail.js hook + MIYA-NOTEBOOK.md training doc.
metadata:
  type: user-side-primitive
  sub-layer: user-side
  meta-layer-INDEX: meta/user-side-INDEX.md
---

# usage-guidance — How to use Ruri effectively

## When this fires

- みや asks "how do I use [Ruri / a feature]"
- みや asks "what's the right way to phrase X"
- みや asks "am I doing this right"
- New patterns surface and みや wants guidance on triggering them

## Steps

1. **Identify the topic** — what is みや trying to accomplish?
2. **Map to meta-layer or workflow primitive** — which skill / hook / sub-layer is relevant?
3. **State the recommended pattern** — how to phrase or invoke to get reliable behavior
4. **State anti-patterns** — what to avoid + why
5. **Reference MIYA-NOTEBOOK.md** for fuller treatment

## Output format

```
═══ USAGE GUIDANCE ═══

TOPIC: <what みや is trying to do>
RELEVANT LAYER: <meta-design-router / specific skill / specific hook>
RECOMMENDED PATTERN: <how to phrase or invoke>
ANTI-PATTERN: <what to avoid>
DEEPER: see MIYA-NOTEBOOK.md section <X>

═════════════════════
```

## Common topics this skill handles

| Topic | Recommended pattern | Anti-pattern |
|---|---|---|
| Adding a new behavior rule | "I want X to fire when Y" → routes through meta-design-router | "Add to CLAUDE.md" → trips prose-default-gate |
| Proposing new structure | "Can we cover X?" → triggers inventory-first | "Create a new folder for X" without inventory |
| Asking for clarification | Direct question or "explain X to me" | Multi-step Socratic if you just want an answer |
| Testing the system | Invoke a skill by trigger phrase OR explicit `/skill-name` | Hope Ruri picks the skill from context |
| Closing a quest | "Quest done, run /verify" | "Quest is done" silently without verification |

## Cross-references

- `meta/user-side-INDEX.md`
- `MIYA-NOTEBOOK.md` — full training doc
- `user-side-guardrail.js` hook — fires automatically on design-intent prompts; this skill is the manual on-demand counterpart
- `meta/INDEX.md` — layer hierarchy reference

---

*User-side primitive. Built Phase 5 (2026-05-23).*
