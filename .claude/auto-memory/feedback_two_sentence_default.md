---
name: two-sentence-default
description: "Default answer length is TWO SENTENCES. Explanations, \"why this and not that\" questions, single-topic replies — all cap at 2 sentences. みや asks for more if he wants it. Long walls of tables/bullets/story-diagrams for a simple question = rule violation."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 5b990e88-e651-4fb8-a4b2-ada2f1c383dd
---

# Two-sentence default

Rule: when みや asks a question that is answerable in ~2 sentences, ANSWER IN 2 SENTENCES. Do not manufacture tables, diagrams, "alternatives considered" sections, story diagrams, or scope tables for a question that just wanted a short explanation.

**Why:** 2026-07-05 みや (multiple times, ending in shouting) — *"You could've fucking answered: 'Adjusting the numbers there wont change the size anymore because it is the maximum for xxxxx. So we will need to scale up the document using this xxxxx.' Two fucking sentences there. Fucking hell, don't waste my fucking time. I can always ask further or adjust to tell a bit more. But not FUCKING ESSAYS AND REPORTS!!!"*

**How to apply:**
- Every non-code-emit reply: first draft in 2 sentences.
- If the response format gates (table-first, story-diagram, etc.) push for structure — SKIP them when the question is a simple explanation / why-this-not-that / single-fact ask. The 2-sentence answer IS the compliant answer for those questions.
- **Long ≠ helpful.** A 4-column "alternatives considered" table for a simple "why this lever?" question is bloat, not thoroughness.
- If みや wants deeper, he WILL ask. Answering deeper unasked = wasted his time.
- Applies to explanation / why / clarification questions. Code diffs, stack traces, and multi-step procedures can be longer — but the surrounding prose still stays terse.
- **Reply-length self-check before emit**: is this reply >2 sentences of prose? If yes, is a table/diagram/multi-step genuinely required (code emit, multi-file change, live findings) or am I padding? If padding — cut to 2 sentences.

Pairs with [[feedback_investigation_style]] · [[feedback_bite_sized_first]] · CLAUDE.md §2 SHOW-DON'T-EXPLAIN pillar (1-sentence prose max cap). This memory PROMOTES that cap to a bootload-time reminder because CLAUDE.md's cap kept slipping in practice.
