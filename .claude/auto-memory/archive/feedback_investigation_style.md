---
name: feedback_investigation_style
description: High-level (what/conclusion) FIRST, technical-level (reasoning/chain/refs) AFTER — universal across all explanations, not just code investigations
type: feedback
originSessionId: 2d6b5b34-1a73-4255-9713-7b3e34579056
---

## Universal principle (refined 2026-05-12 by みや — generalized from code-only to all topics)

**Two layers of explanation, applied in this order:**

1. **High-level layer (what / conclusion / fix / outcome)** — plain everyday language, no jargon, no file:line, no boolean logic. This is what みや reads first. Should stand alone as a complete answer for casual context.
2. **Technical layer (reasoning chain / file:line refs / conditions / evidence / how-I-got-here)** — appended AFTER as a "Tracing note" or supporting block. This is what みや consults when he wants to dig in or verify.

**Default ratio**: high-level should be 1-3 sentences (or table cells with plain text). Technical layer can be as long as needed — but only after the high-level conclusion is delivered. Never embed technical detail mid-explanation as parenthetical/em-dashed asides.

**Failure mode** (named 2026-05-12): "**audit-prose**" — packing every sentence with claim + evidence + qualification + caveat, as if every clause needs to defend itself. This is appropriate for design memos, Recon blocks, post-mortems (formal audit artifacts). It is **wrong** for everyday "what changed?" / "explain X to me" questions. みや 2026-05-12 QA-260179 Q2: when I explained the `addStatusFolder` change via a table whose cells were dense, multi-clause technical sentences, the table form didn't help because each cell was still audit-prose. The two-layer separation must apply WITHIN cells too — plain idea first, technical reasoning if needed in a separate row or section below.

**Mode selection (deliberate, not automatic)**:
- **High-level-first mode** (default): everyday Q&A, status updates, "what changed?", briefings, summaries, rule-baking explanations.
- **Audit-prose mode**: explicitly named artifacts — Recon block, Predicate Box, Design Memo, post-mortem entry, Phase 2 Reflect. These have formats that REQUIRE dense evidence-density.

If a response could be either, default to high-level-first. みや asks for "go deeper" / "audit-level" / "show evidence" when he wants the second layer.

## Code investigation (original 2026-04-22 scope, still valid as a specific application of the principle)

When tracing through code across classes and layers:
- High-level: state class + method + what it does → conclusion → fix
- Technical (at the END as a "Tracing note"): path taken (layer → layer, class → class)
- Format: `Traced: Button (XHTML) → onSimpanJPPH() [MlkUlasanJPPHForm.java] → saveMaklumatJPPH() [PelupusanService.java]`

This lets みや learn the pattern without it interrupting the main flow.

## Domain-by-domain discipline (added 2026-04-22)

Explore one domain at a time. Confirm what you found before moving to the next. Don't jump layers speculatively. Check our path at every step — if a search returns unexpected results, pause and confirm with みや before continuing. This prevents rabbit holes and makes resetting easier.

**Why (2026-04-22):** Multiple sessions showed pattern of jumping between layers without confirming assumptions, missing obvious signals (like "breakpoint never hit"), and building on unverified claims. みや had to repeatedly pull investigation back on track. Domain isolation + step-checking keeps each finding solid before the next move.

## Why this rule is universal, not code-only (added 2026-05-12)

The same separation applies to: rule changes, system audits, retrospectives, ticket discussions, tradeoff analyses, post-mortems, KPI reports. みや's framing 2026-05-12: *"A more encompassing rule I've already set is to separate between high level and then technical. That is why I was calling for a separation and to make it universal. Not just the table thing I mentioned on improving."*

The "show-first table" rule (personality.md 2026-05-12) is a tool for the high-level layer when concrete refs help. But the table itself must follow this principle: cell content is plain at the high level, technical detail appended below or in a separate section. A table full of dense audit-prose cells defeats the purpose.

**Linked to:** みや's goal of learning by reading the high-level pattern first, then drilling down only when curious — same teaching shape that works for JSF tracing also works for protocol changes, system fixes, and everything else.

## Strengthening 2026-05-13 — explanation never starts with a table

みや (xth time reminded): *"I preferred the first explanation about Dun when in line format even though it could've saved time by creating table. I like it because it uses plain words, then show where. Please Refine this. You could've just used table to explain simply in one column & show which table.column or class.name straight away."*

**Tightened rule**: Tables NEVER replace prose. Every explanation answer opens with **1-2 plain-language sentences** describing the WHAT and the WHY in everyday words (no jargon, no `∉`-style symbols, no file:line cites in the lede). THEN tables/lists/code-cites can follow as supporting evidence.

**Self-check before emitting any explanation**: Is the first thing みや reads a sentence in prose, or a table-header line (`|...|...|` or `:--:`)? If table-header → restructure: write the 1-2 prose sentences first, drop the table beneath.

**Cumulative slip count**: at least 4-5 times across 2026-04-22 (original code-tracing scope) → 2026-05-12 (universal generalization) → 2026-05-13 (xth-time reminder + tightening). Recurring root cause: I treat tables as a "structured" alternative to prose, when みや treats them as a "supporting" addition. Different mental model — the rule documents みや's.

## Arrow-flows and diagrams alongside tables (added 2026-05-13)

**Default to tables AND arrow-flow diagrams together** for any explanation involving sequence, layering, dispatch, or path. Tables alone don't show flow; flows alone don't show parallel data. Use both when both help.

Arrow-flow formats:
- Class chain: `ClassA.method() → ClassB.method() → ClassC.method()`
- Read order: `Description.txt → History.txt → cycle boundaries → BA-flagged items`
- Phase flow: `Phase 0 (Scout) → Phase 0 (Recon) → Phase 1 (Apply) → Phase 1 (Verify)`
- Decision flow: `Trigger fired → Predicate Box emitted → Edit applied → Re-verified`

**When to use which** (mode selection):
- **Sequence / order / dispatch / path** → arrow-flow (with table if multiple parallel rows)
- **Parallel attributes / per-item details** → table
- **Both at once** → table where one column is the arrow-flow string (common in Recon, Phase 2 Refine pass, class chain traces)
- **Plain narrative** → prose (1-2 sentences before any structure)

**Why** (2026-05-13 みや): *"I thought I already asked you to add this to the highest level. To always use tables & diagrams (which includes arrows/flows aside from the ASCII draw thingy) as often as possible, as in many situation as you can."* The class-chain arrow style (`A → B → C`) was praised earlier and partially adopted, but only for code tracing. Generalising: arrow-flows apply to ANY sequence/order/dispatch explanation, not just code paths.

## 🆕 DB-data SHOW rule — a data-touching code change MUST come with a query (added 2026-06-22 by みや)

**MANDATORY**: whenever I discuss or make a code change that reads / writes / filters / matches / deletes DATA (e.g. `filteredVplList.removeIf(v -> v.getVersiDok() == 0)`), I MUST also provide a **runnable SQL query** that shows WHERE that data lives + the columns involved, so みや can inspect the actual rows. **Why**: みや sees code diffs in SourceTree (highlighted), but DB state is INVISIBLE there — he needs to be told exactly what to query to see the versions / the filtered column / related records. **How to apply**: alongside the change, emit a `SELECT … FROM <schema>.<table> … WHERE <key> ORDER BY …` that surfaces the exact rows the code operates on. **Banned**: discussing a data-touching code change with no companion query. This is the runnable form of the §3 `UI → code → table` arrow (the "table" leg made executable).
