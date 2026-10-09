# system/ — Layer 1 (Constitution / Meta) Master INDEX

> **Purpose:** The system-layer governs HOW Ruri decides, behaves, and evolves. It enforces best-practices on every other layer below it (Boot/Workflow, Capabilities, Knowledge, State). One unified layer per Stage 1 grill decision (2026-05-23).
>
> **System overview:** Ruri is a Claude Code-based personal AI agent for みや — built on a layered architecture where every behavior has a deterministic home, every slip becomes a refinement, and the system evolves as Anthropic does.
>
> **Plan:** `C:\Users\Ridhwan\.claude\plans\1-this-means-you-toasty-forest.md` (approved 2026-05-23)

---

## The system map — six kinds of parts (THE one map; rewritten 2026-10-05 per みや's rulings below)

Everything in this repo is one of six kinds. **"Installed" has one meaning per kind** (last column): a part that does not meet its row is NOT installed, whatever folder it sits in.

| Kind | Plain meaning | Layer | Home | Installed when |
|---|---|---|---|---|
| **Rules** | How Ruri decides, speaks and boots | 0 · 1 · 2 | `.claude/personality.md` (voice) · `system/` (the constitution: this map, the design rules, the ledgers) · `.claude/CLAUDE.md` + the files it routes to (boot rules) · the root guides | the rule has ONE home file; every other mention is a pointer |
| **Workflows** | A route: ordered steps across many turns, which remembers the step it is on (quest · deploy · release · adhoc · Domain Expansion) | 2 | its skill (owns the step table) + its position in `quest/active.txt` `current_phase`; engines in `quest/` and the legacy `Feature/` folder | a Feature folder (goal + log + eval) · a step table in its skill · a position field |
| **Features** | One job at one moment: a gate, a check, a tool, a skill | 3 | `domain/<name>/`; its skill in `.claude/skills/<name>/`. Hooks still loose in `.claude/hooks/` are NOT yet installed | home folder · README `goal:` `retention:` `footprint:` · a log (observability) · an eval · a registration → census verdict `PROPER` |
| **Memory** | What Ruri knows and remembers | 0 · 4 · 5 | identity `main/main-memory.md` · knowledge `projects/…/etanah-knowledge/` + `library-items/` · notes `.claude/auto-memory/` · diary `daily-diary/` · state `quest/active.txt` + `main/current-session.md` + `main/todo.md` | it sits on a named shelf with an index line. System RULES never live in Memory |
| **Kernel** | Shared code and wiring that everything else runs on | under all | `core/` (forge · registry · slips · boot) · `lib/` (hook-runtime · states · census …) · `.claude/settings.json` (hook wiring) | its header states its goal; at least one Feature or Workflow uses it |
| **Projects** | Work Ruri builds for みや — not a system part | — | `etanah_atlas/` (lives in this repo) · `projects/coding-projects/active/<Name>/` (a project with its own repo: PymTime) | it has an owner row in `system/FOLDER-STRUCTURE.md`. A project folder also has `project.json` (name · aliases · repo) + `PROJECT.md` `VERSIONS.md` `ARCHITECTURE.md` `PROOFS.md` `ROADMAP.md`, is listed in the map below and in `system/save-rules.json`, is loaded by `domain/project-load/` when a prompt names it, and is checked at Domain Expansion by `lib/save-rules.js` |

Layer numbers are unchanged, so every existing "Layer N" reference still resolves: **0** Identity · **1** Constitution · **2** Boot config & Workflow · **3** Capabilities · **4** Knowledge · **5** State.

**Install** (みや 2026-10-05): a part enters the system through `core/forge.js` — `new` for a new part, `install` for one that already exists — never by hand-placing files. `node lib/feature-census.js` reports what is installed; `node lib/folder-structure.js map` proves this map against the disk (eval: `lib/folder-structure.eval.js`).

Machine-read map — edit the table AND this fence together. `map` fails on a path that does not exist, a path under two kinds, or a root entry no kind claims. A deeper path may sit under another kind than its parent (most specific wins).

