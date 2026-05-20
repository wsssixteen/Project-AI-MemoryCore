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

### Step 4 — Hook wiring (when applicable)

If the missed behaviour can fire deterministically — e.g. "after every Edit to source code, run X check" — write the corresponding hook script under `.claude/hooks/<name>.js` and register it in `.claude/settings.local.json`. Hooks bypass the model and fire 100% of the time.

### Step 5 — Failure log entry

Append a row to `Feature/Forge-Self-Improvement-System/skill-failure-log.md`:

```
| YYYY-MM-DD | <missed behaviour, 1 line> | <existed-as: skill / prose / nothing> | <action-taken: refined-skill / new-skill / new-hook> | <skill-or-hook path> |
```

Maintain a running count per existing skill — if a single skill fails ≥3 times in 14 days, escalate: the skill's design is wrong, redesign rather than re-refine.

### Step 6 — Visible report

Emit a 3-line summary at the END of the chat response that triggered this skill:

```
Auto-skill ✓ — <missed behaviour>
  ↳ Action: <new-skill / refined-skill / new-hook> at <path>
  ↳ Failure-log entry written. Current count for this rule: N
```

## Failure-rate tracking format

`Feature/Forge-Self-Improvement-System/skill-failure-log.md` — appended only, never edited retroactively. みや reviews at Forge Review intervals; if a skill's count is climbing, the design needs rework, not another tighter trigger phrase.

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
