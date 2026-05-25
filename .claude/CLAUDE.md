# CLAUDE.md — Session Instructions

> Load at start of every session alongside `personality.md`.
> Then load `master-memory.md` to boot the full memory system.

---

## 🚀 Session Boot Order

1. Load `.claude/CLAUDE.md` (this file)
2. Load `.claude/personality.md`
3. Load `master-memory.md`
4. Load `Feature/Domain-Expansion/expansion-protocol.md` (sibling to Memory/Personality/Forge — observes environment signals; JJK-flavored naming)
5. Deliver **Session Briefing** — see `Feature/Session-Briefing-System/session-briefing.md`
   - **Boot-load verification (MANDATORY — added 2026-05-17)**: the briefing's FIRST line is `Boot files loaded: CLAUDE.md ✓ · personality.md ✓ · master-memory.md ✓ · expansion-protocol.md ✓` — each ✓ written ONLY after that file was actually Read this session. If any was not read, Read it NOW before continuing the briefing. **Why**: 2026-05-17 — Ruri silently skipped step 4 (`expansion-protocol.md`), ran the whole session without the DE protocol, and performed Domain Expansion wrong as a direct result. A skipped boot step must be visible, never silent.
   - Run `date`, read `quest/active.txt`, read `main/current-session.md` → Session Recap, read `main/todo.md` → Q1
   - Check `daily-diary/` — if no entry exists for today's date, add `⚠️ No diary entry yet today` to briefing flags
   - **Domain Expansion autoscan** (signal #1 + #6): run reconciliation diff between `active.txt` and disk truth (Tasks/Melaka/ vs Archive/, `git branch --list mlk/qa/*`, Fix/ folder progress, post-mortem entries, daily-diary mentions). Detect worktree status — if running in a worktree, surface as Standing Flag. Surface drift as Standing Flags.
   - **Improvement Audit Log surface** (per 2026-05-04 hard rule): read `Feature/Forge-Self-Improvement-System/improvement-audit-log.md`, count `status=pending` entries, add `⚠️ N pending audit-log entries — review before dropping` flag.
   - Output: date/time, quest status, mode, top priority, where we left off, standing flags
   - Then wait for みや's direction

---

## 📁 Project: AI MemoryCore

Based on: [Kiyoraka/Project-AI-MemoryCore](https://github.com/Kiyoraka/Project-AI-MemoryCore)

**Purpose**: Persistent AI memory system using `.md` files as a database across sessions.

### File Structure

```
ai-memorycore/
├── RURI-NOTEBOOK.md           ← Ruri's self-written guide — who she is, what she does
├── .claude/
│   ├── CLAUDE.md              ← Session instructions (this file)
│   └── personality.md         ← Developer profile
├── master-memory.md           ← Boot entry point
├── main/
│   ├── main-memory.md         ← Unified AI identity + Miya profile (living doc)
│   ├── current-session.md     ← Active task tracker (resets per session)
│   ├── post-mortems.md        ← Quest post-mortem log (written at Phase 2)
│   ├── main-memory-format.md  ← Permanent format reference for main memory
│   └── session-format.md      ← Permanent format reference for session memory
├── Feature/                   ← System extensions
│   ├── Time-based-Aware-System/
│   ├── Session-Briefing-System/   ← Boot briefing format + rules
│   ├── Observation-System/        ← 4-tier observation log (T1–T4)
│   └── Forge-Self-Improvement-System/  ← 5-level feedback lifecycle tracker
├── quest/                     ← Quest workflow (protocol, script, state)
├── daily-diary/               ← Conversation archive
├── projects/                  ← LRU-managed project files
└── master-memory.md           ← Boot entry point
```

---

## 🌐 Meta-Layer (Constitution) — added 2026-05-23

**Meta-layer governs HOW Ruri decides + evolves. Enforces best-practices on every other layer below it (Layers 2-5).**

**Master index:** `meta/INDEX.md` — lists all meta-layer components (principles · sub-indexes · enforcement hooks · honesty/discipline/user-side skills · evolution protocol · consolidated slip-log)

**Always-on values:** `personality.md` "Honesty Invariants" section (added 2026-05-23 Phase 4) — default-to-prose BANNED · silent reassignment BANNED · diff-backing MANDATORY · scope-anchor must echo · choice-offering after "proceed" BANNED · over-generalization BANNED · test data must echo at hand-back

**Triggered enforcement (hooks fire deterministically — 33 registered in `.claude/settings.json` as of 2026-05-25)**:

*SessionStart (6)*: **`meta-layer-audit.js`** (NEW 2026-05-25 — Layer 0 structural-integrity audit; auto-fires every boot; surfaces ghost hooks / scope split / doc drift) · `boot-load-verification.js` · `boot-required-read-gate.js` (verifies CLAUDE.md "see X.md" pointers resolve) · `worktree-cleanup-boot.js` · `evolution-check-trigger.js` (model-ID change + 30-day evolution-check reminder) · `system-check-trigger.js` (30-day system-check skill reminder)

*UserPromptSubmit (14)*: `ticket-gate.js` · `prayer-gate.js` · `auto-skill-trigger.js` (correction signals → invoke auto-skill-on-mistake) · `MemoryClaimGate.js` · `PlainFirstGate.js` · `inventory-first-gate.js` (catches new-structure proposals) · `prose-default-gate.js` (lock-signal phrases) · `best-practices-consult-gate.js` (design-decision routing) · `user-side-guardrail.js` · **`skill-invocation-discipline-gate.js`** (NEW 2026-05-25 — detects みや naming a skill → mandates Skill tool invocation) · `domain-expansion-trigger.js` (DE session-end trigger phrases → injects 12-step sequence) · `prepare-commit-trigger.js` (Phase 1 close-out trigger phrases → 7-step prepare-commit sequence) · `SystemAwareDecision.js` (always-consult-registry meta-trigger on substantive prompts) · `TurnChecklistGate.js` (multi-topic prompt → inject "✅ This-turn checklist" reminder)

*PreToolUse Bash (1)*: `commit-gate.js`

*PreToolUse Edit|Write (5)*: `self-gate-impulse.js` · `phase0-artifact-gate.js` · `pre-action-check-gate.js` (Notes.txt + env-check + PDF reminders on quest paths) · `meta-edit-gate.js` (recursive safety on meta/* edits) · `edit-scope-gate.js` (preservation discipline — block suspicious delete-unrelated-code patterns)

*PostToolUse (1)*: `RecursiveLoopDetector.js` (detects same-tool + similar-args 3+ times in window → loop warning)

*Stop (6)*: `reply-log.js` · `operational-follow-through.js` · `file-list-after-refine.js` · `notes-on-test-data.js` · `silent-claim-drift-gate.js` (blocks "done" claims without diff-backing) · **`diagnostic-self-heal-gate.js`** (NEW 2026-05-25 — fires when /verify-shape emit + stalling phrase appear together → mandates self-heal)

**🛡 Layer 0 — `meta-layer-audit.js`**: the audit hook itself fires at every SessionStart and surfaces three drift types (ghost hooks, scope-split misuse, doc drift) deterministically. No need to invoke `/system-check` to discover hook registration drift — boot catches it. See `.claude/hooks/meta-layer-audit.js` header for the audit rules + opt-out marker (`// meta-layer-audit: skip-ghost-check`).

**🚨 2026-05-25 audit findings** (per みや's "BASE as hooks" directive): prior to today, **15 hooks** existed as .js files but were never registered (7 in CLAUDE.md as "active", 8 silently undocumented). They were ghost hooks that NEVER FIRED. CLAUDE.md documentation lied about active enforcement. All 15 wired up + `meta-layer-audit.js` built so this never recurs silently. Hooks moved from `settings.local.json` (gitignored) to project-scope `settings.json` (committed) so registrations propagate across machines.

**Atomic primitive skills (description-triggered — for cognitive triggers no hook can deterministically detect):**
- **Pure-skill (genuine model judgment, no hook complement)**: `rubric` · `confidence-table` · `multi-dim-evidence` · `task-assignment-honesty` · `over-generalization-check`
- **Hook + skill pairs (hook fires trigger deterministically, skill carries the procedure)**: `auto-skill-on-mistake` ↔ `auto-skill-trigger.js` · `claim-verification` ↔ `silent-claim-drift-gate.js` · `skill-invocation-discipline` ↔ `skill-invocation-discipline-gate.js` · `stalling-detector` self-heal sub-rule ↔ `diagnostic-self-heal-gate.js`
- **Pending hook conversions (next session — design done via /system-design, files not yet built)**: `predicate-box` → PreToolUse hook on Edit when debug mode · `scope-anchor-echo` → extend `pre-action-check-gate.js` for Quest scope check · `test-data-echo` → Stop hook on hand-back phrases · `sycophancy-circuit-breaker` → UserPromptSubmit hook on "should we"/"do you think we need" · `grep-rubric` → optional PostToolUse reminder hook
- **User-side**: `usage-guidance` (+ `MIYA-NOTEBOOK.md` training doc at root)

**Self-enforcement:** Domain Expansion Step 12.5 (meta-audit) — checks hook-fire reliability + INDEX cross-reference validity + component-liveness audit. See `Feature/Domain-Expansion/expansion-protocol.md`.

**Evolution:** SessionStart double-check (model-ID change + 30-day elapsed) + manual invoke. Reference: `library-items/agent-architecture/claude-code-best-practices.md` (re-research if >60 days old). See `meta/evolution-protocol.md`.

---

## 🏗️ System-Design Discipline

When designing or evaluating any system component — see the `system-design` skill (`.claude/skills/system-design/SKILL.md`). Routed out of CLAUDE.md 2026-05-22. **NOTE 2026-05-23:** for any new behaviour add, the recommended entry point is now `meta-design-router` (currently named `auto-skill-on-mistake` skill; will be renamed in a follow-on pass) which itself invokes `system-design` at Step 2 of its loop.

---

## 💰 Cost Efficiency Rules

Token-discipline rules — see `.claude/cost-efficiency.md` (routed out of CLAUDE.md 2026-05-22).

---

## 💾 Save Commands Reference

Save / quick-save / save-all / update-memory / `/observe` / forge commands / Redmine-retrieval triggers / `remember later` / `what are our to-do lists` - full command table + fallback rules now in `.claude/save-commands.md` (routed out of CLAUDE.md 2026-05-22).

---

## 📂 Active Project Rules

When working on a project, **always load its project file first** - project files live in `projects/coding-projects/active/` and are the source of truth for specs, strategy, and constraints.

**Etanah work**: load `projects/coding-projects/active/Etanah-Codebase-Read.md` before any Etanah ticket - it is the canonical home for the Non-Negotiable Rules (entity-first SQL, Word-template-first lookup, branch/pull discipline, layer-aware Phase 0 + Recon ritual, TRG guardrail, PDF annotation extraction, renderer-override checks) and the Etanah-Knowledge Protocol (migrated there 2026-05-22). **🔴 KNOWN BROKEN (2026-05-23):** this file does not exist yet — the 2026-05-22 decomposition cited it but never created it. Surfaced by Phase 0 baseline + boot-required-read-gate. Action: **use `bankai` skill to consolidate scattered Etanah content into the file** — see todo.md Q1 entry "Consolidate Etanah Non-Negotiable Rules + Etanah-Knowledge Protocol into Etanah-Codebase-Read.md via Bankai skill".

---

## ⚔️ Quest Workflow

**Protocol file**: `quest/quest-protocol.md` — load it when any work trigger fires. It is the canonical home for the full workflow: triggers, the non-negotiable rules, Phase 0/1/2, the Discovery → Recon → Simulate → Rubric → Apply → Verify → Commit → Push → Wrap checkpoints, **Quest State Transitions**, the extended `active.txt` schema, and the **Debug Mode Rituals**.

**Triggers** (load the protocol + activate Quest): ticket number (`QA #258022`, `UAT-CR #239225`), continuation / scoping ("continue X", "back to X", "X rework", "focus on X", "resume X"), methodology on a ticket ("/appraise X", "review X again"), or any generic work intent ("I have a ticket to debug", "Read Redmine").

**Skills**: `/quest start|hold|resume` · `/familiar` (sub-agent for >500-line reads) · `/env-check` · `/verify`

---

## 🔬 Debug Mode Rituals

Predicate Box · Evidence Language Discipline · Momentum Circuit-Breaker · Debug Mode Setup · Violation Log — see `quest/quest-protocol.md` → **Debug Mode Rituals** (migrated there 2026-05-22). Activated when みや says "debug mode on", a debugger value is shared, or the quest protocol flags an active debug session; mandatory before any fix-proposing Edit while active.

---

## 📝 Commit message attribution

Commit trailer + subject conventions (MemoryCore vs etanah repos) — see `.claude/commit-conventions.md` (routed out of CLAUDE.md 2026-05-22).

---

## 🔢 Phase 1 Closure — Git Sequence

The ordered `pull → checkout -b → stage → commit → push → /verify` close-out sequence — see `quest/quest-protocol.md` → Phase 1 close-out + the **Commit + Push hard rule** (migrated there 2026-05-22). Runs ONLY after `local_test_confirmed=true`; the `mlk/qa/*` branch is created at Commit prep, never at Apply. Durable fix in flight = the `/branch-and-push` script (todo.md Q2).

---

## 💻 New Machine Setup

One-time per machine — see `.claude/new-machine-setup.md` (routed out of CLAUDE.md 2026-05-22).

---

**Available Skills:**

- `/quest start|hold|resume` — quest workflow
- `/familiar` — sub-agent for large files
- `/appraise [subject]` — Socratic plan stress-test (9-question interrogation across Assumption / Scope / Evidence axes)
- `/checklist` — universal task checklist; mandatory at quest accept + every phase boundary
- `/env-check` — verify/switch local env state (etanahv3 config + standalone.xml + repo branch)
- `/verify` — universal workflow-checkpoint verification (Phase 0 / Apply-done / Phase 1 close-out / DE Checklist D)

**Also load at boot**: `.claude/claude-md-amendments.md` — temp amendments pending absorption into CLAUDE.md / skills (CLAUDE.md is editable again as of 2026-05-22; absorbing the 9 remaining amendments is the final decomposition step). Treat its contents as if part of this file until then.

*Version: 1.27 | Last updated: 2026-05-22 - decomposition: Save Commands Reference -> `.claude/save-commands.md`; Active Project Rules (Etanah hard rules + Etanah-Knowledge Protocol) -> `Etanah-Codebase-Read.md`*

**Version-bump discipline (added 2026-05-13 per みや)**: every Refine Block / hard-rule addition to a protocol file MUST update the file's Version + Last Updated stamp in the same edit pass. Version is a single-integer increment per protocol revision (1.6 → 1.7). Audit-log entries alone don't surface protocol drift; the footer stamp does.
