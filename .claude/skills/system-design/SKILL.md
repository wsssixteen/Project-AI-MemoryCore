---
name: system-design
description: Agentic system design — for designing our layered instruction system (CLAUDE.md + skills + hooks + evals + protocols). Triggers — "/system-design", "design this", "system design", "design a feature", "how should we build X", "design discipline", before adding any new skill / hook / rule / Feature.
---

# /system-design — Agentic System Design

Designs OUR specific system: the layered instruction architecture (CLAUDE.md ↔ skills ↔ hooks ↔ evals ↔ protocols).

Builds on `/system-rules` (universal disciplines apply FIRST — invoke that as a filter, then this for agentic specifics).

## Feature — the trinity primitive (renamed from "Power" 2026-07-03 per みや, audit E14 — the doc already used domain/<feature-name>/ + feature.skill.md; the folder convention won)

Every behavior we design is a **Feature**: a co-located skill + hook + eval in a single folder.

```
domain/<feature-name>/
├── README.md                  ← what fires when, the contract
├── feature.skill.md           ← THE PROCEDURE (when invoked)
├── trigger.hook.js            ← FRONT GATE (UserPromptSubmit guard)
├── discipline.hook.js         ← BACK GATE (Stop-side verification, optional)
├── eval.workflow.js           ← VERIFIER (when behavior matters)
└── log.jsonl                  ← INSTRUMENTATION (per /system-rules Rule 5)
```

Pieces are OPTIONAL — some Features are hook-only (no skill), some skill-only (no gate). The folder structure makes presence/absence audit-visible.

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

6. **Ship with eval — and RUN it before shipping; REFINEMENTS included (HARD gate; v1.2 extended 2026-07-06 per みや)** — a new Feature / hook is **NOT shipped until its `eval.workflow.js` — or, for a trivial hook, a one-run SMOKE-TEST (register it, trigger it once, confirm it does what it claims AND does not misfire) — has been RUN and PASSED this session.** **Registering a hook in `settings.json` with zero eval AND zero smoke-test is BANNED.** No eval-run = not shipped, even when the code reads correct — code-exists ≠ behaviour-verified (same principle as `veritas-claim-gate`). Re-run the eval when refactoring touches the Feature. **Why hardened**: `auto-commit-docs.js` was registered 2026-07-01 with neither an eval nor a smoke-test; on Windows it flashed a cmd window every turn (no `windowsHide`) and committed telemetry logs as junk — both defects a single smoke-run would have caught. It cost a full incident + a retirement (`system-architecture.md §3.13`).

   **🚨 v1.2 — the gate ALSO fires on PHRASE REFINEMENTS of any existing skill / hook / protocol / rule text (not only new builds).** Every such change passes THREE checks before it is done:
   - **(a) Spec preservation** — snapshot the specs the prior wording encoded; diff against the new wording; every dropped spec is NAMED + JUSTIFIED in the version-stamp / changelog entry (the existing version-bump discipline is the home — no new artifact). Judgment-bound; the auditable artifact is the entry.
   - **(b) Fire check** — fixture eval (or smoke-run) asserts the hook/rule actually FIRES: exit code + decision, not file-exists.
   - **(c) Effect check** — the fixture asserts the rendered output (block reason / advisory text) reaches the surface — exit-0 alone is NOT proof the message rendered.

   "Just clarifying the wording" is NOT exempt — rephrase-drift is how specs silently vanish (2026-07-06: the speak-in-categories rule was found in 4-7 divergent framings after repeated re-saves). Bypass for genuinely trivial edits (typo / comment-only / doc reflow): `[skip-rule-6: <reason>]`.

7. **Pick the primitive — hook-only / skill-only / hook+skill / full trinity** — justify the chosen layer. Don't ship full trinity when hook-only suffices (premature ceremony per /system-rules Rule 4 "start simple"). Add layers when evidence demands.

8. **Specify the trigger MOMENT — fire at the precise point of need, not the broadest event** (みや 2026-06-28). Every Feature's design MUST name WHEN/WHERE it fires and justify it is the LEANEST trigger that catches the need. SessionStart + every-UserPromptSubmit are the broadest, highest-bloat events — default to a NARROWER trigger (a specific skill step like `/quest resume`, or a UserPromptSubmit guarded by a tight predicate) unless the behaviour genuinely must run every boot/turn. **Test**: "would this be just as effective firing only at the moment X actually happens?" → if yes, trigger at X, not at boot. **Why**: checklist-reactivate first shipped as a SessionStart hook → dumped every quest's checklist at every boot = bloat; the right trigger was `/quest resume` (the moment you re-engage a ticket). Complements Rule 7 — Rule 7 picks the LAYER, this picks the TIMING.

