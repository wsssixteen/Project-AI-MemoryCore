---
name: appraise
description: Use when a plan/rule/file/approach needs review before commitment — the ASCR loop (Appraise · Scrutinize · Check-missing · Refine), self-answered with evidence. Triggers — "/appraise", "appraise this", "scrutinize", "check if there's anything missing", "refine it", "go through X and refine", "stress-test the plan", "pressure-test", "challenge this plan".
allowed-tools: Read, Grep, Glob, Bash
---

# /appraise — ASCR Review Loop

> Appraise · Scrutinize · Check-missing · Refine — run on a plan, rule-file, skill, or approach BEFORE committing to it.
> Simplified 2026-07-02 per みや from the 9-question Socratic protocol: the 4-verb loop is the default; the old axes survive as the Scrutinize vocabulary.

## The loop (self-answered — evidence per cell, never questions back at みや)

| Step | What I do | Output shape |
|---|---|---|
| **A — Appraise** | name the subject's load-bearing assumptions + their evidence AGE (stale evidence = finding) + the silent-failure mode (how it fails with no error) | 3-row table |
| **S — Scrutinize** | per claim/rule: verdict `proven / plausible-keep / stale-drop / unverified-soften` — each backed by a cite, test result, or observation | per-claim table |
| **C — Check-missing** | gap sweep vs TODAY's reality: what does the subject not cover that current work already needed? each gap cites the incident that proves it | gap table (`# · gap · proven by`) |
| **R — Refine** | APPLY the refine in place (merge-in-place, pointers not duplicates per File Ownership) + version-stamp + commit; show the change table | edited file + verdict |

**Verdict line**: `PROCEED / PROCEED WITH CAUTION / STOP AND RETHINK` + 1 sentence.

## Scrutinize vocabulary (the old 3 axes, kept as checklists — consult, don't recite)

| Axis | Checks |
|---|---|
| Assumptions | most load-bearing? evidence current or pattern-matched? silent-failure mode? |
| Scope & blast radius | explicit vs implied scope · who else calls/reads the thing (grep callers · XHTML bindings · urusan/tugasan contexts · cross-module etanah-awam↔pelupusan shared refs) · is there an 80/20 smaller version? |
| Evidence quality | per claim: proven (test/query/breakpoint) vs hypothesis · weakest step · does the 2-sentence colleague-summary match what it actually does? |

## Rules

- Self-answer everything with evidence — asking みや the 9 questions is the OLD mode; only surface a question if it is a genuine みや-decision (destructive / preference / external fact)
- Banned vocabulary: "this should work", "it's straightforward", "obviously", "of course"
- R (Refine) is part of the loop by default — an appraisal that ends without applying (or explicitly parking) the refine is incomplete
- Quick mode: for a small decision, compress to 1 row per step + verdict line

---

*Skill version: 2.0 — 2026-07-02 per みや: restructured to ASCR 4-verb loop, self-answered; validated live on `.claude/cost-efficiency.md` v2 refine. Prior: 1.1 (9-question Socratic interrogation, created 2026-04-20, blast-radius expanded 2026-04-24, salvaged 2026-05-19).*
*Invoked via: `/appraise` or `/appraise <subject>`*
