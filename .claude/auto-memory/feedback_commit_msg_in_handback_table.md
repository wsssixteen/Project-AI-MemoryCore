---
name: feedback_commit_msg_in_handback_table
description: "At any commit / deploy prep hand-back, the DRAFTED git commit message MUST appear in the review table itself (a row) alongside branch + staged files — never described in prose or omitted; みや reviews the commit comment as usual and needs it visible in the same table"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d6617a39-e51c-4896-939d-62e88a55fe11
  modified: 2026-08-27T08:12:50.306Z
---

🚨 **TRIGGER = emitting a ▶ YOUR MOVE / test-scenario hand-back for a fix that will be committed/deployed.** That SAME table gets a **`Commit message`** row (the drafted subject-line, per commit-conventions), sitting with the test-data / branch rows. みや reviews the git comment in the test-scenario table itself — never in separate prose, never omitted.

**Table shape (commit prep)**:

| Item | Value |
|---|---|
| Branch | `mlk/<tracker>/<num>` |
| Staged | `<file>` (1-line what) |
| **Commit message** | `<the exact subject-line, per commit-conventions>` |

**Banned**: showing the staged diff without the commit message · describing the message in a sentence instead of a table row · asking "ready to commit?" without the message shown.

**Why (2026-08-27, per みや)**: I staged the pelupusan fix and showed the diff but omitted the drafted commit message from the hand-back table — みや reviews the comment every time and had to ask for it. Pairs with [[feedback_de_disposition_table]] + the quest skill Stop-at-stage gate.

enforcement: memory-only (reply-composition layout — the "commit message in the same table" requirement is a judgment/style call, not mechanically detectable from a hook)
