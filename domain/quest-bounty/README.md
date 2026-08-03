# Power: quest-bounty

**What fires when**: invoked by `close-phase` at **Phase 2** (quest archive), after archive hygiene runs.

**Contract**: harvest a closed quest's three value-streams (quest doc · system improvements made this quest · new etanah-knowledge), mine ONE system refinement from all prevention dimensions + un-actioned `slip-log` clusters, then commit/push/merge the **MemoryCore-side** spoils to main. NEVER touches the etanah git repos (their fix is a teammate-merged PR).

## Pieces

| Piece | Path | Status |
|---|---|---|
| Skill (procedure) | `.claude/skills/quest-bounty/SKILL.md` | ✅ shipped 2026-07-01 |
| Trigger (wiring) | `close-phase` SKILL.md Phase 2 step 4 (invokes quest-bounty) | ✅ wired 2026-07-01 |
| State flag | `system/slip-log.md` schema `bounty_actioned` | ✅ added 2026-07-01 |
| Audit log | `domain/quest-bounty/log.jsonl` | ✅ this folder |
| Discipline hook (verify it ran at archive) | `domain/quest-bounty/discipline.hook.js` | ⬜ pending |
| Eval (score a bounty run) | `domain/quest-bounty/eval.workflow.js` | ⬜ pending |

## Why (extend-over-create, per system-rules Rule 1)

The system was **capture-rich, synthesis-poor**: `auto-skill-on-mistake` + `slip-log` capture every slip, but nothing READ the pile to propose a fix; and quest value was banked only at session-end Domain Expansion, not per-quest. quest-bounty is the missing per-quest **synthesis + bank** — wired into the existing `close-phase` Phase 2 rather than a new event hook (close-phase already owns the archive moment).

## Distinct from neighbours

| Component | Scope |
|---|---|
| `close-phase` | mechanics of advancing a quest active→closed→archived |
| Domain Expansion | session-end save (all quests + diary + memory) |
| **quest-bounty** | per-quest value harvest + ONE mined refinement, at Phase 2 |
