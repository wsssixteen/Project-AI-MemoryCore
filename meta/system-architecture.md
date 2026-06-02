# System Architecture — Project-AI-MemoryCore Quest + Meta Layer

> **Canonical home for: how the system is built, how parts interconnect, how to change it safely.**
> Living doc — every commit that touches a hook, skill, protocol, or state file MUST update this file in the same commit. Enforced by `meta-edit-gate.js` paired-edit predicate + `silent-claim-drift-gate.js` Stop-side check.
>
> Version: 1.0 — created 2026-05-27 from Plan `cached-floating-hummingbird.md` Phase 0. Sync events list at footer.

---

## 1. Design philosophy — the unifying principle

The system exists to cure ONE recurring pattern Agent 1 named **"trust-the-impulse over read-the-context"**: when Ruri has the source-of-truth (sibling code, convention files, canonical enums, protocol rules) available but skips reading it under momentum, then proceeds on first-plausible theory. Every slip in `meta/slip-log.md` traces to this pattern.

The cure is NOT more documentation (already tried — failed). The cure is **deterministic gates at the moment of weakness** — Edit-time, emit-time, Stop-time — that make impulse-skip structurally impossible without an explicit, audit-visible bypass.

Three layers of enforcement compose this cure:
- **Layer 1 (inline instruction)**: protocol files contain `→ Skill: <name>` tokens at every phase boundary where a sub-skill MUST fire. Visible to Ruri when she reads the source.
- **Layer 2 (hook reminder)**: when Ruri's response contains a `→ Skill: <name>` token OR user prompt triggers a phrase, a hook injects advisory context "invoke this skill via Skill tool now".
- **Layer 3 (Stop-hook hard-block)**: at turn-end, scan transcript — if reminder fired AND no Skill tool call to that name appeared AND no bypass token in message → emit `decision: "block"`, refuse turn-end.

Bypass: `[skip-invoke X: <one-line reason>]` is the audit-visible escape valve for legitimate edge cases.

---

## 2. Macro-phase model — how Quest workflow maps to implementation

A Quest is a workflow-type skill running across 4 macro-phases. Each macro-phase contains 1-5 sub-checkpoints. The macro-phase model is what みや uses mentally; the sub-checkpoints are operational steps.

| Macro-phase | Sub-checkpoints (per `quest/quest-protocol.md`) | Purpose |
|---|---|---|
| **A. Context Loading** | Discovery (incl. retrieve + Scout familiar + etiology check + etanah-knowledge tiered load + problem-type classification) | Build full ground-truth picture BEFORE forming theories |
| **B. Debugging** | Recon (single-ticket 100%-VERIFY) + Simulate (reproduce bug locally) | Convert "something's wrong" → "X at file:Y is wrong because Z" |
| **C. Code-Review** | Rubric (option-ranking + multi-perspective scrutiny + blast-radius + sibling-check + Contract Verification Table + etanah-system integration deep-think) | Pick the right fix shape; scrutinize before Apply |
| **D. Ship** | Apply + Verify + Commit + Push + Wrap | Land the fix; archive |

Scout/Recon overlap is **intentional redundancy** — Scout = parallel-fast (multi-ticket retrieve mode); Recon = single-ticket deep verify. "Better twice than miss once."

---

## 3. Hook catalog — every hook, owner, dependencies, change-impact

39 unique hook files total, 40 registrations as of 2026-05-28 (convention-check-gate dual-registered on Bash + Edit|Write). Grouped by trigger phase. Includes `diary-format-gate.js` (Stop) + `quest-resume-preflight.js` (UserPromptSubmit) added by 2026-05-28 parallel session.

> **⚠️ CORRECTION (2026-05-28, diary-redesign session)** — this catalog predates the diary-redesign hook changes and is STALE on the Stop-hook group. Actual current state:
> - `diary-format-gate.js` (Phase 1) was **superseded by `de-output-integrity-checker.js`** (Phase 3, config-driven structure + voice-signal checker) and **deleted**.
> - `session-keyword-tracker.js` (Phase 2 auto-Index) was **built then removed same day** — tracked-JSONL created perpetual dirty-tree noise; auto-tracking deferred for redesign.
> - `voice-signal-spike.js` added (standalone read-only calibration tool, NOT a registered hook).
> - Net Stop-hook registrations: was 6 (Phase 1 added diary-format-gate as 7th) → de-output-integrity-checker replaces it → back to 7 Stop registrations.
> **A full catalog reconciliation is deferred** (flagged for the future "how best to structure this" session along with the auto-tracking redesign). The hook tables below are otherwise accurate for non-diary hooks.

### 3.1 SessionStart (7 hooks)

