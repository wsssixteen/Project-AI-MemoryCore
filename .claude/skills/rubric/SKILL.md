---
name: rubric
description: ABSORBED 2026-05-28 (Phase 4 of plan cached-floating-hummingbird.md). This skill is a redirect stub with auto-decay 2026-06-07. Triggers still route here so misroutes don't 404 — but the actual procedures live in their proper homes. Triggers — "rubric this", "rubrik", "evaluate options", "weigh candidates", "which option", "rank these", "review this code", "scrutinize the fix", "appraise this", "code review", "blast radius", "multi-perspective check", "review my implementation".
metadata:
  type: redirect-stub
  absorbed-date: 2026-05-28
  decay-date: 2026-06-07
  origin: "Phase 4 of plan cached-floating-hummingbird.md — recognized rubric was a workflow phase name, not a discipline primitive. Three distinct use-cases mashed under one word; each now lives in its proper home."
---

# /rubric — ABSORBED (this is a redirect stub, decays 2026-06-07)

The standalone `rubric` skill is being absorbed. The three use-cases that lived here have proper homes:

## Use-case routing

| If you wanted... | Use this instead |
|---|---|
| **Option-ranking** (A vs B vs C fix shapes + pros/cons + recommendation) — "rubric this", "weigh candidates", "which option", "rank these" | **Quest Rubric phase** (workflow checkpoint at Phase 1, see `quest/quest-protocol.md` Rubric row). The phase fully owns option-ranking. |
| **Multi-perspective scrutiny** (single implementation, 6 lenses: Correctness / Completeness / Blast-radius / Edge cases / Thread-safety / Backward-compat) — "review my implementation", "scrutinize the fix", "blast radius", "code review", "multi-perspective check" | **Quest Rubric phase's Multi-Perspective Scrutiny Table** (mandatory for non-trivial change, per Phase 4 expansion). For non-Quest moments, invoke `→ Skill: system-design` Step 6. |
| **Plan / decision stress-test** (Socratic) — "appraise this", "grill me", "stress-test the plan" | `→ Skill: appraise` (9-question interrogation across Assumption / Scope / Evidence axes) |
| **Single-claim proof** (TRUE IF / PROVED BY / FAILED WHEN) — pre-Edit during debug | `→ Skill: predicate-box` |
| **Post-grep judgment** (Proves / Negative / Next) | `→ Skill: grep-rubric` |

## Why absorbed

`rubric` was hoisted as an atomic discipline primitive in Phase 3 of the meta-layer build (2026-05-23). On reflection during this session's /grill-me audit: **rubric is a workflow phase name, not a primitive**. It conflated three distinct moments with different shapes. The Quest Rubric phase IS the canonical home for option-ranking and multi-perspective; the standalone skill was the architectural mistake.

Net: 30 skills → 29 after decay completes 2026-06-07.

## Decay enforcement

`.claude/hooks/worktree-cleanup-boot.js` checks decay dates at boot. From 2026-05-31 onward (3 days before decay), boot will flag this stub as "expired soon — final cleanup required." On or after 2026-06-07, the directory should be removed entirely + triggers absorbed into target homes' description blocks.

## Until decay

This stub satisfies INV-4 (every `→ Skill: rubric` token in protocols/skills points to an existing SKILL.md). The skill remains invocable; it just redirects.

If you invoke `/rubric` between 2026-05-28 and 2026-06-07, you'll get this routing table. After 2026-06-07, the skill should be gone.
