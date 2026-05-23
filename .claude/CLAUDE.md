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

**Triggered enforcement (hooks fire deterministically):**
- `boot-required-read-gate.js` (SessionStart) — verifies CLAUDE.md "see X.md" pointers resolve
- `pre-action-check-gate.js` (PreToolUse) — Notes.txt + env-check + PDF reminders on quest paths
- `inventory-first-gate.js` (UserPromptSubmit) — catches new-structure proposals
- `prose-default-gate.js` (UserPromptSubmit) — catches lock-signal phrases ("hardcode it", "hard rule")
- `silent-claim-drift-gate.js` (Stop) — blocks "done" claims without diff-backing
- `best-practices-consult-gate.js` (UserPromptSubmit) — design-decision routing
- `meta-edit-gate.js` (PreToolUse) — recursive safety; gates edits to meta/* paths
- `user-side-guardrail.js` (UserPromptSubmit) — guidance for みや's usage patterns

**Atomic primitive skills (description-triggered):**
- Discipline: `rubric` · `predicate-box` · `grep-rubric` · `multi-dim-evidence` · `sycophancy-circuit-breaker` · `confidence-table`
- Honesty: `claim-verification` · `task-assignment-honesty` · `stalling-detector` · `scope-anchor-echo` · `over-generalization-check` · `test-data-echo`
- User-side: `usage-guidance` (+ `MIYA-NOTEBOOK.md` training doc at root)

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