9. **🚨 Nuke-marker on newly-created Features — every new Feature ships a `NUKE-MARKER.md` file** (HARD RULE, added 2026-07-07 per みや). Every new Feature folder (`domain/<name>/`) created in a session MUST include a `NUKE-MARKER.md` at the folder root before the commit lands. **Purpose**: みや can nuke a bad Feature in one grep + one command, without hunting through `settings.json` + `system/system-architecture.md` + cross-refs to find every trace. New = untrusted; the marker IS the trust ledger.

   **Required content** (5 fields, table form):

   ```
   # NUKE-MARKER — <feature-name>

   | Field | Value |
   |---|---|
   | Created  | YYYY-MM-DD |
   | Session  | one-line what triggered this Feature (root symptom, quest ID, or user ask) |
   | Files    | every file this Feature added (folder + settings.json entry + doc-catalog rows) |
   | Rollback | exact commands: `rm -rf <folder>` + `settings.json` entries to remove + `git revert <SHA>` |
   | Retire   | YYYY-MM-DD (default: creation + 30 days) — remove this file if Feature has fired ≥1× in window AND no rollback |
   ```

   **Enforcement**:
   - Grep test: `grep -rl "NUKE-MARKER" domain/` returns every Feature not yet trusted. Zero results = whole `domain/` catalog has aged into trusted.
   - Rule 6 v1.2 hook fixture-eval SHOULD add a `nuke-marker-present` assertion (a Feature folder without a `NUKE-MARKER.md` is a build defect — same tier as missing eval).
   - `system-rules` Rule 5 (audit logging) pairs: `NUKE-MARKER.md` (human rollback recipe) + `log.jsonl` (fire-history evidence) → decide retirement together at Domain Expansion Step 6 (Forge review).
   - Retirement happens automatically at Domain Expansion once all three retire-conditions hold (creation ≥ 30d ago AND `log.jsonl` shows ≥ 1 fire AND no rollback event) — the marker file is deleted, the Feature is trusted, catalog moves on.

   **Banned**: shipping a new Feature without the marker (loud detection at Rule 6 v1.2 fire-check) · deleting a marker before the 30-day + 1-fire condition holds (premature trust) · writing the marker AFTER commit (must land in the same commit that adds the Feature).

   **Why**: `stop-point-summary` shipped in commit `90e961d` with settings.json entry + skill refinement + architecture-doc row + skill-failure-log row scattered across 4 files. If it turns out to hard-block correctly-shaped replies, みや currently has to grep-and-delete across those 4 places to reverse it. One `NUKE-MARKER.md` = one grep + one `cat` + one paste of the rollback block into the shell. Grace period is 30 days because that's the DE cadence used for other decay-audits — Feature has to prove it fires + isn't rolled back within one meta-audit cycle.

## Bloat-prevention default

When refining any `/skill` or CLAUDE.md content: apply `/system-rules` Rule 2 (merge in place). The `claude-md-edit-guard.js` hook enforces this deterministically on edits to CLAUDE.md / /system-rules / /system-design.

*Version 2.0 — 2026-06-02. Complete rewrite. Old version (197 lines mixed universal + agentic) split into /system-rules (universal background) + this (agentic-specific specialization). Naming convention "Power" locked per みや 2026-06-02; RENAMED to "Feature" 2026-07-03 per みや (audit E14).*

*Version 2.1 — 2026-07-02. Rule 6 hardened into a HARD pre-ship gate: a hook's eval OR a one-run smoke-test MUST be run + PASS before it is registered in settings.json. Per みや after the `auto-commit-docs` no-eval incident (shipped 2026-07-01, retired 2026-07-02).*

*Version 2.2 — 2026-07-06. Rule 6 → v1.2: gate extended to PHRASE REFINEMENTS of existing skills/hooks/protocols/rules — three checks (spec-preservation diff into the version-stamp entry · fire check via fixture eval · effect check asserting rendered output). Per みや (QA-268415 session, after the speak-in-categories rule was found fragmented into 4-7 framings by repeated re-saves). Spec-preservation self-check on THIS edit: all 5 v1.1 specs preserved (pre-ship eval mandate · settings.json-registration ban · code-exists≠verified · re-run-on-refactor · auto-commit-docs why); zero dropped.*

*Version 2.3 — 2026-07-07. Rule 9 added: HARD RULE that every new Feature ships a `NUKE-MARKER.md` at the folder root — grep-findable rollback recipe with 5 fields (Created / Session / Files / Rollback / Retire date). Grace period 30 days; marker auto-removes at Domain Expansion when the Feature has fired ≥1× AND no rollback. Per みや after the `stop-point-summary` ship (commit `90e961d` scattered rollback state across 4 files — one `NUKE-MARKER.md` would centralize it). Retro-applied to `domain/stop-point-summary/NUKE-MARKER.md` same commit. Spec-preservation self-check on THIS edit: all Version 2.2 specs preserved (Rules 6/7/8 unchanged); Rule 9 is additive.*
