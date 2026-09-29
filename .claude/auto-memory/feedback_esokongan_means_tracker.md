---
name: feedback_esokongan_means_tracker
description: "🚨 \"eSOKONGAN ticket\" = TRACKER eSOKONGAN (id 51, has SLA), never the project name; order eSOKONGAN → PROD → rest, then Priority, then urgent words"
metadata:
  type: feedback
---

"eSOKONGAN ticket", from みや or anyone, ALWAYS means a ticket whose **Tracker** is eSOKONGAN (Redmine tracker id 51). The Redmine project "eSOKONGAN MELAKA" also holds Internal Issue and Data Patching tickets; the project name never makes a ticket eSOKONGAN.

Ticket priority order:

| Step | Rule |
|---|---|
| 1 | eSOKONGAN tracker first (the real SLA tickets) |
| 2 | anything PROD next: Data Patching (PROD) 64 · Internal Issue (PROD) 71 · Internal Issue (PROD-CR) 63 |
| 3 | everything else (Internal Issue 53, QA, Permanent Fix, MA Fix) |
| inside each | Priority Critical > High > Medium > Low |
| then | a ticket whose description or journal says urgent / segera / kritikal / critical / ASAP / mendesak / secepat mungkin / immediate / emergency / kecemasan goes ahead; never miss it |
| then | old tie-break: eSOKONGAN nearest due, others 3-DAY age |

**Why:** 2026-09-29 みや: the eSOKONGAN tracker carries the SLA, so it must be prioritised over tickets that merely live in the eSOKONGAN MELAKA project. PROD tickets are "just as important, settle first".

**How to apply:** `quest/redmine-board.js` implements it (table order + Severity column with URGENT flag + urgent banner). Any hand-made ranking (sweep brief, retrieve-redmine, briefing) follows the same order. Mirrored in list-redmine, sweep, retrieve-redmine skills, session-briefing.md and CLAUDE.md §Vocabulary.

Related: [[reference_redmine_sla_hours]] · [[board-from-redmine-first]]
