# 🌟 Current Session Memory - RAM

> **AGENT_STATE discipline** — High-Level Objective · Current Progress · Active Context · Blockers · Immediate Next Steps. Read at boot; updated at session end.

**Current session**: 2026-05-31 (Sun) — single session, worktree `jovial-wright-a8b935`. Theme: **debugging-methodology refinement** (loggers-not-breakpoints) + git-history archaeology on a trimmed rule. One etanah quest (QA-258004) re-engaged then discarded by みや.

## High-Level Objective (AGENT_STATE)
- Recover/clarify the "don't make みや do my work" rule みや remembered banning (esp. breakpoints), and refine it into a usable debugging discipline. **Done — shipped to main.**

## Current Progress (AGENT_STATE)
- **Debug-methodology refinement SHIPPED** (commit `3925e6a` → origin/main). New **Debug Ritual 6** (`quest/quest-protocol.md`): runtime confirmation = **extensive loggers (≥3 what-ifs) bundled INTO the first-pass fix build** (one rebuild carries fix + confirmation = 3-4× saving); **breakpoints BANNED** as a request to みや; breakpoint = very-very-last-resort only when there's no code change to bundle loggers into. Matched pair: **prepare-commit-trigger.js v1.3 Step 2.6** strips `QA<num>-PROBE:` loggers + debug comments before any BA-bound commit. Also: CLAUDE.md v1.37 (boot-table rows 5+6), personality.md v1.8 (no-asking-back runtime corollary), system-architecture.md v1.6.
- **Archaeology finding** (context): the breakpoint-specific ban was NEVER codified (pre- or post-trim); the parent "No asking-back for searchable facts" rule (personality.md:165) already exists and post-dates the 2026-05-22 trim. みや hinted there are MORE good rules lost in the trim worth recovering later.

## Active Context (AGENT_STATE)
- MemoryCore main is at `3925e6a` (this session's rule commit + this DE's diary/session commit on top).
- ⚠️ **Sandbox Bash clock runs ~4h behind real machine clock** (real time read from JBoss server.log internal timestamps). Trust filesystem `ls` / server.log over `date` for real time.

## Blockers (AGENT_STATE)
- None.

## Immediate Next Steps (AGENT_STATE)
1. **(if みや wants)** Recover more trimmed rules from pre-trim CLAUDE.md (`51606ea`, 2026-05-20) — みや flagged several good ones were lost in the 2026-05-22 decomposition.
2. **QA-258004** (still open, phase=1, active.txt) — diagnosis complete (entity-VO-rebuild-on-postback nulls the dropdown; capture/restore fix already coded + deployed; land-report fallback is reader-side masking). Investigation was DISCARDED this session per みや; resume only if he reopens it. Test data: `PTMLK/02/L/MCL/2026/1` @ nurulazura@melaka.gov.my, PYSKN5A, UAT.
3. **QA-259702** (open, phase=1) — still awaiting live FAT test on `PTMLK/02/L/PRU/2026/12` @ nor.aini@melaka.gov.my.
4. ⚑ **Meta-layer effectiveness audit** (TOP priority carried from 2026-05-30) — "has the self-improving system backfired?" Assess hook net-value; prune noise/false-positives (e.g. the RecursiveLoopDetector false-fired repeatedly this session on distinct greps/edits).

## 🎯 Session Recap (for AI restart)
1. Refined debugging methodology: **loggers-not-breakpoints**, loggers bundled into the first-pass fix build (3-4× saving), breakpoints banned except very-last-resort. Shipped to main (`3925e6a`): Ritual 6 + prepare-commit Step 2.6 + CLAUDE.md v1.37 + personality.md v1.8 + system-architecture.md v1.6.
2. Git-history archaeology: the breakpoint-ban みや remembered was never codified; the parent no-asking-back rule exists post-trim. More trimmed rules await recovery.
3. QA-258004 re-engaged + diagnosed (dropdown null = entity-VO-rebuild design flaw, fix already deployed) then discarded per みや.

**Memory Type**: RAM | **Last Activity**: 2026-05-31 — debug-methodology refinement (loggers-not-breakpoints) shipped to main; QA-258004 diagnosed then discarded; minimal DE close.