| Hook | Owner | Watches | Injects/Blocks | Stakeholders (downstream) | Change-impact |
|---|---|---|---|---|---|
| `meta-layer-audit.js` | self | hook registration drift + scope-split misuse + doc drift | text reminder if drift found | みや, every subsequent hook | Changing audit rules changes drift-detection across all hooks |
| `boot-load-verification.js` | self | required boot reads (CLAUDE.md, personality.md, master-memory.md, expansion-protocol.md, amendments) | reminder if any not Read | Quest skill (depends on boot reads), all phases | If boot reads change, downstream phases lose context |
| `boot-required-read-gate.js` | self | `see X.md` pointers in CLAUDE.md | reminder if pointer doesn't resolve | INV-6 invariant check (this hook IS the enforcement) | If pointer format changes, the regex needs update |
| `worktree-cleanup-boot.js` | self | stale worktree metadata + merged `claude/*` worktrees/branches + decay-stub expiration | **silently prunes + `git worktree remove`s merged worktree DIRS + `git branch -d`s merged branches** (v1.2, 2026-05-30, absorbed DE step 11); text reminder only on decay / uncleanable | rubric decay enforcement, future decay-stubs; DE step 11 (now a pointer here) | worktree-removal is merged-only + never the current/dirty worktree; changing decay-check predicate changes decay enforcement |
| `evolution-check-trigger.js` | self | model-ID change + 30-day evolution elapsed | reminder | evolution-protocol.md procedure | Schedule changes affect when evolution runs |
| `system-check-trigger.js` | self | 30-day system-check elapsed | reminder | system-check skill | Similar to evolution-check |
| `open-quest-surfacer.js` | self | `quest/active.txt` entries with status ∈ {active, hold, blocked, delegated} | "📌 OPEN QUESTS" list at boot | Quest workflow resumption | Status-enum changes (INV-3) require this hook update |

### 3.2 UserPromptSubmit (16 hooks)

