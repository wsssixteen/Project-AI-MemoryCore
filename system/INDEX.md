# system/ — Layer 1 (Constitution / Meta) Master INDEX

> **Purpose:** The system-layer governs HOW Ruri decides, behaves, and evolves. It enforces best-practices on every other layer below it (Boot/Workflow, Capabilities, Knowledge, State). One unified layer per Stage 1 grill decision (2026-05-23).
>
> **System overview:** Ruri is a Claude Code-based personal AI agent for みや — built on a layered architecture where every behavior has a deterministic home, every slip becomes a refinement, and the system evolves as Anthropic does.
>
> **Plan:** `C:\Users\Ridhwan\.claude\plans\1-this-means-you-toasty-forest.md` (approved 2026-05-23)

---

## Layer hierarchy

```
LAYER 0 — Identity                  (WHO Ruri is)        → personality.md, master-memory.md, main/main-memory.md
LAYER 1 — Constitution / Meta       (HOW Ruri decides)   → system/ (THIS FOLDER)
LAYER 2 — Boot Config & Workflow    (WHAT runs at boot)  → CLAUDE.md, Feature/Session-Briefing-System/, Feature/Domain-Expansion/, quest/
LAYER 3 — Capabilities              (skills + hooks)     → .claude/skills/, .claude/hooks/, plugins/
LAYER 4 — Knowledge                 (references)         → library/, library-items/, etanah-knowledge/, memory
LAYER 5 — State                     (current data)       → quest/active.txt, main/current-session.md, main/todo.md
```

## What lives in system/

