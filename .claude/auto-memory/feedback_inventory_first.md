---
name: Inventory-first — take stock before acting
description: "inventory first; universal rule not per ticket; mechanical not judgment; design from layers; top-down apps; observe vs monitor; RAM footprint; reassess before save"
type: feedback
originSessionId: 5ce2ed82-c59b-45ab-9387-9a2599e90792
---
**Rule**: Before any action on the system — creating a file, proposing a rule, analyzing a problem, designing a framework, writing SQL against a real schema — inventory what already exists in the relevant location. Merge-on-create is one application; check-before-analyze is the other. Both reduce to: *take stock before acting*.

**Why:** リドワンさん flagged this after three failures in one session on 2026-04-15:
1. I proposed `FLOWABLE-BESTIARY.md` parallel to `BUG-BESTIARY.md` when a `Layer:` field would merge them cleanly.
2. I was about to create `DATABASE.md` + `FLOWABLES.md` in `etanah-knowledge/melaka/` when files of that name already existed.
3. I fabricated `umm_a_pemohon` SQL without ever reading the existing `DATABASE.md` that was literally designed with a *"Critical Schema Facts — Never assume otherwise"* section to prevent that class of mistake.

All three failures share one root: **acting before inventorying**.

**How to apply:**
- **Before creating a file**: Glob the target folder. If an existing file's scope overlaps, extend it instead of creating a sibling.
- **Before analyzing a cross-layer bug**: Phase 0 MUST `Glob` + `Read` relevant files in `etanah-knowledge/<state>/`. Not optional. Not "if it seems relevant." Default on.
- **Before writing SQL against a real schema**: grep the target `.sql` dump for the table name. Never rely on pattern-symmetry from another bestiary entry ("saw `umm_a_rizab`, assumed `umm_a_pemohon`").
- **Before proposing a rule or framework**: check `CLAUDE.md`, `feedback_*.md`, `forge-log.md`, existing protocols for overlap. Merge > proliferate.
- **Before introducing a new categorical structure** (bestiary, index, registry, etc.): ask whether an existing structure can absorb the new content with a field or tag (e.g. `Layer:` field instead of a parallel bestiary).
- **Applies to this rule itself**: when tempted to create a new feedback memory, first check if an existing one can absorb it. I expanded `feedback_merge_first_thinking` into this file rather than creating a separate `feedback_check_system_first.md` — because merge-first and check-first reduce to the same principle.

---

## Merged 2026-10-04: Design rules from system architecture, not from last slip (was feedback_design_from_architecture.md)

> Recurring design failure pattern — retrofitting rituals to last failure makes them brittle and overfit; design from layer matrix instead

When designing a new rule/ritual/protocol — especially Phase 0 / debugging / quality rituals — DO NOT design reactively from the latest slip. That produces brittle rituals overfit to one ticket shape that become dead weight on others.

