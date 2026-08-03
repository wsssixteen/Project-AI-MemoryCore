# みや's Notebook — Training Guide for Using Ruri

> **Counterpart to RURI-NOTEBOOK.md.** Where Ruri's notebook describes who she is, this one describes how to USE her effectively + the patterns/anti-patterns that prevent the system from slipping back into clunky.
> **Created:** 2026-05-23, Phase 5 of system-layer build (formalizes todo.md Q2 entry).
> **Audience:** リドワンさん / みや.

---

## 1 · Mental model — the 6 layers

```
LAYER 0 — Identity                  (WHO Ruri is)        — personality.md, main/main-memory.md
LAYER 1 — Constitution / Meta       (HOW Ruri decides)   — system/  ← the heart of the system
LAYER 2 — Boot Config & Workflow    (WHAT runs at boot)  — CLAUDE.md, Feature/, quest/
LAYER 3 — Capabilities              (skills + hooks)     — .claude/skills/, .claude/hooks/
LAYER 4 — Knowledge                 (references)         — library/, library-items/, etanah-knowledge/
LAYER 5 — State                     (current data)       — quest/active.txt, current-session.md, todo.md
```

**Key insight:** every behavior has a deterministic home. Hooks fire 100%; skills load on trigger; CLAUDE.md is judgment only. When you ask for something new, it gets routed via `system-design-router` to the right home.

---

## 2 · Patterns that WORK well (what to do)

| Pattern | Why it works |
|---|---|
| **"I want X to fire reliably when Y"** | Routes through system-design-router → ends up as hook or skill (deterministic) |
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
| **"Create a new feedback file"** | Same prose-doesn't-fire trap, scattered in `.claude/auto-memory/` | Route through system-design-router |
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

When Ruri is in a multi-stage workflow (plan mode, system-layer build, etc.), she emits a stage progress bar at the start of each turn:

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
| **INDEX** | A system-layer file listing what lives where + cross-references. Master = `system/INDEX.md`. |
| **system-design-router** | The skill that decides whether new behavior goes to a hook / skill / CLAUDE.md / personality.md. Should fire on lock-signals + design-intent. |
| **Trigger phrase** | The natural-language phrase that loads a skill via description match. Each skill's SKILL.md description enumerates its triggers. |
| **Slip-log** | Consolidated history of past failures (after Phase 8, at `system/slip-log.md`). Empirical evidence for system-layer design. |
| **Bankai 🌌 蒼穹宝典** | Ruri's data-organization loop skill — for consolidating scattered knowledge into structured form. Originally built for etanah-knowledge consolidation. |

---

## 8 · When the system slips (and how to surface it)

The system-layer is designed to prevent slips, but no system is perfect. If Ruri:

- Adds prose to CLAUDE.md when she should have proposed a hook/skill → say "you defaulted to prose; route via system-design-router"
- Proposes a new folder without inventory → say "did you check system/INDEX first?"
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

See `system/principles.md` for the full 68-principle classified inventory.

---

## 10 · When in doubt

- Ask Ruri to explain the architecture: "show me the layer hierarchy"
- Invoke the relevant primitive directly: `/rubric`, `/predicate-box`, `/grep-rubric`
- Use grill-me: "/grill-me on [topic]" — Socratic one-question-at-a-time validation
- Check system/INDEX.md for the master index of what lives where
- Check this notebook for usage patterns

---

## 11 · Phrasing reference — how to route asks to the right system-layer component

> Added 2026-05-25 after みや asked "what keywords/skills should I mention when implementing into a skill + how specific on workflow/checkpoint?"
> Use this card when you want a specific gate or skill to fire deterministically.

### 11a · Reference Card — keywords by intent

