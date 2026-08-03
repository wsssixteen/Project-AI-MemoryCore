---
name: auto-skill-on-mistake
description: When みや corrects me, convert the missed rule into a real skill (or refine the existing one) immediately + log the failure. Trigger phrases — "you missed", "you forgot", "why didn't you", "please fix this", "I already told you", "I asked you previously", "this is the Nth time", "you keep doing this", "I cannot believe", "you should have", "you wasted my time", or any clear correction of a behaviour that was already supposed to be a rule.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# auto-skill-on-mistake — turn corrections into deterministic skills

## What this does

When みや points out a mistake AND the missed behaviour should already have been a rule, this skill ensures:

1. A skill exists for that behaviour (or the existing skill gets refined to cover the gap)
2. A hook is wired where the behaviour is deterministically firable
3. The failure is logged so we can see trends

## Why this exists

Prose rules in CLAUDE.md / personality.md / amendments / feedback files repeatedly fail to fire ("loading ≠ following"). The cure that works in our system is to convert reliable-must-fire rules into either (a) a named skill with discoverable trigger phrases, or (b) a deterministic harness hook. This skill is the conversion engine.

## Trigger model

| Mode | Behaviour |
|---|---|
| Auto-fire on detection | When the conversation contains a clear correction-shape (see trigger phrases above), Ruri runs this skill BEFORE responding to the correction substantively |
| Manual | `/auto-skill-on-mistake` |

## Steps

### Step 1 — Identify the missed behaviour

In one sentence: *"At [point in flow], I should have done [X] but I [did Y / didn't do anything]. The rule lives in [file:line OR is not yet written]."*

### Step 1.5 — Goal alignment declaration (added 2026-05-24, Task #17)

Before proposing skill/hook shape, the new behaviour MUST declare:
- **Goal in larger system:** one line — how this behaviour serves the overall vision (autonomy / discipline / honesty / etc.)
- **Aligns with みや's vision because:** one line — concrete connection to stated goals

If goal-alignment is unclear → STOP. Surface to みや with the gap before continuing.

### Step 2 — Skill inventory check

Run two greps:
- `Grep '<concept-keywords>' .claude/skills/*/SKILL.md` — does a skill name or description match this behaviour?
- `Grep '<rule-snippet>' .claude/personality.md .claude/CLAUDE.md .claude/claude-md-amendments.md quest/quest-protocol.md` — does prose mention it?

Outcomes:
- **Skill exists** → go to Step 3a
- **Prose exists, no skill** → go to Step 3b
- **Neither exists** → go to Step 3c

### Step 3a — Skill exists but didn't fire

Emit Refine Block updating the existing skill with みや's latest feedback. Tighten the trigger phrases. Consider adding a deterministic hook if the skill's behaviour is mechanical (file check, path lookup, command run).

### Step 3b — Prose exists, no skill

This is the "loading ≠ following" gap. Create a new skill at `.claude/skills/<name>/SKILL.md` with:
- `name:` lowercase-hyphenated
- `description:` triggers Claude Code's skill loader; lists the trigger phrases verbatim
- Steps that operationalize the prose rule
- A Hook section identifying whether this is hookable (mechanical → yes; judgment-bound → no)

Move the prose into the skill file as the canonical home; leave a one-line pointer in the original location.

### Step 3c — Net new

Use System-Design Discipline Steps 0-6 (Refine before introducing → decomposition seam → evergreen principles → validation → shape → naming → success measure). Emit Design Memo. Create the skill. みや nods.

### Step 3.6 — Best-Practices Consult (refined 2026-05-25 — "99% compliance lift" slip)

## The Iron Law

```
NO STEP 4 PROPOSAL EMITS WITHOUT BOTH AUDITS COMPLETE
```

Two parallel audits MUST complete BEFORE any Refine Block / Design Memo emit (Step 4). Skipping either = the proposal is invalid; withdraw and re-route through Step 3.6.

**Violating the letter of this step is violating the spirit of this step.**

### 3.6a — Content audit (architectural changes only — preserves original Task #25 rule)

For architectural changes (not small refinements): consult `library-items/agent-architecture/claude-code-best-practices.md` Section H for industry-pattern alignment. For frontier/novel patterns: brief WebSearch on LangGraph / AutoGen / CrewAI / MetaGPT / DSPy / Reflexion equivalent.

Surface inline: "Industry pattern X says Y; we're aligned/diverging because Z." If our approach diverges from industry without explicit reason → revisit shape decision.

### 3.6b — Wording-shape audit (MANDATORY for ALL skill / always-on-rule changes — NO scope exemption)

