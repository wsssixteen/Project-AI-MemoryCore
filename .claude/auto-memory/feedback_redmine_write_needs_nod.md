---
name: feedback_redmine_write_needs_nod
description: "🚨 Every Redmine WRITE (field edit, journal note) runs under miya's name; the FIRST write on a standing instruction is allowed, any rewrite or any new note needs the exact text shown + his nod first, and the write must be announced in the reply's first lines, never buried in a table row"
metadata:
  type: feedback
---

A Redmine write is a message sent in miya's name. The first write that a standing instruction covers ("update the root cause for these 30") may go straight in. Anything after that, a rewrite, a journal note to a colleague, a status change, gets the exact ticket + field + text shown to him and his nod first, and the reply that follows names the write in its first lines.

**Why:** 2026-09-04. 29 tickets' Root Cause/Solutions were rewritten twice on mid-turn messages while his next message said he was happy with the first version (Redmine journal now shows 3 edits per ticket, cannot be wiped). Minutes later a merge-confirmation note was posted to Alex on #277697 with no draft and no nod, mentioned only as one table row. miya: *"what are you going to say about the redmine updates? Why did you keep silent about that?"*

**How to apply:** enforced by `domain/redmine-write-gate/` (PreToolUse, blocks any Redmine PUT/POST/DELETE or `write.js --live` unless the command carries `[redmine-write-approved: <his words>]`). A mid-turn message that changes direction is a STOP signal for outward writes, not a second instruction to execute. Related: [[feedback_hold_background_results]] · [[feedback_redmine_rootcause_format]].
