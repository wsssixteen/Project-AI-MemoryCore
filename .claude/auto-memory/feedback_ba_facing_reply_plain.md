---
name: feedback-ba-facing-reply-plain
description: "When the question came from a BA/colleague, produce the sendable human reply first — not a dev report with file paths and tables"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a78e0335-2176-4331-8e75-548a172ae89d
  modified: 2026-07-27T13:08:08.518Z
---

When みや relays a question **asked by someone else** (BA, colleague, WhatsApp screenshot), the deliverable is a **message he can send**, in their language and register — plain Malay/English sentences, no file:line, no tables, no `template.config.json` paths. My evidence work stays behind the scenes; only the conclusion and what it means for them goes out.

**Why**: 2026-07-27 — BA asked whether #272574 and #242553 were related. I answered him with a verdict table, a BPMN story diagram and full repo paths; then, when he asked "so it is related or not?", I still led with "not by a Redmine link, but by mechanism". みや: *"can you answer like how a human would fucking understand? The question was asked by the BA... we are not going to answer like you just did."* The technical content was right and none of it was usable.

**How to apply**: spot the relay signal (pasted chat, "BA asked", a name/phone in the quote) → answer YES/NO plainly in the first line → 2-4 short sentences of why, in their vocabulary (tugasan/kod/template, not class names) → offer the dev-detail version separately only if he wants it. Related: [[feedback_two_sentence_default]] · [[feedback_show_diagram_for_issues]] (diagrams are for みや's own debugging, not for BA-facing replies).