**Why:** みや 2026-05-08 (after QA-260154 ritual scrutinize): "Why do you always design poorly and not take into account those things when I was literally talking about build something for this project? We've already done so many tickets and create many things and you kept making poor designs." Concrete example: the original 8-step Phase 0 ritual (baked 2026-05-07) included "Composite/XHTML wiring read" + "Ralat-message + scope match" as universal steps — both layer-specific (only fit JSF UI tickets with validator+ralat shape). Would have force-fit JSF reads on .docx tickets (#259318, #259759), force-fit ralat-match on Flowable bugs (#259534) and config bugs (#258022). Recurring pattern across multiple system-design attempts.

**How to apply:**
- **Design from system architecture first.** For etanah work, the canonical decomposition is the framework-layer matrix: Java validators/services, JSF XHTML/composite/PrimeFaces, Java config (Template Method overrides), .docx + Word CC, config.json (tindakan/template/flowable), SQL/Hibernate entities, Spring DI, Flowable BPMN. New rules sit on top of this matrix.
- **Pressure-test new rules against ≥3 past tickets BEFORE baking.** Mentally walk through the rule against past closed tickets across different layers. If the rule helps <50% of them, it's Tier 2 (layer-specific extension), not Tier 1 (universal core).
- **State explicitly which past tickets the rule would have helped vs hurt.** Forces evidence-based design instead of plausible-sounding-but-overfit additions.
- **2-tier shape is the default.** Universal core (always applies) + per-layer extensions (apply only when that layer is involved). Skipping a layer extension is EXPLICIT (with one-line reason), not silent.
- **Avoid additive piles.** Each new rule should either (a) extend an existing universal core, (b) add a new layer to the per-layer matrix, or (c) replace an old rule that's been superseded — NOT just stack onto a growing checklist.

**Past tickets to test against** (representative spread across layers):
- QA-258022 (config + Spring service)
- QA-258418 (XHTML composite + Java config flag)
- QA-259318 (.docx + Java populator + Word CC)
- QA-259534 (Flowable BPMN + SQL/Hibernate)
- QA-259759 (.docx + new populator + JSON store)

If a new rule doesn't help at least 3 of these (across different layers), it doesn't belong in the universal core.

---

## Merged 2026-10-04: mechanical-deterministic (was feedback_mechanical_deterministic.md)

> 🚨 ALWAYS-ON: build every feature 100% mechanical & deterministic; model-judgment only where NECESSARY; retrieve/check must be script-over-frozen-data, identical every run

🚨 The target is ALWAYS 100% mechanical & deterministic. Model-judgment (the "translation"/understanding layer) is allowed ONLY where genuinely NECESSARY, and even then run ONCE and freeze.

**Why:** みや 2026-09-20 — "the target is ALWAYS, ALWAYS 100% mechanical & deterministic, unless the NECESSARY translation/understanding humans part, ONLY IF NECESSARY." A feature that answers differently across runs is not trustworthy; "retrieve and check" must return the SAME thing every time.

**How to apply:**
- Split every feature into two layers: **BUILD** (judgment: extract/interpret → VERIFY → freeze to data/JSON, one-time) and **USE** (a script reading that frozen data — deterministic, identical output every run).
- Any "retrieve / check / list / review" = a script over stored data, NEVER regenerated by the model at call time.
- Allowed non-determinism (necessary translation only): speech→text, one-time meaning-extraction (must be verified + frozen), bounded generation (e.g. sentences from a closed vocabulary).
- Before shipping any feature, ask: "if みや asks me to retrieve/check this again, is it 100% the same?" If a model judgment sits in the runtime path, move it to the one-time BUILD step.
- Prefer a real script/hook over a prose instruction; a deterministic set-diff over eyeballing a listing.
- Standing audit lives in `main/todo.md` Q2 (2026-09-20): audit existing skills/hooks/features against this. First application: `/arabic` v2 ([[project-arabic-review]], library/PLAN-v2.md). Related: [[feedback-simplify-and-reference]], [[inventory-first]].

---

## Merged 2026-10-04: system-fix-universal-rule (was feedback_system_fix_universal_rule.md)

> 🚨 Fixing miya's system (MemoryCore gate/skill/rule) = UNIVERSAL rule, never keyed to one ticket/tugasan/urusan; load system-rules + system-design BEFORE any design or audit

When a slip is turned into a system fix (gate, skill, hook, rule, audit), the fix MUST be a universal rule that covers the whole class — never a check keyed to the ticket that exposed it (no tugasan kod, urusan, constant map, or form name as the trigger or the test).

Before proposing ANY design, option list, or audit of the system: invoke `system-rules` and `system-design` via the Skill tool FIRST. Options offered before those load are invalid.

**Why:** 2026-09-30 (#256334 follow-up) — designed submit-path-gate and offered choices without loading either skill, and proposed a static check on TKPDBB / PENYEDIAAN_DOKUMEN_MODE_MAP. miya had asked for both disciplines many times; escalated. Ledger: `design-not-universal`.

**Enforcement (this memory is only the record):** `domain/design-consult-gate/proposal-judge.js` Stop side blocks a system proposal with no consult or no clean `UNIVERSAL:` line (eval `design-consult-gate.eval.js`).

**How to apply:** test every proposed check with "would this fire for a different screen, urusan, state, and module with the same failure shape?" If no, it is ticket-specific: generalize the predicate (e.g. "a removed UI element is still read by the screen's save/submit path") before offering it. Ticket details go in the eval fixtures, never in the rule. Related: (merged above) [[inventory-first]]

---

## Merged 2026-10-04: Always reassess before saving memory or making structural changes (was feedback_reassess_before_save.md)

> List what will be saved/changed and get confirmation — don't eagerly memory-fy things mid-conversation

Before writing memories, creating new files, or making structural changes to the memory system, **list what's about to be saved and pause for reassessment**. Don't treat mid-conversation insights as automatic save-worthy facts.

**Why:** みや explicitly flagged this — *"before you start saving, we should take a step back to reassess, always"*. Eager memory-writing creates duplicate entries, locks in premature framings, and clutters the index. The reassess step catches things that seemed important mid-flow but aren't actually worth persisting.

**How to apply:**
- When multiple save-worthy items pile up in a conversation, present a **save manifest**: bulleted list of what will be written where, before any Write calls
- Ask for confirmation OR make the manifest the last thing before executing — so みや can still interrupt
- For single obvious saves (e.g. one feedback memory after a clear correction), the manifest can be one line
- Rule of thumb: if I'm about to write 3+ files in a row, I owe a manifest first
- The reassess pause also catches cases where the "new" memory duplicates an existing one — check MEMORY.md index first

---

## Merged 2026-10-04: feedback-top-down-app-design (was feedback_top_down_app_design.md)

> 🚨 Apps and dashboards miya asks for are built TOP-DOWN — glance → area → item → evidence; deeper levels open only on demand; never jam every level onto one page; words and names defined before any guide

When building any app, dashboard or UI for みや: design it top-down with levels of information depth. Level 0 answers "is it OK and what needs me" on one screen; each deeper level (area, item, evidence) opens only when he asks for it (tabs, expanders, drawers). No page shows every depth at once.

**Why:** 2026-09-27, Lapis Lazuli Observatory v1: I shipped 11 flat tabs, 12 flat component "kinds" and an Overview with 9 tiles + 24 findings + 3 charts. みや: *"not just jamming everything in to the page, it needs to have levels of information depth, only open when needed since it is a top-down approach (remember my rule in building apps)"*. The rule existed only as a reply rule (`.claude/reply-shape-spec.md` 1b "Bird's-eye first, granular last"; personality "bite-sized first, expand on request"), never as an app rule, so it was not applied.

**How to apply:**
- Map the levels before building: L0 glance, L1 area tabs (≤6), L2 item (drawer or expanded row), L3 evidence (collapsed lists, raw tables).
- Model the domain's own abstraction first (e.g. Feature → parts), never a flat file list.
- Fix names and words before layout polish: every UI term defined once (glossary), same word everywhere.
- Fixed anatomy per repeated block (stat card: label · value · sub · reserved chart row) so nothing overlaps.
- The onboarding guide comes LAST, after structure and wording are final.

Related: [[reference-observatory]] · [[feedback_reply_separation_of_concerns]].

---

## Merged 2026-10-04: feedback_observability_vs_monitoring (was feedback_observability_vs_monitoring.md)

> 🚨 miya's two-layer vocabulary: OBSERVABILITY = liveness (did it fire/block/how long); MONITORING = context (why, which quest/phase, true-or-false block, turn cost, his reaction). Answer BOTH when he asks about 'observe & monitor'; monitoring = the turn-ledger design (plan §M), not built until 2026-09.

**The distinction (miya, 2026-09-04)**: when he says *"our observe & monitor feature"*, that is TWO layers:

| Layer | Question it answers | What exists |
|---|---|---|
| Observability | did component X fire · did it block · how long · is anything silent | `system/telemetry/hook-fires.jsonl` (75k rows) · `domain/*/log.jsonl` · `lib/liveness-report.js` · `lib/feature-census.js` — collecting fine |
| Monitoring | WHY did it block · on which quest/phase · was the block true or a false positive · what did the turn cost (tool calls, hook ms) · how did miya react (reask / correction / nod) | **never built** as a layer — `lib/watch.js` was used 6× on 2026-08-16 then abandoned; `reply-log.js` logs rhythm only. Design = `system/speed-optimization-plan-2026-09-04.md §M` (`turn-ledger`) |

**Why**: 2026-09-04 I answered "observability is collecting" and stopped; he replied *"You still haven't answered on the monitoring part. You only answered the observability part."* Slip `reask/buried-answer`. He expected a separate, related, context-gathering log beyond liveness.

**How to apply**: any status question about "observe & monitor" / "is it collecting data" gets two sections, one per layer, each with numbers. Never call the estate "observed" when only liveness is proven. When §M ships, the monitoring answer = `lib/turn-report.js` output (true_blocks yield, cost per phase, reask rate).

Related: [[feedback_verify_before_claim]] · [[feedback_no_on_the_fly_artifacts]] (the design refines existing writers, no new folder shapes) · plan file `system/speed-optimization-plan-2026-09-04.md`.

---

## Merged 2026-10-04: feedback_resource_footprint (was feedback_resource_footprint.md)

> 🚨 miya asks why the laptop is slow / what those node, python, console processes are / RAM → measure LIVE first (sessions, helpers per session, commit vs limit, db-gateway), trace every process to its parent, answer with numbers; monitoring must be MECHANICAL, never a UI; system-rules Rule 7

When みや asks about laptop slowness, RAM, or "what are all these node / python / console processes", **measure live and trace before answering**: count open sessions, helper processes per session, commit charge vs commit limit (not RAM %), and `db_gateway.py status`, then name what started each process (parent tree). Never answer from memory, and never say a process "can't be traced". Every process is traceable by parent PID.

**Why**: 2026-09-22→29 incident. The laptop hung at 93-96% RAM (60 GB commit). Every session started all 21 database MCP servers, and 233 finished sessions were never archived. My first answers were vague ("orphans", "can't trace") and wrong until live parent-tree checks proved every process belonged to an open session. He had to screen-record Task Manager three times.

**How to apply**:
- The fix and its ops live in [[project_db_gateway]]. The research and audit are in `library-items/agent-architecture/agent-resource-footprint-2026.md`. The follow-ups are in `main/todo.md` Q1 "Resource footprint follow-ups".
- Any new component states its cost: system-rules **Rule 7** (`footprint:` line; shared + on-demand over per-session copies; per-prompt checks join a bundle). This is enforced by `core/forge.js --footprint` and `component-birth-gate`.
- Monitoring he accepts is MECHANICAL: it fires on its own and acts (notifies, restarts, lists archive-safe sessions). "Put it in the observatory" alone is the thing he rejected ("a beautiful UI but useless").
- Cleanup of sessions uses the 14-gate safety check (work in main, no unmerged branch, no uncommitted files, no stash, no open quest, not recent, not pinned or remote-control). The rule is archive, not delete.
- Remaining per-session cost after the gateway is codegraph + the pdf-viewer plugin (a claude.ai account plugin that only he can turn off) + ~60-70 hook node spawns per prompt.

**Flow first (miya, 2026-10-07).** Before changing an existing hook, script, skill or workflow: show its flow as a short story diagram in chat (existing flow, the one step being changed, what stays), reading from system/INDEX.md down. No diagram = no edit. More than one changed step = redesign, ask first. He also wants ONE flow artifact per Workflow (not built yet; ask before making them). **Why:** the 2026-10-02 guard change was made without the flow understood and the repair was over-built. Rule body lives in .claude/skills/system-design/SKILL.md 'Flow first'.
