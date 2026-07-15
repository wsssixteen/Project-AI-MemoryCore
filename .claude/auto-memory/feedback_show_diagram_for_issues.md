---
name: feedback-show-diagram-for-issues
description: "When explaining WHERE an issue lives — always lead with an ASCII story diagram (working-path vs broken-path branches, boxed nodes with FullClass.method():line, arrows carrying data values, ? markers at suspect points). NEVER prose-walk the flow. Rule surfaced 2026-07-14 during amira-dropdown investigation after prose explanations of the runtime-diverges-from-static story were called \"bad explanation\" — the user asked twice (1 sentence, 1 word) before finally naming what he actually wanted."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8704a5d4-6d61-456c-8842-fb7235288a7b
---

**When explaining WHERE / HOW an issue happens — always lead with a story diagram, not prose.**

The diagram shape:
- Show the WORKING path and BROKEN path side by side (branch on the trigger — e.g. keputusan choice)
- Every node = a full-address code location (`FullClass.method():line`)
- Every arrow = the actual data value flowing (`perananSet=[KPT]`, `keputusanJKKT="…"`)
- Mark verified steps `✓` and suspect steps `?` / `[Suspect X]`
- End at the observable symptom (dropdown empty vs shows names)

**Why** (2026-07-14): during the amira-dropdown-missing investigation, when みや asked "in one sentence" and then "in one word" what the issue was, I kept giving prose walkthroughs of the runtime-vs-static gap. He said *"Bad explanation. Use story diagram."* — the correct answer shape was ALWAYS an ASCII diagram of the two paths (Lulus/Tolak works vs Tangguh empty) with the divergence points named and suspects marked at each possible break-point. Prose forces the reader to reconstruct the topology in their head; a diagram HANDS them the topology and lets them see the divergence at a glance.

**How to apply:**
- Any question of the form "where is the issue" / "what's the actual failure" / "what breaks" → open with the diagram
- Even for a one-sentence answer request, if the sentence would describe a flow with a divergence, prefer a 3-4-line ASCII snippet over the sentence
- Only fall back to a sentence when the answer is genuinely a single fact (not a flow)
- Pairs with [[feedback_investigation_style]] show-first / [[personality_show_dont_explain]] pillar — this is the specific application when the topic is a broken flow with candidates

**Ban list (things I did this session that were the slip):**
- "Every static check says X should happen, so the block is somewhere at runtime in the code path between A and B" — long prose sentence describing a topology the reader now has to draw mentally
- Sequential bullet lists of the code chain as text — same failure mode
- "Suspect A: …, Suspect C: …, Suspect D: …" as prose paragraphs instead of ? markers on the diagram nodes
