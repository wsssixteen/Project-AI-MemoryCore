# みや's Notebook — Training Guide for Using Ruri

> **Counterpart to RURI-NOTEBOOK.md.** Where Ruri's notebook describes who she is, this one describes how to USE her effectively + the patterns/anti-patterns that prevent the system from slipping back into clunky.
> **Created:** 2026-05-23, Phase 5 of meta-layer build (formalizes todo.md Q2 entry).
> **Audience:** リドワンさん / みや.

---

## 1 · Mental model — the 6 layers

```
LAYER 0 — Identity                  (WHO Ruri is)        — personality.md, main/main-memory.md
LAYER 1 — Constitution / Meta       (HOW Ruri decides)   — meta/  ← the heart of the system
LAYER 2 — Boot Config & Workflow    (WHAT runs at boot)  — CLAUDE.md, Feature/, quest/
LAYER 3 — Capabilities              (skills + hooks)     — .claude/skills/, .claude/hooks/
LAYER 4 — Knowledge                 (references)         — library/, library-items/, etanah-knowledge/
LAYER 5 — State                     (current data)       — quest/active.txt, current-session.md, todo.md
```

**Key insight:** every behavior has a deterministic home. Hooks fire 100%; skills load on trigger; CLAUDE.md is judgment only. When you ask for something new, it gets routed via `meta-design-router` to the right home.

---

## 2 · Patterns that WORK well (what to do)

| Pattern | Why it works |
|---|---|
| **"I want X to fire reliably when Y"** | Routes through meta-design-router → ends up as hook or skill (deterministic) |
| **"Can we cover X?" (open framing)** | Triggers inventory-first; Ruri checks existing layers before proposing new |
| **"Pressure-test my idea"** | Activates `appraise` skill; Ruri Socratic-grills before agreeing |
| **"Run /verify"** at quest close | External cross-check catches Ruri's owner-blindness |
| **"Show me the diff"** before approving | Forces claim-verification skill; catches silent claim drift |
| **"Use Bankai to consolidate X"** | Invokes the data-organization loop for scattered knowledge |
| **"/grill-me on this plan"** | Socratic one-question-at-a-time validation before commit |

---

## 3 · Anti-patterns to AVOID (what NOT to do)

| Anti-pattern | Why it fails | Better alternative |
|---|---|---|
| **"Add to CLAUDE.md"** | Prose in CLAUDE.md doesn't reliably fire (proven 3× in 2026-05-23 session). Triggers prose-default-gate + user-side-guardrail | "Make it fire reliably when X" → router picks shape |
| **"Create a new folder for X"** | Skips inventory; risks proliferation (the `references/` slip 2026-05-23). Triggers inventory-first-gate | "Where should X live?" → inventory-first |
| **"Create a new feedback file"** | Same prose-doesn't-fire trap, scattered in `.claude/auto-memory/` | Route through meta-design-router |
| **"Just hardcode it"** without slip evidence | Locks a single observation as a universal rule. Better to wait for ≥2 occurrences | "I've seen this twice — should we add a gate?" |
| **Silent approval of Ruri's first proposal** | Misses pressure-test moments | Ask "what's the weakest part of this recommendation?" |
| **Closing a quest without /verify** | Silent skip of cross-check; owner-blindness slips through | Always /verify Checklist C at Phase 1 close |

---

## 4 · How to invoke skills (when manual helps)

Skills usually auto-load on description match. But manual invocation is sometimes faster:

| Invocation form | When to use |
|---|---|
| `/skill-name` (explicit slash) | When you want to FORCE the skill to load even if context-trigger isn't matching |
| Plain trigger phrase | Normal use; relies on description-trigger matching |
| `<skill name>` in chat ("rubric this", "predicate box this") | Conversational invocation; matches trigger-phrase list |

If a skill doesn't fire when you expect it to → log to `skill-failure-log.md` so the description trigger gets tuned.

---

## 5 · Reading the stages-arrow

When Ruri is in a multi-stage workflow (plan mode, meta-layer build, etc.), she emits a stage progress bar at the start of each turn:

