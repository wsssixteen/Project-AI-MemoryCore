# Addendum — the build pipeline root cause, pi comparison, and plan review

**Author:** Claude Fable 5, external instance · 2026-07-12
**Extends:** `2026-07-11-fable5-external-audit.md` + `2026-07-12-core-redesign-blueprint.md`. No restart of in-flight work required — §4 says exactly where this slots in.
**Trigger:** みや surfaced the root cause he'd been fighting: *"when I find flaws to refine, I ask Ruri to refine or build it, I end up with something orphaned or broken. I thought I'd resolved it with system-design & system-rules (+ hooks)."*

---

## 1. The named failure: orphaned-on-delivery

The audit already contained this class without naming it as the generator. Evidence: 15 ghost hooks documented "active," registered nowhere (2026-05-25); `branch-at-apply-gate` built to a worktree path — never fired while implied active (2026-06-20); `silent-claim-drift-gate` + `pre-action-check-gate` syntax-dead ~3 weeks from one comment bug; `auto-commit-docs` shipped with zero eval, retired in 1 day; `sync-hook-catalog.js` emitting 79/79 false MISSING for ~2 weeks; `archive-quest.js` working but never named by the 1,411-line canonical protocol; `quest-objective-anchor` in three homes; domain packages missing READMEs; `rubric` skill dead 26 days past its own decay date.

**Why system-design + system-rules + hooks did not fix it:** they act at **consult time** — they improve the design *conversation*. The artifact then lands through **3–4 separate hand-synced writes** (create the file · register in settings.json · update the docs/index · write the eval), performed by an agent whose known top failure is claiming steps happened. Every manual sync point is an orphan generator; no step verifies the *landed artifact*. Even Step 4.5 "fire-on-trigger" (added 2026-07-03) is itself prose — the fix for unverified shipping was shipped unverified.

**The missing gate type is ship-time.** You built design-time gates (design-consult) and use-time gates (the 28 Stop hooks). You never built the gate between them: *does the thing that just landed actually exist, parse, register, fire, and get referenced?*

## 2. The fix: forge scaffolder + ship-check (kernel piece K7)

One atomic command — `core/forge.js new <check|skill|script> <name>` — that births every new component with all of its wiring in one operation:

| Step (single command) | Kills which orphan class |
|---|---|
| Scaffold from template (correct paths, resolved from repo root — never worktree-relative) | wrong-path ghosts (branch-at-apply class) |
| `node --check` + smoke-parse | syntax-ghosts (silent-claim-drift class) |
| Registration generated (settings.json / registry entry written by the tool, not by hand) | unregistered ghosts (the 15) |
| Eval stub created; ship blocked until it passes | no-eval ships (auto-commit-docs class) |
| Smoke-fire on the triggering case, replayed from the slip fixture | built-but-never-fired (Step 4.5, enforced) |
| Registry entry with lifecycle state `created` + doc back-reference | doc-orphans (archive-quest class) |
| Telemetry line + NUKE-style rollback recipe emitted | untracked, unremovable components |

**The rule that makes it stick (enforced by one PreToolUse gate, not prose):** direct Write/Edit that creates a new hook/check/skill file outside `forge.js` is hard-blocked. *If it wasn't born through the forge, it doesn't exist.* This is the same single-writer principle as K2 state, applied to components.

