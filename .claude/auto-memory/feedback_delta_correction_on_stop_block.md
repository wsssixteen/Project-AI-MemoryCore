---
name: delta-correction-on-stop-block
description: "Stop-hook block → emit ONLY the delta (bypass token / missing line), NEVER re-emit the reply; hook noise never narrated"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b7adab82-50d9-4567-bef6-aa285ea8b892
  modified: 2026-08-16T06:59:57.517Z
---

🚨 When a Stop hook blocks a reply that was already shown to みや: the correction turn is a DELTA — the bypass token and/or the one missing element only. Re-emitting the table/diagram/summary a second time is BANNED. Likewise: hook advisories that change nothing get zero narration in the reply.

**Why:** 2026-08-16, みや (via /i-have-adhd): "this part where you repeat yourself… the hook's result sometimes doesn't make much difference, it is also wasting tokens, you output double unnecessary into conversation." Same complaint as 2026-07-28 ("This is so fucking stupid — isn't it supposed to be an instruction BEFORE you reply?"). He reads the same content 2-3× per session; the gates built to stop verbosity are manufacturing it.

**How to apply:** (1) On any Stop-block: assume みや already read the reply; output `[token] + one-line fix` and end. (2) Never restate a blocked reply's content "with the fix applied". (3) Architectural cure = todo.md Q1 row 42+44 / Scope D1 design pass ([[feedback_two_sentence_default]] is the sibling rule for first-emit length).
