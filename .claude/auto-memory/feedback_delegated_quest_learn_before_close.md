---
name: delegated-quest-learn-before-close
description: A quest a colleague holds on Redmine is never closed locally while open there; once Redmine shows Closed, audit their fix (learn-from-fix) before closing
metadata:
  type: feedback
---

A delegated or reassigned quest stays `status=delegated` while Redmine still shows it open (In Progress, Rework, Resolved). It closes only after Redmine shows Closed AND the colleague's fix was read and audited with `/learn-from-fix` (strict: scrutinize, appraise; each finding routed to quest workflow, that state's etanah-knowledge, elsewhere, or none).

**Why:** みや 2026-10-04, when I offered to close QA-275043 (Ammar, Rework) and QA-265109 (Ammar, In Progress): "add a rule to not close reworks. Because once we detected a Delegated quest being Closed, we need to learn from it. You will see how they solved it, audit it, then decide if we need to add into our Quest workflow or etanah-knowledge for that particular state or any other places. Be strict about it, scrutinize, appraise."

**How to apply:** boot check `quest/redmine-status-check.js` prints `👀 TRACKING` (keep, do not close) or `🎓 LEARN BEFORE CLOSE` (run the skill first). Never offer "close" for a TRACKING row. Related: [[cross-module-handoff-artifact]], [[rework-commit-on-existing-ticket-branch]].
