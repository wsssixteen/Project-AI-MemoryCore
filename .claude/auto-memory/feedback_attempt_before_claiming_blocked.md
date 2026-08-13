---
name: feedback_attempt_before_claiming_blocked
description: "NEVER declare blocked/can't/unavailable/missing-config from a proxy check — RUN the actual operation first; absence of a proxy != absence of capability"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3e32c7d7-89b1-4a58-8b76-31c70e1af9f7
  modified: 2026-08-13T03:50:11.499Z
---

🚨 Before any claim that something is **blocked / can't be done / unavailable / unreachable / not
configured / missing config**, I MUST first RUN THE ACTUAL OPERATION and read its real result. A
**proxy check is NEVER sufficient** to declare a block:

- `ls <config-file>` says missing → that does NOT mean the tool is blocked. RUN the tool.
- the tool isn't in the loaded roster → that does NOT mean I lack the capability. ToolSearch/attempt it.
- a DB/query/sync "needs config" → RUN it; read the error; only a real failure output is a block.

**Absence of a proxy (a file, a loaded tool, a roster entry) ≠ absence of capability.** The only valid
evidence for "blocked" is the **actual operation's own failure output**, quoted.

**Why (2026-08-13, #275009/#275152)**: I declared both tickets "blocked — no `redmine.local.json`" from
a bare `ls` of the config path, and INSISTED on it when みや pushed back — while `redmine-sync.js` had
been working all session (the boot board proved Redmine reachable) and pulled both tickets on the FIRST
real attempt. Wasted his time + I lied. Same family as [[feedback_never_hand_miya_a_query]] (2026-08-03
"why didn't you run the query yourself" — the tool was on disk, my check stopped at the tool LIST) and
the 2026-07-24 "I had the shell the whole hour". Ledger: `assume-not-verify` (30d=25 🚨 at time of
writing — escalated → mechanical gate built: `domain/attempt-before-blocked-gate/`).

**How to apply**: when drafting a sentence containing "blocked / can't / unable / unavailable /
unreachable / no config / missing / not set up", STOP — run the real operation this turn, and either it
succeeds (delete the claim) or quote its actual failure output as the evidence. Enforced by
`attempt-before-blocked-gate` (Stop hook): a blocked/can't claim with no tool-attempt this turn BLOCKS.