**Trigger**: every refine or new emit touching `.claude/skills/*/SKILL.md`, `.claude/CLAUDE.md`, `personality.md`, `claude-md-amendments.md`, `quest/quest-protocol.md`, `system/*`, or any always-on-rule file. **No "small refine" bypass.**

**Why no scope exemption**: compliance research (Meincke et al. 2025, N=28,000 LLM conversations) shows wording loaded with Authority / Commitment / Scarcity principles lifts agent compliance from **33% → 72%** on the same semantic content. Every refine compounds. Skipping the audit on "small" changes silently bleeds 2.2× effectiveness across the system-layer — the exact failure mode that caused this Step 3.6 refine.

**Required consult sources**:
- `library-items/agent-architecture/claude-code-best-practices.md` Section A — Anthropic-official skill authoring: description ≤500 chars preferred (1024 hard cap) · lead with "Use when X" · NEVER summarize workflow in description · progressive disclosure · 500-line body ceiling
- Persuasion principles (Authority / Commitment / Scarcity — Meincke 2025; canonical mirror until folded into our reference: `~/.claude/plugins/cache/claude-plugins-official/superpowers/<version>/skills/writing-skills/persuasion-principles.md`)

**Required emit BEFORE the Step 4 proposal** — a wording-shape audit table:

| Dimension | Current draft | Anthropic / research recommendation | Verdict |
|---|---|---|---|
| Description leads with "Use when X" | ... | "Use when..." per docs.claude.com best-practices | ✓ / ⚠️ / ✗ |
| Description length | N chars | <500 chars preferred (1024 hard cap) | ✓ / ⚠️ / ✗ |
| Description summarizes workflow | yes / no | NEVER — causes Claude to follow summary instead of reading skill body | ✓ / ⚠️ / ✗ |
| Trigger-keyword coverage | yes / no | Required — list phrases Claude would search for | ✓ / ⚠️ / ✗ |
| Authority-language density (MUST / NEVER / Iron Law / No exceptions) | ... | High for discipline skills; research-validated 2.2× compliance lift | ✓ / ⚠️ / ✗ |
| Rationalization table present (`\| Excuse \| Reality \|`) | yes / no | Required for discipline skills — pre-empts agent's own justifications | ✓ / ⚠️ / ✗ |
| Red Flags - STOP section present | yes / no | Required for discipline skills — discrete self-check phrases | ✓ / ⚠️ / ✗ |
| "Violating letter = violating spirit" clause | yes / no | Required for discipline skills — closes spirit-vs-letter rationalization | ✓ / ⚠️ / ✗ |
| Time-stamps / slip history embedded in description | yes / no | NEVER — Anthropic: avoid time-sensitive info in description; move to body History section | ✓ / ⚠️ / ✗ |

Any row with **✗** → revise wording BEFORE Step 4 emit. **⚠️** rows surface inline with rationale for the divergence.

### Red Flags — STOP if you catch yourself thinking:

- "We already have something similar, the wording is fine" — effectiveness ≠ ownership; audit anyway
- "Best-practices means content comparison" — NO; it means BOTH content (3.6a) AND wording-shape (3.6b)
- "The Refine Block IS the proposal, audit can happen after" — NO; audit precedes emit
- "It's a small refine, wording-shape doesn't matter" — compliance compounds; small refines that violate wording-shape decay the surrounding rules they sit next to
- "Wording-shape audit only applies to skills, not to CLAUDE.md / personality.md rules" — NO; same parahuman model applies to all prose Claude reads
- "The hook fired its route, that's enough" — the hook routes; the audit contents are still on Ruri. Hook ≠ audit
- About to emit Step 4 (Refine Block / Design Memo) without the wording-shape audit table

**ALL of these mean: STOP. Run 3.6b audit. Re-emit proposal.**

### Excuse | Reality

| Excuse | Reality |
|---|---|
| "It's a small refine, wording doesn't matter" | Compliance research: 33% → 72% with proper wording. Compounds across every refine |
| "I'll audit wording after I see if the content lands" | Wording is what makes content land. Audit comes BEFORE proposal emit |
| "Anthropic best-practices applies to skills, not rules" | Same parahuman model applies to all prose Claude reads. Audit both |
| "We don't have context / time for the consult" | The consult IS the time-save. Re-rolling a wrong-shape rule costs more |
| "I'll add it next time / pending in audit-log" | Audit-log is a changelog, not permission. Defer = decay |
| "The user can review and catch it" | みや already caught one — that's THE slip. Don't make him the QA |
| "The hook fired, the audit must have happened" | The hook routes; the audit contents are still on Ruri. Verify both ran |

