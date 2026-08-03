---
name: reference_multi_ticket_sweep
description: "The multi-ticket sweep work (the /sweep design + its evidence) lives in FIVE places — cite all five, never just todo.md"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 67e46c39-a699-4479-a1ae-7d4f5649fa02
  modified: 2026-07-28T01:17:38.053Z
---

The 2026-07-27 night sweep (5 tickets × 4 waves × 19 Opus familiars) produced an automation audit that landed in **five** locations. When みや asks about the sweep, the `/sweep` trigger, or "how do we automate going through many tickets", surface **all five** — naming only one implies the others don't exist.

| # | Path | Holds |
|---|---|---|
| 1 | `projects/coding-projects/active/multi-ticket-sweep/DESIGN.md` | the `/sweep` design — skill-only · explicit-invocation trigger · 4-wave ladder (understand → quest → blind → audit) · the skip rules · 10-assertion eval contract · the 11 open decisions |
| 2 | `projects/coding-projects/active/multi-ticket-sweep/PRIOR-ART.md` | 16 prior attempts (2026-05-04 → 07-27) with outcomes · the inventory verdict · 16 constraints any trigger must respect |
| 3 | `Feature/Forge-Self-Improvement-System/improvement-audit-log.md` | 2 entries dated 2026-07-27 night — `multi-ticket-orchestration-has-no-assembly` + `stop-bundle-assumes-main-loop-writes-code` |
| 4 | `main/todo.md` Q1 | 2 rows — BUILD `/sweep` · the orchestration-mode gate fix (its **prerequisite**) |
| 5 | `main/current-session.md` | the session block with the per-ticket queue + the traps table |

**Load-bearing facts** (so they survive even if a file is moved):
- 16 prior attempts; **every success was hand-specified by みや**; every attempt to make it reusable became a todo row. **Five unbuilt orchestration rows: todo Q1 items 35 · 37 · 39 · 69 · 136. Zero shipped multi-item components.**
- The parts exist (`redmine-sync --create` · `familiar`+`quest` · Delegation Economy + `agent-spend-gate` · `archive-quest.js` · `/goal`); the **assembly** is what's missing.
- `bankai` = near-fit (right loop shape, built for a static corpus — needs a ticket-corpus adapter). `system-check` fans out over **lenses**, not a **list**. `quest`'s "multi-ticket retrieve mode" is a **dangling reference** (named at `.claude/skills/quest/SKILL.md:213` + `system/system-architecture.md:36`, specified nowhere). **`/loop` is a harness skill we have never used or assessed.**
- 🚨 **Prerequisite before building `/sweep`**: the Stop bundle assumes the main loop is writing code. On orchestration-only turns `predicate-box` (hard-block, zero edits), `show-gate`, `full-address-trace-gate` and `RecursiveLoopDetector` all misfire on relayed familiar text.

**Why this memory exists**: みや, 2026-07-28 — *"don't just forget if I ask you to refer to todo then forget the rest."* A single pointer to one home is how the other four go dark. Related: [[feedback_inventory_first]], [[feedback_check_archives]].
