# Core Redesign Blueprint — kernel / user-space

**Author:** Claude Fable 5, external fresh-context instance · 2026-07-12
**Companion to:** `2026-07-11-fable5-external-audit.md` (this file is the implementation shape of that audit's Phase 2)
**みや's brief:** make the core cleaner — *"not necessarily slimmer, but more manageable, predictable, deterministic, structured, not orphaned, very tightly-related (not coupled)"* — by applying the underlying concept that makes pi/oh-my-pi reliable, without copying either 100%, while keeping our workflow logic.

---

## 1. Correction that matters: what pi and oh-my-pi actually are

pi (Mario Zechner) is the **minimal** one: 4 tools, sub-1,000-token system prompt, everything else user-space. oh-my-pi (Can Bölük) is the **maximal fork**: 32 tools, LSP, debugger, subagents. They disagree about size — so "minimal" is not the transferable concept.

What they share, and what MemoryCore's core lacks, is this: **the core is code with defined behavior; prose never does a job code can do; the model's judgment is spent only where judgment is genuinely needed.** oh-my-pi's rules aren't prose hopes — a regex watches the output stream, aborts on violation, injects the rule, retries. pi's memory isn't a ritual — it's files, loaded by the harness. In both, the core is small enough to hold in your head, testable, and *boring*. Everything interesting lives on top of it.

That concept transfers to MemoryCore completely, and your workflow logic survives intact: **the logic doesn't change — it moves.** Scout→Recon→Rubric→Apply, RCRL, sibling-diff, the Etanah non-negotiables, Ruri's identity and diary all remain; what changes is *who enforces the skeleton* (code, not prose) and *how content reaches context* (the kernel loads it by trigger/tier/budget, instead of "remember to read X").

## 2. Scorecard — the current core against your six criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| Manageable | ✗ | Core spread over 7 boot files + 79 hook registrations + 21 meta files; the canonical quest doc (1,411 lines) never names `archive-quest.js`, the script that fixes its own Phase-2 step |
| Predictable | ✗ | Briefing is 100% prose-composed (no script assembles or validates it); DE: 9 of 17 steps are pure model judgment; same state does not produce the same output |
| Deterministic | ~ | Asymmetric: the code-edit path is hardened (schema'd `quest-phase0.js`, atomic `archive-quest.js` with the repo's only self-test, hard-block domain gates) — but the session/memory layer is prose-majority, hooks are 76% advisory, fail open, and are unmeasured |
| Structured | ~ | `active.txt`: 78 live field names vs ~20 documented; zero validation in any of the 10 quest scripts; one hand-edit dropping a blank line can silently fuse two quest blocks |
| Not orphaned | ✗ | Boot chain still loads `master-memory.md` (asserts 4 phantom skills); graveyards (hook-fire-log, RURI-GROWTH, archived.txt, retrieval-tracker); and the reverse orphan: good scripts exist that canonical docs don't reference |
| Tightly-related, not coupled | ✗ | The system has the inverse: **low cohesion** (one concern smeared across files — output rules in 2 homes, quest rules in 3, hook catalog in 4) and **high coupling** (duplication IS coupling — every copy must be hand-synced, and wasn't: 3 contradictory layer models, 3 hook counts, one documented Recon contradiction) |

The scar-map pattern is the deepest tell: `expansion-protocol.md` cites ≥6 named incidents as the origin of its own safeguards; `session-briefing.md` needed "STOP" language and a manual staleness checklist after prose failures. Every core ritual's structure is an accumulation of patches over prose — which is exactly what a code spine prevents.

## 3. The design

### 3.1 Kernel — code + schemas, deterministic, boring (`core/`)

Six components. Each ≤200 lines, each with an eval, total kernel budget ~1,500 lines. Small trusted base — this is the "not necessarily slimmer" answer: the *system* stays rich; what shrinks is the part that must be correct for everything else to be safe.

| # | Component | Replaces | Behavior |
|---|---|---|---|
| K1 | `core/boot.js` — boot assembler | boot order prose + `session-briefing.md` + "Boot files loaded ✓" honor system | Reads state, assembles the context bundle deterministically (profile card, open-quest summary, todo Q1 top-N, slip escalations from JSONL, standing flags), enforces the ≤25K token budget, emits the briefing skeleton. The model adds voice; it never selects files. Reproducibility invariant: same repo state → same bundle |
| K2 | `core/state/` — single-writer state | free-text `active.txt` + hand-written `current-session.md` | `quests.jsonl` + `session.json` with schemas; `state-cli.js` (grown from `active-cli.js`) is the ONLY writer; `state-check.js` validates at boot and pre-commit; direct Edit/Write to state files hard-blocked by one PreToolUse gate; miyazaki machine = overlay file, not a fork |
| K3 | `core/gate-runtime.js` + `core/checks/*.check.js` | 79 hand-rolled hook files | One runtime (stdin parse, fail policy, telemetry, bypass handling); gates become small declarative check modules `{trigger, evidence, action, bypass, telemetry}`; `settings.json` is GENERATED from the check manifest. This is your stream-rules equivalent — and it kills the syntax-ghost class permanently |
| K4 | `core/registry.js` → `REGISTRY.md` | hand-maintained INDEXes, hook tables, file-structure trees, the broken `sync-hook-catalog.js` | One inventory generated from disk: every component, owner, lifecycle state, eval status, last-fired. All hand-written maps deleted. Registry drift = failing check at boot, not an essay |
| K5 | `core/lifecycle.js` | NUKE-MARKER (5 packages only) + ad hoc retirement | created → proven (fired + eval green) → trusted → retired, for EVERY component including kernel pieces; weekly consolidation entry point (the "dream" pass: merge dupes, resolve contradictions, prune, regenerate) |
| K6 | `core/telemetry/` | the empty, tombstoned hook-fire-log | JSONL appends from runtime, boot, and CLIs; weekly report generated, surfaced at boot. Already specified as audit R1 — it is also kernel component #6 |

**Session-end (DE) recomposition:** `core/close.js` orchestrates the mechanical steps — state flush, archive calls, git commit/push with verification, integrity checks, worktree sweep — and a small `close` skill (~5KB) carries the narrative steps (diary voice, reflection, closing words). 30KB of scar-map prose becomes: script spine + marked judgment slots. The Handoff Block, Gap Sweep, and Forge review become checklist items the script *emits* and the model *fills* — fill-in-the-blanks, not recall-the-ritual.

### 3.2 User-space — prose, probabilistic, where judgment belongs

Identity/personality (deduped — mirrored rules live in exactly one home); the quest methodology as a skill (Scout→Recon→Rubric→Apply with all its emits — loaded JIT on quest triggers, which the ticket-gate/resume hooks already fire deterministically); Etanah knowledge (tiered, as today); lessons (consolidated homes per audit C5); the diary and Ruri's voice (untouched — G6 is a real goal, and none of this blueprint spends against it).

### 3.3 The contract between them (this is "tightly-related, not coupled")

1. **One owner per concern.** Your File-Ownership table was the right instinct — it becomes the registry, enforced, covering everything.
2. **Relationships by reference, never by copy.** A rule appears in one home; other places point to it. Duplication is treated as coupling (because it is — hand-synced coupling, the worst kind).
3. **User-space reaches context only through the kernel** — by trigger, tier, and budget. "Remember to read X" ceases to exist as a mechanism.
4. **Prose that proves mechanical gets compiled down.** `auto-skill-on-mistake` becomes: slip → is it checkable? → write a check module + replay eval (not a new prose rule). The Iron Law, finally enforceable.
5. **Judgment slots are explicit.** Where a ritual genuinely needs the model (diagnosis content, diary voice, Rubric choices), the script emits a labeled slot. Everything outside a slot is script territory.

## 4. Migration map

| Today | Verdict | Tomorrow |
|---|---|---|
| `CLAUDE.md` 581 lines | shrink | Kernel manifest ≤200 lines: boot pointer, disposition 5, ownership pointer, Etanah non-negotiable pointers |
| `master-memory.md`, `save-protocol.md` | retire | Tombstone; K1 output replaces them |
| `main-memory.md` 80KB | split | 2–3KB profile card (boot, curated) + episodic archive (on-demand, indexed) |
| `current-session.md` | generate | `session.json` (K2) + rendered recap |
| `quest/active.txt` | migrate | `quests.jsonl` + schema + validator; CLI-only writes. **Step 1 is non-breaking: write `state-check.js` against the CURRENT format first** — instant win, zero migration risk |
| `session-briefing.md` | replace | K1 output template |
| `expansion-protocol.md` 30KB | recompose | `core/close.js` + small close skill |
| `save-commands.md` (65KB in 24 lines) | fold | CLI verbs: `save` = state flush script; redmine row already is one |
| `quest-protocol.md` 188KB | user-space | Quest skill, tiered; names its scripts explicitly (fixes the archive-quest orphan) |
| meta INDEXes + hook tables | generate | K4 registry; hand-maps deleted |
| 79 hook registrations | migrate | ~40 check modules on K3 runtime |
| `slip-log.md` 255KB | freeze | `slips.jsonl` + generated dashboard (audit C7) |
| `auto-memory/` 71 files | compile/route | hook / skill / one-liner / delete (audit C5) |
| `personality.md`, diary, notebooks | keep | User-space; dedupe mirrors only |

## 5. What we deliberately do NOT copy

From pi: the 4-tool austerity, no-subagents, no-hooks stance — you keep skills, familiars, and gates; they're earning their keep once measured. From oh-my-pi: per-model benchmaxxing and its 55K-line ambition — your kernel budget is ~1,500 lines precisely so it stays holdable. From both: nothing about identity — Ruri as a persistent partner (G6) is a goal they don't have, and it costs the kernel nothing.

## 6. Build order and guardrails

Order (each step shippable, no big-bang): **K6 telemetry + K3 runtime** (= existing Phase 1, unchanged) → **`state-check.js` on current active.txt** (day-1, non-breaking) → **K4 registry** (delete hand-maps as it lands) → **K1 boot.js** (run it in shadow mode alongside the prose boot for a week; compare) → **K2 state migration** → **close.js + close skill** → **CLAUDE.md shrink last**, once JIT loading is proven by telemetry.

Guardrails: kernel pieces are built in dedicated sessions, never mid-quest; each lands with its eval or it doesn't land (design-consult-gate already enforces this — repoint it at `core/`); kernel has a hard LOC budget and its own lifecycle (K5 applies to the kernel too — this blueprint must not become the next accretion layer); shadow-mode before cutover for anything boot- or state-touching; every migration step has the rollback recipe pattern.

## 7. Definition of done — the six criteria as testable invariants

1. **Manageable:** the whole core is `core/` + one manifest; a new reader can hold it in one sitting. Registry answers "what exists, who owns it, does it work" in one file.
2. **Predictable:** boot is reproducible — same repo state produces the same context bundle (modulo date). Verified by running K1 twice in CI.
3. **Deterministic:** every core ritual (boot, state change, close, save, commit) has a script spine; prose exists only inside labeled judgment slots. Gate behavior is measured, fail policy explicit.
4. **Structured:** state files validate against schemas at boot and pre-commit; hand-edits to state are hard-blocked; field vocabulary is closed (new fields require a schema change, not a whim).
5. **Not orphaned:** registry lifecycle states make orphans visible automatically (0 fires in 30 days → retire flag); docs reference scripts by name because the registry generates those references.
6. **Tightly-related, not coupled:** one owner per concern (registry-enforced); zero duplicated rule bodies (grep-checkable); cross-references are pointers.

When all six hold, the answer to "are we already doing X?" stops being a claim — it's a registry lookup with a telemetry line attached. That is the property pi and oh-my-pi actually share, delivered on your workflow, in your voice.