| Your intent | Recommended phrasing | Routes to / fires |
|---|---|---|
| **Add NEW skill** (net-new behavior) | "Create a skill for X" + "triggers should be A, B, C" + "should fire when Y" + "should NOT fire when Z" | `auto-skill-on-mistake` Step 3c + `system-design` Steps 0-6 |
| **REFINE existing skill** (shape/wording/trigger) | "Refine /<skill-name>" or "the /<skill-name> skill is missing X trigger" or "tighten triggers on /<skill-name>" | skill-invocation-discipline-gate fires → Ruri invokes that skill via Skill tool + auto-skill-on-mistake Step 3a |
| **RENAME or restructure existing** | "Rename /<skill-name> to X because Y" + "the name should be more specific" | system-design Step 5 naming-tier check |
| **TRIGGER a correction loop** (catching a slip) | "you missed", "you forgot", "why didn't you", "I already told you", "this is the Nth time", "unacceptable", "can you not", "shouldn't you have", "did you actually", "did you go through proper" | auto-skill-trigger.js → auto-skill-on-mistake invokes automatically |
| **INVOKE a specific skill** for current task | "Use /<skill-name>" or "invoke /<skill-name>" or "run /<skill-name> properly" or "use it as intended" | skill-invocation-discipline-gate → Ruri MUST use Skill tool (manual SKILL.md execution banned) |
| **Convert prose-rule → skill** | "This is in prose at <file>, make it a skill" + "trigger phrases should be A, B" | auto-skill-on-mistake Step 3b (prose exists → make skill) |
| **Add a HOOK** (deterministic, fires 100%) | "Make this fire deterministically on X event" or "add a PreToolUse hook on Y" or "this should be a hook, not a skill" | auto-skill-on-mistake Step 4 — explicitly hook-not-skill |
| **STRUCTURE change** (new folder/file) | Best to first say: "What exists? Should we extend instead?" before "Let's add a folder for X" | inventory-first-gate.js — forces system/INDEX read before new structure |
| **NEVER fall into "add to CLAUDE.md"** | Banned by default — CLAUDE.md should stay thin. Say "make this a skill" or "make this a hook" instead | prose-default-gate.js catches "add to CLAUDE.md" / "hard rule" lock-signals |

### 11b · Reference Card — workflow / checkpoint specificity

| Workflow | Checkpoints | Phrasing pattern |
|---|---|---|
| **Quest** | Phase 0 / 1 / 2 + Discovery · Recon · Simulate · Rubric · Apply · Verify · Commit · Push · Wrap | "At Quest Recon, always X" · "Before Apply, MUST Y" · "At Phase 1 close-out, do Z" |
| **Domain Expansion** | 12 numbered steps (Step 0a compaction check · Step 0b worktree sync · Steps 1-12 content + close) | "Add to DE step 7 (Gap Sweep): check for X" · "DE step 11 (worktree close) should also Y" |
| **Bankai** | Search → Verify → Apply → Review loop | "In Bankai's Verify phase, add Z" · "Bankai schema should include flag X" |
| **Skill creation** (`auto-skill-on-mistake`) | Steps 1 / 1.5 / 2 / 3a-b-c / 3.6a / 3.6b / 4 / 5 / 6 | "Step 5 of auto-skill-on-mistake should X" · "Add to Step 3.6b audit table: Y check" |
| **Boot / Session Briefing** | Boot order steps 1-5 + briefing line items | "At boot, also surface X" · "Add to Session Briefing standing-flags: Y" |
| **Forge Review** | Weekly cadence | "At Forge Review, also check X" |
| **General preference** (no workflow) | n/a | Just state the preference; Ruri routes to personality.md or new skill |

### 11c · Two power-combos (most-routable phrasings)

**Combo A — fastest correct skill refine**:
> "/<skill-name> needs to also trigger on '<exact phrase>' — refine"
>
> Routes to: skill-invocation-discipline-gate (Ruri invokes via Skill tool) + auto-skill-on-mistake Step 3a (existing skill refine) + Step 3.6b wording-shape audit (mandatory).

**Combo B — fastest workflow-checkpoint addition**:
> "At <workflow> <checkpoint>, also <behavior>. Make it deterministic."
>
> Routes to: identifies workflow file (quest-protocol.md / expansion-protocol.md / etc) + system-design Step 0 (refine over new) + decision: is this a hook (deterministic) or skill (description-triggered)?

### 11d · Anti-patterns (rephrase if you catch yourself saying these)

| Phrasing | Why it fails | Rephrase as |
|---|---|---|
| "Add a rule for X" | No layer specified — defaults to prose, trips prose-default-gate | "Make X a skill / hook / Quest checkpoint rule" |
| "Make it better" | No scope, no trigger | "/<skill-name> should also fire on Y" |
| "Update CLAUDE.md to do X" | CLAUDE.md is edit-blocked + should stay thin | "Make this a skill / hook" |
| "Make sure you always do X" | "Always" without trigger = prose decay | "When at Quest Apply, always X" or "On every Edit to .docx, always X" |
| Just naming a skill without "use it" | Skill-invocation-discipline doesn't fire | "**Invoke** /<skill-name>" or "**Use** /<skill-name>" |

### 11e · TL;DR

1. **Mention the skill by name with `/`** when you want it to fire (e.g. `/auto-skill-on-mistake`).
2. **Specify workflow + checkpoint** when the behavior is workflow-scoped (e.g. "at Quest Recon").
3. **Say "make this a hook"** when you want deterministic firing; **"make this a skill"** when description-triggered is enough; **never** "add to CLAUDE.md" or "update the rules" by default.
4. **For corrections**, the catch phrases ("you missed", "did you actually", "shouldn't you have") auto-fire the meta-loop — no need to specify the skill.

---

*Maintained by Ruri. Refined as みや's patterns evolve and as new anti-patterns surface.*