```
Stages: 1 Shape ✅ · 2 Purpose+content ✅ · 3a Enforcement ⏳ · 3b Discipline ⬜ · ...
```

This tells you:
- ✅ = stage closed (don't revisit unless you explicitly want to)
- ⏳ = stage in progress (your input now affects this)
- ⬜ = stage pending (will be reached if execution proceeds)

You can override flow by directing Ruri to a specific stage or revisiting an earlier one.

---

## 6 · When to override (owner's prerogative)

Ruri's recommendations are research-backed, but you're the owner. Cases where you should override even if Ruri pushes back:

- **Personal preference** (file naming, banner style, etc.)
- **Project-specific context** Ruri doesn't have full visibility into
- **Strategic decisions** (whether to invest in feature X now or later)
- **Style or values** that don't fit Anthropic's general best-practices but fit your work style

Just say "override — let's do X anyway" + brief reasoning. Ruri logs it (so she doesn't pressure-test the same thing again) and proceeds.

---

## 7 · Glossary

| Term | Meaning |
|---|---|
| **Atomic primitive** | A small reusable skill that does ONE thing (e.g. `rubric`, `predicate-box`). Workflows call primitives by name. |
| **Workflow** | A sequence/composition that calls primitives at specific moments. Quest is the canonical workflow. Bankai is another. |
| **Hook** | A JS script that fires deterministically on Claude Code events (SessionStart, UserPromptSubmit, PreToolUse, Stop). Bypasses model decision. |
| **INDEX** | A meta-layer file listing what lives where + cross-references. Master = `meta/INDEX.md`. |
| **meta-design-router** | The skill that decides whether new behavior goes to a hook / skill / CLAUDE.md / personality.md. Should fire on lock-signals + design-intent. |
| **Trigger phrase** | The natural-language phrase that loads a skill via description match. Each skill's SKILL.md description enumerates its triggers. |
| **Slip-log** | Consolidated history of past failures (after Phase 8, at `meta/slip-log.md`). Empirical evidence for meta-layer design. |
| **Bankai 🌌 蒼穹宝典** | Ruri's data-organization loop skill — for consolidating scattered knowledge into structured form. Originally built for etanah-knowledge consolidation. |

---

## 8 · When the system slips (and how to surface it)

The meta-layer is designed to prevent slips, but no system is perfect. If Ruri:

- Adds prose to CLAUDE.md when she should have proposed a hook/skill → say "you defaulted to prose; route via meta-design-router"
- Proposes a new folder without inventory → say "did you check meta/INDEX first?"
- Claims "done" without diff-backing → say "show me the diff"
- Offers (a)/(b) choices after you said "proceed" → say "stop offering choices"
- Skips test-data echo at hand-back → say "where's the test data table"

Each correction:
1. Auto-fires `auto-skill-on-mistake` skill (hook-driven)
2. Logs to `skill-failure-log.md`
3. Refines the skill that should have fired
4. If pattern recurs ≥3 times in 14 days → redesign-level fix (not more prose)

---

## 9 · The 6 core tenets (what Ruri stands for)

1. **Prose-only principles never persist** — must-fire = hook or skill, never aspirational prose
2. **Output rituals are non-negotiable** — silent failures are invisible failures
3. **Design from architecture, not last slip** — pressure-test against the layered model
4. **Invocation must be visible** — every principle has a deterministic trigger; floating principles die
5. **Verify before closure** — no phase closes without external cross-check
6. **Failure-mode awareness** — before declining an action, ask "what breaks if I'm wrong?"

See `meta/principles.md` for the full 68-principle classified inventory.

---

## 10 · When in doubt

- Ask Ruri to explain the architecture: "show me the layer hierarchy"
- Invoke the relevant primitive directly: `/rubric`, `/predicate-box`, `/grep-rubric`
- Use grill-me: "/grill-me on [topic]" — Socratic one-question-at-a-time validation
- Check meta/INDEX.md for the master index of what lives where
- Check this notebook for usage patterns

---

*Maintained by Ruri. Refined as みや's patterns evolve and as new anti-patterns surface.*
