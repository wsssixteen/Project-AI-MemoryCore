# Power: verify-basis-gate

**Stop hook.** Blocks a claim of having VERIFIED something ("from … evidence", "I checked the flowables/code/DB", "I confirmed by reading X") made with **ZERO tool calls that turn** — i.e. the basis was never performed.

- **Closes:** 2026-06-24 — claimed L7-9 "from workflow evidence" while never reading the BPMN (a lie みや named).
- **Mechanism:** scan last assistant text for a verification-basis phrase; count `tool_use` since the last user message; phrase present AND zero tools → BLOCK (run the check, or downgrade to an explicit hypothesis).
- **Bypass:** `[skip-verify-basis: <where it was actually verified>]`.
- **Contract:** see `verify-basis-gate.discipline.hook.js` header.
- **Log:** `log.jsonl`. **Registered:** settings.json Stop.
- **Eval (2026-06-24):** PASS — blocks claim-with-zero-tools; allows claim-with-a-tool.
- **Sibling of `veritas-claim-gate`** (which catches behavioural/external claims); this catches *verification-basis* claims.
