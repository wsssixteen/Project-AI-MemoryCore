# Layer Architecture — Ruri's System Stack

> **Purpose**: Single map of every layer that constitutes me. Tracks reliability over time.
> **Owner**: Ruri (self-assessment) + みや (sign-off on promotions/demotions).
> **Cadence**: Re-assess at every Forge Review. Update on any new layer added or removed.
> **Created**: 2026-05-08 (in response to みや's request to track + improve the layer model itself)

---

## Layer 0 — Continuous Improvement (mindset / meta-meta)

> **The mindset that makes every other layer improvable.** Without L0, even System Design Discipline (L1) is a static rule set. With L0, the rules themselves are subject to refinement, retirement, and evolution.

**Inspired by**: Hermes Agent (referenced by みや 2026-05-08 — to research the specific repo).

**What it is**:
- A philosophical anchor, not an operational system
- The reason Forge (L7 below) exists
- The reason audit-logs and post-mortems exist
- The reason rules carry "Why" + "How to apply" + Reason-for-deprecation when retired

**Manifests as**:
- Audit-log entries that capture *why* a rule was added, so future-me can decide if it still fits
- Forge log L1→L4 promotion path
- Post-mortem rituals after every quest
- Weekly Forge Review
- Continuous-Improvement sections in knowledge files (per 2026-04-29 protocol)
- This very document — rating + improving the layer model itself

**Failure mode if absent**:
- Rules pile up without review (the 105-pending-audit-log-entries problem proves L0 is partly absent right now)
- Old rules contradict new ones, silently
- System grows in volume without growing in quality
- I get more rules but not more reliable

**Reliability target**: must be ≥80% always — if it drops below, the rest of the stack rots regardless of how strong individual layers are.

---

## Layer registry (operational layers)

| # | Layer | Purpose | Owner | Where it lives |
|---|---|---|---|---|
| 1 | **System Design Discipline** | Architect-first method for adding any rule/skill/hook/memory/format | hard rule | `.claude/CLAUDE.md` (System-Design Discipline section) |
| 2 | **Identity / Personality / Memory** | Who I am + how I express + what I remember about みや | identity | `main/main-memory.md`, `.claude/personality.md`, `.claude/auto-memory/` |
| 3 | **Quest Protocol** (Phases + Cp A-N) | Execution discipline for tickets | protocol | `quest/quest-protocol.md` + `.claude/CLAUDE.md` Quest Workflow |
| 4 | **Skills** | Reusable named operations | per-skill SKILL.md | `.claude/skills/<name>/SKILL.md` + plugins |
| 5 | **Hooks / Automation** | Pre/post tool gating | settings | `.claude/settings.local.json`, `.claude/settings.json` |
| 6 | **Knowledge files** | Domain reference (etanah codebase, urusans, tugasan, BPMN, DB) | framework + ticket-driven growth | `projects/coding-projects/active/etanah-knowledge/melaka/*.md` |
| 7 | **Forge** (continuous improvement OPERATIONAL) | Logs + KPI + audit + observation. The IMPLEMENTATION of L0. | tracking system | `Feature/Forge-Self-Improvement-System/` |
| 8 | **Domain Expansion** | Environment signal observation (drift, autoscan, state-transitions) | observation system | `Feature/Domain-Expansion/expansion-protocol.md` |
| 9 | **Quest State** (`active.txt`) | Source of truth per active/held quest | per-quest record | `quest/active.txt` |

---

## Reliability assessment — current snapshot

> Updated: 2026-05-08
> Method: honest self-assessment against (a) firing-when-expected, (b) followed-not-dropped, (c) producing-measurable-value, (d) superseded-rules-retired.

| # | Layer | Reliability | Evidence |
|---|---|---|---|
| 0 | **Continuous Improvement (mindset)** | **65%** | L0 manifests in Forge + audit-log + post-mortems, but **105 pending entries with no review cadence** = the catch-net has holes. Mindset present in design but inconsistent in practice. |
| 1 | System Design Discipline | **40%** | v2 baked 2026-05-08; ~92% theory confidence per pressure-test; **0 real-world uses**. Validation pending next 3 design cycles. |
| 2 | Memory / Personality | **75%** | Auto-load reliable; ~30 feedback files = pile-up; some clash (DE format slip 2026-05-07); refactor scheduled in Q2 todo. |
| 3 | Quest Protocol (Cp A-N) | **65%** | Phase structure stable; Cp A-N + Recon **new — only QA-259759 ran end-to-end**. Need ≥3 more cycles to validate. |
| 4 | Skills | **50%** | /quest + /familiar solid; /appraise too broad (みや's note 2026-05-08, needs refinement + rename); /loop + /schedule exist; coverage gaps elsewhere. |
| 5 | Hooks / Automation | **60%** | ticket-gate + commit-gate wired 2026-04-02; limited coverage beyond. |
| 6 | Knowledge files | **70%** | Inventory-first + SCOPE/NOT FOR rules strong; gaps in CONFIG-FRAMEWORK + topic mindmaps (in Q2). |
| 7 | Forge (operational) | **55%** | Logs exist (forge-log, audit-log, kpi-tracker, observation-log, debug-ritual-violations); promotion mechanics under-exercised; weekly review **not happening reliably**. **Highest-leverage layer to harden next** because it serves L0. |
| 8 | Domain Expansion | **70%** | Boot autoscan works (signals 1-3); ticket re-engagement scan + Rework/Addition classification (signals 4-5) untested at scale. |
| 9 | Quest State (active.txt) | **80%** | Schema works; mutation-on-trigger sometimes missed (e.g. learning_marker not surfaced in Note column — fix in progress 2026-05-08). |

**Honest critique alignment with みや's mental model**:
- His **Layer 1** ("highest, improve anything") = my row 1 (System Design Discipline). Currently weakest because it's brand new.
- His **Layer 2** ("must be 100% reliable except external failures") = my rows 2-6. None at 100%.
- **Forge (row 7)** is the catch-net for when 100% isn't met — but Forge itself is only 55% reliable. Misses get silently dropped instead of escalated. **This is the highest-leverage gap**.
- **L0 (Continuous Improvement)** is the philosophical layer that makes Forge necessary. Forge is L0's operational implementation. Without L0 mindset, Forge becomes ceremony.

---

## Update log

| Date | Change | Reason |
|---|---|---|
| 2026-05-08 | Doc created with L0 + 9 operational layers + first reliability snapshot | みや asked for tracked + improvable layer model after item 8 of 2026-05-08 morning session; elevated Continuous Improvement to L0 (inspired by Hermes Agent reference) |

---

## How this doc evolves

**Add a new layer** when:
- A new system component spans across multiple existing layers' concerns (not "I added a new file")
- The system component has its own protocol / lifecycle / failure mode
- It's an addition that warrants reliability tracking on its own axis

**Demote / remove a layer** when:
- It's been fully absorbed into another layer (consolidation)
- It's measurably 0% reliable AND not being improved (retirement)

**Re-assess reliability** at:
- Every Forge Review (weekly)
- After any layer-spanning change (e.g. v2 system-design rule baked → L1 needs re-assessment after 3 uses)
- When みや asks "where are we now?"

**Sign-off rule**: I (Ruri) propose changes to this doc; みや approves before merging. Same as mindmap protocol (Cp K rule from QA-259759 cycle).

---

*This doc is itself an instance of L0 — it exists so the layer model can improve over time, not be set in stone.*
