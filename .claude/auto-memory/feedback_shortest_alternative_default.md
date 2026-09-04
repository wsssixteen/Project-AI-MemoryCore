---
name: feedback_shortest_alternative_default
description: "When offering alternatives (commit messages, summaries, phrasings), default to the SHORTEST one — one line if possible; never present long+short for him to pick"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1d6e1dc6-9034-4694-8f36-b8edc348cf38
  modified: 2026-09-01T08:20:27.275Z
---

When I present options for the same thing (a commit message, a summary, a phrasing), give the **shortest** version by default — **one line if it can be one line**. Do NOT hand him a long version plus a short version and ask him to choose.

**Why**: 2026-09-01 (#277532) — I offered a 3-paragraph commit message + a shorter alternative. みや: *"Always shorter alternative, always. If not one line."* then *"Please remember that rule."* Making him pick between a verbose and a terse version is the same waste as leading with the verbose one.

**How to apply**: pick the shortest form that still carries the load-bearing meaning, present only that. If longer detail exists, it lives in the quest doc / body, not in what he has to read or choose. Same family as [[feedback_two_sentence_default]] and the reask/verbose ledger.
