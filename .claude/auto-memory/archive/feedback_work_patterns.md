---
name: Work discussion patterns — decision framework + tables
description: Apply lightweight decision framework (risk, compare, validate) to all work discussions. Always use tables for visualization when possible.
type: feedback
---

**Decision framework for work discussions:**
Even for small decisions, apply a lightweight structure:
- What are the options?
- What does each solve / what's the catch?
- Risk — what can go wrong?
- Does it align with the current phase of Miya's career vision?

Not full PMP — just the useful bones: risk assessment, decision matrix, vision alignment check.

**Tables:**
Always use tables when possible — Miya finds them a strong visualization tool. Default to tabular format for comparisons, evaluations, status tracking, option analysis.

**Other visualizations to use when relevant:**
- ASCII diagrams for process flows
- Tree structures for hierarchies
- Mermaid diagrams if the context supports rendering

**Scope tenet — always limit scope as much as possible:**
Never touch shared/common components (etanah-common, shared XHTMLs) unless explicitly required by the ticket. Prefer a solution confined to the specific module or VO over one that modifies shared infrastructure.

**Why:** Shared component changes affect all modules (Melaka, Terengganu, etc.) and require senior sign-off. Scope creep = risk.

**How to apply:** Before proposing any fix, ask — "can this be solved without touching shared code?" If yes, that's the path.

**Why:** Miya wants structured, visual thinking applied consistently — not just for big decisions. Ensures nothing slips through even on small calls.

**How to apply:** Every work discussion where options or trade-offs exist → table + brief risk note + vision alignment check. Even lightweight ones.