| File | Purpose | Phase built |
|---|---|---|
| `INDEX.md` (this file) | Master index — points to all sub-indexes + cross-refs | Phase 1 ✅ |
| `principles.md` | The 6 proto-system-layer principles + classified rest of 68 principles from personality.md / feedback files | Phase 1 ✅ |
| `baseline-2026-05-23.md` | Pre-system-layer baseline measurement (slip count + corrections + INDEX validity) for comparative eval | Phase 0 ✅ |
| `discipline-INDEX.md` | Sub-index for Discipline atomic primitive skills (Rubric / Predicate Box / Grep Rubric / Multi-dim evidence / Sycophancy Circuit-Breaker / Confidence Table) | Phase 1 skeleton ✅ → Phase 3 populates |
| `honesty-INDEX.md` | Sub-index for Honesty atomic skills (claim-verification / task-assignment-honesty / stalling-detector / scope-anchor-echo / over-generalization-check / test-data-echo) + Identity-section reference in personality.md | Phase 1 skeleton ✅ → Phase 4 populates |
| `enforcement-INDEX.md` | Sub-index for 6 Enforcement hooks (boot-required-read · pre-action-check · inventory-first · prose-default · silent-claim-drift · best-practices-not-consulted) | Phase 1 skeleton ✅ → Phase 2 populates |
| `user-side-INDEX.md` | Sub-index for User-side Guardrails (user-side-guardrail.js hook + usage-guidance skill + MIYA-NOTEBOOK.md) | Phase 1 skeleton ✅ → Phase 5 populates |
| `evolution-protocol.md` | How system-layer self-updates on Anthropic releases (SessionStart double-check + manual invoke) | Phase 1 placeholder ✅ → Phase 7 implements |
| `slip-log.md` | **Pending Phase 8** — consolidated slip history from 8 scattered files | Phase 8 |
| `hook-fire-log.md` | **Pending Phase 6** — per-hook fire logging for self-enforcement eval | Phase 6 |
| `build-progress.md` | **Pending** — multi-session build state tracker (per refinement #6) | Add at next session resume |

## Cross-references (where system-layer touches other layers)

| Target | Where | Why |
|---|---|---|
| `library-items/agent-architecture/claude-code-best-practices.md` | Knowledge layer | Read by system-design-router Step 3.5 (best-practices check) before deciding hook/skill/CLAUDE.md |
| `personality.md` — Honesty Invariants section (Phase 4) | Identity layer | Always-on values that complement the Honesty atomic skills (triggered) |
| `.claude/skills/system-design-router/SKILL.md` | Capabilities layer | The skill that runs the inventory → system-design → best-practices → skill/hook decision loop |
| `.claude/hooks/system-edit-gate.js` (Phase 6, v1.2 2026-07-06) | Capabilities layer | PreToolUse hook on `system/*` paths — advisory reminder + HARD-BLOCK arch-doc-sync predicate (deny if system-touching edit lacks `system/system-architecture.md` Read/Edit this session) |
| `domain/design-consult-gate/design-consult-gate.gate.hook.js` (v1.2 2026-07-06) | Capabilities layer | PreToolUse Edit\|Write hook — HARD-BLOCKS edits to skills/hooks/CLAUDE.md/personality.md/system/**/quest-protocol/settings.json unless `/system-design` + `/system-rules` invoked this session; eval-existence rider blocks new hook/skill without paired `domain/<name>/eval.js`; advisory-only on etanah new-symbol additions |
| `Feature/Domain-Expansion/expansion-protocol.md` (Phase 6) | Workflow layer | Extended with `meta-audit` step (Step 12.5) covering hook-fire reliability + cross-ref validity + component-liveness |
| `Feature/Forge-Self-Improvement-System/skill-failure-log.md` (Phase 6 extension) | Knowledge layer | Extended schema with skill-load counter for invocation-reliability tracking |
| `CLAUDE.md` (Phase 9) | Boot Config layer | Adds Layer 1 reference: "System-layer: see `system/INDEX.md`" |

## The 6 core tenets (proto-system-layer principles)

1. **Prose-only principles never persist** — must-fire ≠ aspirational; convert to skill or hook
2. **Output rituals are non-negotiable** — silent failures are invisible failures; visible gates surface gaps
3. **Design from architecture, not from last slip** — pressure-test new rules against the layered model
4. **Invocation must be visible** — every principle has a deterministic trigger; floating principles die
5. **Verify before closure** — no phase closes without external cross-check
6. **Failure-mode awareness** — before declining an action, ask "what breaks if I'm wrong?"

See `system/principles.md` for the full 68-principle classified inventory.

## Decision criteria (used by system-design-router)

When a new behaviour needs a home, the router decides shape based on:

| Behaviour type | Goes to | Why |
|---|---|---|
| MUST fire deterministically (every time) | **Hook** (SessionStart/Pre/Post/Stop event) | Hooks bypass the model; fire 100% |
| Fires conditionally on context (when triggered) | **Skill** (description-trigger discoverable) | Progressive disclosure; loaded only when relevant |
| Judgment / style / values | **CLAUDE.md** (≤200 lines) or **personality.md** (identity) | Advisory; influences emission |
| Reference / knowledge | **library-items/** or `knowledge/` | Retrieved on-demand; not auto-loaded |

**Default-to-prose path** (add to CLAUDE.md / new feedback_*.md) is **BANNED** unless the behaviour is genuinely judgment/style only.

## Recursive safety (Stage 5 self-enforcement)

The system-layer applies its own rules to itself:

- **Edits to `system/*` paths** require `system-design-router` invocation first (enforced by `system-edit-gate.js` PreToolUse hook — Phase 6)
- **Domain Expansion meta-audit step** (Phase 6) runs every session-end checking: hook-fire reliability · INDEX cross-reference validity · component-liveness (no orphans)
- **Fallback** — if `system-edit-gate.js` is dark for 2 sessions, DE meta-audit raises a standing flag (refinement #5)

## Evolution mechanism (Stage 6)

- **SessionStart hook double-check** (Phase 7): model-ID-change detection + >30 days since last evolution-check
- **Manual invoke** also available: "check Anthropic updates"
- Scope: Anthropic product + best-practices guidance + Claude model + LLM research community + agent-design advances
- See `system/evolution-protocol.md`

---

*Master INDEX maintained at the system-layer's root. Updated on every Phase completion.*