### Step 4 — Hook wiring (when applicable)

If the missed behaviour can fire deterministically — e.g. "after every Edit to source code, run X check" — write the corresponding hook script under `.claude/hooks/<name>.js` and register it in `.claude/settings.local.json`. Hooks bypass the model and fire 100% of the time.

### Step 4.5 — Fire-on-the-trigger (added 2026-07-03, audit E10 — C-walk pattern #4, 2 strikes)

The refined/created skill or hook MUST be invoked/exercised on the VERY ticket/turn that triggered the refinement, in the SAME session — a defender built but not fired on its own trigger case is unvalidated. QA-262004 (annotations skill built same session, not run on the ticket) + QA-262039 (checklist refined same session, not invoked on the ticket) are the proof strikes. Emit: `Fire-on-trigger: <component> exercised on <ticket/case> ✓` or the explicit reason it cannot be (e.g. ticket already closed).

### Step 5 — Failure log entry + tiered escalation (refined 2026-05-25 — "12 days unacceptable" slip)

## The Iron Law

```
NO SLIP CLOSES WITHOUT SLIP-LOG ENTRY + RUNNING-COUNT TABLE UPDATE
```

Every Step 5 invocation MUST (a) append a row to `system/slip-log.md` (the canonical home — `Feature/Forge-Self-Improvement-System/skill-failure-log.md` is tombstoned), (b) increment the running-count table at the TOP of `system/slip-log.md` by BOTH `root_category` AND `skill_path`, (c) check the tiered escalation thresholds below + emit the escalation banner if any threshold tripped.

**Violating the letter of this step is violating the spirit of this step.**

### Tiered escalation thresholds (mandatory check after every entry)

| Pattern | Threshold | Action |
|---|---|---|
| Same `root_category`, **2 strikes in same session** | 🚨 **IMMEDIATE escalation** | STOP the refine cycle. Design failure detected — the latest refine did not fix the structural gap. Surface to みや with: "this root_category is structurally undefended; propose redesign options before next attempt." Do NOT add another refine to the same skill. |
| Same `root_category`, **2 strikes in 7 days** | ⚠️ **Same-day escalation** at session-end DE | Redesign the root-cause defender, don't add another wording refinement. |
| Same `root_category`, 3 strikes in 14 days | ⚠️ Escalation | Same as above; retained for older slip patterns with longer cadence. |
| Same `skill_path`, **2 strikes in same session** | 🚨 **Skill-design failure** | The skill's design is wrong, not its wording. Redesign the skill's SHAPE (scope / decomposition / triggers structure), not add another trigger phrase. |

### Slip-log entry format (canonical)

Append to `system/slip-log.md` under the current date's section:

```
| YYYY-MM-DD (context) | <slip, 1 paragraph + Lesson:> | <root_category from schema enum> | <existing_rule cited file:line> | <action: refined-skill / new-skill / new-hook / refined-hook> | <system-layer-relevant: ✅ Yes / ⚠️ Partial / ❌ No> |
```

### Running-count table (auto-readable, updated every entry)

At the top of `system/slip-log.md` (after the Schema section), maintain a table:

| Root category | Last 30 days | Last 7 days | This session | Status |
|---|---|---|---|---|
| (per root_category from schema enum) | N | N | N | ✓ / ⚠️ (≥2/7d) / 🚨 (≥2/session) |

**Status icons** — `✓` = no recent strikes · `⚠️` = at-threshold (warning) · `🚨` = over-threshold (escalation triggered).

Update mechanism: v1 = Ruri updates manually as part of Step 5. v1.1 = `slip-count-tracker.js` PostToolUse hook on Edit/Write of `system/slip-log.md` parses the appended row, increments counts, rewrites the table. v1.1 deferred until first proven need.

### Red Flags — STOP if you catch yourself thinking:

- "It's only 2 strikes, the rule says 3" — NO; the rule now says 2-in-session = escalate immediately
- "Different skills failed, so the root_category count isn't really 2" — NO; root_category is the cluster axis, not the skill name
- "I'll update the running-count later" — NO; same-emit update is mandatory, "later" = decay
- "The strike was technically a different shape" — if it maps to the same root_category in the schema, it counts; don't sub-categorize to dodge
- "Escalation means I have to do a big redesign now" — escalation means STOP the refine cycle + surface; the redesign decision is みや's, not yours
- About to write a slip-log entry without updating the running-count table

