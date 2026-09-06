# System Architecture — Project-AI-MemoryCore Quest + Meta Layer

> **Canonical home for: how the system is built, how parts interconnect, how to change it safely.**
> Living doc — every commit that touches a hook, skill, protocol, or state file MUST update this file in the same commit. Enforced by `system-edit-gate.js` paired-edit predicate + `silent-claim-drift-gate.js` Stop-side check.
>
> Version: 1.0 — created 2026-05-27 from Plan `cached-floating-hummingbird.md` Phase 0. Sync events list at footer.

---

## 1. Design philosophy — the unifying principle

The system exists to cure ONE recurring pattern Agent 1 named **"trust-the-impulse over read-the-context"**: when Ruri has the source-of-truth (sibling code, convention files, canonical enums, protocol rules) available but skips reading it under momentum, then proceeds on first-plausible theory. Every slip in `system/slip-log.md` traces to this pattern.

The cure is NOT more documentation (already tried — failed). The cure is **deterministic gates at the moment of weakness** — Edit-time, emit-time, Stop-time — that make impulse-skip structurally impossible without an explicit, audit-visible bypass.

Three layers of enforcement compose this cure (an enforcement-SEVERITY ladder — NOT a system layer model; the canonical system model is `system/INDEX.md`'s 6 layers, per external-audit C6 2026-07-13):
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

**(Live count + canonical registry: §3.0 auto-registry below — the hand-counts in this paragraph are historical and no longer maintained.)** 40 unique hook files, 41 registrations as of 2026-06-08 (convention-check-gate dual-registered on Bash + Edit|Write; `quest-phase-gate.js` added 2026-06-08, QA-262762). **2026-06-19**: `codemap-recon-consult.discipline.hook.js` added (Stop — codegraph back-gate) + `convention-check-gate.js` upgraded to v1.2 (Java-blocking); both self-tested 5 cases each. Grouped by trigger phase. Includes `diary-format-gate.js` (Stop) + `quest-resume-preflight.js` (UserPromptSubmit) added by 2026-05-28 parallel session.

> **⚠️ CORRECTION (2026-05-28, diary-redesign session)** — this catalog predates the diary-redesign hook changes and is STALE on the Stop-hook group. Actual current state:
> - `diary-format-gate.js` (Phase 1) was **superseded by `de-output-integrity-checker.js`** (Phase 3, config-driven structure + voice-signal checker) and **deleted**.
> - `session-keyword-tracker.js` (Phase 2 auto-Index) was **built then removed same day** — tracked-JSONL created perpetual dirty-tree noise; auto-tracking deferred for redesign.
> - `voice-signal-spike.js` added (standalone read-only calibration tool, NOT a registered hook).
> - Net Stop-hook registrations: was 6 (Phase 1 added diary-format-gate as 7th) → de-output-integrity-checker replaces it → back to 7 Stop registrations.
> **A full catalog reconciliation is deferred** (flagged for the future "how best to structure this" session along with the auto-tracking redesign). The hook tables below are otherwise accurate for non-diary hooks.

### 3.0 Registered-hooks registry — AUTO-GENERATED (canonical)

> Generated from `.claude/settings.json` by `system/sync-hook-catalog.js` — **do not hand-edit between the markers.** This is the canonical list the `system-audit` boot check reads, so it can never drift again (it caused the ~month-long DOC-DRIFT false alarm fixed 2026-06-19, QA-266215 session). The rich §3.1–§3.7 tables below stay hand-written for semantic detail (Owner / Action / why-fragile) the registry can't carry — they are commentary, not the source of truth for "what is registered." Re-run `node system/sync-hook-catalog.js` after any settings.json hook change; `--check` exits 1 if stale.

<!-- HOOK-REGISTRY:AUTO-START -->
_AUTO-GENERATED from `.claude/settings.json` by `system/sync-hook-catalog.js` — do NOT hand-edit. 106 hook registrations across 5 events. Re-run after any settings.json hook change (`node system/sync-hook-catalog.js`)._

| Event | Matcher | Hook | On disk? |
|---|---|---|---|
| SessionStart | — | `boot-load-verification.js` | ✓ |
| SessionStart | — | `boot-required-read-gate.js` | ✓ |
| SessionStart | — | `evolution-check-trigger.js` | ✓ |
| SessionStart | — | `hook-syntax-check.js` | ✓ |
| SessionStart | — | `open-quest-surfacer.js` | ✓ |
| SessionStart | — | `system-audit.js` | ✓ |
| SessionStart | — | `system-check-trigger.js` | ✓ |
| SessionStart | — | `worktree-cleanup-boot.js` | ✓ |
| UserPromptSubmit | — | `adhoc-paste-detector.check.hook.js` | ✓ |
| UserPromptSubmit | — | `adhoc-register.check.hook.js` | ✓ |
| UserPromptSubmit | — | `attachment-context.trigger.hook.js` | ✓ |
| UserPromptSubmit | — | `auto-skill-trigger.js` | ✓ |
| UserPromptSubmit | — | `batch-ask.trigger.hook.js` | ✓ |
| UserPromptSubmit | — | `best-practices-consult-gate.js` | ✓ |
| UserPromptSubmit | — | `codemap-recon-consult.trigger.hook.js (bundle upsm-consult)` | ✓ |
| UserPromptSubmit | — | `domain-expansion-trigger.js` | ✓ |
| UserPromptSubmit | — | `inventory-first-gate.js` | ✓ |
| UserPromptSubmit | — | `local-deploy-gate.check.hook.js` | ✓ |
| UserPromptSubmit | — | `MemoryClaimGate.js` | ✓ |
| UserPromptSubmit | — | `mode-detector.js (bundle upsm-mode)` | ✓ |
| UserPromptSubmit | — | `multi-dim-evidence-gate.js` | ✓ |
| UserPromptSubmit | — | `overview-tracker.trigger.hook.js` | ✓ |
| UserPromptSubmit | — | `PlainFirstGate.js` | ✓ |
| UserPromptSubmit | — | `prayer-gate.js` | ✓ |
| UserPromptSubmit | — | `pre-reply-contract.check.hook.js` | ✓ |
| UserPromptSubmit | — | `prepare-commit-trigger.js` | ✓ |
| UserPromptSubmit | — | `prose-default-gate.js` | ✓ |
| UserPromptSubmit | — | `quest-active-grounding.js (bundle upsm-mode)` | ✓ |
| UserPromptSubmit | — | `quest-objective-anchor.js` | ✓ |
| UserPromptSubmit | — | `quest-resume-preflight.js` | ✓ |
| UserPromptSubmit | — | `reask.check.hook.js` | ✓ |
| UserPromptSubmit | — | `release-mlk-plp-ask.check.hook.js` | ✓ |
| UserPromptSubmit | — | `retrieve-sync-gate.check.hook.js` | ✓ |
| UserPromptSubmit | — | `route-consult-gate.js (bundle upsm-consult)` | ✓ |
| UserPromptSubmit | — | `scout-completeness-gate.js` | ✓ |
| UserPromptSubmit | — | `session-items-manager.js` | ✓ |
| UserPromptSubmit | — | `skill-invocation-discipline-gate.js (bundle upsm-consult)` | ✓ |
| UserPromptSubmit | — | `ticket-gate.js` | ✓ |
| UserPromptSubmit | — | `TurnChecklistGate.js` | ✓ |
| UserPromptSubmit | — | `user-side-guardrail.js` | ✓ |
| UserPromptSubmit | — | `word-ui-vocab-gate.js` | ✓ |
| PreToolUse | Agent|Workflow | `agent-spend-gate.check.hook.js` | ✓ |
| PreToolUse | Bash | `branch-at-apply-gate.js` | ✓ |
| PreToolUse | — | `branch-guard.check.hook.js` | ✓ |
| PreToolUse | Edit|Write | `claude-md-edit-guard.js` | ✓ |
| PreToolUse | Bash | `commit-gate.js` | ✓ |
| PreToolUse | Edit\|Write | `domain/knowledge-schema-audit/knowledge-schema-audit.check.hook.js` (write-time branch: warns when a non-canonical / legacy knowledge file name or a bad `flowables-bpmn/` placement is about to be written under `etanah-knowledge/<state>/`; advisory) | ✓ 2026-09-04 |
| SessionStart | — | `domain/knowledge-schema-audit/knowledge-schema-audit.check.hook.js` (boot branch: audits every `etanah-knowledge/<state>/` against `KNOWLEDGE-SCHEMA.json` — required files/dirs, legacy names, un-indexed extras, flowables layout; one advisory line per drifting state; CLI `audit` / `scaffold --state`) | ✓ 2026-09-04 |
| Stop | — | `domain/commit-subject-gate/commit-subject-gate.check.hook.js` | ✓ |
| PreToolUse | Edit|Write | `component-birth-gate.check.hook.js` | ✓ |
| PreToolUse | Bash | `convention-check-gate.gate.hook.js` | ✓ |
| PreToolUse | Edit|Write | `convention-check-gate.gate.hook.js` | ✓ |
| PreToolUse | — | `deploy-guard.check.hook.js` | ✓ |
| PreToolUse | Edit|Write | `design-consult-gate.gate.hook.js (bundle pretool-editwrite-gates)` | ✓ |
| PreToolUse | Edit|Write | `edit-scope-gate.js` | ✓ |
| PreToolUse | Read | `familiar-nudge.check.hook.js` | ✓ |
| PreToolUse | — | `knowledge-first-gate.check.hook.js` | ✓ |
| PreToolUse | Read|Edit|Write | `known-bug-surfacer.hook.js` | ✓ |
| PreToolUse | Edit|Write | `logic-blast-radius.discipline.hook.js` | ✓ |
| PreToolUse | Edit|Write | `no-code-comments-gate.js` | ✓ |
| PreToolUse | Edit|Write | `pre-action-check-gate.js (bundle pretool-editwrite-gates)` | ✓ |
| PreToolUse | Edit|Write | `pre-code-check.check.hook.js` | ✓ |
| PreToolUse | mcp__postgres-mlkprod-pg__.* | `prod-db-confirm.discipline.hook.js` | ✓ |
| PreToolUse | Edit|Write | `quest-phase-gate.gate.hook.js` | ✓ |
| PreToolUse | Bash | `release-mlk-plp-push-gate.check.hook.js` | ✓ |
| PreToolUse | Edit|Write | `release-mlk-plp-scope-gate.check.hook.js` | ✓ |
| PreToolUse | Edit|Write | `system-edit-gate.js (bundle pretool-editwrite-gates)` | ✓ |
| PostToolUse | Grep | `grep-rubric-gate.js` | ✓ |
| PostToolUse | Bash | `quest-bounty.hook.js` | ✓ |
| PostToolUse | — | `RecursiveLoopDetector.js` | ✓ |
| PostToolUse | — | `slip-count-tracker.js` | ✓ |
| PostToolUse | Task|Agent|Workflow | `spawn-telemetry.check.hook.js` | ✓ |
| Stop | — | `ask-back-gate.js` | ✓ |
| Stop | — | `attempt-before-blocked-gate.check.hook.js` | ✓ |
| Stop | — | `awam-no-resit-gate.check.hook.js` | ✓ |
| Stop | — | `ba-understanding-table.discipline.hook.js` | ✓ |
| Stop | — | `citation-cross-check.check.hook.js` | ✓ |
| Stop | — | `codemap-recon-consult.discipline.hook.js` | ✓ |
| Stop | — | `de-output-integrity-checker.js` | ✓ |
| Stop | — | `de-run-verify.js` | ✓ |
| Stop | — | `de-step11-verdict-gate.discipline.hook.js` | ✓ |
| Stop | — | `delegation-plan-presence.check.hook.js` | ✓ |
| Stop | — | `deliverable-lands-on-main.check.hook.js` | ✓ |
| Stop | — | `deploy-proof-gate.js` | ✓ |
| Stop | — | `diagnostic-self-heal-gate.js` | ✓ |
| Stop | — | `discipline.hook.js` | ✓ |
| Stop | — | `falsifier-ran-check.check.hook.js` | ✓ |
| Stop | — | `full-address-trace-gate.discipline.hook.js (bundle stop-reply-shape)` | ✓ |
| Stop | — | `notes-on-test-data.js` | ✓ |
| Stop | — | `operational-follow-through.js` | ✓ |
| Stop | — | `over-generalization-gate.js` | ✓ |
| Stop | — | `patch-script-gate.discipline.hook.js` | ✓ |
| Stop | — | `predicate-box.discipline.hook.js` | ✓ |
| Stop | — | `quest-context-load-gate.js` | ✓ |
| Stop | — | `quest-deferrals-gate.discipline.hook.js` | ✓ |
| Stop | — | `quest-doc-freshness.discipline.hook.js` | ✓ |
| Stop | — | `quest-knowledge-save-gate.js` | ✓ |
| Stop | — | `rcrl-emit-check.js` | ✓ |
| Stop | — | `reply-log.js` | ✓ |
| Stop | — | `scope-claim-census.check.hook.js` | ✓ |
| Stop | — | `show-gate.discipline.hook.js (bundle stop-reply-shape)` | ✓ |
| Stop | — | `silent-claim-drift-gate.js (bundle stop-claim-integrity)` | ✓ |
| Stop | — | `sql-schema-verify.check.hook.js` | ✓ |
| Stop | — | ~~`stop-point-summary.discipline.hook.js`~~ DEREGISTERED 2026-08-18 (`c270f89`, Stop-gate reshape — re-registration parked in todo Q1) | — |
| Stop | — | `terse-gate.discipline.hook.js (bundle stop-reply-shape)` | ✓ |
| Stop | — | `test-scenario-login-gate.check.hook.js` | ✓ |
| Stop | — | `ticket-criteria-gate.discipline.hook.js (bundle stop-claim-integrity)` | ✓ |
| Stop | — | `verify-basis-gate.discipline.hook.js (bundle stop-claim-integrity)` | ✓ |
| Stop | — | `veritas-claim-gate.js (bundle stop-claim-integrity)` | ✓ |
<!-- HOOK-REGISTRY:AUTO-END -->

### 3.1 SessionStart (7 hooks)

| Hook | Owner | Watches | Injects/Blocks | Stakeholders (downstream) | Change-impact |
|---|---|---|---|---|---|
| `system-audit.js` | self | hook registration drift + scope-split misuse + doc drift | text reminder if drift found | みや, every subsequent hook | Changing audit rules changes drift-detection across all hooks |
| `boot-load-verification.js` | self | required boot reads (CLAUDE.md, personality.md, main/main-memory.md, expansion-protocol.md — master-memory + amendments dropped 2026-07-12, P0.3) | reminder if any not Read | Quest skill (depends on boot reads), all phases | If boot reads change, downstream phases lose context |
| `boot-required-read-gate.js` | self | `see X.md` pointers in CLAUDE.md | reminder if pointer doesn't resolve | INV-6 invariant check (this hook IS the enforcement) | If pointer format changes, the regex needs update |
| `worktree-cleanup-boot.js` | self | stale worktree metadata + merged `claude/*` worktrees/branches + decay-stub expiration | **silently prunes + `git worktree remove`s merged worktree DIRS + `git branch -d`s merged branches** (v1.2, 2026-05-30, absorbed DE step 11); text reminder only on decay / uncleanable | rubric decay enforcement, future decay-stubs; DE step 11 (now a pointer here) | worktree-removal is merged-only + never the current/dirty worktree; changing decay-check predicate changes decay enforcement |
| `evolution-check-trigger.js` | self | model-ID change + 30-day evolution elapsed | reminder | evolution-protocol.md procedure | Schedule changes affect when evolution runs |
| `system-check-trigger.js` | self | 30-day system-check elapsed | reminder | system-check skill | Similar to evolution-check |
| `open-quest-surfacer.js` | self | `quest/active.txt` entries with status ∈ {active, hold, blocked, delegated} | "📌 OPEN QUESTS" list at boot | Quest workflow resumption | Status-enum changes (INV-3) require this hook update |
| `domain/arabic-nudge/arabic-nudge.check.hook.js` (NEW 2026-09-06, per みや /goal build) | self | `projects/learning-projects/active/arabic/data/progress.json` via `.claude/skills/arabic/arabic.js nudge` | ONE line `📖 Arabic: N/5 reviews this week · not yet today\|done today`; nothing when the data folder is absent | `/arabic` skill (SPEC §7) | Advisory, never blocks. Personal (non-etanah); state-agnostic. Log `domain/arabic-nudge/log.jsonl` |

> **Power: checklist-reactivate** (2026-06-28) — NOT a SessionStart hook. Resumability TRIO: `/checklist` persists `## Next-Steps Checklist` in the qa_doc → `domain/checklist-reactivate/checklist-show.js <QA>` (reactivate) at `/quest resume` → `domain/checklist-reactivate/resume-readiness.js [QA]` (VERIFY — deterministic cold-resume check) at `/quest hold` + DE Step 12.6. Boot stays lean (/system-design Rule 8 trigger-timing). Replaces the ad-hoc familiar cold-resume test.

> **Power: quest-doc-freshness** (2026-06-28) — Stop hook `domain/quest-doc-freshness/quest-doc-freshness.discipline.hook.js`. After each reply during an `active` quest, flags if the reply looks state-changing but the qa_doc wasn't written this turn → nudge to spawn a familiar to persist. The deterministic trigger for the QA-NNNN.md "save after every stop" rule; REPORT-ONLY; detect(hook)→write(familiar). Same save-gap class as resume-readiness, caught DURING the work.

> **Skill: domain-expansion** (2026-06-28) — DE is now a Skill-tool-invoked orchestrator (`.claude/skills/domain-expansion/SKILL.md`), not just a protocol + trigger-hook. `domain-expansion-trigger.js` routes session-end phrases → invoke the skill (no longer freelances steps inline). Detail stays in `expansion-protocol.md` (source of truth). Raises DE execution from model-driven (freelance-able) → skill-invoked (the skill-invocation-discipline gate enforces actual invocation).

### 3.2 UserPromptSubmit (23 hooks)

| Hook | Owner | Watches user prompt for | Injects | Stakeholders | Change-impact |
|---|---|---|---|---|---|
| `ticket-gate.js` | self | ticket number patterns (QA #N, FAT-OR #N, UAT-CR #N) + Redmine-retrieval | injects Phase-0 gate checklist; **Row 0 (2026-06-20) = COMPULSORY GIT-STATE CHECK** — baseline-verify + behind-origin count + existing-fix probe (`git branch -a --list "*<#>*"` + `git log --all --grep`) → emit GIT-STATE summary, STOP on existing-fix-by-other/pull-fail/stale-base | Quest skill, Phase-0 git-discipline (CLAUDE.md Quest-Prep-Verification row) | regex update if ticket format expands; Row-0 git-commands per repo baseline |
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
| `prepare-commit-trigger.js` | self | Phase 1 close-out trigger phrases | 12-step prepare-commit sequence (Step 2.6 v1.5 2026-06-20 strips cycle-added comments too, unless みや says keep) | quest-protocol.md Phase 1 close-out | Step changes affect the close-out sequence |
| `SystemAwareDecision.js` | self | substantive prompts (always-consult-registry meta-trigger) | "scan skills/hooks/INDEX before responding" reminder | every skill + hook + INDEX file | If new registry layer added, this hook needs to scan it |
| `TurnChecklistGate.js` | self | multi-topic prompts (≥3 numbered items OR ≥2 questions) | "✅ This-turn checklist" template | みや (visible) | Predicate update affects multi-topic detection |
| `quest-resume-preflight.js` | self | bare ticket numbers cross-matching active.txt | Phase 0 preflight checklist | Quest skill resumption | Bare-ticket-format changes need regex update |
| `scout-completeness-gate.js` | self (NEW 2026-05-28, plan Phase 3) | Scout / Recon trigger phrases ("scout spawn", "running recon", "verify each claim", "100% verify", "universal check", "sibling-structure") | injects 100%-VERIFY clause text + UC9 reminder + required Skill tool invocations list | quest-protocol.md 100%-VERIFY clause (line 545), predicate-box skill, claim-verification skill | Predicate-phrase changes (extending trigger detection) require regex update |
| `quest-active-grounding.js` | self (NEW 2026-06-01 S4, hooks-as-harness pattern per みや) | every UserPromptSubmit (no phrase match — always evaluates) | injects `🎯 Active quest: QA-X · Scope: <urusan> · Phase: <current_phase> · Local test: <yes\|no>` per active.txt block where `status=active` AND NOT (`phase=1` AND `local_test_confirmed=true`) — silent if no match | open-quest-surfacer.js (SessionStart counterpart), quest workflow, every prompt during active quest | Status-enum changes (INV-3) + phase-aware silence predicate (option b per みや 2026-06-01) require this hook update; registered in settings.json line 115 |
| `mode-detector.js` | self (NEW 2026-06-01 S5, Item D per みや — mode-scoping enabler) | every UserPromptSubmit | emits `🎯 Mode: <Quest-active\|Discussion>` — same predicate as quest-active-grounding (status=active AND NOT past-testing). Lets downstream hooks scope enforcement to Quest-active mode only | operational-follow-through.js (reads same predicate to scope its warnings), future Debugging-mode hooks (v1.1 deferred) | Mode list expansion (adding Debugging-universal etc.) requires this hook update + downstream consumers |
| `batch-ask.trigger.hook.js` | self (NEW 2026-06-02, Power: `domain/batch-ask/`) | UserPromptSubmit · regex matches extensive-intent phrases (extensive/exhaustive/thoroughly/sweep/in-one-go/save-time/extensive-logging — 7 family patterns ~40 phrases) | injects mandate: use AskUserQuestion tool for ALL clarifying questions this turn; bans chat-written stalling | みや's workflow during extensive-intent prompts; AskUserQuestion tool | Phrase list grows ONLY with ≥2 observed misses + みや nod (per /system-design trigger-reliability discipline) |
| `codemap-recon-consult.trigger.hook.js` | self (NEW 2026-06-16, Power: `domain/codemap-recon-consult/`, QA-261517 — #6 codemap-in-quest-hooks per みや) | UserPromptSubmit · **state-driven** (reads active.txt, NOT prompt-phrase) · fires when a quest is `status=active` AND `current_phase` ∈ {discovery, recon, rubric} | injects codemap-consult reminder: `bpmn_flow.json` (module-scope, MLK_TKL_* teknikal flag) · `callgraph_callers.json` (blast-radius, w/ SootUp method-ref blind-spot caveat — negatives not authoritative) · codegraph MCP | quest Recon/Rubric blast-radius + module-scope steps; etanah-codemap data files; routed /system-rules + /system-design | State-driven chosen because Recon runs autonomously (scout-completeness-gate's prompt trigger misses it); promote to Stop-side back-gate if slip-log shows reminder insufficient |
| `attachment-context.trigger.hook.js` | self (NEW 2026-06-27, Power: `domain/attachment-context/`, retrieved from `unruffled-merkle`) | UserPromptSubmit · quest-intake detected | surfaces BA-attachment file paths + types (photos / PDF / .docx / video) from active Task folder's `0. Brief/` so attachment-skip is structurally impossible — anti-attachment-skip Power | CLAUDE.md §10 BA attachments row + PDF annotation extraction row; quest skill Phase-0 BA-content emit | Predicate refinements per observed misses |

### 3.3 PreToolUse Bash (3 hooks)

| Hook | Owner | Watches | Action | Stakeholders |
|---|---|---|---|---|
| `domain/commit-subject-gate/` | self | a fenced `Ref #`/`QA #` subject in the reply | DRAFT-time subject shape R1–R6 (no `;`, no dash in description, no arrows, no non-change words, ≤100 chars, redraft never longer) — BLOCK; bypass `[skip-commit-subject:]` | commit-conventions.md §Subject shape | pairs with commit-gate Check 0 |
| `commit-gate.js` | self | `git commit` commands | stop-at-staging + message-format **v4 (2026-09-02): R1–R5 + verbs must match staged status letters** + message-approval flag (3b) + Check 1 = **green build OR local_test_confirmed** (per みや 2026-08-28; a successful build substitutes for a manual local test) + checklist | etanah-pelupusan commits, MemoryCore commits | Commit-conventions changes require predicate update |
| `convention-check-gate.js` | self (v1.5 2026-07-01) | Edit/Write on .java (BLOCK) · .docx / .xhtml / .sql / config (advisory) + SQL UPDATE/INSERT in Bash + mcp__postgres queries | find-working-analog convention reminder; **v1.5**: `.sql` file-write fires the sql checks + VERIFY-SELECT-shows-TRUE-values line (no BOOL_OR/COUNT/CASE stand-ins) | data-patch operations, all code edits | Rule home for verify-true-values: CLAUDE.md §9 |
| `branch-at-apply-gate.js` | self (NEW 2026-06-19 branch-at-Apply ban defender; **un-ghosted 2026-06-20** — file had been written to the worktree hooks dir while settings.json points at the MAIN path → never fired; now copied to main path) | `git checkout/branch/switch` on a work repo while the active quest is pre-Commit | block + force-surface (base-branch decisions are みや's; branch ops are Commit-prep only, never Apply) | quest Phase-1 close, CLAUDE.md branch-at-Apply ban | one-shot flag bypass `.claude/state/base-branch-approved-<QA>.flag` |

### 3.4 PreToolUse Edit|Write (7 hooks)

| Hook | Owner | Watches | Action | Stakeholders |
|---|---|---|---|---|
| `domain/design-consult-gate/design-consult-gate.gate.hook.js` | self (NEW 2026-06-18 — replaces self-gate-impulse for skill/hook creation) | Edit/Write to `.claude/skills/**/SKILL.md` · `.claude/hooks/*.js` · `domain/**/*.hook.js` | **HARD-BLOCK (deny)** until transcript shows BOTH `system-design` + `system-rules` invoked this session; bypass `[skip-design-consult: <reason>]`; fail-open; reads `transcript_path` | system-design + system-rules consult discipline (みや 2026-06-18) | self-gate-impulse.js RETIRED (unregistered 2026-06-18 — WARN-only since 2026-05-20, never enforced) |
| `phase0-artifact-gate.js` | self | Edits during Phase 0 | Phase 0 artifact rules | Quest Phase 0 | Phase 0 rule changes need this hook update |
| `pre-action-check-gate.js` | self | quest-related path edits | Notes.txt + env-check + PDF reminders · **Notes-file tool-only DENY (v1.2)** · **deliverable-in-quest-folder DENY (v1.3, 2026-09-02): any non-QA-NNN.md file under projects/…/active/QA-*/ is denied; Redmine-bound deliverables → Task folder 2. Fix/ or 3. Rework/** | Quest skill, Notes.txt write, notes.js | Path-pattern changes need predicate update |
| `system-edit-gate.js` | self | `system/*` path edits + (Phase 0 extension) hooks/skills/protocols/state-files. **2026-07-20 finding (NOT a code change — v1.3 was reverted as redundant)**: `.claude/hooks/*.js` was ALREADY covered (pattern line 54, since v1.1). A `ticket-gate.js` edit still landed on the advisory branch because the deny is conditional on `archTouched` — `system-architecture.md` had already appeared in the session transcript (via an unrelated read), so the hard-block was skipped. **Real gap: `archTouched` is a whole-transcript regex, so ANY earlier mention disarms the deny for the rest of the session.** Tightening it (proximity/edit-only match) is an open design item. | recursive safety + paired-edit predicate | system-layer audit, architecture-doc-sync | Phase 0 extends this hook for architecture-doc-sync |
| `edit-scope-gate.js` | self | suspicious delete-unrelated-code patterns | preservation discipline reminder | PRESERVATION DISCIPLINE rule | Pattern-list expansion needs predicate update |
| `convention-check-gate.js` | self (dual-registered; v1.3 2026-06-20 — Java BLOCKING, +jsf/.xhtml ADVISORY, +IN-FILE-FIRST) | Edit/Write to .java / .docx / .xhtml / .json|xml|properties | **Java: HARD-BLOCK (deny)** unless an analog is cited this session (bypass `[skip-convention-check:]`, fail-open); **.xhtml/.docx/config advisory** reminder + universal **IN-FILE-FIRST** check (grep the TARGET FILE's own idiom before parallel code — QA-261517) | etanah-pelupusan code/JSF edits, template edits | jsf/SQL/.docx promote-to-block on evidence; Java self-tested 5 cases 2026-06-19 |
| `claude-md-edit-guard.js` | self (NEW 2026-06-02 — enforces /system-rules Rule 2 merge-in-place) | Edit/Write to CLAUDE.md · /system-rules/SKILL.md · /system-design/SKILL.md | scans for HARD-RULE block opener · Why+QA-NNN narrative · pairs-with cross-ref · How-to-apply restatement · みや verbatim quote inside rule body; warns advisory | /system-rules Rule 2, /system-design Bloat-prevention default; pairs with no current skill (hook-only Power) | Bloat-pattern regex additions per observed misses |
| `quest-phase-gate.js` | self (NEW 2026-06-08, QA-262762 — structural defender for the skip-the-phases / fix-on-assumption slip, root_category wrong-baseline-diagnosis 🚨) | Edit/Write to `etanah-*` code/template/config WHILE a `status=active` quest exists | **HARD-BLOCKS** until Scout+Recon+Rubric banners (`═══ SCOUT/RECON/RUBRIC ═══`) appear in the session transcript; bypass `[skip-phase-gate: <reason>]`; **fail-open** (any error → allow) | quest-protocol.md FORCED PHASE-EMIT GATES + banner contract + Logic Blast Radius Evidence column; **first hook to read `transcript_path`** | Checks SHAPE (presence) NOT correctness — that stays Ruri's judgment + みや's glance; marker/predicate changes need regex update. Self-tested 5 cases 2026-06-08 |

### 3.5 Stop (22 hooks)

| Hook | Owner | Watches turn-end | Action | Stakeholders |
|---|---|---|---|---|
| `reply-log.js` | self | every Stop | log reply for analytics | reply-log.jsonl state | Log-shape changes affect downstream tools |
| `operational-follow-through.js` | self | every Stop | check operational TODOs | Quest workflow follow-through | Predicate extension affects what's checked |
| `file-list-after-refine.js` | self | refine/save signal | emit list of touched files | みや (visible) | Refine-detection changes affect emit |
| `notes-on-test-data.js` | self | test-data mentions in turn — permohonan IDs (`PTMLK/../..`) **+ v1.2 (2026-07-20) No Resit Carian Rasmi** (`\b\d{6}[A-Z]{2,6}\d{4,6}\b`, e.g. `260707BSAT00337`) | Notes.txt write reminder | Quest skill, Notes.txt state, etanah-knowledge TEST-PERMOHONAN-INDEX § No Resit Carian Rasmi | Test-data detection changes affect reminder. Receipt pattern rejects hakmilik ids (9 trailing digits), permohonan ids, SHAs — 9-case regex fixture verified |
| `silent-claim-drift-gate.js` | self | "done"/"complete" claims without diff-backing | advisory reminder (Stage 5A) / hard-block (Stage 5B) | Phase 5 enforcement, claim-verification skill | Phase 3 + Phase 5 both extend this hook |
| `diagnostic-self-heal-gate.js` | self | /verify-shape emit + stalling phrase | self-heal mandate | stalling-detector skill | Predicate changes affect self-heal triggers |
| `ask-back-gate.js` | self (catalogued 2026-06-19 — was registered but absent from this table, the lone real DOC-DRIFT after the audit-rule fix) | every Stop — reply offers a choice / asks permission with no decision-required signal | advisory self-check: search/finish before asking (no-asking-back rule); `[genuine-fork: <reason>]` bypass | personality.md "No asking-back for searchable facts" + quest Debug Ritual 5 | predicate tuning per false-fire observations |
| `diary-format-gate.js` | self (NEW 2026-05-28, parallel session) | every Stop | validates 3 H2 sections in today's daily-diary entry (Sessions / Index / Closing) | daily-diary template, DE Step 4 | Template-section name changes require this hook update; warn-only (does not block) |
| `rcrl-emit-check.js` | self (NEW 2026-06-01 S5, RCRL backstop) | every Stop — fires only when active.txt has `status=active` AND turn transcript has Recon-shape emit | warns if RCRL block missing (advisory in v1); bypass via `[skip-rcrl: <reason>]` | CLAUDE.md §10 RCRL primitive Step 0, scout-completeness-gate.js (same family) | Stage 2 flip to `decision:block` deferred until predicate quality observed |
| `quest-knowledge-save-gate.js` | self (NEW 2026-06-03, continuous knowledge-save; **v2 2026-07-01** — now also fires on phase-emit + hand-back, not only discovery) | every Stop — fires when active.txt has `status=active` AND the turn surfaced a discovery signal (root-cause / `@Column` / class-chain / `file:line` / tugasan etc.) **OR a phase-emit / hand-back** AND no save-confirmation phrase present | warns to route the finding NOW: durable → `etanah-knowledge/melaka/<category>.md` (DE Step-7 table), quest-specific → `QA-NNN.md`; warn-only | DE Step-7 sweep (continuous version of it), quest skill, etanah-knowledge files | v2 widened trigger to phase-emit + hand-back; block-on-Stop still a future candidate |
| `domain/show-gate/show-gate.discipline.hook.js` | self (NEW 2026-06-18 — SHOW-discipline, per みや "the utmost criteria") | every Stop — reply discusses a change/compare/finding with no box-diagram and no code-block | **HARD-BLOCK (decision:block)** the turn end until a shown artifact present; bypass `[skip-show-gate: <reason>]`; exempt ═══/DE/short(<500); fail-open; reads `transcript_path` | CLAUDE.md §2 diagram-mandatory rule (makes it deterministic) | trigger-signal regex additions per observed misses |
| `domain/codemap-recon-consult/codemap-recon-consult.discipline.hook.js` | self (NEW 2026-06-19 — codegraph back-gate, per みや "you failed to use codegraph AGAIN"; the pre-planned promotion named in the trigger-hook header) | every Stop — reply makes a completion/"exhausted" claim AND active.txt status=active AND NO `mcp__codegraph__*` call this turn | **HARD-BLOCK (decision:block)** until codegraph runs; bypass `[skip-codegraph: <reason>]`; exempt ═══/DE/short(<400); fail-open; reads `transcript_path` | codemap-recon-consult front-gate (trigger.hook.js reminder), CLAUDE.md grep-vs-codegraph split | completion-claim regex additions per observed misses; self-tested 5 cases 2026-06-19. **v1.1 2026-06-19 (QA-266215): also fires on a CODE root-cause claim (ROOT_CAUSE_CLAIM + CODE_SIGNAL) made w/o a codegraph call — the owner-count-misdiagnosis defender; `CODEGRAPH_GATE_ACTIVE_TXT` env-override for eval; eval 9/9** |
| `veritas-claim-gate.js` | self (NEW 2026-06-20 — TRUTH layer; QA-265964 lying root-cause, built via anti-fabrication workflow) | every Stop — reply makes an EXTERNAL-research claim ("I checked GitHub / searched the web") with ZERO search tools this turn, OR a BEHAVIOURAL claim (saves/persists/displays/loads) with no runtime evidence | external-research lie → **HARD-BLOCK**; behavioural-claim → **advisory** (flips to block after a fixture-validated binder + zero-false-positive window); bypass `[skip-veritas: <reason>]`; EXEMPT+FRAME pre-gates (negation/hedge/hand-back/recap → abstain); line-1 `stop_hook_active` exit; fail-OPEN; reads `transcript_path`; ledger `.claude/state/veritas-claim-ledger.jsonl` | silent-claim-drift-gate (completion-verb sibling — veritas covers the behavioural-verb + research-claim hole), show-gate (FORMAT vs TRUTH split), CLAUDE.md §2 | behavioural→block flip gated on validation window; 7/7 fixtures pass 2026-06-20 |
| `domain/ticket-criteria-gate/ticket-criteria-gate.discipline.hook.js` | self (NEW 2026-06-20 — ticket-criteria COMPLETENESS, per みや QA-261986 "much more critical than the test stop hook") | every Stop — (A) reply makes a done/close/ready-to-test claim + ticket ref, not hedged; (B) reply emits an Issue Checklist | (A) **HARD-BLOCK** unless a `CRITERIA COVERAGE` table + ≥1 evidence token present (each BA criterion needs file:line / test / DB read-back / みや-confirmed, no bare ✓); (B) **advisory** if the checklist cites no BA source; bypass `[skip-criteria-gate: <reason>]`; line-1 `stop_hook_active`; fail-OPEN; reads `transcript_path` | veritas-claim-gate (per-claim TRUTH vs full COVERAGE), Rubric BA-Expected Alignment (Apply-time vs done-time), /verify Checklist C — complements, not duplicates | CAN: table+evidence shape ~100%; CANNOT: evidence valid / criteria exhaustive / unknown bug found. Check B flips to block + per-row parsing on evidence; eval-vs-past-tickets deferred. Built in worktree zen-napier-4471cc — pending merge to main (§3.0 registry shows MISSING until then) |
| `domain/ba-understanding-table/ba-understanding-table.discipline.hook.js` | self (NEW 2026-06-27, Power: `domain/ba-understanding-table/`, QA-267382 root — *retrieved from `unruffled-merkle`*) | every Stop — quest-intake turn with no "BA said \| my understanding" table emitted | **advisory**: prompt 2-col anchor (col 1 = BA said VERBATIM with one row per attachment; col 2 = pre-Phase-0 understanding) — stops inference from overriding BA's ground truth; bypass `[skip-ba-table: <reason>]` | CLAUDE.md §10 Quest Preparation Verification BA-attachments row, multi-dim-evidence skill | Predicate tuning per observed misses; flip to block after fixture validation |
| `domain/terse-gate/terse-gate.discipline.hook.js` | self (NEW 2026-06-27, Power: `domain/terse-gate/`, retrieved from `unruffled-merkle` — みや 2026-06-24 "you're still blabbering stupidly") | every Stop — heavy prose lines (>150 chars, non-table, non-diagram, outside code fences) ≥6 in reply | **HARD-BLOCK** (decision:block) — "convert to tables/diagrams"; exempt short(<800)/═══/DE/personal; bypass `[skip-terse: <reason>]`; fail-OPEN | show-gate sibling (FORMAT discipline: show-gate fires on change/finding signals; terse-gate fires on verbosity regardless of content), CLAUDE.md §2 HARD PRE-SEND GATE | Heavy-line threshold tunable per false-positive observation; superpowers v6.0.3 #6 home (≤1-line narration folded here) |
| `domain/verify-basis-gate/verify-basis-gate.discipline.hook.js` | self (NEW 2026-06-27, Power: `domain/verify-basis-gate/`, retrieved from `unruffled-merkle`) | every Stop — reply makes a BEHAVIOURAL claim (saves/persists/displays/loads/works) with no verifying tool-call this turn (DB read-back, grep, code read) | **advisory** at v1: flag claim + ask for basis citation; bypass `[skip-verify-basis: <reason>]`; fail-OPEN | veritas-claim-gate sibling (veritas covers external-research lies + behavioural-block; verify-basis covers behavioural-advisory at finer granularity), silent-claim-drift-gate (completion-verb sibling) | v1.1: behavioural→block after fixture-validated binder window |
| ~~`auto-commit-docs.js` (+`auto-commit-worker.js`)~~ — **RETIRED 2026-07-02** (commit `7ac9ec0`) | — | — | Per-turn background commit+push. **Deleted + unregistered** per みや /goal: per-turn git flashed a cmd window every turn (no `windowsHide`) + committed telemetry logs as junk. **Save path reverted to DE / save-all** (session-end, one git run). Root slip = shipped with no eval; see §3.13. | — | — |
| `de-run-verify.js` | self (NEW 2026-07-01, per みや /goal — DE no-miss guard) | every Stop — warns if a session wraps without Domain Expansion having run | advisory warn — closes the DE full-skip hole (a session ending with no save ritual) | domain-expansion skill, DE Step-1 boot-verification, current-session/diary save ritual | predicate tuning per false-fire; block-flip a future candidate |
| `domain/patch-script-gate/patch-script-gate.discipline.hook.js` | self (NEW 2026-06-29 — patch-script annotation + Stage-Match discipline, per みや PROD patch `0402DIS2025000170`; salvaged to main 2026-07-05 from stranded worktree amazing-bassi) | every Stop — (1) reply has SQL DML (`UPDATE…SET` / `DELETE FROM` / `INSERT INTO`) in a fenced code block without `-- N rows {updated\|deleted\|inserted}` trailing annotation; (2) reply UPDATEs a transactional table (`umm_aplikasi` / `umm_a_*` / `umm_p_*` / `dft_a_*` / `pks_a_*`) without a "Stage-Match" marker or `⏭ N/A — reference table` token | **advisory v1** both checks (flip to block once validated, per /system-rules R4); bypass `[skip-patch-gate: <reason>]`; line-1 `stop_hook_active`; fail-OPEN; log `domain/patch-script-gate/log.jsonl` | CLAUDE.md §9 Patch-script rule v1.62 (rules 3-5: ONLY-UPDATE-WHAT-IS-REQUIRED · Stage-Match Block · expected-outcome annotation); patch checklist (4→6 items) | CAN: missing-annotation/marker shape ~100%; CANNOT: N correct / WHERE portable / patch minimal / stage-verdict right. HOOK-ONLY Feature (R7); Stop = leanest trigger (R8 — patch scripts emit in any context) |
| `domain/full-address-trace-gate/full-address-trace-gate.discipline.hook.js` | self (v1 advisory 2026-07-01 QA-267976; **v2 BLOCKING 2026-07-06** — background task, promoted after 6+ fires/day on QA-268883, relocated `.claude/hooks/` → Feature folder) | every Stop — reply looks like a trace/class-chain (≥2 `:line` refs AND arrows `↓`/`→` OR the words "class chain"/"trace") AND contains ≥1 bare filename:line (no path/repo prefix) OR bare method():line (no `Class.` prefix) | **HARD-BLOCK (decision:block)** — lists offenders, hints full-address form, points at bypass; exempt: `[skip-full-address: <reason>]` · ═══/DE/banner · short(<400); `stop_hook_active` guard; fail-OPEN; log `domain/full-address-trace-gate/log.jsonl` | personality.md `FULL-ADDRESS TRACE` rule (line 50); CLAUDE.md §2 class-chain vertical form; quest-protocol.md class-chain emit | CAN: bare-file / bare-method shape ~100% within trace-shaped replies (fixture eval 10/10). CANNOT: judge whether the FULL address that Ruri writes actually points to the real code — that stays Ruri's judgment + みや's glance. Baseline: 49.2% first-try compliance across last 20 sessions (94/191); target ≥95% after promotion. HOOK-ONLY Feature (R7 — pre-emit skill would duplicate what block already achieves); Stop = leanest trigger (R8 — last chance before みや reads) |
| `domain/de-step11-verdict-gate/de-step11-verdict-gate.discipline.hook.js` | self (NEW 2026-07-07 — hot-fix defender for DE Step-11 "flagged" shortcut, per みや after frosty-elbakyan-007619 archive-dialog slip) | every Stop — reply contains DE close banner (`Domain Expansion — closed` / `Barrier settles`) AND `git status --porcelain` returns uncommitted files AND ≥1 file has no disposition line (`discard:` / `park:` / `commit:` / `keep-in-worktree:`) in the reply | **HARD-BLOCK (decision:block)** — lists undisposed files, shows all 4 disposition-line forms, points at bypass; bypass `[skip-de-verdict: <reason>]`; `stop_hook_active` guard; fail-OPEN (git-shell / parse error → allow); log `domain/de-step11-verdict-gate/log.jsonl`; test hook `DE_VERDICT_GATE_FAKE_STATUS` env-var for eval fixtures | DE Step 11 (`expansion-protocol.md`), CLAUDE.md Phase-2 archive-hygiene rule (same family — "flipping status without moves is incomplete close") | CAN: force per-file disposition at close moment ~100% (fixture eval 7/7). CANNOT: judge whether the chosen disposition is CORRECT — that stays Ruri's judgment. HOOK-ONLY Feature (R7); Stop at close banner = leanest trigger (R8). Root slip = frosty-elbakyan-007619 DE closed with "flagged" verdict; harness dialog then surfaced 2 uncommitted files DE had ignored |

### 3.5b PreToolUse mcp-tool-matcher (1 hook)

| Hook | Owner | Watches | Action | Stakeholders |
|---|---|---|---|---|
| `domain/prod-db-confirm/prod-db-confirm.discipline.hook.js` | self (NEW 2026-06-29 — みや granting PROD read-only via pgEdge `postgres-mlkprod-pg`; salvaged to main 2026-07-05 from stranded worktree amazing-bassi) | PreToolUse matcher `mcp__postgres-mlkprod-pg__.*` (every pgEdge tool on the PROD server) | Forces `permissionDecision: "ask"` — harness prompts みや on EVERY PROD touch (defence-in-depth over the `et_read` read-only DB role) · audit-logs tool + SQL preview to `domain/prod-db-confirm/log.jsonl` · injects 🚨 PROD DB ACCESS banner (role/host/db visible) | `~/.claude.json` `postgres-mlkprod-pg` MCP entry (host 172.30.17.104:5444 db etprdmlk user et_read); raw `postgres-mlkuat` retired same batch (tombstoned — pgEdge `-pg` verified) | CAN: intercept-every-PROD-call ~100%; CANNOT: judge whether みや should approve. HOOK-ONLY Feature (R7); PreToolUse on exact tool-name pattern = leanest gate (R8) |

### 3.6 PostToolUse (3 hooks)

| Hook | Owner | Watches | Action | Stakeholders |
|---|---|---|---|---|
| `RecursiveLoopDetector.js` | self | same-tool + similar-args 3+ times in window | loop warning | Momentum Circuit-Breaker ritual | Window-size + similarity threshold are tunable |
| `slip-count-tracker.js` | self | Edit/Write to `system/slip-log.md` (dated entry rows) | append {ts,category} to `system/slip-counts.jsonl` + emit 7d/30d tally + escalation flag | auto-skill-on-mistake Step 5 | NEW 2026-06-20 (みや item 4). Ledger = source of truth; the markdown count-table is a view |
| ~~`domain/stop-point-todo-table/stop-point-todo-table.discipline.hook.js`~~ | ~~self (2026-06-30 → RETIRED 2026-07-06)~~ | ~~matcher Edit\|Write\|NotebookEdit on code files~~ | RETIRED — advisory-only + code-Edit-only + free-text bypass abused ("mid-implementation" etc.). Subsumed by broader Stop-hook below. Old spec ⊂ new spec (Rule 6 v1.2 spec-preservation). | — | See `domain/stop-point-todo-table/README.md` tombstone |
| `domain/stop-point-summary/stop-point-summary.discipline.hook.js` | self (NEW 2026-07-06 per みや) | Stop event — fires at end of every reply | **HARD BLOCK** if substantive turn (tool_use ≥ 1 OR ≥ 300 chars + code-block/table/≥ 8 lines) ends without a Stop-Point Summary (`## ▶ <Title>` full form OR `Micro-Summary:` 3-line form OR TurnChecklistGate `## ✅ This-turn checklist`) | `stop-point-summary` skill (carries procedure); replaces retired `stop-point-todo-table` | Bypass WHITELIST ENUM only: `[skip-stop-point-summary: pure-ack\|question-only\|error-only\|de-mode\|closing-voice]` — free-text reasons REJECTED (that was the abuse pattern). Structural exempt: DE banner / るり結界 / Bankai. Fail-OPEN on error. Recursion guard on `stop_hook_active`. Eval + smoke-test at `domain/stop-point-summary/eval.js` (Rule 6 v1.2 fire+effect verified 7/7 fixtures). Baseline at ship: 24.9% substantive-turn compliance (154/618 across 15 recent transcripts). Target: ≥ 95%. |

### 3.7 Hooks added/changed by plan `cached-floating-hummingbird.md` (executed 2026-05-28)

- ✅ Phase 0: `system-edit-gate.js` v1.1 — added paired-edit predicate (system-component edits trigger arch-doc-sync reminder; bypass `[skip-architecture-doc-update: <reason>]`)
- ✅ Phase 1: `pre-action-check-gate.js` v1.1 — added single-canonical-doc enforcement (blocks edits to sibling files under projects/coding-projects/active/QA-*/ that aren't QA-NNN.md; bypass `[skip-canonical-doc: <reason>]`)
- ✅ 2026-06-04: `pre-action-check-gate.js` v1.2 — added Notes-file tool-only DENY (hard `permissionDecision: deny` on Write/Edit to `1. Tasks\Melaka\…\1. *.txt` → forces `node quest/notes.js`). Structural defender for `tool-choice-skip` 5th-cluster-strike (QA-264006 Notes hand-write). Merge-in-place into the existing gate (already fired on the Notes path) — no new hook, no new registration. notes.js bypasses (writes via Bash fs, not the Edit/Write tool).
- ✅ Phase 3: `scout-completeness-gate.js` (NEW, UserPromptSubmit) — injects 100%-VERIFY clause + UC9 sibling-structure-read reminder on Scout/Recon trigger phrases
- ✅ Phase 5: `silent-claim-drift-gate.js` v1.1 — Stage 5A advisory extensions: (a) scans for `→ Skill: <name>` tokens vs Skill tool calls; (b) scans Recon emits for HYPOTHESIS-vs-VERIFIED ratio (100%-VERIFY check); (c) scans system-component edits vs system/system-architecture.md edits (arch-doc-sync). All advisory in Stage 5A; Stage 5B (decision:block flip) deferred to future session after observation. Bypass tokens: `[skip-invoke <name>: <reason>]`, `[skip-100-verify: <reason>]`, `[skip-architecture-doc-update: <reason>]`.
- ⏸ Phase 5 Stage 5B (DEFERRED): `silent-claim-drift-gate.js` flip from `additionalContext` advisory to `hookSpecificOutput.decision: "block"`. Dry-run scenarios at `system/hook-test-scenarios.md`.
- ⏸ `PlainFirstGate.js` hard-block upgrade (DEFERRED to Stage 5B alongside silent-claim-drift)

### 3.8 Changes 2026-06-20 (STG-PPTPB session — みや system-improvement batch)
- ✅ `slip-count-tracker.js` (NEW, PostToolUse) — auto-maintains slip escalation counts in `system/slip-counts.jsonl` (was hand-maintained → stale). Eval 3/3.
- ✅ `silent-claim-drift-gate.js` Extension D — agreement/conclusion reflex ("you're right" / "that's the bug" / "confirmed") with no verification evidence → advisory (assume-not-verify guard; みや item 1). Eval 3/3.
- 🐛 **`silent-claim-drift-gate.js` was a SYNTAX-GHOST since 2026-05-28** — its v1.1 header comment contained `.claude/skills/*/SKILL.md`; the `*/` closed the block comment early → the file threw on every Stop → never fired (fail-open). `system-audit` missed it (checks REGISTRATION, not syntax). FIXED (node --check PASS). **Defender candidate**: system-audit (or a boot step) should `node --check` every registered hook to catch syntax-ghosts (would also have caught the earlier `branch-at-apply-gate` ghost). Flagged in todo.
- ✅ `hook-syntax-check.js` (NEW, SessionStart) — `node --check`s every registered hook at boot, reports syntax/path GHOSTS (the class system-audit can't see). Eval PASS; on first run it immediately found pre-action-check-gate.js (below). Standalone now; folds into system-boot-check at rename time.
- 🐛 **`pre-action-check-gate.js` was ALSO a syntax-ghost since 2026-05-28** — header comment `projects/coding-projects/active/QA-*/` → the `*/` closed the block comment early. FIXED (node --check PASS). Found by hook-syntax-check's first run. **TWO core gates** (this + silent-claim-drift) dead ~3 weeks, both from the 2026-05-28 plan's comment style → hook-syntax-check is the structural fix for the whole class.
- ⏸ DEFERRED to system-index session: rename `system-audit` → `system-boot-check` (marker-coupled, ~6-8 live files; hook-syntax-check folds in here); the any-task-in-active.txt convention doc (CLAUDE.md / quest-protocol); quest-knowledge-save-gate v1.1 (warn→block).

### 3.9 Changes 2026-06-21 (housekeeping session — worktree-portability + salvage)
- ✅ **Hook path convention: absolute-main → `${CLAUDE_PROJECT_DIR}`** — all 59 hook command paths in `.claude/settings.json` rewritten from the hardcoded main-repo absolute path to `${CLAUDE_PROJECT_DIR}\...`. **Why**: the absolute-main path made every worktree depend on the MAIN working tree's freshness — any hook newer than main's checkout commit was a ghost in every worktree (caught this session: `ticket-criteria-gate` was the lone dead hook because the main tree sat 4 commits behind). `${CLAUDE_PROJECT_DIR}` is substituted by Claude Code itself, pre-exec and platform-agnostic (verified against code.claude.com/docs/en/hooks), and resolves to the running session's own root — so each worktree runs the hooks its OWN branch carries. Eliminates the stale-main-tree ghost class; `worktree-cleanup-boot.js` keeping main current is no longer load-bearing for hook correctness. Verified: JSON valid · 0 absolute paths left · 59/59 resolve to existing files in-worktree. Live-fire confirmed on next CC restart.
- ✅ **Activated `quest-objective-anchor.js` (UserPromptSubmit, NEW 2026-06-17, QA-261517 anti-drift OBJECTIVE LOCK) + `deploy-proof-gate.js` (Stop, NEW 2026-06-14 QA-260508 B4, deploy-proof advisory)** — both salvaged from unmerged worktree branches (charming-jones / great-cori) that never reached main; advisory/fail-open; target the open wrong-baseline/drift slip cluster.
- §3.0 registry regenerated (`node system/sync-hook-catalog.js`): 56 → 59 registrations.

### 3.10 Changes 2026-06-22 (overnight feature batch — みや GO)
- ✅ **NEW Power `domain/scan/`** + skill `.claude/skills/scan/` (`/scan`) — static bug-pattern detection for etanah Java: PMD (curated `bug-ruleset.xml`, bug-only) + SpotBugs (`-high` bytecode dataflow) on a file/package, merged into a defect-shaped table. Tools live at `%LOCALAPPDATA%\etanah-static-analysis` (PMD 7.25 + SpotBugs 4.10, out of repo). **NEW hook `domain/scan/known-bug-surfacer.hook.js`** (PreToolUse Read|Edit|Write) — surfaces recorded known-bugs for a `.java` file the moment it's read/edited; store `known-bugs.jsonl`, `--record`ed by /scan; advisory/fail-open. Selftest PASS; live eval caught a real latent NPE (`PelupusanLiteService:789`, flagged independently by PMD `BrokenNullCheck` + SpotBugs `NS`). Closes the "we have no defect detection" gap (codegraph/SootUp map structure, not bugs).
- ✅ **NEW Power `domain/review-etanah/`** + skill `.claude/skills/review-etanah/` — layered review orchestration: `/scan` (static) → built-in `/code-review` (etanah-rule-aware) → `/security-review` (SQLi/XSS/authz/PII). Ships `REVIEW.md` (canonical in `domain/review-etanah/`, active copy at the etanah repo root) so the built-in commands enforce our non-negotiables (schema-prefix, sibling-wiring, VO-instance, blast-radius). Inventory-first: built-ins already existed; this configures + composes, doesn't reimplement.
- ✅ **`best-practices-consult-gate.js` extended** — now also fires on "add/create/build a feature/Power/capability" phrasing → reminds to invoke `/system-rules` + `/system-design` first (per みや: "add a feature" always means consult both; `design-consult-gate` hard-blocks the skill/hook edit otherwise). Merge-in-place, no new hook.
- ✅ **superpowers** — marketplace index was stale (2026-04-20); refreshed via `claude plugin marketplace update`; superpowers confirmed installed + current at **5.1.0** (`install` idempotent, reports already-current).
- 📋 **Research-only** → `system/research-proposals/2026-06-22-improvement-directions.md`: (a) **codebase-memory-mcp assessed REDUNDANT** with codegraph — not added (margin ≈ 0; does NOT replace grep, orthogonal); (b) 10 improvement directions brainstormed, top 4 deep-researched (DB-schema-aware entity validation · JSF/EL static check · Semgrep convention rules · past-ticket semantic retrieval). NOT built — proposal for みや.
- §3.0 registry regenerated (`node system/sync-hook-catalog.js`): 59 → **60** registrations.

**Total hook count after Phase 5 Stage 5A**: 40 unique files / 41 registrations (added `scout-completeness-gate.js` to UserPromptSubmit).

### 3.11 Changes 2026-06-28 (superpowers v6.0.3 upgrade + quest orchestration integration — みや GO)
- ✅ **superpowers upgraded 5.1.0 → 6.0.3** via `claude plugin update` (restart-required to load). v6 = SDD single task-reviewer (~50% fewer tokens), vendor-neutral vocabulary, plans Global-Constraints/Interfaces, `.superpowers/sdd/` scratch paths. No skill renamed/removed.
- ✅ **Quest orchestration integration** (skill/protocol layer, **NO new hooks** — promote-on-observed-slip per /system-design Rule 7; building a hook in a worktree would hit the 2026-06-20 ghost-hook trap). Eval baseline: `wf_a90c9945` (3 closed quests, adversarially verified — the verify pass caught its own fabricated token %; net = tokens saved-but-unmeasured, speed marginal, **accuracy SAME only with guards**). (a) `.claude/skills/familiar/SKILL.md` — model-tiering (`haiku` retrieval = HYPOTHESIS; capable for Scout-trace/Recon/Rubric) + bulk file-handoff to scratchpad. (b) `quest/quest-protocol.md` Phase-1 Execute — "Subagent orchestration" subsection (#1 file-handoff bulk-only · #2 tiering · #3 one-dispatch-N-emits · failure/rollback · Phase-1 sequential fence · KEEP Recon + #7-rejection). (c) `domain/terse-gate/README.md` — #6 ≤1-line inter-tool narration folded in (not a new rule).
- ⚠️ **Pending みや**: CLAUDE.md boot-summary pointer + version bump (edit-blocked for Ruri); session restart to load 6.0.3.

### 3.12 Changes 2026-07-01 (QA-267976 close + auto-save/DE-guard hooks — commit `f02844d`)
- ✅ **NEW Stop hook `auto-commit-docs.js` (+worker `auto-commit-worker.js`)** — background commit+push of tracked MemoryCore docs at Stop; MemoryCore-only, etanah HARD-guarded, templated message v1. Catalogued in §3.5. (Worker is dispatched by the hook, not separately registered.)
- ✅ **NEW Stop hook `de-run-verify.js`** — warns if a session wraps without Domain Expansion having run; closes the DE full-skip hole. Catalogued in §3.5.
- ✅ **`quest-knowledge-save-gate.js` → v2** — trigger widened to fire on phase-emit + hand-back, not only on discovery signals. §3.5 row updated.
- (Earlier this session, MemoryCore-side: `no-code-comments-gate.js` + `full-address-trace-gate.js` hooks + a personality.md full-address-trace rule + a convention-check-gate no-comments line.)
- Net Stop-hook delta: +2 net-new registered hook files (`auto-commit-docs.js`, `de-run-verify.js`) + 1 worker (`auto-commit-worker.js`, hook-invoked) + 1 enhanced (`quest-knowledge-save-gate.js` v2). §3.5 heading updated 17 → 19 registered Stop hooks. **Note**: §3.0 auto-generated registry should be regenerated (`node system/sync-hook-catalog.js`) to reflect the new registrations.

### 3.13 Change 2026-07-02 (auto-commit-docs RETIRED — commit `7ac9ec0`)
- ❌ **RETIRED Stop hook `auto-commit-docs.js` + worker `auto-commit-worker.js`** (unregistered from `settings.json` + files deleted). Per-turn background commit+push flashed a cmd window every turn on Windows (git spawned with no `windowsHide`) and committed hook-telemetry `*.log.jsonl` as junk every turn. **Save path reverted to the normal method: Domain Expansion / save-all at session end** (one git run, no per-turn noise). Telemetry logs + state files added to `.gitignore` so save-all won't re-add them.
- 🩹 **Root slip**: the hook was shipped 2026-07-01 **with no eval and no smoke-test** — a bypass of §3-doctrine Rule 6. Both defects (missing `windowsHide`, tracked telemetry) would have surfaced in a single smoke-run. Rule 6 hardened this session into a **pre-ship gate** (`.claude/skills/system-design/SKILL.md`) + logged in `skill-failure-log.md`.
- Net Stop-hook delta: **−1** (`auto-commit-docs.js` removed; `de-run-verify.js` stays). §3.5 count 19 → 18; regenerate §3.0 via `node system/sync-hook-catalog.js`.

### 3.14 Change 2026-07-03 (quest-system-audit Phase E9 — retire pass, みや full nod)
- ❌ **RETIRED `phase0-artifact-gate.js`** (PreToolUse Edit|Write) — keyed on `early-diagnostic.md`, an artifact superseded by canonical `QA-<n>.md` + the quest-phase0 Workflow; its `\Z` regex was broken anyway. Paired fix: `verify` Checklist A4 now cites `QA-<n>.md`.
- ❌ **RETIRED `file-list-after-refine.js`** (Stop) — A7 ceremony guard; concern covered by DE manifest + git status.
- ❌ **RETIRED `rubric` skill** (redirect-stub) — its own auto-decay date (2026-06-07) was 26 days past.
- ❌ **DELETED `domain/learn-from-fix/` (empty) + `domain/overview-steps/`** (only orphan `state/239386.json`, zero references — git history preserves it).
- 🔁 **RENAMED `SystemAwareDecision.js` → `route-consult-gate.js` v2.0** — the file's own header always said route-consult-gate (filename≠behavior drift). Trigger narrowed per Rule 8 (floor 80 chars · skip slash-commands/ack-openers), emit trimmed 13→3 lines per cost-efficiency v2. Smoke-tested 3/3 (fires substantive · skips ack · skips slash) BEFORE registration swap — Rule 6 compliant.
- Provenance: [quest-system-audit](../projects/coding-projects/active/quest-system-audit/quest-system-audit.md) Phase B verdicts + B6 adversarial review (2 of 7 retire proposals overturned: this rename instead of deletion; edit-scope-gate merge rejected).
- Net delta: UserPromptSubmit −0 (rename) · PreToolUse(Edit|Write) −1 · Stop −1 · skills −1 · domain folders −2. Regenerate §3.0 via `node system/sync-hook-catalog.js`.
- ➕ **quest-phase-gate v2 (E2+E3)**: after the blocking phase-emit check passes, two ADVISORY checks fire on etanah edits during an active quest — **E3 mechanism-history** (transcript must show `git log -- <edited file>` evidence — QA-268273's 25 unseen sibling commits) and **E2 entry-point proof** (`ENTRY-POINT: <page.xhtml:line> -> <Class.method()>` line required for .java/.xhtml — QA-268273 fix-1 patched the wrong handler). Advisory-first per promote-on-observed-slip; smoke-tested 3/3 (deny-regression · both advisories · silent-with-evidence). CLAUDE.md v1.57 pairs: Rubric row (h) CODE-LOGIC scenario matrix (E4) + Recon Cheapest-falsifier-first (E1).
- ➕ **E7 batch (4 new hooks + 1 extension, all smoke-tested fire+silent before registration)**: `predicate-box-gate.js` (Stop — etanah edit in active quest with no ASSUMPTION+FALSIFIER diagram) · `over-generalization-gate.js` (Stop — broad-quantifier claim with no enumeration evidence) · `multi-dim-evidence-gate.js` (UserPromptSubmit — visual-evidence prompt → open-every-Brief-file reminder) · `grep-rubric-gate.js` (PostToolUse Grep — unscoped content-mode grep nudge) · `pre-action-check-gate.js` +scope-anchor-echo advisory. Controller smoke caught 2 builder defects pre-registration (stdin-as-transcript in both Stop hooks + a hardcoded repo root) — Delegation-Economy controller-verifies discipline working as designed. Deferred (zero slip-links, Rule 7): checklist/evaluator-optimizer/git-health/sycophancy hooks.
- ➕ **E8 batch (4 procedure skills for existing gates)**: `logic-blast-radius` · `quest-objective-anchor` · `quest-knowledge-save` · `pre-action-check` SKILL.md files.
- ➕ **E12 phrase-registry**: `system/phrase-registry.js` generates `system/phrase-registry.md` — one table over the 4 trigger-phrase scatter-homes (skills · hook regexes · CLAUDE.md tables · feedback memories).
- ➕ **E10 fire-on-trigger** (`auto-skill-on-mistake` Step 4.5): a defender built mid-session MUST be exercised on its own triggering ticket same-session. **E13 Phase-2 knowledge-distill gate** (CLAUDE.md v1.58 §Phase-2 step 4): bestiary/post-mortem writes only at verified Phase-2 close.
- ➕ **E5 SHIP-CHECK added to `hook-syntax-check.js`** (same audit batch): every registered hook file must be git-tracked (`git ls-files --error-unmatch`; only exit-1 counts as untracked — transient git errors fail-open). Closes the A1 class (registration-committed/file-uncommitted worktree ghost, seen twice). Smoke-tested both directions (silent when healthy · exactly-1 flag when planted).

### 3.16 Change 2026-07-07 (de-step11-verdict-gate BUILT — hot-fix defender for DE close)

- ➕ **NEW BLOCKING Stop hook `domain/de-step11-verdict-gate/`** — kills the "flagged for future boot" shortcut at DE close. Fires when the reply contains the DE close banner AND `git status --porcelain` returns uncommitted files AND ≥1 file has no disposition line (`discard:` / `park:` / `commit:` / `keep-in-worktree:`) in the same reply. Bypass `[skip-de-verdict: <reason>]`. Fail-OPEN. Test hook `DE_VERDICT_GATE_FAKE_STATUS` env var overrides live git-status for eval.
- 🩹 **Root slip** (frosty-elbakyan-007619 background session, this turn): DE closed with Step 11 verdict = "flagged" while worktree had 2 uncommitted files (`.verify-notified` + `salvage-2026-05-26/convention-check-gate.js`). Harness archive dialog then surfaced "2 uncommitted changes will be permanently discarded", exposing DE's checkbox-not-work failure mode. みや: *"Why do you keep fucking missing stuffs after domain expansion?"* Structural fix = force per-file disposition at close moment.
- Design consult: /system-design + /system-rules invoked earlier this session (design-consult-gate satisfied). R7: hook-only. R8: Stop at close banner = leanest trigger.
- Eval `domain/de-step11-verdict-gate/eval.js` — 7/7 fixture PASS (Rule 6 v1.2 fire+effect checks cleared) BEFORE registration.
- Net Stop-hook delta: 21 → 22.

### 3.15 Change 2026-07-06 (full-address-trace-gate promoted ADVISORY → BLOCKING — background task)

- 🔁 **PROMOTED `full-address-trace-gate` — advisory (v1, 2026-07-01) → BLOCKING (v2, `decision:block`)** — per みや after a QA-268883 session in which the advisory version fired 6+ times/day on the same slip class, each nag arriving AFTER the emit had already reached みや. The advisory nag-then-correct loop is the failure mode; blocking rejects the emit BEFORE it leaves Ruri so the rewrite happens inline. 
- 🔁 **RELOCATED** `.claude/hooks/full-address-trace-gate.js` → `domain/full-address-trace-gate/full-address-trace-gate.discipline.hook.js` (Feature-folder convention alongside show-gate / terse-gate / patch-script-gate). Old file deleted. Settings.json path updated (line 323).
- ➕ **ADDED bypass token** `[skip-full-address: <reason>]` (task-brief requirement; the advisory version never had one).
- ➕ **ADDED `stop_hook_active` guard** (avoids infinite loop — pattern taken from veritas-claim-gate / show-gate).
- ➕ **NEW `domain/full-address-trace-gate/eval.js`** — fixture run (10 cases, 100% PASS) + retrospective transcript scanner. Rule-6-v1.2 spec-preservation checked: v1 offender-detection regexes preserved byte-for-byte, trigger heuristic preserved, log format preserved; new specs (bypass · `stop_hook_active` · length-floor 400 · `decision:block` exit path) documented in `domain/full-address-trace-gate/README.md`. Fire check + effect check both PASS in eval.
- 📊 **Baseline (pre-promotion, over last 20 sessions)**: 49.2% first-try compliance (94/191 trace-shape turns compliant · 97 would-block). **Target**: ≥95% first-try compliance next session — measured by re-running `node domain/full-address-trace-gate/eval.js --transcript-only` after this ships.
- 📐 **Design routing**: /system-design + /system-rules invoked; verdict **hook-only, no pre-emit skill** (R7 — pre-emit skill would duplicate what the block already achieves; the block returns the reply for rewrite BEFORE it reaches みや, which is the same effect a pre-emit skill would produce, minus one Skill-tool round-trip).
- 📝 Slip logged in `Feature/Forge-Self-Improvement-System/skill-failure-log.md`.
- Net Stop-hook delta: 20 → 21 (this Feature added — replaces the previously-un-catalogued advisory hook that lived at `.claude/hooks/`). §3.0 auto-registry regeneration deferred to a merge-to-main follow-up (`node system/sync-hook-catalog.js`).

### 3.16 Change 2026-07-06 (design-consult-gate v1.2 + system-edit-gate arch-doc-sync PROMOTED — background task)

- 🔁 **EXTENDED `domain/design-consult-gate/design-consult-gate.gate.hook.js` → v1.2** (routed /system-design + /system-rules; merge-in-place per Rule 2 — did NOT create a new hook). Root slip: 2026-07-06 QA-268883 session shipped 5 framework files (enum entry in `WordContentControlTypeEnum.java`, 2 util methods in `PelupusanUtil.java`, dispatcher case + handler in `PelupusanTemplateUtil.java`, helper in `PelupusanWordEditorUtil.java`, populator flip in `PelupusanWordCCMethodConstant.java`) with ZERO `/system-design` invocation because the gate's guarded paths did not cover etanah code AND did not cover the top-level rule files themselves.
  - ➕ Guarded paths extended from 3 → 9: added `.claude/settings.json` · `CLAUDE.md` · `personality.md` · `system/**` · `quest/quest-protocol.md` · `domain/*/*.skill.md` (was `.hook.js` only).
  - ➕ **Etanah new-symbol heuristic (advisory-only, err-on-skip-friendly per chip)**: detects new enum entry / new method signature / new switch case / new class definition in `etanah-{pelupusan,awam,common,teknikal}/src/**/*.java`. Emits advisory reminder when consult missing; line-level bug fixes (no new symbol detected) pass through silently.
  - ➕ **Eval-existence rider** (Part 2 — hard-block): creating a NEW hook (`.claude/hooks/*.js` or `domain/*/*.hook.js`) or NEW skill file (`.claude/skills/*/SKILL.md` or `domain/*/*.skill.md`) requires a paired `domain/<name>/eval.js` or `eval.workflow.js` on disk. Bypass `[skip-eval-check: <reason>]` for hooks with no measurable behaviour.
  - ➕ **NEW `domain/design-consult-gate/eval.workflow.js`** — reads hook's own `log.jsonl`, computes first-try compliance rate (`allowed / (allowed + blocked-*)`), advisory fire rate (proxy for etanah false-positive risk), blocked-then-resolved vs blocked-then-abandoned split. Target ≥95% first-try; window configurable (`--window N` / `--all` / `--json`).
  - 📊 **Baseline**: no `log.jsonl` prior to this deploy (gate was silent-passing for these paths); target is ≥95% first-try compliance across next 30 days of guarded-path fires. False-positive rate on etanah line-fixes measured via `advisory-skipped` bucket (fires only when new-symbol heuristic matches; misses → 0 advisory, 0 nag).
  - 📐 **Smoke-tested 8/8** (fire check + effect check per Rule 6 v1.2): guarded CLAUDE.md/system/quest-protocol/settings.json/personality.md all deny; unrelated file passes; etanah NEW method advisory; etanah line-fix silent.
- 🔁 **PROMOTED `.claude/hooks/system-edit-gate.js` v1.1 → v1.2**: architecture-doc-sync predicate advisory → **HARD-BLOCK** (`decision:deny`). System-touching edit (hook / skill / Feature hook / quest-protocol / active.txt / settings.json) is denied unless `system/system-architecture.md` was Read or Edit'd earlier this session (transcript match) OR bypass `[skip-architecture-doc-update: <reason>]` present. Advisory reminder for other system-layer paths preserved unchanged. Smoke-tested 5/5 (block without arch-doc-read · pass with arch-doc-read · pass with bypass · pass when editing arch-doc itself · no-op on non-system-touching).
- 📝 **Comment fix** — `.claude/hooks/best-practices-consult-gate.js:43-44`: was aspirational reference to `design-consult-gate` at implicit path; corrected to `domain/design-consult-gate/design-consult-gate.gate.hook.js` with v1.2 note. The gate WAS real (created 2026-06-18) but the chip investigation only globbed `.claude/hooks/*.js` and missed the domain/ location.
- 📝 Slip logged in `system/slip-log.md` (canonical per skill-failure-log tombstone).
- Net delta: 0 new registrations (both hooks pre-existing); +1 new file `eval.workflow.js`; §3.4 catalog row for `design-consult-gate` should note extended guarded paths + eval rider at next regen.

### 3.17 Change 2026-07-07 (system-design Rule 9 — NUKE-MARKER on new Features)

- ➕ **NEW `/system-design` Rule 9 (HARD)**: every new Feature folder (`domain/<name>/`) MUST ship a `NUKE-MARKER.md` at the folder root before the commit lands. Content: 5 fields (Created / Session / Files / Rollback / Retire date). Purpose: みや can nuke a bad Feature in one grep (`grep -rl "NUKE-MARKER" domain/`) + one `cat`-and-paste of the rollback block, without hunting through `settings.json` + `system/system-architecture.md` + cross-refs.
- ➕ **Grace period 30 days** — the marker auto-removes at Domain Expansion when three retire-conditions hold: (a) `log.jsonl` shows ≥ 1 fire in the window, (b) creation date + 30 days has passed, (c) no rollback event on the ship commit. When all three hold, marker is deleted, Feature graduates to trusted.
- ➕ **RETRO-APPLIED to `domain/stop-point-summary/NUKE-MARKER.md`** in the same commit (Feature shipped 2026-07-06 as commit `90e961d`). Retire date 2026-08-05.
- 📐 **Enforcement pairing**: Rule 6 v1.2 hook fixture-eval SHOULD add a `nuke-marker-present` assertion so a new Feature without a marker fails ship-check the same way a hook without an eval does. Deferred to a follow-on hook extension (not in this ship).
- 📝 Per みや after `stop-point-summary` ship: rollback state was scattered across 4 files (Feature folder + settings.json + arch doc + skill-failure-log). One NUKE-MARKER file centralizes it. Same-day trigger: *"add like for newly created skills/hooks a marking. I can straight away nuke it if it turned out very bad due to your stupid implementation."*
- Net delta: 0 new hook/skill registrations; +1 new rule (`/system-design` v2.3); +1 new file (`domain/stop-point-summary/NUKE-MARKER.md`).

### 3.18 Change 2026-07-07 (code-touch gates quest-independence + Feature migration — familiar-built batch)

- 🔁 **logic-blast-radius-gate v2**: quest-gate REMOVED (was dark outside quests) — fires on ANY stateful-flow etanah .java Edit; migrated to `domain/logic-blast-radius/`; eval 6/6.
- 🔁 **predicate-box-gate v2**: quest-gate REMOVED + advisory PROMOTED to `decision:block`; firing scope = etanah edit + fix-intent in last user message; `stop_hook_active` guard; migrated to `domain/predicate-box/`; eval 7/7.
- 🔁 **convention-check-gate**: behavior unchanged (v1.5 byte-preserved), migrated to `domain/convention-check-gate/` + first-ever eval 5/5; dual registration (Bash + Edit|Write) both swapped; legacy log stays at `.claude/hooks/`.
- 🔁 **quest-phase-gate**: behavior unchanged, quest-gated BY DESIGN (Scout/Recon/Rubric banners are quest artifacts; outside-quest coverage = the trio above); migrated to `domain/quest-phase-gate/` + eval 5/5; NOTE: resolves repo root via `path.resolve(__dirname,'..','..')` — depth-2 invariant, do not nest deeper.
- 🩹 **Why**: みや 2026-07-07 — *"checks must ALWAYS fire when I ask to apply fix or implement etanah code, even outside quests"*; recon found 3 gates silently dark without `status=active`.
- Built by 3 builder familiars + this registrar (controller-only parent).

---

## 4. Skill catalog — every skill, invocation trigger, stakeholders

30 skills total. Grouped by category.

### 4.1 Workflow skills (multi-step, persistent state)

| Skill | Invocation | Produces | Stakeholders / Touchpoints | Change-impact |
|---|---|---|---|---|
| `quest` | `/quest start|hold|resume [<QA-num>]` + trigger phrases (ticket numbers, "let's start with X", etc.) | active.txt entry + QA-NNN.md + workflow execution | every Quest sub-skill (env-check, familiar, verify, appraise, predicate-box, etc.); touchpoints = quest/active.txt, projects/coding-projects/active/QA-*/QA-*.md, Notes.txt | Phase 2.5 rewrote this skill as Skill-tool composition runner; further changes to phase sequencing require updates here + matching `current_phase=` semantics in active.txt |
| `quest-phase0` (Workflow tool) | invoked by the `quest` skill at `/quest start` — auto-fire, `depth=full` for bugs / `quick` otherwise — script `.claude/workflows/quest-phase0.js` (NEW 2026-05-29) | writes `1. Notes.txt` (canonical format, quest-protocol.md:373-403) + QA-NNN.md investigation sections; returns verified diagnosis + fix-shape | Quest Phase 0 ONLY (Apply/test/commit stay human-gated in `quest` skill); touchpoints = quest/quest-protocol.md, etanah-knowledge, Notes.txt, QA-NNN.md, postgres MCPs | Blast-radius is codebaseRoot-keyed: TRG BANNED for etanah-pelupusan, multi-state-aware for etanah-awam. Phase/dimension changes require updates here + the SKILL.md Phase-0 wiring block |
| `verify` | `/verify <ticket>` | Checklist A/B/C/D/E verdict | Quest Phase 1 + Phase 2 close-out; touchpoints = quest/active.txt, git state, file existence | Adding new checklists requires this skill update + system-audit.js extension if invariants involved |
| `appraise` | `/appraise <subject>` + trigger phrases ("appraise", "scrutinize", "check if anything missing", "refine it", "stress-test") | **v2.0 (2026-07-02): ASCR loop — Appraise · Scrutinize · Check-missing · Refine, self-answered with evidence; Refine APPLIES in place by default.** Old 9-question Socratic axes kept as Scrutinize vocabulary | Plan/rule-file reviews, Quest Rubric phase (multi-perspective overlap); validated live on cost-efficiency.md v2 | Adding steps/axes requires this skill update; trigger-phrase additions require skill-description update |
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
| `system-design` v2.0 (REWRITE 2026-06-02) | `/system-design` + trigger phrases | Agentic-specific design: Feature trinity primitive (renamed from Power, E14) (skill+hook+eval in `domain/<name>/`) · layering doctrine · trigger reliability · decay protocol · rules 6+7 (ship with eval · pick the primitive) · bloat-prevention default | Every new feature/Power we build in our agentic system; pairs with /system-rules (universal) + claude-md-edit-guard.js hook |
| `etanah-knowledge-graph-build` | quest mid-flow | knowledge graph artifacts | etanah-knowledge layer maintenance |
| `bankai` | `/bankai` + trigger phrases | autonomous-loop data organization (slip-log consolidation, etc.) | system-layer maintenance |
| `auto-skill-on-mistake` | correction signal detection (via auto-skill-trigger.js hook) | refined/new skill OR hook | system-layer self-improvement |
| `evaluator-optimizer` | iterative refinement moments | scoped review-improve cycle | code/design iteration |

### 4.4 Utility / specialized skills

| Skill | Invocation | Produces |
|---|---|---|
| `env-check` | `/env-check` | env target verified or switched (mlkuat/mlkfat/mkit) |
| `familiar` | `/familiar <file>` | sub-agent read + summary for big files |
| `checklist` | `/checklist` | universal task checklist for quest phase boundaries |
| `annotations` | `/annotations` | PDF annotation extraction |
| `git-health` | `/git-health` | 3-tier safety git check. Tier-1 case-collision recipe is 3-part (refspec → stale-ref delete → two-fetch verify) as of v1.1 2026-08-10 — refspec alone leaves `incorrect old value provided`. Procedure detail + applied exclusion lists: `etanah-knowledge/melaka/GIT-REPO-HYGIENE.md` |
| `system-check` | 30-day boot trigger | system audit |
| `etanah-rahsia-bypass` | etanah-specific need | rahsia document access |
| `usage-guidance` | user-side helper | usage advice |
| `video-frames` | video content | frame extraction |
| `video-trim` (NEW 2026-06-01 S4) | "trim the video" / "trim this video" / "trim my video" / "help me trim" / "video for Redmine" / "trim for upload" / post-testing hand-back with recent ShareX .mp4 | ffmpeg motion-detect cut of idle/loading stretches + tail-trim cursor-to-stop-button + 2 calibration outputs (aggressive/conservative) → highest-numbered Task subfolder + ShareX source delete on verified-success |
| `kowalski` (NEW 2026-07-02, per みや /goal; format chosen via 3-candidate+judge workflow `wf_5c0231fb`) | `/kowalski` · "kowalski" · "explain the architecture" · "draw the stack" · "show me the layers" | 2 ASCII story diagrams — **D1 CONCEPT** (generic layer stack, one line of what each layer does) + **D2 EXAMPLE** (current-work real files as box headers, `method:line` only, zero prose). Skill-only Feature (on-demand, no hook). |
| `redmine-phase1-prefill` (NEW 2026-06-01 S4, manual-invoke only) | "redmine prefill" / "prefill redmine for X" / `/redmine-phase1-prefill` / explicit invocation only — does NOT auto-bind to quest workflow | Claude-in-Chrome MCP driven: navigate Redmine Edit page → fill Status=Resolved + Assignee + %Done=100% + Resolved By (both) + Notes template + Files from highest-numbered Task subfolder → STOP before Submit (みや reviews + submits) |
| `learn-from-fix` (NEW 2026-06-30, manual-invoke only) | "learn from <ticket>" / "learn from commit <SHA>" / "extract lessons from <ticket>" / `/learn-from-fix <ticket>` — no auto-fire | 5-section structured extract from a closed ticket's git commit + Redmine History.txt (identity / root cause / fix shape / learnable factors / reuse potential) + proposed edits to `etanah-knowledge/melaka/BUG-BESTIARY.md` (primary) + secondary knowledge files. Propose + apply after nod (v1); promote to direct-apply after 3 clean runs. Audit log: `domain/learn-from-fix/log.jsonl`. Plan: `Feature/Learn-From-Others-Fixes/plan-v1.md` |
| `skill-invocation-discipline` | hook+skill pair | discipline enforcement |
| `arabic` (NEW 2026-09-06, per みや /goal build; spec `projects/learning-projects/active/arabic/SPEC.md`) | `/arabic` · `/arabic more` · `/arabic week <n>\|next` · `/arabic class at <x>` · `/arabic status` · a reply answering a pending recall | Deterministic daily Arabic vocab review: engine `.claude/skills/arabic/arabic.js` (no deps) picks the Week Set (Madina Book 1 lessons, ≤15-word chunks, Monday roll, carry-over <3 reviews), 5-word table + 1 Malay→Arabic recall, lenient matcher (script / translit / no-shadda / typed-ن tanwin). Model only writes closed-vocabulary sentences on review 2/4. Eval `.claude/skills/arabic/arabic.test.js` (42 scenarios). Data not git-tracked (OneDrive `projects/`). Boot line via `domain/arabic-nudge`. |
| `deploy` (NEW 2026-07-27, born via `core/forge.js`) | `/deploy <env> <module> <ticket>` · "deploy to internal/staging" · "deploy X to mlit" | Merges a ticket branch into `mlk/stag-env` or `mlk/int-env` (fresh branch off `origin/<base>`, `--no-ff`, team message format, recovery tag `ruri/pre-<env>-<ticket>`), pushes, then emits a numbered ssh build+deploy card. Straight-push justified: env branches have ZERO backflow into `mlk/master`, so `git revert -m 1` fully undoes. Two pipelines: INTERNAL = one function on `172.16.100.162` `deployment-scripts/mlit/`; STAGING = build on `.162` `build-scripts17/` then deploy on `172.30.12.203` `deployment-scripts/stag/`. Skill-only Feature (no hook, no settings.json entry). Eval `domain/deploy/eval.js` 20/20. **Scope boundary**: NOT a release — `mlk/release/*` + `mlk/master` belong to `release-mlk-plp`. |

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
| `system/slip-log.md` | (stable) | every slip + `auto-skill-on-mistake` skill | bankai consolidation, slip-pattern analysis | Append-only with periodic Bankai pass |
| `system/system-architecture.md` | v1 (this file) | every commit touching hooks/skills/protocols/state-files | future refactors, change procedures | Paired-edit enforced via `system-edit-gate.js` |
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

Machine-checkable rules enforced by `system-audit.js` at SessionStart.

| ID | Invariant | Real-failure precedent | Check shape |
|---|---|---|---|
| **INV-1** | Every entry in `.claude/settings.json` hook-registration has a corresponding file in `.claude/hooks/` | 2026-05-25 ghost-hooks audit (7 registered without files at one point) | For each registered command path: verify file exists |
| **INV-2** | Every file in `.claude/hooks/*.js` is registered in `.claude/settings.json` | Same audit, opposite direction | For each .js file: verify at least one registration cites it |
| **INV-3** | Every `status=` value in `quest/active.txt` is in the canonical 7-value enum | 2026-05-26 `local-test-confirmed` slip in QA-262869 | Parse status= lines, set-diff vs enum |
| **INV-4** | Every `→ Skill: <name>` token in protocol/skill files references a `<name>` that exists in `.claude/skills/<name>/SKILL.md` | (preventive — Phase 5 introduces tokens) | Grep tokens, verify each name has matching dir |
| **INV-5** | Every `ticket_type=` value in active.txt is `bug|enhancement|cr|requirement` | (preventive — Phase 2 introduces field) | Parse ticket_type= lines, set-diff vs enum |
| **INV-6** | Every `see X.md` / `see X/` reference in CLAUDE.md resolves to existing file/dir | (defense-in-depth with boot-required-read-gate.js) | Grep references, verify each path resolves |

Boot output format: `🛡 invariants: 6/6 pass` OR `🛡 invariants: 5/6 — INV-3 fails: status=foo in QA-NNN not in canonical enum`. みや sees this at every SessionStart; absence = `system-audit.js` broke.

---

## 7. Reverse-lookup index — "who references me?"

For change-impact assessment: when refactoring component X, this index says what else needs updating.

### 7.1 Hooks referenced by

| Hook | Referenced in protocols/skills/state |
|---|---|
| `auto-skill-trigger.js` | quest-protocol.md (correction-signal handling), auto-skill-on-mistake skill, CLAUDE.md hook catalog |
| `silent-claim-drift-gate.js` | quest-protocol.md (claim-verification rule), Phase 5 layered enforcement, Phase 3 100%-VERIFY binding, claim-verification skill |
| `system-edit-gate.js` | quest-protocol.md (recursive safety), Phase 0 architecture-doc-sync |
| `PlainFirstGate.js` | feedback_investigation_style.md, personality.md:53, system/principles.md:80 |
| `pre-action-check-gate.js` | quest-protocol.md (Notes.txt + env-check + PDF reminders), Phase 1 single-canonical-doc enforcement |
| `convention-check-gate.js` | feedback_simplify_and_reference.md (find-working-analog rule), CLAUDE.md hook catalog |
| `open-quest-surfacer.js` | quest-protocol.md (boot surfacing), Phase 5 plan-execution surfacing (cut from plan but pattern preserved) |
| `quest-resume-preflight.js` | quest-protocol.md (bare-ticket resumption), Quest skill resume |
| `prepare-commit-trigger.js` | quest-protocol.md Phase 1 close-out, commit-conventions.md (Step 7.5 read) |
| `skill-invocation-discipline-gate.js` | skill-invocation-discipline skill, CLAUDE.md skill rules |
| `system-audit.js` | INV-1 through INV-6 enforcement, CLAUDE.md system-layer description |

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
| `system/system-architecture.md` (this) | system-edit-gate.js paired-edit predicate, future refactor procedures |
| `system/slip-log.md` | auto-skill-on-mistake, Bankai consolidation, every slip detection |
| `main/current-session.md` | DE Step 2, session boot recap |
| `.claude/settings.json` | INV-1 + INV-2 boot audit, Claude Code at startup |

---

## 8. Change procedures — how to safely modify the system

Three documented procedures cover the common change types. For change types not listed here, generalize from the closest match OR add a new procedure to this section.

### 8.1 Renaming a hook

1. Update `.claude/settings.json` registration (path AND any matcher references)
2. `grep -r "<old-name>" .claude/ quest/ system/ main/ personality.md CLAUDE.md` — replace each match
3. Update Reverse-lookup index (§7.1) — replace old name with new
4. Bump this file's version + add Sync Event (§9)
5. Run `system-audit.js` at next boot — verify INV-1 + INV-2 hold

### 8.2 Deprecating a skill

1. Replace `.claude/skills/<name>/SKILL.md` body with redirect stub (decay date if temporary)
2. Update `system/discipline-INDEX.md` (or honesty-INDEX, enforcement-INDEX as applicable) — strike row, footnote
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
2. Update `system/hook-test-scenarios.md` (created in Phase 5) — add test cases for new edge cases
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
| 2026-05-28 | v1.1 — Phases 0-7 of plan executed: system-edit-gate.js extended with paired-edit predicate; pre-action-check-gate.js extended with single-canonical-doc enforcement; scout-completeness-gate.js NEW; silent-claim-drift-gate.js Stage 5A extensions for skill-invocation drift + 100%-VERIFY + arch-doc-sync; QA-NNN-template.md NEW; quest/SKILL.md rewritten with Skill-tool composition + ticket-num arg + workflow runner mode; quest-protocol.md updated with ticket-type classification, tiered etanah-knowledge load, Scout/Recon clarity, UC9 sibling-structure-read, Proactive Initiative emit, 100%-VERIFY binding, Rubric phase expansion; rubric SKILL.md replaced with decay stub (decay 2026-06-07); discipline-INDEX.md strike-through on rubric; system/hook-test-scenarios.md NEW with 10 dry-run scenarios | Plan `cached-floating-hummingbird.md` execution session |
| 2026-05-28 | v1.2 — Post-/verify 4-partial-fixes: G2 (system-audit.js v1.1 extended with INV-3..INV-6 invariant checks at boot); E3 (added scout-completeness-gate.js + diary-format-gate.js to hook catalog); G1 (added grill-me + grill-with-docs to skill catalog with interconnection metadata); C4 (worktree-cleanup-boot.js v1.1 extended with decay-date scanner — flags decay-expired + decay-soon stubs at boot) | /verify follow-up of plan execution |
| 2026-05-28 | v1.3 — DE-banner confabulation fix: domain-expansion-trigger.js v1.1 inlined the EXACT canonical DE banner (`═══ [ Domain Expansion ] ═══` / `💠 るり結界 (ラピス バリアー) 💠`) into the Step 0 injection. Slip-driven (Ruri confabulated 蒼穹瑠璃の結界/Sōkyū/ドメイン展開). Same cure pattern as commit-conventions (Step 7.5) + status-enum (Step 10.5): inline-at-trigger beats reference-file-recall. DE is hook+docs, NOT a Skill — so the banner text must be handed at trigger time, not recalled. | みや caught DE-name confabulation at DE close |
| 2026-05-28 | v1.4 — `env-check` skill behavior change (§4.4): removed the 2026-05-18 "Mock Cutover 1" UAT-only temporary override (FAT restored); env selection reverted to **ticket-driven** (match BA `Env:` line + permohonan ID env; FAT is a full local implement+test target again); added **Priority 0 `hold` override** (みや saying "hold" at ticket start suppresses the env switch — parallel-session safety); AWAM→`mkit`/UAT special case unchanged. Paired memory updated same turn: `feedback_uat_fat_environments.md` + `MEMORY.md` index line. | みや directive — FAT usable again |
| 2026-05-31 | v1.6 — **Debug Ritual 6 (loggers, not breakpoints) + prepare-commit Step 2.6**: breakpoints BANNED as a request to みや; runtime confirmation uses extensive loggers (≥3 what-ifs) BUNDLED into the first-pass fix build (one rebuild carries fix + confirmation = 3-4× saving). `prepare-commit-trigger.js` v1.3 adds Step 2.6 (strip `QA<num>-PROBE:` loggers + debug comments before BA-bound commit) — matched pair with Ritual 6. quest-protocol.md triage-ladder breakpoint→logger; CLAUDE.md boot table rows 5+6; personality.md no-asking-back runtime corollary. | みや 2026-05-31 debug-methodology refinement |
| 2026-05-29 | v1.5 — **`quest-phase0` Workflow-tool engine NEW** (`.claude/workflows/quest-phase0.js`): Quest Phase 0 as a deterministic fan-out (Discovery → etanah-knowledge tiered load → Recon → adversarial Verify for bugs → Synthesize); writes `1. Notes.txt` (canonical format) + QA-NNN.md; scales by ticket_type. Wired into `quest/SKILL.md` `/quest start` (auto-fire + depth-scale). Blast-radius codebaseRoot-keyed — **TRG banned for etanah-pelupusan**, multi-state-aware for etanah-awam. Added to §4.1. | みや: "create the quest workflow" |
| 2026-06-08 | v1.7 — **`quest/delegate-quest.js` NEW script logged** (atomic delegate + archive: moves Task folder → `Archive\` + active.txt block → `active-archive.txt`, KEEPS per-quest `QA-NNN.md` live in `active/` with `## Delegated Resolution` + `learning_marker=`; `delegated` EXCLUDED from cadence/KPI counts). Shipped in `0052bfb` (Phase 2 simplification) but never reflected here — paid as DEBT 2 this session. Paired with quest-protocol.md **v3.8** stamp (DEBT 1) for the same Phase 2 simplification (Step 3 Post-Mortem META removed → weekly slip-log pass; Step 4 → Refine receipt; `delegated` status redefined). NOTE: no dedicated "script catalog" section exists in this doc — quest CLI scripts (`active-cli.js`, `notes.js`, `redmine-sync.js`, `archive-quest.js`, `migrate-post-mortems.js`, `delegate-quest.js`) are currently tracked only via §9 sync events + incidental hook-row mentions; a §Script-catalog is an open structural question (see §10). | DEBT 1+2 paid at 2026-06-08 boot; architecture-doc-sync paired-update for the quest-protocol v3.8 edit |
| 2026-06-26 | v1.8 — **3 QA-267382 defenders**: (1) `ba-understanding-table` Power NEW (`domain/ba-understanding-table/` — Stop hook forcing a pre-Phase-0 `BA said (per attachment) │ my understanding` table; registered in settings.json Stop; node --check PASS); (2) `veritas-claim-gate` CHECK 3 (symptom-downgrade advisory — flags "VERIFIED" stamped on evidence proving a DIFFERENT proposition than the BA's symptom); (3) `auto-skill-on-mistake` Step 5.5 (mandatory `name │ what-it-solves │ how-it-works` skill-card table on every build). Slip-driven: I overrode the BA's verbatim screenshot annotation ("Tarik pelan yang salah") with inference + false VERIFIED. Routed through system-design + system-rules (design-consult-gate). | みや directive after QA-267382 pelan misdiagnosis |
| 2026-06-19 | v1.8 — **§3.0 auto-generated hook registry NEW + `system/sync-hook-catalog.js`**: regenerates the canonical registered-hooks list (Event·Matcher·Hook·on-disk, 52 rows) from `.claude/settings.json` between `<!-- HOOK-REGISTRY:AUTO -->` markers, so the catalog can NEVER drift again — fixes the ~month-long `system-audit` DOC-DRIFT false alarm (root-caused this session: the audit read CLAUDE.md for a catalog that MOVED here 2026-06-02 + a `.js`-matched-`.json` regex bug). Script is idempotent (no timestamp), has `--check` (exit 1 if stale), runs ON-DEMAND (not a boot hook — start-simple; mutating a doc at boot is risky). §3's intro hand-count demoted to historical; §3.1–§3.7 rich tables kept as semantic commentary. `system-audit.js` also fixed same session (reads this doc's catalog + `\.js\b` boundary). Routed through /system-rules + /system-design — primitive = maintenance SCRIPT (not a Power), placed in system/ per the quest/*.js co-location precedent. (Partially addresses the v1.7 "no script-catalog section" open question for meta-scripts.) | みや: "what is system-architecture for… auto-generate the §3 catalog" |
| 2026-06-16 | v1.8 — **`codemap-recon-consult` Power NEW** (`domain/codemap-recon-consult/`, hook-only): UserPromptSubmit, state-driven off active.txt (`status=active` AND `current_phase` ∈ {discovery,recon,rubric}) → injects codemap-consult reminder (`bpmn_flow.json` module-scope · `callgraph_callers.json` blast-radius w/ SootUp method-ref blind-spot caveat · codegraph MCP). Added to §3.2 (16→17 hooks). Routed /system-rules + /system-design; chosen over extending `scout-completeness-gate` (prompt-triggered → misses autonomous Recon) / `quest-active-grounding` (concern-bleed). Built+tested (fires for QA-261517 Discovery, logs to log.jsonl) + registered in settings.json; live after merge-to-main + Claude Code restart. NOTE global hook totals (§3.0 "40/41") already lag the live boot audit (48→now 49) — pre-existing drift, not introduced here. | みや #6 "make sure all these new features run through hooks when running our quests" |
| 2026-06-27 | v1.10 — **Stranded-worktree detect+act pair NEW** (the gap that stranded QA-267382's close + 3 Powers for days). DETECT: `worktree-cleanup-boot.js` **v1.4** — added a STRANDED-WORKTREE SURFACER pass (merge-in-place, NOT a new hook per /system-rules R1+R2): for every non-merged, non-checked-out `claude/*` branch, count commits not on main by patch-id (`git cherry "+"`) → surface list to stderr `⚠️ STRANDED WORKTREE WORK`. Surface-ONLY (content-guard — never auto-merges/deletes unmerged). ACT: **`/worktree-retrieve` skill NEW** (`.claude/skills/worktree-retrieve/`, skill-only) — codifies Survey→Classify→Salvage→Prune with the gotchas (use `git cherry` not `git diff main..branch`; MSYS mangles `branch:path` refs; `-D` for merged-by-content; content-guard before delete; JSON-validate settings.json). Eval (node-harness vs live branch state): caught a real bug — `git branch --list` prefixes current `*` / sibling-worktree `+`; fixed to skip ALL checked-out branches; PASS (flags great-cori+1 + unruffled+6, excludes elated-wright). Routed /system-design + /system-rules. | みや: "find skills for quest improvement" |
| 2026-07-05 | v1.11 — **boot-required-read-gate false-alarm root fix + eval-coverage radar** (みや /goal). (1) `boot-required-read-gate.js` REWRITTEN — resolver was basename-only (`<root>/name` + raw ref, no subdir walk) → 95% false-positive (42 flagged, ~40 present in subdirs); now recursive relpath+basename index + placeholder-skip (`N{3,}`) + external ignore-list (settings.local.json · etanah `*.config.json` · Etanah-Codebase-Read.md); core split into pure fns + `module.exports`. Ships `boot-required-read-gate.eval.js` — **5/5 PASS** (subdir refs resolve · missing ref still caught · placeholder+external skipped · real CLAUDE.md **42→0** broken). (2) `system-audit.js` **CHECK 6 NEW** — advisory eval-coverage radar listing REGISTERED block-capable hooks (`decision:block`/`exit(2)`) with no co-located eval (retrofit backlog, /system-design Rule 6); smoke-run PASS, surfaced 7 (commit-gate, branch-at-apply-gate, silent-claim-drift-gate, veritas-claim-gate, ticket-criteria-gate, terse-gate, +1). Root cause: pre-Rule-6 judgment hooks shipped eval-less + nothing flagged them; sibling `system-audit` got a false-positive fix (`35f2cb2`) never carried across (knowledge-transfer-incompleteness). Routed /system-design + /system-rules. OPEN (pre-existing, logged not fixed): `system-audit` REPO_ROOT hardcoded to main (worktree-blind) + onDisk scan excludes `domain/`. | みや /goal after architecture deep-audit surfaced the 42-false-positive gate |
| 2026-06-27 | v1.9 — **3 stranded anti-slip Powers retrieved from worktree + REGISTERED** (built 2026-06-24 in `unruffled-merkle`, never merged): (1) `terse-gate` (Stop — blocks ≥6 long prose-wall lines; sibling of show-gate which fires on change/finding signals); (2) `verify-basis-gate` (Stop — blocks an "I verified/checked X" claim made with ZERO tool calls that turn; sibling of veritas which catches behavioural/external claims); (3) `attachment-context` (UserPromptSubmit — on ticket engagement lists every `0. Brief/` file + requires a 1-line content emit per file; deterministic enforcement of CLAUDE.md §10 BA-attachment rule). Overlap-eval: all 3 complementary, not duplicates. §3.2 17→18, §3.5 14→16. Registered in settings.json (JSON-validated) + node --check PASS. Retrieved during the worktree-retrieval session (commit `612b6f8` brought the files; this commit registers them). | みや: "retrieve all worktree updates" + "find skills for quest improvement" |

---
| 2026-09-04 | **Multi-state audit (todo Q1 row 1)** — `system/states.json` is THE state registry (6 states; tracked) + `system/states.local.json` (gitignored hosts overlay) resolved by `lib/states.js` (cascade: explicit → `ETANAH_STATE` → active.txt `state=`/`task_folder=` → path segment `1. Tasks\<State>` / `E:\Projects\<State>` → `PT<STATE>/` prefix → UNKNOWN, never a silent default; CLI `list · show · resolve · validate · check · add · remove`; eval 40/40). Migrated: `ticket-gate` · `knowledge-first-gate` v3 · `branch-guard` v2 · `alter-ticket-gate` v1.1 · `adhoc-register` · `latent-bugs-gate` · `adhoc-lifecycle` · `awam-no-resit-gate` · `notes-on-test-data` · `pre-action-check-gate` · `quest-resume-preflight` · `quest-knowledge-save-gate` · `lib/test-data-db` · `bug-db` · `knowledge-schema-audit` (its `states` block moved out of `KNOWLEDGE-SCHEMA.json`). `system-audit.js` CHECK 7 = state-literal drift count (`node lib/states.js check`), CHECK 8 = root layout vs `system/FOLDER-STRUCTURE.md` (allow-list + `lib/folder-structure.js`, eval 6/6). 52 files remain UNROUTED (listed by `check`; Melaka-only-by-design tools declare it instead of migrating). | #275847 follow-on, per みや "cater for ALL states & even future ones" |

## 10. Open architectural questions (deferred)

Not blocking current execution; tracked for future sessions.

1. **SQLite migration** for lookup-shaped etanah-knowledge layers (TEST-PERMOHONAN-INDEX, PERANAN-MAP, DEFERRED-CRITICAL-ISSUES, DOMAIN-GLOSSARY). Trade-off: structured query vs simpler MD edits.
2. **Codebase graph build** for etanah-pelupusan Java sources — faster grep + symbol lookup using tree-sitter or codegraph.
3. **Multi-state expansion** of etanah-knowledge (terengganu/, selangor/) once melaka/ pattern proves stable across more quests.
4. **`auto-skill-trigger.js` upgrade** to detect more trigger phrase categories (design-decision signals, debugging-method signals).
5. **`/flow-diagram` skill** or `PlainFirstGate` diagram-first extension — みや asked for this multiple times; partially addressed by personality.md:53 + PlainFirstGate but discipline keeps failing.
6. **Per-turn invariant check** — currently INV-1..INV-6 fire at boot only. Per-turn check would catch mid-session drift but adds overhead.
7. **Script / CLI catalog section** — this doc catalogs hooks (§3), skills (§4), state files (§5) but NOT the `quest/*.js` CLI scripts (`active-cli.js`, `notes.js`, `redmine-sync.js`, `archive-quest.js`, `migrate-post-mortems.js`, `delegate-quest.js`). They're tracked only via §9 sync events + incidental hook-row mentions, so a new script's omission (e.g. delegate-quest.js — DEBT 2 this session) isn't caught by `system-audit.js`. Open question: add a dedicated §Script-catalog (owner / invoked-by / reads-writes / change-impact, mirroring §3) and have the audit hook check it, OR keep scripts as sync-event-only. Surfaced 2026-06-08.

---

*This file is the system's mirror of itself. If it diverges from reality, something silent has broken — check `system-audit.js` boot output for surfaces.*