| Hook | Owner | Watches user prompt for | Injects | Stakeholders | Change-impact |
|---|---|---|---|---|---|
| `ticket-gate.js` | self | ticket number patterns (QA #N, FAT-OR #N, UAT-CR #N, etc.) | Quest workflow trigger | Quest skill | If ticket format expands, regex update needed |
| `prayer-gate.js` | self | prayer-time mentions | acknowledgment context | みや | Time-aware-system feature |
| `auto-skill-trigger.js` | self | correction signals ("you missed", "why didn't you", etc.) + `→ Skill: X` tokens (Phase 5 extension) | invoke skill reminder | auto-skill-on-mistake skill, Layer 2 enforcement | Predicate extension affects which slips get caught |
| `MemoryClaimGate.js` | self | memory claims that need verification | warning | claim-verification skill | Predicate change affects memory hygiene |
| `PlainFirstGate.js` | self | explanation prompts (status update / explain / why / how / trace) | "lead with plain prose" reminder | feedback_investigation_style.md rule | Phase 5 upgrade adds hard-block on table-first |
| `inventory-first-gate.js` | self | new-structure proposals ("let's create", "we need a new") | inventory-check reminder | inventory-first feedback rule | Predicate update affects which proposals get caught |
| `word-ui-vocab-gate.js` | self | Word/.docx/SDT/OOXML topic | Word UI translation mandate | personality.md "Word .docx edits — UI vocabulary" rule | Predicate update affects which topics trigger UI translation |
| `session-items-manager.js` | self | lifecycle commands ("add to todo", "park it", "done", "fix it now") | session-items state file update | session-items state tracker | State-file schema changes need this hook update |
| `prose-default-gate.js` | self | lock-signal phrases ("just answer", "no tables") | "default to prose" reminder | output-format discipline | Predicate update affects format gating |
| `best-practices-consult-gate.js` | self | design-decision prompts ("should we", "best approach") | best-practices skill invocation reminder | best-practices skills, library-items references | Predicate update affects when consultations fire |
| `user-side-guardrail.js` | self | みや's banned input shapes | guardrail warning | user-side-INDEX | Adding banned shapes requires this hook update |
| `skill-invocation-discipline-gate.js` | self | みや referencing a skill by name | mandatory invoke-via-Skill-tool reminder | Skill tool, every skill | Predicate update affects skill-name detection |
| `domain-expansion-trigger.js` | self | DE session-end trigger phrases ("/save all", "wrap up the day", etc.) | 12-step DE sequence | DE protocol (expansion-protocol.md) | Trigger-phrase changes affect DE firing |
| `prepare-commit-trigger.js` | self | Phase 1 close-out trigger phrases | 12-step prepare-commit sequence | quest-protocol.md Phase 1 close-out | Step changes affect the close-out sequence |
| `SystemAwareDecision.js` | self | substantive prompts (always-consult-registry meta-trigger) | "scan skills/hooks/INDEX before responding" reminder | every skill + hook + INDEX file | If new registry layer added, this hook needs to scan it |
| `TurnChecklistGate.js` | self | multi-topic prompts (≥3 numbered items OR ≥2 questions) | "✅ This-turn checklist" template | みや (visible) | Predicate update affects multi-topic detection |
| `quest-resume-preflight.js` | self | bare ticket numbers cross-matching active.txt | Phase 0 preflight checklist | Quest skill resumption | Bare-ticket-format changes need regex update |
| `scout-completeness-gate.js` | self (NEW 2026-05-28, plan Phase 3) | Scout / Recon trigger phrases ("scout spawn", "running recon", "verify each claim", "100% verify", "universal check", "sibling-structure") | injects 100%-VERIFY clause text + UC9 reminder + required Skill tool invocations list | quest-protocol.md 100%-VERIFY clause (line 545), predicate-box skill, claim-verification skill | Predicate-phrase changes (extending trigger detection) require regex update |
| `quest-active-grounding.js` | self (NEW 2026-06-01 S4, hooks-as-harness pattern per みや) | every UserPromptSubmit (no phrase match — always evaluates) | injects `🎯 Active quest: QA-X · Scope: <urusan> · Phase: <current_phase> · Local test: <yes\|no>` per active.txt block where `status=active` AND NOT (`phase=1` AND `local_test_confirmed=true`) — silent if no match | open-quest-surfacer.js (SessionStart counterpart), quest workflow, every prompt during active quest | Status-enum changes (INV-3) + phase-aware silence predicate (option b per みや 2026-06-01) require this hook update; registered in settings.json line 115 |
| `mode-detector.js` | self (NEW 2026-06-01 S5, Item D per みや — mode-scoping enabler) | every UserPromptSubmit | emits `🎯 Mode: <Quest-active\|Discussion>` — same predicate as quest-active-grounding (status=active AND NOT past-testing). Lets downstream hooks scope enforcement to Quest-active mode only | operational-follow-through.js (reads same predicate to scope its warnings), future Debugging-mode hooks (v1.1 deferred) | Mode list expansion (adding Debugging-universal etc.) requires this hook update + downstream consumers |
| `batch-ask.trigger.hook.js` | self (NEW 2026-06-02, Power: `domain/batch-ask/`) | UserPromptSubmit · regex matches extensive-intent phrases (extensive/exhaustive/thoroughly/sweep/in-one-go/save-time/extensive-logging — 7 family patterns ~40 phrases) | injects mandate: use AskUserQuestion tool for ALL clarifying questions this turn; bans chat-written stalling | みや's workflow during extensive-intent prompts; AskUserQuestion tool | Phrase list grows ONLY with ≥2 observed misses + みや nod (per /system-design trigger-reliability discipline) |

### 3.3 PreToolUse Bash (2 hooks)

| Hook | Owner | Watches | Action | Stakeholders |
|---|---|---|---|---|
| `commit-gate.js` | self | `git commit` commands | message-format check + commit-conventions.md reminder | etanah-pelupusan commits, MemoryCore commits | Commit-conventions changes require predicate update |
| `convention-check-gate.js` | self | SQL UPDATE/INSERT in Bash + mcp__postgres queries | value-shape convention reminder | data-patch operations | New SQL patterns may need regex extension |

### 3.4 PreToolUse Edit|Write (6 hooks)

| Hook | Owner | Watches | Action | Stakeholders |
|---|---|---|---|---|
| `self-gate-impulse.js` | self | impulsive Edits | "pause + verify" reminder | personality.md self-gate discipline | Predicate affects impulse detection |
| `phase0-artifact-gate.js` | self | Edits during Phase 0 | Phase 0 artifact rules | Quest Phase 0 | Phase 0 rule changes need this hook update |
| `pre-action-check-gate.js` | self | quest-related path edits | Notes.txt + env-check + PDF reminders | Quest skill, Notes.txt write | Path-pattern changes need predicate update |
| `meta-edit-gate.js` | self | `meta/*` path edits + (Phase 0 extension) hooks/skills/protocols/state-files | recursive safety + paired-edit predicate | meta-layer audit, architecture-doc-sync | Phase 0 extends this hook for architecture-doc-sync |
| `edit-scope-gate.js` | self | suspicious delete-unrelated-code patterns | preservation discipline reminder | PRESERVATION DISCIPLINE rule | Pattern-list expansion needs predicate update |
| `convention-check-gate.js` | self (dual-registered) | Edit/Write to .java / .docx / .json|xml|properties | working-analog-first reminder | etanah-pelupusan code edits, template edits | New file-types may need extension |
| `claude-md-edit-guard.js` | self (NEW 2026-06-02 — enforces /system-rules Rule 2 merge-in-place) | Edit/Write to CLAUDE.md · /system-rules/SKILL.md · /system-design/SKILL.md | scans for HARD-RULE block opener · Why+QA-NNN narrative · pairs-with cross-ref · How-to-apply restatement · みや verbatim quote inside rule body; warns advisory | /system-rules Rule 2, /system-design Bloat-prevention default; pairs with no current skill (hook-only Power) | Bloat-pattern regex additions per observed misses |

### 3.5 Stop (6 hooks)

| Hook | Owner | Watches turn-end | Action | Stakeholders |
|---|---|---|---|---|
| `reply-log.js` | self | every Stop | log reply for analytics | reply-log.jsonl state | Log-shape changes affect downstream tools |
| `operational-follow-through.js` | self | every Stop | check operational TODOs | Quest workflow follow-through | Predicate extension affects what's checked |
| `file-list-after-refine.js` | self | refine/save signal | emit list of touched files | みや (visible) | Refine-detection changes affect emit |
| `notes-on-test-data.js` | self | test-data mentions in turn | Notes.txt write reminder | Quest skill, Notes.txt state | Test-data detection changes affect reminder |
| `silent-claim-drift-gate.js` | self | "done"/"complete" claims without diff-backing | advisory reminder (Stage 5A) / hard-block (Stage 5B) | Phase 5 enforcement, claim-verification skill | Phase 3 + Phase 5 both extend this hook |
| `diagnostic-self-heal-gate.js` | self | /verify-shape emit + stalling phrase | self-heal mandate | stalling-detector skill | Predicate changes affect self-heal triggers |
| `diary-format-gate.js` | self (NEW 2026-05-28, parallel session) | every Stop | validates 3 H2 sections in today's daily-diary entry (Sessions / Index / Closing) | daily-diary template, DE Step 4 | Template-section name changes require this hook update; warn-only (does not block) |
| `rcrl-emit-check.js` | self (NEW 2026-06-01 S5, RCRL backstop) | every Stop — fires only when active.txt has `status=active` AND turn transcript has Recon-shape emit | warns if RCRL block missing (advisory in v1); bypass via `[skip-rcrl: <reason>]` | CLAUDE.md §10 RCRL primitive Step 0, scout-completeness-gate.js (same family) | Stage 2 flip to `decision:block` deferred until predicate quality observed |

### 3.6 PostToolUse (1 hook)

| Hook | Owner | Watches | Action | Stakeholders |
|---|---|---|---|---|
| `RecursiveLoopDetector.js` | self | same-tool + similar-args 3+ times in window | loop warning | Momentum Circuit-Breaker ritual | Window-size + similarity threshold are tunable |

### 3.7 Hooks added/changed by plan `cached-floating-hummingbird.md` (executed 2026-05-28)

- ✅ Phase 0: `meta-edit-gate.js` v1.1 — added paired-edit predicate (system-component edits trigger arch-doc-sync reminder; bypass `[skip-architecture-doc-update: <reason>]`)
- ✅ Phase 1: `pre-action-check-gate.js` v1.1 — added single-canonical-doc enforcement (blocks edits to sibling files under projects/coding-projects/active/QA-*/ that aren't QA-NNN.md; bypass `[skip-canonical-doc: <reason>]`)
- ✅ Phase 3: `scout-completeness-gate.js` (NEW, UserPromptSubmit) — injects 100%-VERIFY clause + UC9 sibling-structure-read reminder on Scout/Recon trigger phrases
- ✅ Phase 5: `silent-claim-drift-gate.js` v1.1 — Stage 5A advisory extensions: (a) scans for `→ Skill: <name>` tokens vs Skill tool calls; (b) scans Recon emits for HYPOTHESIS-vs-VERIFIED ratio (100%-VERIFY check); (c) scans system-component edits vs meta/system-architecture.md edits (arch-doc-sync). All advisory in Stage 5A; Stage 5B (decision:block flip) deferred to future session after observation. Bypass tokens: `[skip-invoke <name>: <reason>]`, `[skip-100-verify: <reason>]`, `[skip-architecture-doc-update: <reason>]`.
- ⏸ Phase 5 Stage 5B (DEFERRED): `silent-claim-drift-gate.js` flip from `additionalContext` advisory to `hookSpecificOutput.decision: "block"`. Dry-run scenarios at `meta/hook-test-scenarios.md`.
- ⏸ `PlainFirstGate.js` hard-block upgrade (DEFERRED to Stage 5B alongside silent-claim-drift)

**Total hook count after Phase 5 Stage 5A**: 40 unique files / 41 registrations (added `scout-completeness-gate.js` to UserPromptSubmit).

---

## 4. Skill catalog — every skill, invocation trigger, stakeholders

30 skills total. Grouped by category.

### 4.1 Workflow skills (multi-step, persistent state)

| Skill | Invocation | Produces | Stakeholders / Touchpoints | Change-impact |
|---|---|---|---|---|
| `quest` | `/quest start|hold|resume [<QA-num>]` + trigger phrases (ticket numbers, "let's start with X", etc.) | active.txt entry + QA-NNN.md + workflow execution | every Quest sub-skill (env-check, familiar, verify, appraise, predicate-box, etc.); touchpoints = quest/active.txt, projects/coding-projects/active/QA-*/QA-*.md, Notes.txt | Phase 2.5 rewrote this skill as Skill-tool composition runner; further changes to phase sequencing require updates here + matching `current_phase=` semantics in active.txt |
| `quest-phase0` (Workflow tool) | invoked by the `quest` skill at `/quest start` — auto-fire, `depth=full` for bugs / `quick` otherwise — script `.claude/workflows/quest-phase0.js` (NEW 2026-05-29) | writes `1. Notes.txt` (canonical format, quest-protocol.md:373-403) + QA-NNN.md investigation sections; returns verified diagnosis + fix-shape | Quest Phase 0 ONLY (Apply/test/commit stay human-gated in `quest` skill); touchpoints = quest/quest-protocol.md, etanah-knowledge, Notes.txt, QA-NNN.md, postgres MCPs | Blast-radius is codebaseRoot-keyed: TRG BANNED for etanah-pelupusan, multi-state-aware for etanah-awam. Phase/dimension changes require updates here + the SKILL.md Phase-0 wiring block |
| `verify` | `/verify <ticket>` | Checklist A/B/C/D/E verdict | Quest Phase 1 + Phase 2 close-out; touchpoints = quest/active.txt, git state, file existence | Adding new checklists requires this skill update + meta-layer-audit.js extension if invariants involved |
| `appraise` | `/appraise <subject>` + trigger phrases ("grill me", "stress-test") | Socratic 9-question interrogation across Assumption/Scope/Evidence axes | Plan stress-tests, Quest Rubric phase (multi-perspective overlap); touchpoints = the subject being appraised | Adding new axes requires this skill update; trigger-phrase additions require regex update in skill description |
| `grill-me` | `/grill-me` (NEW 2026-05-28 parallel session) + trigger phrases | mattpocock's grill-me workflow output | Plan stress-tests; complements `appraise` | Installed verbatim from `https://github.com/mattpocock/skills`; modifications should preserve attribution comments |
| `grill-with-docs` | `/grill-with-docs` (NEW 2026-05-28 from origin/main merge) | grill-me variant grounded against domain model docs | Plan stress-tests with documentation grounding | Same install-source contract as grill-me |

### 4.2 Discipline primitives (atomic, Edit-time / emit-time)

| Skill | Invocation | Produces | Stakeholders |
|---|---|---|---|
| `predicate-box` | trigger phrase OR pre-Edit-while-debugging | TRUE IF / PROVED BY / FAILED WHEN box | Debug Mode Ritual 1, Quest Recon phase |
| `grep-rubric` | post-grep moments | 3-line Proves / Negative / Next box | Quest investigation discipline |
| `multi-dim-evidence` | screenshot/PDF reading | spatial + text + color + hierarchy evidence | Quest Recon, BA artifact processing |
| `confidence-table` | hand-back moments | calibration table | Quest hand-back |
| `rubric` | currently slash + trigger phrases (DEPRECATED via Phase 4 — absorbed into Quest Rubric phase + system-design Step 6, 10-day decay) | (absorbed) | (post-Phase 4: stub redirect; pre-Phase 4: option-ranking + multi-perspective) |
| `claim-verification` | "done" claims, hand-back | diff-backing check | silent-claim-drift-gate.js, Quest hand-back |
| `scope-anchor-echo` | Edit-time during Quest | scope-anchor re-echo | Quest Apply, edit-scope discipline |
| `test-data-echo` | hand-back during Quest | test-data table | Quest hand-back, Notes.txt write |
| `task-assignment-honesty` | hand-back moments | honest assignment-list | Quest hand-back |
| `stalling-detector` | mid-quest patterns | momentum check | Momentum Circuit-Breaker ritual |
| `sycophancy-circuit-breaker` | "should we" / "do you think" prompts | failure-mode evaluation | honesty primitives |
| `over-generalization-check` | rule-generalization moments | scope-limit check | personality.md over-generalization discipline |

### 4.3 Knowledge / structural skills

| Skill | Invocation | Produces | Stakeholders |
|---|---|---|---|
| `system-rules` | `/system-rules` + trigger phrases (NEW 2026-06-02 — universal background discipline split out from old /system-design) | 5 universal rules: inventory first · merge in place · assess + delete deprecated · clean system value · build with audit logging | Universal disciplines for ANY system; /system-design references these |
| `system-design` v2.0 (REWRITE 2026-06-02) | `/system-design` + trigger phrases | Agentic-specific design: Power trinity primitive (skill+hook+eval in `domain/<name>/`) · layering doctrine · trigger reliability · decay protocol · rules 6+7 (ship with eval · pick the primitive) · bloat-prevention default | Every new feature/Power we build in our agentic system; pairs with /system-rules (universal) + claude-md-edit-guard.js hook |
| `etanah-knowledge-graph-build` | quest mid-flow | knowledge graph artifacts | etanah-knowledge layer maintenance |
| `bankai` | `/bankai` + trigger phrases | autonomous-loop data organization (slip-log consolidation, etc.) | meta-layer maintenance |
| `auto-skill-on-mistake` | correction signal detection (via auto-skill-trigger.js hook) | refined/new skill OR hook | meta-layer self-improvement |
| `evaluator-optimizer` | iterative refinement moments | scoped review-improve cycle | code/design iteration |

### 4.4 Utility / specialized skills

| Skill | Invocation | Produces |
|---|---|---|
| `env-check` | `/env-check` | env target verified or switched (mlkuat/mlkfat/mkit) |
| `familiar` | `/familiar <file>` | sub-agent read + summary for big files |
| `checklist` | `/checklist` | universal task checklist for quest phase boundaries |
| `annotations` | `/annotations` | PDF annotation extraction |
| `git-health` | `/git-health` | 3-tier safety git check |
| `system-check` | 30-day boot trigger | system audit |
| `etanah-rahsia-bypass` | etanah-specific need | rahsia document access |
| `usage-guidance` | user-side helper | usage advice |
| `video-frames` | video content | frame extraction |
| `video-trim` (NEW 2026-06-01 S4) | "trim the video" / "trim this video" / "trim my video" / "help me trim" / "video for Redmine" / "trim for upload" / post-testing hand-back with recent ShareX .mp4 | ffmpeg motion-detect cut of idle/loading stretches + tail-trim cursor-to-stop-button + 2 calibration outputs (aggressive/conservative) → highest-numbered Task subfolder + ShareX source delete on verified-success |
| `redmine-phase1-prefill` (NEW 2026-06-01 S4, manual-invoke only) | "redmine prefill" / "prefill redmine for X" / `/redmine-phase1-prefill` / explicit invocation only — does NOT auto-bind to quest workflow | Claude-in-Chrome MCP driven: navigate Redmine Edit page → fill Status=Resolved + Assignee + %Done=100% + Resolved By (both) + Notes template + Files from highest-numbered Task subfolder → STOP before Submit (みや reviews + submits) |
| `skill-invocation-discipline` | hook+skill pair | discipline enforcement |

### 4.5 Skill-invocation contract

Every skill MUST be invoked via the Skill tool. Banned bypass shapes (per `skill-invocation-discipline-gate.js`):
- "I'll follow the SKILL.md procedure manually" — SKILL.md is source code, not a checklist
- "I'll dispatch agents via Agent tool" — Skill tool orchestrates dispatch + scripts as one unit
- "I'll build the artifact programmatically" — Ruri's interpretation, not the skill's behaviour
- "It's faster inline" — speed is not a valid reason to skip
- Treating meta-skills (auto-skill-on-mistake, system-design, claim-verification) as "procedures to follow inline"

If Skill tool fails (skill not in registry, runtime error): surface error to みや, do NOT shortcut to manual. Workflow pauses at that point.

---

## 5. State file map — what writes each, what reads each, lifecycle

| File | Schema version | Writers | Readers | Lifecycle |
|---|---|---|---|---|
| `quest/active.txt` | v2 (2026-05-27, post-Phase 2 adds `ticket_type=` + `current_phase=`; v1 was the canonical 7-status enum) | Quest skill at `/quest start` and phase transitions, `redmine-sync.js` at retrieve, `prepare-commit-trigger` sequence Step 10 | `open-quest-surfacer.js` at boot, `quest-resume-preflight.js` on bare-ticket detection, every session start | Append-only entries; status transitions in place; archive on Phase 2 close |
| `projects/coding-projects/active/QA-NNN/QA-NNN.md` | v1 (post-Phase 1: single canonical doc) | Quest skill per phase emit | Quest resumption, post-mortem composition | Created at `/quest start`, moved to archive at Phase 2 |
| `main/current-session.md` | (stable) | DE Step 2 at session end | Session boot recap | Updated once per session at DE |
| `main/post-mortems.md` | (stable) | Quest Phase 2 wrap | retrospective, KPI calc | Append-only |
| `main/kpi-tracker.md` | (stable) | Quest Phase 2 wrap | cadence reporting | Append-only |
| `meta/slip-log.md` | (stable) | every slip + `auto-skill-on-mistake` skill | bankai consolidation, slip-pattern analysis | Append-only with periodic Bankai pass |
| `meta/system-architecture.md` | v1 (this file) | every commit touching hooks/skills/protocols/state-files | future refactors, change procedures | Paired-edit enforced via `meta-edit-gate.js` |
| `.claude/settings.json` | (stable) | hook-registration changes | Claude Code at boot | Modified rarely; INV-1 + INV-2 enforce no drift vs hook files |

### 5.1 `active.txt` schema (v2)

Per entry:
```
qa=<QA-NNN or PLAN-...>
quest_start_ts=<ISO timestamp>
task_folder=<absolute path>
qa_doc=<absolute path to QA-NNN.md>
branch=<repo branch>
commit=<SHA> (when applicable)
phase=<0|1|1-complete|2|2-complete>
current_phase=<implementation-phase name>   ← NEW for Phase 2.5 workflow runner
status=<active|hold|delegated|blocked|closed|archived|archived-shipped-by-other>
ticket_type=<bug|enhancement|cr|requirement>   ← NEW for Phase 2 problem-type detection
local_test_confirmed=<true|false>
priority=<High|Medium|Low>
issue_one_liner=<text>
scope_anchor=<text>
files_changed=<list>
notes:
  - <YYYY-MM-DD>: <event>
```

Backward-compatibility: entries without `ticket_type=` or `current_phase=` still parse — readers default to unknown values.

---

## 6. Architecture invariants — INV-1 through INV-6

Machine-checkable rules enforced by `meta-layer-audit.js` at SessionStart.

| ID | Invariant | Real-failure precedent | Check shape |
|---|---|---|---|
| **INV-1** | Every entry in `.claude/settings.json` hook-registration has a corresponding file in `.claude/hooks/` | 2026-05-25 ghost-hooks audit (7 registered without files at one point) | For each registered command path: verify file exists |
| **INV-2** | Every file in `.claude/hooks/*.js` is registered in `.claude/settings.json` | Same audit, opposite direction | For each .js file: verify at least one registration cites it |
| **INV-3** | Every `status=` value in `quest/active.txt` is in the canonical 7-value enum | 2026-05-26 `local-test-confirmed` slip in QA-262869 | Parse status= lines, set-diff vs enum |
| **INV-4** | Every `→ Skill: <name>` token in protocol/skill files references a `<name>` that exists in `.claude/skills/<name>/SKILL.md` | (preventive — Phase 5 introduces tokens) | Grep tokens, verify each name has matching dir |
| **INV-5** | Every `ticket_type=` value in active.txt is `bug|enhancement|cr|requirement` | (preventive — Phase 2 introduces field) | Parse ticket_type= lines, set-diff vs enum |
| **INV-6** | Every `see X.md` / `see X/` reference in CLAUDE.md resolves to existing file/dir | (defense-in-depth with boot-required-read-gate.js) | Grep references, verify each path resolves |

Boot output format: `🛡 invariants: 6/6 pass` OR `🛡 invariants: 5/6 — INV-3 fails: status=foo in QA-NNN not in canonical enum`. みや sees this at every SessionStart; absence = `meta-layer-audit.js` broke.

---

## 7. Reverse-lookup index — "who references me?"

For change-impact assessment: when refactoring component X, this index says what else needs updating.

### 7.1 Hooks referenced by

| Hook | Referenced in protocols/skills/state |
|---|---|
| `auto-skill-trigger.js` | quest-protocol.md (correction-signal handling), auto-skill-on-mistake skill, CLAUDE.md hook catalog |
| `silent-claim-drift-gate.js` | quest-protocol.md (claim-verification rule), Phase 5 layered enforcement, Phase 3 100%-VERIFY binding, claim-verification skill |
| `meta-edit-gate.js` | quest-protocol.md (recursive safety), Phase 0 architecture-doc-sync |
| `PlainFirstGate.js` | feedback_investigation_style.md, personality.md:53, meta/principles.md:80 |
| `pre-action-check-gate.js` | quest-protocol.md (Notes.txt + env-check + PDF reminders), Phase 1 single-canonical-doc enforcement |
| `convention-check-gate.js` | feedback_simplify_and_reference.md (find-working-analog rule), CLAUDE.md hook catalog |
| `open-quest-surfacer.js` | quest-protocol.md (boot surfacing), Phase 5 plan-execution surfacing (cut from plan but pattern preserved) |
| `quest-resume-preflight.js` | quest-protocol.md (bare-ticket resumption), Quest skill resume |
| `prepare-commit-trigger.js` | quest-protocol.md Phase 1 close-out, commit-conventions.md (Step 7.5 read) |
| `skill-invocation-discipline-gate.js` | skill-invocation-discipline skill, CLAUDE.md skill rules |
| `meta-layer-audit.js` | INV-1 through INV-6 enforcement, CLAUDE.md meta-layer description |

### 7.2 Skills referenced by

| Skill | Referenced in protocols/skills |
|---|---|
| `quest` | every Quest-triggering hook (ticket-gate, quest-resume-preflight), CLAUDE.md, master-memory.md |
| `predicate-box` | quest-protocol.md Apply boundary, Debug Mode Ritual 1, Phase 3 100%-VERIFY binding |
| `claim-verification` | silent-claim-drift-gate.js, quest-protocol.md hand-back, personality.md Honesty Invariants |
| `rubric` (deprecating) | quest-protocol.md Rubric phase (until Phase 4 absorbs), discipline-INDEX.md |
| `system-design` | quest-protocol.md Rubric phase (Step 6 multi-perspective), Phase 4 absorption target |
| `appraise` | plan stress-tests, Quest Rubric phase (overlap with multi-perspective), this session's grill |
| `auto-skill-on-mistake` | auto-skill-trigger.js, slip-log entries, every correction signal |
| `verify` | quest-protocol.md Phase 1 close-out, /verify Checklist C |

### 7.3 State files referenced by

| State file | Referenced in |
|---|---|
| `quest/active.txt` | open-quest-surfacer.js, quest-resume-preflight.js, Quest skill, prepare-commit-trigger.js, every quest skill operation |
| `meta/system-architecture.md` (this) | meta-edit-gate.js paired-edit predicate, future refactor procedures |
| `meta/slip-log.md` | auto-skill-on-mistake, Bankai consolidation, every slip detection |
| `main/current-session.md` | DE Step 2, session boot recap |
| `.claude/settings.json` | INV-1 + INV-2 boot audit, Claude Code at startup |

---

## 8. Change procedures — how to safely modify the system

Three documented procedures cover the common change types. For change types not listed here, generalize from the closest match OR add a new procedure to this section.

### 8.1 Renaming a hook

1. Update `.claude/settings.json` registration (path AND any matcher references)
2. `grep -r "<old-name>" .claude/ quest/ meta/ main/ personality.md CLAUDE.md` — replace each match
3. Update Reverse-lookup index (§7.1) — replace old name with new
4. Bump this file's version + add Sync Event (§9)
5. Run `meta-layer-audit.js` at next boot — verify INV-1 + INV-2 hold

### 8.2 Deprecating a skill

1. Replace `.claude/skills/<name>/SKILL.md` body with redirect stub (decay date if temporary)
2. Update `meta/discipline-INDEX.md` (or honesty-INDEX, enforcement-INDEX as applicable) — strike row, footnote
3. Update Reverse-lookup index (§7.2) — mark all references as routing-target
4. If decay-based: ensure `worktree-cleanup-boot.js` decay-check covers it
5. After decay date passes: delete skill directory + remove from Reverse-lookup
6. Verify INV-4 holds (no orphan `→ Skill: <name>` tokens pointing at deleted skill)

### 8.3 Changing a state-file schema

1. Document old vs new schema in §5 with version bump
2. Update writers (hooks, skills, scripts that write the file)
3. Update readers (hooks, skills, protocol references that parse the file)
4. Verify backward-compatibility: existing entries without new fields still parse
5. Update Reverse-lookup index (§7.3) if new readers/writers introduced
6. If new enum field: add corresponding INV entry in §6

### 8.4 Modifying a Stop-hook predicate

1. Document old vs new behaviour in §3 (this file) with version bump
2. Update `meta/hook-test-scenarios.md` (created in Phase 5) — add test cases for new edge cases
3. Ship in advisory mode first (re-apply Stage 5A pattern): emit `additionalContext` only, NOT `decision: "block"`
4. Observe N sessions (typically 1-3) for false-positive rate
5. If acceptable → flip to `decision: "block"` (Stage 5B)
6. Update Reverse-lookup index if predicate reads from new files/transcripts

---

## 9. Sync events — change log

Every commit that updates this file appends a row here.

| Date | Change | Triggered by |
|---|---|---|
| 2026-05-27 | v1.0 initial creation per Plan `cached-floating-hummingbird.md` Phase 0 | Plan execution session |
| 2026-05-28 | v1.1 — Phases 0-7 of plan executed: meta-edit-gate.js extended with paired-edit predicate; pre-action-check-gate.js extended with single-canonical-doc enforcement; scout-completeness-gate.js NEW; silent-claim-drift-gate.js Stage 5A extensions for skill-invocation drift + 100%-VERIFY + arch-doc-sync; QA-NNN-template.md NEW; quest/SKILL.md rewritten with Skill-tool composition + ticket-num arg + workflow runner mode; quest-protocol.md updated with ticket-type classification, tiered etanah-knowledge load, Scout/Recon clarity, UC9 sibling-structure-read, Proactive Initiative emit, 100%-VERIFY binding, Rubric phase expansion; rubric SKILL.md replaced with decay stub (decay 2026-06-07); discipline-INDEX.md strike-through on rubric; meta/hook-test-scenarios.md NEW with 10 dry-run scenarios | Plan `cached-floating-hummingbird.md` execution session |
| 2026-05-28 | v1.2 — Post-/verify 4-partial-fixes: G2 (meta-layer-audit.js v1.1 extended with INV-3..INV-6 invariant checks at boot); E3 (added scout-completeness-gate.js + diary-format-gate.js to hook catalog); G1 (added grill-me + grill-with-docs to skill catalog with interconnection metadata); C4 (worktree-cleanup-boot.js v1.1 extended with decay-date scanner — flags decay-expired + decay-soon stubs at boot) | /verify follow-up of plan execution |
| 2026-05-28 | v1.3 — DE-banner confabulation fix: domain-expansion-trigger.js v1.1 inlined the EXACT canonical DE banner (`═══ [ Domain Expansion ] ═══` / `💠 るり結界 (ラピス バリアー) 💠`) into the Step 0 injection. Slip-driven (Ruri confabulated 蒼穹瑠璃の結界/Sōkyū/ドメイン展開). Same cure pattern as commit-conventions (Step 7.5) + status-enum (Step 10.5): inline-at-trigger beats reference-file-recall. DE is hook+docs, NOT a Skill — so the banner text must be handed at trigger time, not recalled. | みや caught DE-name confabulation at DE close |
| 2026-05-28 | v1.4 — `env-check` skill behavior change (§4.4): removed the 2026-05-18 "Mock Cutover 1" UAT-only temporary override (FAT restored); env selection reverted to **ticket-driven** (match BA `Env:` line + permohonan ID env; FAT is a full local implement+test target again); added **Priority 0 `hold` override** (みや saying "hold" at ticket start suppresses the env switch — parallel-session safety); AWAM→`mkit`/UAT special case unchanged. Paired memory updated same turn: `feedback_uat_fat_environments.md` + `MEMORY.md` index line. | みや directive — FAT usable again |
| 2026-05-31 | v1.6 — **Debug Ritual 6 (loggers, not breakpoints) + prepare-commit Step 2.6**: breakpoints BANNED as a request to みや; runtime confirmation uses extensive loggers (≥3 what-ifs) BUNDLED into the first-pass fix build (one rebuild carries fix + confirmation = 3-4× saving). `prepare-commit-trigger.js` v1.3 adds Step 2.6 (strip `QA<num>-PROBE:` loggers + debug comments before BA-bound commit) — matched pair with Ritual 6. quest-protocol.md triage-ladder breakpoint→logger; CLAUDE.md boot table rows 5+6; personality.md no-asking-back runtime corollary. | みや 2026-05-31 debug-methodology refinement |
| 2026-05-29 | v1.5 — **`quest-phase0` Workflow-tool engine NEW** (`.claude/workflows/quest-phase0.js`): Quest Phase 0 as a deterministic fan-out (Discovery → etanah-knowledge tiered load → Recon → adversarial Verify for bugs → Synthesize); writes `1. Notes.txt` (canonical format) + QA-NNN.md; scales by ticket_type. Wired into `quest/SKILL.md` `/quest start` (auto-fire + depth-scale). Blast-radius codebaseRoot-keyed — **TRG banned for etanah-pelupusan**, multi-state-aware for etanah-awam. Added to §4.1. | みや: "create the quest workflow" |

---

## 10. Open architectural questions (deferred)

Not blocking current execution; tracked for future sessions.

1. **SQLite migration** for lookup-shaped etanah-knowledge layers (TEST-PERMOHONAN-INDEX, PERANAN-MAP, DEFERRED-CRITICAL-ISSUES, DOMAIN-GLOSSARY). Trade-off: structured query vs simpler MD edits.
2. **Codebase graph build** for etanah-pelupusan Java sources — faster grep + symbol lookup using tree-sitter or codegraph.
3. **Multi-state expansion** of etanah-knowledge (terengganu/, selangor/) once melaka/ pattern proves stable across more quests.
4. **`auto-skill-trigger.js` upgrade** to detect more trigger phrase categories (design-decision signals, debugging-method signals).
5. **`/flow-diagram` skill** or `PlainFirstGate` diagram-first extension — みや asked for this multiple times; partially addressed by personality.md:53 + PlainFirstGate but discipline keeps failing.
6. **Per-turn invariant check** — currently INV-1..INV-6 fire at boot only. Per-turn check would catch mid-session drift but adds overhead.

---

*This file is the system's mirror of itself. If it diverges from reality, something silent has broken — check `meta-layer-audit.js` boot output for surfaces.*