**ALL of these mean: STOP. Update the running-count. Check thresholds. Escalate if tripped.**

### Excuse | Reality

| Excuse | Reality |
|---|---|
| "Strike 2 in one session is just bad luck" | Bad luck twice in one session is structural failure, not luck. Escalate. |
| "Running-count table is bureaucracy" | Without it, "count" is fictional — Ruri pretends to remember; numbers drift. Table = single source of truth. |
| "The previous refine just landed, give it time" | The previous refine DIDN'T HOLD — that's the evidence the design is wrong. Don't repeat the same shape. |
| "I'll wait for DE close to update the count" | Update at every entry, not batched. Batched = forgotten. |
| "Per-skill count is enough; root_category is double work" | Per-skill misses cross-skill design failures (today: 2 different skill creations failed for `best-practices-not-consulted`). Both axes mandatory. |
| "12 days is the protocol" | 12 days was wrong. The refined protocol is in-session / 7-day. みや: "even 3 sessions is unacceptable." |

### Step 5.5 — Skill-card table (MANDATORY emit on every skill/feature build — added 2026-06-26, みや)

At any skill / hook / Power / feature build (the Step 3a/3b/3c/4 emit), ALWAYS show this table — one row per component built:

| Skill / feature | What it solves | How it works |
|---|---|---|
| `<name>` | <the slip / gap it closes, plain language> | <trigger → action → enforcement layer (hook / skill / advisory)> |

みや reads this to know at a glance what each component IS without opening it. **Banned:** shipping a skill / hook / Power without its skill-card row in the same turn.

### Step 6 — Visible report

Emit a 3-line summary at the END of the chat response that triggered this skill:

```
Auto-skill ✓ — <missed behaviour>
  ↳ Action: <new-skill / refined-skill / new-hook> at <path>
  ↳ Failure-log entry written. Current count for this rule: N
```

## Failure-rate tracking format

**Canonical home**: `system/slip-log.md` (replaced `Feature/Forge-Self-Improvement-System/skill-failure-log.md` per Phase 8 tombstone).

Format: appended-only entries + running-count table at top (per Step 5 refined 2026-05-25). Counts maintained by both `root_category` and `skill_path`. Tiered escalation thresholds fire automatically at write-time:
- 🚨 2 strikes same session → immediate STOP + surface
- ⚠️ 2 strikes / 7 days → same-day escalation
- ⚠️ 3 strikes / 14 days → escalation (legacy threshold)

みや reviews at Forge Review intervals; escalation fires at write-time without waiting for review.

## What this skill explicitly does NOT do

- Does not auto-create skills for one-off mistakes that are not rules (e.g. typos, single-instance miscommunication)
- Does not fire on positive feedback ("good", "thanks", "yes") even if it contains a "you" pronoun
- Does not replace the existing Refine Block / Design Memo discipline — it runs the same discipline at correction-time

## Lifecycle

- **v1 (now)** — Manual + auto-detection of trigger phrases. みや explicitly nods each spawn.
- **v1.1** — Trigger phrase auto-detection moves to a `UserPromptSubmit` hook for deterministic firing
- **v2** — Skill creation runs without per-spawn nod (after ≥3 successful cycles)

---

*Created 2026-05-20 by みや (asked) + Ruri (built). The single most important skill in the moment of correction — its job is to make the next correction not need to happen.*

*Version: 2 | Last updated: 2026-05-25 — Step 3.6 promoted from `Comparative-systems check` (architectural-only content audit) to `Best-Practices Consult` (dual audit: 3.6a content + 3.6b wording-shape, latter mandatory for ALL skill/rule changes with no scope exemption). Refine triggered by 99%-compliance-lift slip 2026-05-25 — bypass via "small refine" scope was the structural gap. Modeled Authority-loaded forcing-functions (Iron Law + Red Flags + Excuse table) inside the refine itself to demonstrate the wording-shape the new step requires.*

*Version: 3 | Last updated: 2026-05-25 (same day) — Step 5 refined: tiered escalation thresholds replace 3-in-14-days flat (now: 2-in-session = IMMEDIATE escalate; 2-in-7-days = same-day; 3-in-14-days retained for legacy). Counts now by BOTH root_category AND skill_path. Running-count table mandated at top of `system/slip-log.md` (canonical home; skill-failure-log.md is tombstoned). Authority-loaded styling + Red Flags + Excuse table added per Step 3.6b. Refine triggered by 2-strikes-in-one-session on best-practices-not-consulted today; みや: "even 3 sessions is unacceptable."*
