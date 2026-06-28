---
name: system-design
description: Agentic system design — for designing our layered instruction system (CLAUDE.md + skills + hooks + evals + protocols). Triggers — "/system-design", "design this", "system design", "design a feature", "how should we build X", "design discipline", before adding any new skill / hook / rule / Power.
---

# /system-design — Agentic System Design

Designs OUR specific system: the layered instruction architecture (CLAUDE.md ↔ skills ↔ hooks ↔ evals ↔ protocols).

Builds on `/system-rules` (universal disciplines apply FIRST — invoke that as a filter, then this for agentic specifics).

## Power — the trinity primitive

Every behavior we design is a **Power**: a co-located skill + hook + eval in a single folder.

```
domain/<feature-name>/
├── README.md                  ← what fires when, the contract
├── feature.skill.md           ← THE PROCEDURE (when invoked)
├── trigger.hook.js            ← FRONT GATE (UserPromptSubmit guard)
├── discipline.hook.js         ← BACK GATE (Stop-side verification, optional)
├── eval.workflow.js           ← VERIFIER (when behavior matters)
└── log.jsonl                  ← INSTRUMENTATION (per /system-rules Rule 5)
```

Pieces are OPTIONAL — some Powers are hook-only (no skill), some skill-only (no gate). The folder structure makes presence/absence audit-visible.

## Layering doctrine

| Layer | Role | Reliability |
|---|---|---|
| CLAUDE.md | Boot-loaded awareness · triggers · cross-refs | ~60% (decays w/ context length) |
| Skill | Procedure with state; description-matched invocation | ~80% (gated by Skill tool invocation) |
| Hook | Deterministic enforcement at event | ~100% (harness-enforced) |
| Eval workflow | Verification scoring | adds trust signal |
| Protocol.md | Source-of-truth detail (on-demand reference) | when read |

Each layer ADDS reliability without replacing the previous. Promote a behavior from prose → skill → hook based on observed slip rate, not pre-emptively.

## Trigger reliability discipline

Every hook's regex predicate is documented + tested. False-positive cost named explicitly. Phrase-list additions require:
- (a) ≥2 observed misses in slip-log OR みや explicit ask
- (b) documented rationale + みや nod

## Decay protocol

Components fade if unused. Periodic audit (per /system-rules Rule 3): check hook-fire-log · skill-invocation counts · slip-log mentions. Triage per fire-rate × effectiveness matrix:

| | HIGH effectiveness | LOW effectiveness |
|---|---|---|
| **HIGH fire-rate** | KEEP | REDESIGN |
| **LOW fire-rate** | KEEP RARE | DELETE |

## Two agentic-specific rules (moved here from /system-rules)

6. **Ship with eval when behavior reliability matters** — new Power ships with `eval.workflow.js` that scores its behavior. PASS/FAIL baseline. Re-run when refactoring touches the Power. Demonstrated this session: line 190 + line 191 merge-in-place trims scored PASS via workflows `wdw2beqd5` + `wchns1n2r`.

7. **Pick the primitive — hook-only / skill-only / hook+skill / full trinity** — justify the chosen layer. Don't ship full trinity when hook-only suffices (premature ceremony per /system-rules Rule 4 "start simple"). Add layers when evidence demands.

8. **Specify the trigger MOMENT — fire at the precise point of need, not the broadest event** (みや 2026-06-28). Every Power's design MUST name WHEN/WHERE it fires and justify it is the LEANEST trigger that catches the need. SessionStart + every-UserPromptSubmit are the broadest, highest-bloat events — default to a NARROWER trigger (a specific skill step like `/quest resume`, or a UserPromptSubmit guarded by a tight predicate) unless the behaviour genuinely must run every boot/turn. **Test**: "would this be just as effective firing only at the moment X actually happens?" → if yes, trigger at X, not at boot. **Why**: checklist-reactivate first shipped as a SessionStart hook → dumped every quest's checklist at every boot = bloat; the right trigger was `/quest resume` (the moment you re-engage a ticket). Complements Rule 7 — Rule 7 picks the LAYER, this picks the TIMING.

## Bloat-prevention default

When refining any `/skill` or CLAUDE.md content: apply `/system-rules` Rule 2 (merge in place). The `claude-md-edit-guard.js` hook enforces this deterministically on edits to CLAUDE.md / /system-rules / /system-design.

*Version 2.0 — 2026-06-02. Complete rewrite. Old version (197 lines mixed universal + agentic) split into /system-rules (universal background) + this (agentic-specific specialization). Naming convention "Power" locked per みや 2026-06-02.*