```json
{
  "kinds": {
    "rules": [".claude/CLAUDE.md", ".claude/personality.md", ".claude/reply-shape-spec.md", ".claude/commit-conventions.md", ".claude/cost-efficiency.md", ".claude/save-commands.md", ".claude/new-machine-setup.md", "system", "AGENT-ARCHITECTURE.md", "MIYA-NOTEBOOK.md", "RURI-NOTEBOOK.md", "README.md", "REGISTRY.md"],
    "workflows": ["quest", "Feature", ".claude/workflows"],
    "features": ["domain", ".claude/skills", ".claude/hooks", ".agents", "skills-lock.json"],
    "memory": ["main", "daily-diary", "projects", "library-items", ".claude/auto-memory", ".claude/state", "quest/active.txt"],
    "kernel": ["core", "lib", ".claude/settings.json"],
    "projects": ["etanah_atlas", "projects/coding-projects/active/PymTime"]
  },
  "ignored": [".git", ".gitattributes", ".gitignore", "node_modules", "backups", "meta", "outputs-temp.gitkeep", ".claude/worktrees", ".claude/settings.local.json", ".claude/launch.json"]
}
```

Dropped from the pre-2026-10-05 layer block, each on purpose: `master-memory.md` (file deleted 2026-08-16) · `plugins/` and `library/` (orphans awaiting みや's verdict in `system/FOLDER-STRUCTURE.md`; never live parts). Everything else the old block named is in the table above.

## Structure rulings — みや, 2026-10-04 (ruled by popup)

Build state 2026-10-05: ruling 4 is BUILT (the map above + its disk check). Rulings 1–3 are migrations still to run: the loose hooks, the skills without a Feature folder and the legacy `Feature/` folder are named in the map as not yet installed.

| # | Ruling | Counted from disk at ruling time |
|---|---|---|
| 1 | "Everything under a Feature" = everything that DOES A JOB (hooks, skills, job scripts) is a Feature in `domain/<name>/`. `core/` (kernel) and `lib/` (shared code) stay outside Features; each names the Features that use it. | 115 Feature folders · 55 loose hooks in `.claude/hooks/` · 7 kernel scripts · 40 libraries |
| 2 | A skill is a Feature PART: every skill has a Feature folder (README goal + log + eval) that points to `.claude/skills/<name>/SKILL.md`. | 72 skills · 52 without a Feature folder |
| 3 | Root `Feature/` moves into `domain/` and the name is retired, so "Feature" has ONE meaning. | 7 legacy folders |
| 4 | THIS file is the one map of the system. `CLAUDE.md`, `system/FOLDER-STRUCTURE.md` and the system-design skill point here instead of carrying their own map. | 4 documents carry a partial map today |

### Workflows — defaults taken 2026-10-04 (みや answered "no preference" on all four; these are Ruri's recommended options, open to his re-ruling)

A **Workflow** is what the quest skill already calls a "workflow-type skill": it chains steps at each phase boundary and records its position in `current_phase` (`quest/active.txt`). A **Feature** is one job at one moment.

| # | Default | State at decision time |
|---|---|---|
| 5 | A Workflow is a ROUTE (Layer 2) made of Features (Layer 3). Its own folder with goal + log + eval is a Feature, like every skill (ruling 2). | quest · domain-expansion · adhoc-save · close-phase · hotfix have a skill and no Feature folder |
| 6 | The Workflow's SKILL owns its step list (the phase-boundary table); the protocol file is per-step detail. This supersedes the CLAUDE.md File Ownership row that names `quest/quest-protocol.md` as owner — that row is re-pointed at build time. | only quest has a step table and a position field; 9 other Workflow skills have neither |
| 7 | The quest engine stays in `quest/` (27 scripts + protocol + `active.txt`); the quest Feature folder points to it. No path moves. | 6 scripts read `current_phase` by path |
| 8 | "Workflow" = a route only. The Claude Code multi-agent scripts are always written "Workflow tool script". | the word had three uses |

Design constraints carried from the 2026-10-04 audit (so the build does not re-invent): NO new steps file (the step table exists) · NO new shared step gate (join an existing bundle; add a gate to a step only on slip evidence; blocking predicates ship advisory first per `system-architecture.md` §8.4) · each Feature gains a README key naming the Workflow step it serves (0 of 115 had one) · load only the current step's text by refining the existing loader (quest skill 120 KB + protocol 188 KB were loaded whole).

A Feature's layers, in みや's words (2026-09-04): **observability** = liveness (did it fire, did it block, how long); **monitoring** = context (why, on which quest and phase, was it right, what it cost, did it meet its goal). Both are part of every Feature, not a dashboard. At ruling time: 59 of 115 Features write a log, 9 write a goal log, 41 have README + goal + log + eval together.

## Change record — every system change is saved at the moment it is made (みや, 2026-10-05)

His words: "keep creating artifacts for your reference every time a system change" · "I do not want to rely simply on domain expansion to save anything that is important … save every time you updated something. So that you will know the history and purpose and reason behind it."

A system change = any change to a Rule, Workflow, Feature or Kernel part in the map above. It is not done until each row below that applies is written, in the same turn as the change. Domain Expansion only checks these; it is never the first place a change is recorded.

| What is recorded | Where (existing ledger, nothing new) | When |
|---|---|---|
| What changed + why + rollback | the part's own `README.md` + `NUKE-MARKER.md` · `system/registry.jsonl` (forge writes it) | in the commit that makes the change |
| Rule text changed | `system/claude-md-changelog.md` + the version stamp | same edit pass |
| Hook added, moved or removed | `system/system-architecture.md` §9 sync row + `node system/sync-hook-catalog.js` | same commit |
| Behaviour to watch after the change | `node lib/watch.js add …` BEFORE the commit (a watch added after it prints the wrong rollback line) | before commit |
| The decision and who made it | "Structure rulings" above, or the owning skill | when ruled |
| Session narrative (what, why, state, next) | `main/current-session.md` · the day's `daily-diary/current/<date>.md` · an open effort's `main/handoff-<date>-<topic>.md` | same turn, not at session end |
| Open work | `main/todo.md` | same turn |
| A Project changed (its code, its plan, its state) | that project's own folder: a `VERSIONS.md` row with the commit · `PROJECT.md` state and its `Last updated:` line · `ROADMAP.md` status (added 2026-10-08 per みや) | same turn as the change; `lib/save-rules.js` fails Domain Expansion when the project's repo moved and these did not |
| The picture | the artifact for that area, republished to the same URL | same turn |

Artifacts (private pages on claude.ai, republished in place; the source HTML is rebuilt from this map and the handover when a session no longer has it):

| Area | URL | Shows |
|---|---|---|
| System map | https://claude.ai/artifact/7rC3ck11zTHQdfqbtAnNGv | the six kinds, what is installed, what is not |
| Boot sequence | https://claude.ai/artifact/WnyAt8Jdg9LEkZjdytmWzB | every startup script, cost before and after |
| Quest paths | https://claude.ai/artifact/F6XUQEjvyABeLJaoSY3Ls4 | patch / minor / development: which path, what each phase produces, what is loaded when, development in depth (2026-10-05) |
| Boot + structure handover | https://claude.ai/artifact/FYG8o9tQy6KzRTqMN1doDo | decided · built · batch 2 · still to do (full text: `main/handoff-2026-10-05-boot-structure-audit.md`) |

Not built: a gate that refuses a system-change commit when a row above is missing. Today this section is a rule that Ruri follows; the gate belongs to the Memory audit.

## What lives in system/

| File | Purpose | Phase built |
|---|---|---|
| `INDEX.md` (this file) | Master index — points to all sub-indexes + cross-refs | Phase 1 ✅ |
| `principles.md` | The 6 proto-system-layer principles + classified rest of 68 principles from personality.md / feedback files | Phase 1 ✅ |
| `baseline-2026-05-23.md` | Pre-system-layer baseline measurement (slip count + corrections + INDEX validity) for comparative eval | Phase 0 ✅ |
| `discipline-INDEX.md` | Sub-index for Discipline atomic primitive skills (Rubric / Predicate Box / Grep Rubric / Multi-dim evidence / Sycophancy Circuit-Breaker / Confidence Table) | Phase 1 skeleton ✅ → Phase 3 populates |
| `honesty-INDEX.md` | Sub-index for Honesty atomic skills (claim-verification / task-assignment-honesty / stalling-detector / scope-anchor-echo / over-generalization-check / test-data-echo) + Identity-section reference in personality.md | Phase 1 skeleton ✅ → Phase 4 populates |
| `enforcement-INDEX.md` | Sub-index for 6 Enforcement hooks (boot-required-read · pre-action-check · inventory-first · prose-default · silent-claim-drift · best-practices-not-consulted) | Phase 1 skeleton ✅ → Phase 2 populates |
| `user-side-INDEX.md` | Sub-index for User-side Guardrails (user-side-guardrail.js hook + usage-guidance skill + MIYA-NOTEBOOK.md) | Phase 1 skeleton ✅ → Phase 5 populates |
| `evolution-protocol.md` | How system-layer self-updates on Anthropic releases (SessionStart double-check + manual invoke) | Phase 1 placeholder ✅ → Phase 7 implements |
| `slip-log.md` | **Pending Phase 8** — consolidated slip history from 8 scattered files | Phase 8 |
| `system/telemetry/hook-fires.jsonl` + `lib/liveness-report.js` (replace `hook-fire-log.md`, deleted 2026-08-16; pointer corrected 2026-10-04) | Per-hook fire logging for self-enforcement eval | Live |
| `build-progress.md` | **Pending** — multi-session build state tracker (per refinement #6) | Add at next session resume |

## Cross-references (where system-layer touches other layers)

| Target | Where | Why |
|---|---|---|
| `library-items/agent-architecture/claude-code-best-practices.md` | Knowledge layer | Read by system-design-router Step 3.5 (best-practices check) before deciding hook/skill/CLAUDE.md |
| `personality.md` — Honesty Invariants section (Phase 4) | Identity layer | Always-on values that complement the Honesty atomic skills (triggered) |
| `.claude/skills/auto-skill-on-mistake/SKILL.md` (the system-design-router; the rename to `system-design-router` was never done, pointer corrected 2026-10-04) | Capabilities layer | The skill that runs the inventory → system-design → best-practices → skill/hook decision loop |
| `.claude/hooks/system-edit-gate.js` (Phase 6, v1.2 2026-07-06) | Capabilities layer | PreToolUse hook on `system/*` paths — advisory reminder + HARD-BLOCK arch-doc-sync predicate (deny if system-touching edit lacks `system/system-architecture.md` Read/Edit this session) |
| `domain/design-consult-gate/design-consult-gate.gate.hook.js` (v1.2 2026-07-06) | Capabilities layer | PreToolUse Edit\|Write hook — HARD-BLOCKS edits to skills/hooks/CLAUDE.md/personality.md/system/**/quest-protocol/settings.json unless `/system-design` + `/system-rules` invoked this session; eval-existence rider blocks new hook/skill without paired `domain/<name>/eval.js`; advisory-only on etanah new-symbol additions |
| `Feature/Domain-Expansion/expansion-protocol.md` (Phase 6) | Workflow layer | Extended with `meta-audit` step (Step 12.5) covering hook-fire reliability + cross-ref validity + component-liveness |
| `domain/skill-invocation-log/log.jsonl` (replaces `Feature/Forge-Self-Improvement-System/skill-failure-log.md`, deleted 2026-08-16; pointer corrected 2026-10-04) | Knowledge layer | One row per Skill-tool invocation: the skill-load counter for invocation-reliability tracking |
| `CLAUDE.md` (Phase 9) | Boot Config layer | Adds Layer 1 reference: "System-layer: see `system/INDEX.md`" |

## The 6 core tenets (proto-system-layer principles)

1. **Prose-only principles never persist** — must-fire ≠ aspirational; convert to skill or hook
2. **Output rituals are non-negotiable** — silent failures are invisible failures; visible gates surface gaps
3. **Design from architecture, not from last slip** — pressure-test new rules against the layered model
4. **Invocation must be visible** — every principle has a deterministic trigger; floating principles die
5. **Verify before closure** — no phase closes without external cross-check
6. **Failure-mode awareness** — before declining an action, ask "what breaks if I'm wrong?"

See `system/principles.md` for the full 68-principle classified inventory.

## Decision criteria (used by system-design-router)

When a new behaviour needs a home, the router decides shape based on:

| Behaviour type | Goes to | Why |
|---|---|---|
| MUST fire deterministically (every time) | **Hook** (SessionStart/Pre/Post/Stop event) | Hooks bypass the model; fire 100% |
| Fires conditionally on context (when triggered) | **Skill** (description-trigger discoverable) | Progressive disclosure; loaded only when relevant |
| Judgment / style / values | **CLAUDE.md** (≤200 lines) or **personality.md** (identity) | Advisory; influences emission |
| Reference / knowledge | **library-items/** or `knowledge/` | Retrieved on-demand; not auto-loaded |

**Default-to-prose path** (add to CLAUDE.md / new feedback_*.md) is **BANNED** unless the behaviour is genuinely judgment/style only.

## Recursive safety (Stage 5 self-enforcement)

The system-layer applies its own rules to itself:

- **Edits to `system/*` paths** require `system-design-router` invocation first (enforced by `system-edit-gate.js` PreToolUse hook — Phase 6)
- **Domain Expansion meta-audit step** (Phase 6) runs every session-end checking: hook-fire reliability · INDEX cross-reference validity · component-liveness (no orphans)
- **Fallback** — if `system-edit-gate.js` is dark for 2 sessions, DE meta-audit raises a standing flag (refinement #5)

## Evolution mechanism (Stage 6)

- **SessionStart hook double-check** (Phase 7): model-ID-change detection + >30 days since last evolution-check
- **Manual invoke** also available: "check Anthropic updates"
- Scope: Anthropic product + best-practices guidance + Claude model + LLM research community + agent-design advances
- See `system/evolution-protocol.md`

---

*Master INDEX maintained at the system-layer's root. Updated on every Phase completion.*
