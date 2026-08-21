---
name: feedback_ticket_writing_style
description: "How miya writes ticket/handoff explanations - short plain sentences, no technicals, warm close. Use MANDATORY when preparing ticket text OR explaining anything inside a ticket to BA/another team."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8396324f-083e-49c7-a0cc-838d559ec328
  modified: 2026-08-21T12:12:17.088Z
---

**When preparing ticket text, or explaining inside a ticket, write like miya writes - not like an AI.**

**Why:** BA and other teams do not know technicals. AI-style wording (DB-proven, file:line, "the constant does not exist yet", sudden CAPS) confuses them and wastes miya's time editing it.

**How to apply - the shape (from miya's own example, #276436):**
- Short simple sentences. One idea per line.
- Plain words. No file names, no line numbers, no code names, no jargon.
- Normal human tone. Warm. No caps for emphasis. No "AI explaining".
- Order: what we fixed + where to test it -> what is still broken + which side does not do it -> what DOES work (the comparison) -> what will show once the condition is met -> "Attached are the fixes required for X to check further." -> "Thank you."

**miya's verbatim example (this IS the target voice):**
> For Keluasan Tanah Dipohon I have fixed on our side & can be tested on internal.
> But for PPTPB, Tujuan Permohonan, Perserahan Kaunter does not save them.
> For PRBB & PRU it is saved.
> Kategori Tanah will show if we have the Tujuan Permohonan.
> Attached are the fixes required for SPOC side for them to check further.
> Thank you.

**Banned in ticket text:** "DB-proven" / "verified" / file:line / class names / JSON keys / method names / CAPS-for-emphasis / long sentences / more than one idea per line. Keep the technical detail inside the attached files, never in the message.

**At ticket close / "test passed" / after a confirmed push:** emit the plain close message (above) PLUS the git commit-reference block. Generate the block with `node domain/ticket-close-block/ticket-close-block.js --repo <path> --ticket <num> --module <pelupusan|awam>`. Module rule: AWAM = branch only (another team merges PROD); pelupusan = branch + merged to mlk/int-env (we deploy PROD, BA tests int-env). Do not hand-type the block.

Related: [[feedback_cross_module_handoff_artifact]] · [[feedback_ba_facing_reply_plain]].
