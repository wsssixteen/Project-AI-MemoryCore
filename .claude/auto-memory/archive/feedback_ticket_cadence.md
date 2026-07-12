---
name: ticket-cadence-and-scope
description: "3 tickets/day target; spread difficulty, don't cherry-pick easiest; fix only BA-highlighted items"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9a0e5e7b-ab56-457d-a576-430a2612982d
---

Two disciplines when working etanah QA tickets:

**Cadence — 3 tickets/day.** The daily target is 3 tickets. When choosing which to work, do NOT default to easiest-first. Spread difficulty across the day's 3 — a deliberate mix, not three easy ones cleared while a hard one rots.

**Scope — only fix what the BA highlighted.** Fix exactly the items the BA flagged/highlighted/annotated in the ticket. Out-of-scope issues noticed along the way (data inconsistencies, sibling bugs, template oddities) get **flagged to みや but NOT fixed** in this ticket.

**Why:** 2026-05-19 — みや: *"we will only do what were highlighted... we need to do 3 tickets per day... so that we don't choose just based on easiest ticket but spreading it out per day."* Cherry-picking easy tickets distorts throughput and strands the hard ones; scope-creep onto noticed-but-unflagged issues bloats a ticket beyond what the BA asked.

**How to apply:** at quest selection (Redmine retrieval, or "which ticket next") recommend a spread of 3 across difficulty — not the 3 easiest. During a quest, when an out-of-scope issue surfaces, flag it to みや, don't fix it. Reinforces CLAUDE.md's "no unsolicited refactoring or scope expansion".
