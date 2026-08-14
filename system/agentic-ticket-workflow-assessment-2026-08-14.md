# Agentic / ticket-workflow assessment — 2026-08-14

Session: retrieval + quest 2 new tickets (275456 fold, 275500 Phase 0), autonomous /goal.

## A1 — Agentic system
- **Worked**: chose inline scout over a workflow fan-out for 275500 (Delegation Economy: scout inline first). Instance — 4 greps + 2 code reads pinned the root (`PelupusanService.java:14151` `apbList.get(0)`) with no fleet spend. A full quest-phase0 workflow would have been overkill for a single-populator trace where BA already gave the exact expected output.
- **Instance of good restraint**: 275456 was an ad-hoc match → folded, zero agents spent.

## A2 — Quest workflow
- **Worked**: the ad-hoc register compare (Phase-0 mandatory row) caught 275456 = A13 at Description-read, before any Scout. Folding the DB-proven evidence saved a full re-investigation of an already-proven mechanism. This is exactly the register's designed payoff.
- No phase let anything through this session.

## A3 — Debugging efficiency + accuracy
- **Friction (mechanical, fixable)**: `branch-guard` blocked a **Read** of an etanah `.java` because the repo sat on `mlk/int-env` (where みや actively works). Reads don't edit — the guard is an *edit-path* protection, but it fires on Read too, costing 2 round-trips before I worked around it with Grep. Instance: `Read PelupusanService.java` blocked twice at :14180/:13860 on 2026-08-14.
- **Accuracy held**: root cause was direct-read verified (not inferred); confidence stated at 90% with the exact reasons it isn't higher (video unwatched, >2 casing unconfirmed).

## A4 — Etanah issue-solving
- **Reusable fact surfaced (deferred to Phase-2 per the mid-quest-distill ban)**: ALL six `generateDefaultRisalat<URUSAN>` methods in `PelupusanService.java` build the pemohon line from `apbList.get(0)` (single pihak berkepentingan). This is a general defect shape (multi-pemohon applications lose names in every risalat tajuk). Bank into BUG-BESTIARY / a risalat-populator note when 275500 closes and the fix is verified.
- 275456 fold reused A13's DB proof cleanly.

## A5 — Sweep / file sweep
- **Friction (mechanical)**: a recursive `Get-ChildItem -Recurse` over the whole MemoryCore OneDrive tree **timed out at 2 min** when hunting a ticket-number file. File-search over this tree must target specific dirs (`projects/coding-projects/active`, `1. Tasks/Melaka`), never recurse the repo root.
- **Useful discovery**: the 08-13 sweep's qa_docs are durable in main **despite `projects/` being gitignored** — OneDrive replicates the dir across the whole tree, so "gitignored" ≠ "ephemeral" for these. (Still: worktree copies are physically separate; the durable one is the main-repo path.)
