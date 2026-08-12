---
name: feedback-ticket-type-vocab-tracking
description: Tag each ticket with a TYPE (template / document-reset / etc.) and track how different individuals word the same style of ticket; hold provisional confidence until fluent
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a33c1df2-526f-458d-b2b8-b00a7858ef17
  modified: 2026-08-11T02:24:37.943Z
---

みや wants each ticket tagged with a "type" (e.g. template, document-reset-via-maintenance, ...) and wants me to collect the different WORDINGS that different BAs/individuals use for the same style of ticket, building fluency across tickets over time.

**Why:** I'm new to these ticket families; the same underlying issue is phrased differently per person, and premature confidence produces a wrong reset/fix model — e.g. QA-273621, where I over-asserted a `pembetulan` flow auto-delete when the real test-reset is deleting docs via `PelupusanMaintenanceForm.xhtml` ([[pelupusan-doc-reset-tool]]).

**How to apply:** on each ticket record `ticket_type` + the reporter's exact phrasing; when a new ticket resembles a prior type, match on VERIFIED shape, not vocabulary alone; stay explicitly provisional ("still new to this family") until the pattern holds across several tickets. Related: [[over-generalization-check]] · [[feedback_verify_before_claim]].
