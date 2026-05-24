---
name: system-check
description: Comprehensive deep-audit of the meta-layer architecture — spawns 5 parallel familiars (Skills / Hooks / Workflows+Scenarios / Cross-references / Comparative-systems) and consolidates findings into ranked fix-list. Use periodically (monthly cadence + after major architectural work) OR on-demand when system health is uncertain. Triggers — "/system-check", "system check", "audit the system", "deep audit", "full system sweep", "check everything", "comprehensive audit", "is the system healthy", "are there orphans", "architecture review", "system audit". Built 2026-05-24 as response to repeated paraphrase-instead-of-build slip — the 5-parallel-audit pattern this turn surfaced 35+ real gaps that Step 12.5 lightweight meta-audit would have missed.
metadata:
  type: meta-layer-skill
  sub-layer: self-enforcement
  meta-layer-INDEX: meta/INDEX.md
  trifecta:
    goal: Surface architectural drift / orphans / industry-gaps BEFORE they compound; convert findings into actionable tasks
    guardrails: 5 parallel familiars, scope-capped (≤1000 words per familiar report); does NOT auto-implement fixes (TaskCreate only)
    grounded: Current state of meta-layer (INDEX + sub-indexes) + slip-log + library-items/agent-architecture/claude-code-best-practices.md + industry frameworks research
---

# system-check — Comprehensive architecture deep-audit

## When this fires

| Trigger | Mechanism |
|---|---|
| Monthly elapsed (>30 days since last run) | SessionStart hook `system-check-trigger.js` flags overdue at boot |
| Manual invoke | "/system-check" or any trigger phrase from description |
| After major architectural work | Manual judgement — when meta-layer / hooks / skills have substantially changed |
| When system health is uncertain | Manual — みや or Ruri notices drift signals |

## Why this exists (Justify)

- Step 12.5 meta-audit (DE-integrated) is LIGHTWEIGHT — covers hook-fire reliability + INDEX cross-references + component-liveness ONLY
- It does NOT catch: architectural drift, industry-pattern gaps, workflow-scenario silent failures, orphaned skills, narrowed primitives
- Without periodic deep-audit, system accumulates orphans + broken wirings + industry drift silently
- 2026-05-24 demonstration: 5-parallel-audit surfaced 35+ real gaps that Step 12.5 would have silently missed
- **Industry context (Audit 5)**: NO production framework (LangGraph, AutoGen, CrewAI, MetaGPT, Claude Agent SDK, OpenAI, DSPy, TextGrad, Reflexion) has a comparable periodic comprehensive-architecture-audit. This is a frontier pattern we're pioneering because OUR system genuinely needs it

## Steps

1. **Verify cadence justification** — if not "/system-check" manual invoke + not "after major work" judgement + not yet 30 days elapsed → ask みや if running early is intentional
2. **Spawn 5 parallel familiars** (templates frozen from 2026-05-24 first run — `/audit:skills`, `/audit:hooks`, `/audit:workflows`, `/audit:cross-refs`, `/audit:comparative`)
3. **Wait for all 5 to return** (typically 2-5 minutes total)
4. **Consolidate findings** into a single ranked table:
   - CRITICAL = blocks core workflows OR introduces silent failure
   - HIGH = real slip-causing pattern, not yet hit but high probability
   - MEDIUM = improvement, not blocking
   - LOW = nice-to-have polish