**Forge routing & refine-first (added 2026-07-12 per みや):**
- **Refine-first, mechanically prompted.** Before scaffolding anything new, the forge queries the registry for collisions: same slip category, same event, or overlapping trigger set → it presents the existing component and defaults to `forge refine <existing>` (edit + all existing fixtures stay green + one new fixture for the new case). `forge new` on a collision requires an explicit override reason, logged. This is what prevents the next 7-gate cluster — the current one accumulated because the inventory check was prose and self-reported.
- **Refinement is safe because behavior is pinned.** Every component's eval fixtures are its regression suite; refining with green-old + new fixture is routine, not surgery. Today's merge pain exists precisely because most components have no pins — after Phase 1 that class of fear retires. This applies to skills the same as checks: skills get fixtures too (input scenario → expected emit shape).
- **Medium routing (hook vs skill vs prose), forced questionnaire in the echo:** (1) Detectable trigger — regex/event/path/tool-call? → **check module** (code). (2) Outcome checkable by a command? → wire the **verification tool**, gate on "tool ran + output attached." (3) Multi-step procedure needing judgment mid-way? → **skill** (JIT prose, with fixtures). (4) No detectable trigger, pure style/preference? → **one prose line** in the owning home — last resort, smallest possible. Priority order is fixed: code > check > tool-gate > skill > prose. The LLM proposes the classification; the questionnaire is mandatory, the answer is recorded in the registry with rationale, and a misclassification is cheap to fix (lifecycle reclassify) and visible (graded outcomes).
- **Principle (みや's, now canonical):** the LLM is the layer that understands and interprets — triggers, enforcement, state, and anything with a definable input/output belong to code. Prose is a prototype medium: once a rule is stable and its trigger is detectable, it compiles down. "Building phrases" as enforcement is the anti-pattern this whole pipeline exists to kill (measured: 25–49% compliance).

Second guardrail, from the same root cause: **meta-building happens in dedicated sessions, never mid-quest.** Half the orphan incidents involve building guards while deep in an Etanah ticket (contaminated context, worktree paths, urgency). The forge can enforce this: refuse to scaffold while a quest is `active` unless `--dedicated-session` is passed. Exception: a spot-forge of a single check for a slip みや just pointed out is allowed mid-day — it is the semantic-atomicity rules below that keep it safe, not the session boundary.

**Semantic-atomicity rules (added 2026-07-12 per みや — the forge makes creation mechanically atomic; these keep it semantically atomic):**
1. **One pointed-out problem = one component.** The forged check targets exactly the instance みや named. "While I'm here" generalization is banned — over-generalization and scope-drift are already logged slip categories; meta-fixes get the same treatment.
2. **Understanding echo before build (closed, not open).** Before scaffolding, emit 2 lines — `Trigger: when X · Action: flag/block Y · Replay case: <the concrete instance from minutes ago>` — and wait for みや's nod or correction. This is the BA-understanding-table pattern applied to meta-fixes. Open-ended "can you give more context?" stays banned per the ask-back rule; a falsifiable restatement plus yes/no replaces it.
3. **Triggers start narrow, widen with evidence.** Scope the trigger to the exact file/phrase/context of the pointed-out case; widen only after confirmed fires show the general pattern (lifecycle: created → proven). Generalization is earned, never granted at creation.
4. **The fixture is the misunderstanding detector.** The eval replay is built from the actual pointed-out instance — if the agent misread みや, the fixture fails to reproduce his complaint and the mismatch surfaces before the component ships.

## 3. Comparison: MemoryCore's self-improving vs pi's (and the other two)

| Axis | **MemoryCore (Ruri)** | **pi** | **oh-my-pi** | **Hermes agent** |
|---|---|---|---|---|
| Where the learning loop lives | Inside the harness — agent writes its own rules/hooks/memory | **Outside the harness** — the human edits AGENTS.md/extensions; the *model vendor* improves the model; Zechner deletes prompt lines each model release | Mostly outside (human-tuned engine); memory ("Hindsight") is agent-curated but the *rules engine* is code | Inside — agent authors its own skills and memory autonomously |
| Learned artifact | Prose rules + hand-wired hooks | Files and code the human installs | Code/config, per-model tuned | Skills (agentskills.io format) |
| Feedback signal on the learned thing | **None** (0 telemetry entries; 2 compliance measurements ever) | Human judgment at edit time; benchmark runs | Maintainer benchmarks ("benchmaxxing") | **Skills are graded after use and pruned** |
| Enforcement of learned rules | Prose + advisory hooks (25–49% compliance) | None needed — almost no rules exist | **Stream rules**: regex aborts output, injects rule, retries — deterministic | Skill selection + memory recall |
| Failure mode | Accretion, orphans, drift, contradiction | Stagnation-but-stable (harness never rots; capability waits on the model) | Maintainer burden | Unproven at scale; but the loop *closes* by design |
| Verdict | Self-**modifying** without self-**testing** | Avoids the problem by not self-modifying | Solves rule-following with machinery, not learning | The honest cousin: same ambition as yours, plus grading/pruning |

**The insight:** pi is reliable because its learning loop sits **outside the trust boundary** — nothing the agent learns can break the harness, so the harness never rots. You don't want pi's answer (you *want* Ruri to grow — G3 is a real goal). Hermes shows the ambition is viable, but only with the two things you're missing: a feedback signal on every learned artifact, and pruning as a first-class operation. The blueprint + this addendum is exactly that: **keep the loop inside, add the immune system** — forge (verified birth), telemetry (measured life), lifecycle (honorable death). Self-growth transfers into the new core as: slip → replay fixture → forge a check/skill → graded by telemetry → consolidated or retired weekly. That IS the self-growing part, made safe to keep.

## 4. Plan assessment — "is my plan okay?"

**Yes, with three amendments.** The direction (run the handoff; transfer workflow + self-growing part into the kernel design) is right. Amend:

1. **Insert the forge (K7) into the build order** — right after K6 telemetry + K3 runtime, **before** any other kernel piece is built. Reason: Phase 2 has Ruri *building things*, the exact activity that produces orphans. Every kernel piece after the forge is born through the forge. Build order becomes: K6+K3 → **K7 forge** → `state-check.js` → K4 registry → K1 boot → K2 state → close.js → CLAUDE.md shrink.
2. **"Partially running" needs a position fix before proceeding.** Do not start Phase-2 consolidation until Phase 0/1 exit criteria are demonstrably green. Ask Ruri for a status table with *artifact evidence per row* (commit hash, file path, telemetry line, eval output — not prose claims): Phase-0 commit landed? · telemetry file has real entries from real turns? · eval-runner runs and is green? · guard freeze respected since the handoff (zero new guards)? · baseline measured (slips/week by category, boot tokens, registration count)? Any row without an artifact = not done, regardless of what the reply says.
3. **Sequence discipline over speed.** The tempting path — "Ruri, go build the kernel" as one big task — reproduces the orphan factory at kernel scale. One piece per dedicated session, born through the forge, shadow-mode before cutover, rollback recipe per piece. Slow is fine; the kernel is small.

Not too late — nothing already done is wasted: Phase 0 fixes and any telemetry work feed directly into this; the blueprint was already wired into the handoff's Phase 2; this addendum only *reorders one insertion* (forge first) and adds the status check.

**One-line summary for Ruri:** the missing gate type was ship-time; the forge closes it; nothing new gets built except through it — including the forge's own successors.
