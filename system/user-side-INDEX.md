# User-Side Guardrails Sub-INDEX

> **Purpose:** A distinct sub-layer for guardrails on HOW みや interacts with Ruri — moments when his instruction would push Ruri into clunky patterns ("create a `references/` folder", "hardcode it", "let's add a rule"). The system stops/checks/guides BEFORE Ruri executes on those.
>
> **Origin:** みや's insight during Stage 3d grill (2026-05-23) — system-layer so far had been all about Ruri's behavior; he also needs guardrails for his own usage patterns to prevent inadvertently pushing Ruri into bad designs.
>
> **Status:** Phase 1 skeleton ✅ (this file). Phase 5 builds the hook + skill + MIYA-NOTEBOOK.md.

---

## Components (to be built in Phase 5)

| # | Component | Target path | Purpose | Build status |
|---|---|---|---|---|
| 1 | `user-side-guardrail.js` | `.claude/hooks/` (UserPromptSubmit) | Intercept みや's prompt patterns that would push Ruri into bad designs. Surface "inventory check returned X · proceed?" or "this triggers system-design — confirm?" BEFORE Ruri acts | ⬜ Phase 5 |
| 2 | `usage-guidance/SKILL.md` | `.claude/skills/` | Triggered when みや's prompt would cause Ruri to violate her own discipline. Emits multi-step guidance + check before execution | ⬜ Phase 5 |
| 3 | `MIYA-NOTEBOOK.md` | Root (parallel to `RURI-NOTEBOOK.md`) | Training/guide doc for みや on patterns/triggers/anti-patterns when using Ruri. Formalizes todo.md Q2 entry | ⬜ Phase 5 |

## Why this sub-layer is distinct

| Dimension | Other sub-layers (Discipline / Honesty / Enforcement) | This sub-layer (User-side) |
|---|---|---|
| Invocation | Responds to Ruri's actions | Responds to USER prompts |
| Purpose | Protects Ruri from her own failure modes | Protects みや from accidentally pushing Ruri into bad patterns |
| Audience | Gates Ruri's emissions | Outputs guidance to みや |
| When it fires | Before Ruri emits / acts | Before Ruri processes みや's prompt |

This justifies a separate sub-layer + separate INDEX rather than folding into Enforcement.

## How it relates to existing enforcement

`user-side-guardrail.js` overlaps with `prose-default-gate.js` (Enforcement) in some triggers — both fire on UserPromptSubmit, both look for design-signal phrases. The distinction:

| `prose-default-gate.js` (Enforcement) | `user-side-guardrail.js` (User-side) |
|---|---|
| Catches Ruri's likely response and forces system-design-router invocation | Catches みや's likely intent and surfaces "are you sure this triggers a design pass?" + offers alternatives |
| Targets Ruri's behavior pattern | Targets みや's usage pattern |
| Fires AFTER detecting lock-signal | Fires AT detection + offers shape options to みや |

Both hooks can fire in the same turn (different purposes). Order matters: user-side-guardrail fires FIRST (offers みや shape options), then if みや proceeds, prose-default-gate fires to ensure Ruri routes correctly.

## Trigger phrases (initial — refine in Phase 5)

| Component | Trigger phrases |
|---|---|
| `user-side-guardrail` (hook) | Same lock-signal set as `prose-default-gate` PLUS: "let's add", "we should have a", "create a new [folder/file/skill/hook]", "I want a [thing]", "make it so" |
| `usage-guidance` (skill) | "how do I use [feature]", "what's the right way to ask", "am I doing this right", "should I [trigger pattern]" |

## MIYA-NOTEBOOK.md scope (Phase 5 will draft)

Content categories planned:

- **How Ruri thinks** — the layered architecture; system-layer's role
- **Patterns that work well** — describe-end-goal-then-let-Ruri-design (not direct-instruction); pressure-test her recommendations; use plain language
- **Anti-patterns** — "create a [folder]" without inventory; "always do X" without considering shape (hook/skill/CLAUDE.md)
- **How to invoke skills explicitly** — when manual invocation helps
- **How to interpret stages-arrow + grill questions** — the discovery rhythm
- **When to override** — owner's prerogative on architectural decisions
- **Glossary** — atomic primitives, workflows, hooks, INDEX, system-design-router, etc.

## Cross-references

- `system/INDEX.md` — master system-layer index
- `system/principles.md` — sycophancy circuit-breaker + skeptical-of-suggestions principles
- `RURI-NOTEBOOK.md` — parallel doc for Ruri's self-description
- Phase 5 of plan `1-this-means-you-toasty-forest.md` — build instructions
- todo.md Q2 — original entry for MIYA-NOTEBOOK; this formalizes

---

*Sub-index for User-side Guardrails. Populated by Phase 5.*
