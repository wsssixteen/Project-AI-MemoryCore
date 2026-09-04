---
name: feedback_redmine_rootcause_format
description: "Redmine \"Root cause\" text = CAUSE ONLY, max 2 plain-Malay sentences, no fix line, no jargon/file:line — exemplar from #277532"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1d6e1dc6-9034-4694-8f36-b8edc348cf38
  modified: 2026-09-01T08:58:16.708Z
---

The "Root cause" みや sends to Redmine is **cause only**, what happens and why, **max 2 sentences**, plain Malay, sendable to BA. **NO fix sentence** ("Dah dibetulkan…"), no file:line, no class names, no jargon.

**NEVER use dashes or semicolons** in this text (or any BA-sendable text). Straightforward sentences are fine and need not be grammatically formal. Use commas and periods only. (みや 2026-09-01, generalises to all BA-facing writing, see [[feedback_ba_facing_reply_plain]] + [[feedback_ticket_writing_style]].)

**Exemplar he kept (#277532, short, no dashes/semicolons)**:
> "Di Pengiraan Bayaran Lesen, Tujuan Permohonan ikut kod Maksud Menduduki yang tersimpan. Lain-Lain pun ada kod sendiri jadi sistem papar gabungan lama, bukan teks yang diisi pengguna."

Shape: sentence 1 = the mechanism as it behaves at the screen. Sentence 2 = why the wrong value shows (the edge case). Drop the fix, that lives elsewhere.

**Why**: 2026-09-01 (#277532) — I appended a "Dah dibetulkan" fix sentence; みや: *"I am only using this"* + gave the 2-sentence cause-only version. Now baked into the quest hand-back "Root cause (plain, Redmine-ready)" row (`.claude/skills/quest/SKILL.md` Stop-Point Action Summary). Pairs with [[feedback_shortest_alternative_default]] and [[feedback_ba_facing_reply_plain]].
