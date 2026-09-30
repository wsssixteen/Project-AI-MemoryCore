---
name: system-fix-universal-rule
description: "🚨 Fixing miya's system (MemoryCore gate/skill/rule) = UNIVERSAL rule, never keyed to one ticket/tugasan/urusan; load system-rules + system-design BEFORE any design or audit"
metadata:
  node_type: memory
  type: feedback
  originSessionId: d974ff8f-3f5a-4c2e-8608-d3c38130d7c0
  modified: 2026-09-30T09:37:06.045Z
---

When a slip is turned into a system fix (gate, skill, hook, rule, audit), the fix MUST be a universal rule that covers the whole class — never a check keyed to the ticket that exposed it (no tugasan kod, urusan, constant map, or form name as the trigger or the test).

Before proposing ANY design, option list, or audit of the system: invoke `system-rules` and `system-design` via the Skill tool FIRST. Options offered before those load are invalid.

**Why:** 2026-09-30 (#256334 follow-up) — designed submit-path-gate and offered choices without loading either skill, and proposed a static check on TKPDBB / PENYEDIAAN_DOKUMEN_MODE_MAP. miya had asked for both disciplines many times; escalated. Ledger: `design-not-universal`.

**Enforcement (this memory is only the record):** `domain/design-consult-gate/proposal-judge.js` Stop side blocks a system proposal with no consult or no clean `UNIVERSAL:` line (eval `design-consult-gate.eval.js`).

**How to apply:** test every proposed check with "would this fire for a different screen, urusan, state, and module with the same failure shape?" If no, it is ticket-specific: generalize the predicate (e.g. "a removed UI element is still read by the screen's save/submit path") before offering it. Ticket details go in the eval fixtures, never in the rule. Related: [[design-from-architecture]] [[inventory-first]]