5. **TaskCreate per CRITICAL + HIGH item** (apply first-time-creation rule — don't wait for strikes)
6. **Surface to next-session boot** via standing-flag mechanism if any CRITICAL remain after this run
7. **Update last-system-check date** in `meta/evolution-protocol.md`
8. **Emit final report** to chat — what shipped this run + what's tracked + what's deferred

## Familiar templates (frozen from 2026-05-24 first run)

### Familiar 1 — Skills audit
Targets `.claude/skills/*/SKILL.md` + `plugins/*/skills/*/SKILL.md`. For each: description tightness, trigger phrase ≥5 enumeration, workflow invocation, hook reference, INDEX cross-ref, orphan-status, redundancy, gaps. Output: ranked skill-level fixes.

### Familiar 2 — Hooks audit
Targets `.claude/hooks/*.js` + `.claude/settings.local.json`. For each: event registered, trigger patterns, coverage gaps vs slip-log root_category enum, conflict matrix vs other hooks on same event. Output: ranked hook-level fixes.

### Familiar 3 — Workflows + scenarios
Traces EVERY workflow (Quest / DE / Session Briefing / Bankai / Phase 1 close / Redmine retrieval / Forge Review / meta-design-router) checkpoint-by-checkpoint. Plus 3-5 SCENARIO TRACES per workflow (hypothetical inputs → what should fire vs what actually fires). Output: ranked workflow wiring fixes.

### Familiar 4 — Cross-reference integrity
Every backtick-wrapped file path + "see X.md" pointer + INDEX entry. Validates each resolves on filesystem. Compares against baseline. Output: broken/dead references requiring fix.

### Familiar 5 — Comparative-systems
Re-pulls latest research on industry agentic frameworks (LangGraph, AutoGen, CrewAI, MetaGPT, Claude Agent SDK, OpenAI, DSPy, TextGrad, Reflexion). Compares our patterns vs theirs. Surfaces where we're industry-leading, where below standard, what's frontier. Output: 5-10 industry recommendations ranked by impact.

### Familiar 6 — Scenario replay (added 2026-05-24 — minimum-viable; full implementation deferred to Task #32)

The "ping the website to see if it actually responds" check. Static audits (Familiars 1-4) check architecture integrity; this familiar validates BEHAVIOUR by replaying historical Quests through the current meta-layer.

**Methodology:**
- Select 3-5 representative past Quests from `projects/coding-projects/archive/` covering different types (debug · enhancement · template-fix · Java-patch · .docx-edit)
- For each Quest: load BA Description + History + early-diagnostic + screenshots
- Familiar runs Phase 0 + Phase 1 with CURRENT meta-layer active (which hooks fire? which skills load? what's the analysis output?)
- Compare familiar's analysis to historical record:
  - Did the right skills auto-load on the trigger phrases in the Quest?
  - Did Recon emit the same checks as the original?
  - Did Apply propose the same fix shape?
  - Did Honesty primitives fire at hand-back?
- Surface discrepancies — anywhere current architecture would have produced DIFFERENT outcome vs. historical record = regression signal

**Per-Quest-type knowledge loading** (per みや 2026-05-24): different Quest types load different knowledge bundles —
- Template fix → loads PelupusanWordCCMethodConstant.java + relevant .docx + populator-registry
- Java patch → loads relevant Form/Helper + flowable BPMN if state-machine relevant
- Debug → loads server.log path + debug-mode rituals + Predicate Box discipline
- Enhancement → loads scope-anchor + cross-impact analysis + Integration Analysis sub-ritual
- Each load pattern needs explicit definition (Task #32 work)

**Cadence:**
- Familiar 6 is HEAVY (5 full Quest simulations × multiple sub-familiar reads each = significant token cost)
- DEFAULT system-check (monthly) runs Familiars 1-5 only
- system-check WITH replay (quarterly OR explicit invoke "/system-check --replay" OR "/system-check deep") runs Familiars 1-6

**Status:** Skill description includes this familiar (this section). FULL IMPLEMENTATION (per-Quest-type knowledge bundle definitions + scenario-replay familiar template + historical-Quest selection script) is **Task #32** — deferred to next session. Today's system-check runs Familiars 1-5.

## What this skill does NOT do

- Does NOT auto-implement fixes (Goal: surface + task; not act)
- Does NOT replace Step 12.5 DE meta-audit (different tier — Step 12.5 = every DE lightweight; system-check = periodic deep)
- Does NOT run if cadence not met AND not manually invoked AND no architectural work flag — avoids ritual-without-value
- Does NOT block any workflow — purely additive observability

## Cost / cadence reasoning

5 parallel familiars × 5 minutes ≈ significant token cost per run. Cadence calibration:
- Monthly (~12/year) = manageable cost, catches drift before compounding
- Quarterly = too rare given system evolution rate
- Weekly = too frequent given change rate

Adjust based on observed value over first 3 runs.

## Cross-references

- `meta/INDEX.md` — master meta-layer index
- `meta/evolution-protocol.md` — tracks `last-system-check` date (extended 2026-05-24)
- `.claude/hooks/system-check-trigger.js` — SessionStart cadence flag
- `Feature/Domain-Expansion/expansion-protocol.md` Step 12.5 — sibling lightweight audit (different tier)
- `library-items/agent-architecture/claude-code-best-practices.md` — research reference for Familiar 5

---

*Built 2026-05-24 — Phase 0 of post-meta-layer hardening. Cadence: monthly + on-demand + after-major-architectural-work. First run: this turn (5 familiars completed; findings captured in Tasks #21-31).*
