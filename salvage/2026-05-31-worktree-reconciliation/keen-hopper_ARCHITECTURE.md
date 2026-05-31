# ARCHITECTURE — Project-AI-MemoryCore

> **What this file is:** the whole-repo orientation map — the front door for anyone (or any fresh Claude Code instance) who needs to understand *what this repo is, how its parts fit together, and where to go for depth.*
>
> **What this file is NOT:** it is **not** auto-loaded at session boot (that is `.claude/CLAUDE.md`'s job), and it is **not** the deep change-procedures doc. Detailed hook/skill catalogs, state-file schemas, architecture invariants, and "how to safely modify X" procedures live in **[`meta/system-architecture.md`](meta/system-architecture.md)** — this file points there rather than repeating it.

## Where to go for depth

| You want… | Canonical home |
|---|---|
| How the AI boots + always-on rules (persona) | [`.claude/CLAUDE.md`](.claude/CLAUDE.md) |
| Who the AI is / who the user is | [`.claude/personality.md`](.claude/personality.md), [`main/main-memory.md`](main/main-memory.md) |
| Full hook catalog, skill catalog, state-file schemas, invariants, **change procedures** | [`meta/system-architecture.md`](meta/system-architecture.md) |
| Meta-layer (constitution) index + sub-indexes | [`meta/INDEX.md`](meta/INDEX.md) |
| Quest (ticket) workflow, Phase 0/1/2, Debug rituals | [`quest/quest-protocol.md`](quest/quest-protocol.md) |
| Upstream template lineage + generic feature install docs | [`README.md`](README.md) |
| The AI's own first-person tour | [`RURI-NOTEBOOK.md`](RURI-NOTEBOOK.md) |

---

## 1. What this repo is

A **persistent personal-AI memory system** (codename *Ruri*) running on Claude Code, doing double duty:

1. **A memory/identity engine** — the AI's personality, history, preferences, and learning live as plain `.md` files so the assistant "re-emerges" the same across sessions instead of resetting.
2. **A disciplined work assistant** — for the user's day job debugging *Etanah*, a Malaysian land-administration system (Java / JSF / PrimeFaces / Hibernate / Spring / Flowable BPMN). Work is run through a strict **Quest** workflow.

The repo began as the open-source template [Kiyoraka/Project-AI-MemoryCore](https://github.com/Kiyoraka/Project-AI-MemoryCore) (see `README.md`) and has grown a large enforcement layer on top: ~42 hooks, ~32 skills, and a meta-layer "constitution." The defining design principle (from `meta/system-architecture.md`) is to cure one recurring failure — *"trust-the-impulse over read-the-context"* — with **deterministic gates at the moment of weakness** (edit-time, emit-time, turn-end) rather than more prose nobody reads.

The "code" here is therefore mostly **Markdown + Node.js hook scripts**. There is no build/test/lint pipeline — hooks are executed by Claude Code, and the system audits itself at boot (see §5).

---

## 2. The layered model

The system's own mental model (from [`meta/INDEX.md`](meta/INDEX.md)) — every behavior has a deterministic home:

```
LAYER 0 — Identity            WHO the AI is        → personality.md, master-memory.md, main/main-memory.md
LAYER 1 — Constitution/Meta   HOW it decides       → meta/
LAYER 2 — Boot & Workflow     WHAT runs at boot    → .claude/CLAUDE.md, Feature/Session-Briefing-System/,
                                                      Feature/Domain-Expansion/, quest/
LAYER 3 — Capabilities        skills + hooks       → .claude/skills/, .claude/hooks/, plugins/
LAYER 4 — Knowledge           references           → library/, library-items/, etanah-knowledge/,
                                                      .claude/auto-memory/
LAYER 5 — State               current data         → quest/active.txt, main/current-session.md, main/todo.md
```

When a *new* behavior needs a home, the decision rule (meta-layer) is:

| Behaviour type | Goes to |
|---|---|
| MUST fire every time, deterministically | **Hook** (`.claude/hooks/` + `settings.json`) |
| Fires conditionally when context matches | **Skill** (`.claude/skills/<name>/SKILL.md`) |
| Judgment / style / values | **CLAUDE.md** (≤200 lines) or **personality.md** |
| Reference / knowledge | **library-items/** or a knowledge folder |

Default-to-prose (just adding a paragraph to CLAUDE.md) is **banned** unless the behavior is genuinely judgment-only — prose-only principles don't fire reliably.

---

## 3. Boot sequence

At every session start, `.claude/CLAUDE.md` drives this order (a SessionStart hook verifies each file was actually read):

```
.claude/CLAUDE.md  →  .claude/personality.md  →  master-memory.md
   →  Feature/Domain-Expansion/expansion-protocol.md
   →  Session Briefing  (date · active quest · priority · where-we-left-off · standing flags)
```

`master-memory.md` is the memory entry point: it loads `main/main-memory.md` (identity + user profile) and `main/current-session.md` (session RAM). Several **SessionStart hooks** also fire here to audit the system and surface state (see §5).

---

## 4. Repository map

One line per top-level area. **(gitignored)** marks paths excluded from git (see `.gitignore`).

| Path | Role |
|---|---|
| `.claude/CLAUDE.md` | Session instructions / persona boot — the always-loaded operating rules |
| `.claude/personality.md` | User profile + the AI's behavioral invariants |
| `.claude/hooks/` | ~42 Node.js guard scripts (deterministic enforcement) — see §5 |
| `.claude/skills/` | ~32 project-local skills (`<name>/SKILL.md`) — see §5 |
| `.claude/auto-memory/` | Cross-session memory facts + `MEMORY.md` index (user/feedback/project/reference) |
| `.claude/settings.json` | **Hook registration** (committed, propagates across machines) |
| `.claude/settings.local.json` | Machine-specific permissions **(gitignored)** |
| `.claude/state/` | Runtime state (e.g. `session-items.md`) |
| `master-memory.md` | Memory boot entry point |
| `main/` | Living memory: `main-memory.md`, `current-session.md`, `post-mortems.md`, `todo.md`, `kpi-tracker.md`, format refs |
| `meta/` | **Layer 1 constitution**: `INDEX.md`, `system-architecture.md`, `principles.md`, `slip-log.md`, sub-indexes, eval baselines |
| `quest/` | Quest workflow: `quest-protocol.md`, `active.txt` **(gitignored)**, archives, helper scripts (`redmine-sync.js`, `active-trim.js`, `notes.js`) |
| `Feature/` | System extensions — see §8 |
| `daily-diary/` | Long-form session archive (`current/` + `archived/`), `daily-diary-protocol.md` |
| `projects/` | Per-ticket work files (specs, scope, FAT checklists) — **(gitignored, sensitive)** |
| `library/`, `library-items/` | Reusable knowledge library + format templates + pre-made entries |
| `etanah-knowledge/` | Etanah domain knowledge (e.g. `melaka/`) — Layer 4 |
| `growth/`, `RURI-GROWTH.md` | KPI / growth evidence tracking |
| `tools/` | Local tooling (e.g. `tools/docx/`) |
| `plugins/ruri-skills/` | **Legacy** plugin skill layout — superseded by `.claude/skills/` |
| `MIYA-NOTEBOOK.md` | User-side guidance (how to drive the assistant well) |
| `RURI-NOTEBOOK.md` | The AI's first-person tour of itself |

---

## 5. Enforcement — hooks + skills

This is the heart of the system. **Read [`meta/system-architecture.md`](meta/system-architecture.md) §3–4 for the full per-hook / per-skill catalog and §8 for change procedures.** This section is the system-level overview only.

### Hooks (deterministic — fire 100% of the time)

Hooks are Node scripts registered in `.claude/settings.json` and run by Claude Code at lifecycle events. Most are **advisory** — they inject reminder context; a few **block** (notably `commit-gate.js`). `settings.json` is the single source of truth for what is active.

Current wiring (snapshot — confirm against `settings.json`):

| Event | Count | Examples / purpose |
|---|---|---|
| `SessionStart` | 7 | `meta-layer-audit` (self-audit), `boot-load-verification`, `boot-required-read-gate`, `open-quest-surfacer`, `worktree-cleanup-boot` |
| `UserPromptSubmit` | 18 | `ticket-gate` (Quest trigger), `prayer-gate`, `PlainFirstGate`, `inventory-first-gate`, `skill-invocation-discipline-gate`, `prepare-commit-trigger`, … |
| `PreToolUse` (Bash) | 2 | `commit-gate` (blocks unsafe commits), `convention-check-gate` (SQL value-shape) |
| `PreToolUse` (Edit\|Write) | 6 | `self-gate-impulse`, `pre-action-check-gate`, `meta-edit-gate`, `edit-scope-gate`, `convention-check-gate` |
| `Stop` | 8 | `reply-log`, `silent-claim-drift-gate` (no "done" without diff-backing), `de-output-integrity-checker`, `ask-back-gate` |
| `PostToolUse` | 1 | `RecursiveLoopDetector` (same tool + similar args 3×) |

**Files vs registrations:** ~42 `.js` files exist on disk; 41 are registered (`convention-check-gate.js` is dual-registered on Bash and Edit|Write). `voice-signal-spike.js` is a standalone calibration tool, intentionally unregistered — the boot audit flags it as a "ghost" because it lacks the `// meta-layer-audit: skip-ghost-check` opt-out marker.

**Drift protection:** `meta-layer-audit.js` runs at every boot and checks machine-checkable invariants **INV-1…INV-6** (e.g. every registration has a file, every file is registered, every `status=` is in the canonical enum). If a count or pointer in any doc disagrees with reality, the boot audit is what surfaces it — **trust `settings.json` + the boot audit over any prose count, including the ones above.**

### Skills (conditional — loaded when relevant)

Skills are description-triggered (or slash-invoked) procedures under `.claude/skills/<name>/SKILL.md`. They fall into rough families (full catalog in `meta/system-architecture.md` §4):

- **Workflow:** `quest`, `verify`, `appraise`, `grill-me`, `grill-with-docs`
- **Discipline primitives:** `predicate-box`, `grep-rubric`, `claim-verification`, `scope-anchor-echo`, `test-data-echo`, `over-generalization-check`, `stalling-detector`, `sycophancy-circuit-breaker`, `confidence-table`, `multi-dim-evidence`
- **Knowledge/structural:** `system-design`, `bankai`, `auto-skill-on-mistake`, `evaluator-optimizer`, `etanah-knowledge-graph-build`
- **Utility:** `env-check`, `familiar`, `checklist`, `annotations`, `git-health`, `system-check`, `etanah-rahsia-bypass`, `video-frames`, `usage-guidance`

**Hard rule:** a skill MUST be invoked via the Skill tool — manually "following the SKILL.md steps" by hand is banned and enforced by `skill-invocation-discipline-gate.js`.

**Hook ↔ skill pairing:** some disciplines are split — a hook fires the trigger deterministically, the paired skill carries the procedure (e.g. `auto-skill-trigger.js` ↔ `auto-skill-on-mistake`, `silent-claim-drift-gate.js` ↔ `claim-verification`).

---

## 6. The memory system

Persistence is just files, loaded on boot and rewritten through conversation:

| File | Role | Lifecycle |
|---|---|---|
| `main/main-memory.md` | Unified identity + user profile | Living doc; refined as the AI learns |
| `main/current-session.md` | Session RAM (current context, where we left off) | Resets each session; only the recap survives |
| `main/post-mortems.md` | What was learned per closed ticket | Append-only (written at Quest Phase 2) |
| `main/todo.md` | Task backlog | Items live until confirmed done |
| `main/kpi-tracker.md`, `growth/` | Cadence / growth evidence | Append-only |
| `daily-diary/` | Long-form session history | One file per day; monthly archival |
| `.claude/auto-memory/` | Atomic memory facts + `MEMORY.md` index | One fact per file; updated, not duplicated |

The `.claude/auto-memory/` layer is the harness's own cross-session memory (separate from `main/`): each `.md` holds one `user` / `feedback` / `project` / `reference` fact, indexed in `MEMORY.md`.

---

## 7. The Quest workflow (how work gets done)

A **Quest** is the ritual for any Etanah ticket. It exists because jumping to code on first-plausible-theory cost real time. Full body: [`quest/quest-protocol.md`](quest/quest-protocol.md).

Four macro-phases (from `meta/system-architecture.md` §2):

```
A. Context Loading   →   B. Debugging    →   C. Code-Review   →   D. Ship
   (Discovery)            (Recon +            (Rubric: rank        (Apply → Verify →
   read everything        Simulate:           fixes, scrutinize,   Commit → Push → Wrap)
   before theorising)     reproduce)          blast-radius)
```

Operationally tracked as **Phase 0** (recon/setup), **Phase 1** (fix + local test + close-out), **Phase 2** (wrap + post-mortem). Hard gates:

- Triggered automatically when a ticket number is mentioned (`ticket-gate.js`) — read Task folder, Notes, History **first**.
- **Never commit** without `local_test_confirmed=true` (enforced by `commit-gate.js`).
- State lives in `quest/active.txt` (gitignored; schema in `meta/system-architecture.md` §5.1); per-ticket detail in `projects/coding-projects/active/QA-NNN/`.

---

## 8. Feature subsystems

Beyond Quest + Meta, `Feature/` holds self-awareness systems (these are *not* covered by `meta/system-architecture.md`):

| Subsystem | What it does |
|---|---|
| `Session-Briefing-System/` | The structured boot briefing (date, quest, priority, flags) |
| `Domain-Expansion/` | Session-end reconciliation + meta-audit sequence (`expansion-protocol.md`); a Layer-2 boot file |
| `Observation-System/` | 4-tier log (T1 immediate → T4 systemic) of patterns the AI notices |
| `Forge-Self-Improvement-System/` | 5-level lifecycle for corrections (Raw → … → Masterwork); slip + violation logs |
| `Time-Based-Aware-System/` | Prayer-time awareness; `prayer-gate.js` reads `prayer-config.json` (cache/state files gitignored) |

---

## 9. Etanah work context

The day-job target is **Etanah / Pelupusan** (Melaka state land administration). Key facts for anyone touching it:

- The actual source code is **not in this repo** — it's a separate checkout (the dev copy, not any OneDrive mirror). This repo holds the *memory, workflow, and knowledge* about it.
- Environments are **ticket-driven**: `mlkuat` / `mlkfat` for most Melaka work, `mkit` for AWAM tickets. Verified/switched via the `env-check` skill.
- **Working-analog-first** is the prime directive: Etanah is mature — find the closest sibling that already solves the shape before writing anything new.
- Non-negotiables (entity-first SQL, Word-template-first lookup, PDF annotation extraction, TRG hard-exclusion, multi-state classification) are summarized in `.claude/CLAUDE.md` → *Active Project Rules*.

---

## 10. Working ON the system (conventions)

If you are modifying the memory system itself (hooks, skills, protocols, state schemas):

1. **Inventory first / merge > proliferate.** Check what already exists before adding a file. (This very doc was scoped to *complement* `meta/system-architecture.md`, not duplicate it.)
2. **Follow the change procedures** in [`meta/system-architecture.md`](meta/system-architecture.md) §8 (renaming a hook, deprecating a skill, changing a state schema, modifying a Stop-hook predicate).
3. **Paired-edit discipline.** Touching a hook / skill / protocol / state file should update `meta/system-architecture.md` in the same change (`meta-edit-gate.js` reminds you).
4. **Version-bump discipline.** Any rule/protocol change bumps that file's `Version` + `Last updated` stamp in the same edit.
5. **Decide the right home** using the §2 table — don't add advisory prose for something that must fire deterministically.
6. **Let the boot audit verify you.** After changes, the next `meta-layer-audit.js` boot run reports `🛡 invariants: N/6` — green means INV-1…6 still hold.
7. **Commit conventions** differ by repo — see `.claude/commit-conventions.md`. Commits are manual (`save all` auto-commits the memory repo; the user pushes).

---

*Created 2026-05-29 via `/init` as the repo's orientation front-door. Not auto-loaded. This is a map — the canonical homes it links to own the authoritative detail; if a count or pointer here disagrees with `settings.json` or `meta/system-architecture.md`, those win.*
