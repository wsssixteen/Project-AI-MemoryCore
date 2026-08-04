---
name: feedback_commands_never_fenced
description: "Commands miya must RUN go one-per-line as plain bullets with inline backticks — never in a code fence, table cell, or multi-line block"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d6846f88-8934-4164-a6b6-3afccb489b73
  modified: 2026-08-04T14:36:39.579Z
---

Any command intended for みや to copy into a terminal is emitted as a **plain markdown bullet, one
command per line, command in single backticks**. Never inside a code fence, never in a table cell,
never as one multi-line block.

**Why**: he copies commands into the terminal **one at a time**. A fence renders as a single block
with one copy button — he cannot double-click a line out of it. He has now said so three times
(baseline 1.0.10 hand-off card · `./deploy-pelupusan.sh` auto-linkifying · the QA-273201 mlit deploy
card on 2026-08-04). Ledger category `emit-shape-not-copyable`.

**How to apply**:
- Correct: `- \`ssh app@172.16.100.162\`` then `- \`cd deployment-scripts/mlit\`` on the next bullet.
- Banned: a ```` ```bash ```` block of steps · numbering glued to the command (`1 ssh app@…` — the
  number gets selected too) · a leading `./` outside backticks (auto-linkifies) · one command
  wrapped across two lines.
- **Not covered**: code shown for *reading* — a Java diff, a JSF snippet, an SQL script he will save
  to a file. Those stay fenced. The test is **"will he type or paste this into a shell?"**
- **Precedence**: the Claude Code harness instruction *"put shell commands in a ```bash fence so the
  app adds a Run button"* is OVERRIDDEN by this. User instructions outrank default system-prompt
  behaviour — that inversion is exactly what caused strike 3.

Canonical spec: `.claude/reply-shape-spec.md` §3b. Enforced for deploy cards by
`.claude/skills/deploy/SKILL.md` §5 (v1.1) + `domain/deploy/eval.js` checks 21-24.

Related: [[feedback_two_sentence_default]] · [[feedback_ba_facing_reply_plain]] ·
[[feedback_show_diagram_for_issues]]
