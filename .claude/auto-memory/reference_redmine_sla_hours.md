---
name: reference_redmine_sla_hours
description: "🚨 SLA for dev by Redmine Priority, in working hours: Critical 6, High 10, Medium 22, Low 31; timer 8am to 5pm; Terengganu Sunday to Thursday, the rest Monday to Friday; NOT the 'N Days' severity custom-field label; priority is not loaded into any quest artifact yet (redmine-sync prints it once, :667)"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 95051a81-4a1c-4543-ba85-76d5e29dd4e1
  modified: 2026-09-09T02:56:10.547Z
---

🚨 THE RULE, the message he shared, word for word (given again 2026-11-01, "I need you to remember this"):

> for support team, pls always rmb, the ticket SLA is based on ticket priority:
> Critical - 6 hours for dev
> High - 10 hours for dev
> Medium - 22 hours for dev
> Low - 31 hours for dev
>
> The timers will count from 8am to 5pm. For Trg is sunday to thu , the rest is monday to friday

**How to apply**: developer's limit by priority = Critical 6, High 10, Medium 22, Low 31 working hours. Timer 08:00 to 17:00; Terengganu Sunday to Thursday, every other state Monday to Friday. The message does not say whether lunch counts: he is unsure, so show lunch in and lunch out and never choose silently. **Take public holidays out of the timer**: without them, September 2026 showed 3 misses where his manager counted 1; removing Malaysia Day gave exactly 1. A manager's count outranks my calculation. **This replaces the 2026-09-09 table below where they differ (Critical 1, High 6, Low unstated)**; that table may be a ticket-level figure, not verified.

Older note, per みや 2026-09-09 (#278218 retrospective):

| Redmine Priority (`issue.priority.name`; enumeration ids Critical=4, High=3, Medium=2 default, Low=1) | SLA from `created_on` |
|---|---|
| Critical | 1 hour |
| High | 6 hours |
| Medium | 22 hours |
| Low | not stated, confirm before using |

- 🚨 The hours are WORKING hours, 08:00 to 17:00 (みや 2026-09-09): a High ticket raised at 16:00 is due 14:00 the next working day. Weekend and public-holiday handling not yet stated.
- 🚨 Per みや 2026-11-01: "developers are allocated with 22 hours, out of the number of days that is allocated for normal ticket". The 22 hours are the developer's share of the ticket's working days (Medium 7, checked on #274046's due date only). Never report one SLA percentage alone: state the clock, and show the whole-ticket limit beside the developer's hours. Whether the developer's clock starts at creation or at assignment is not yet confirmed.
- The custom fields `Priority Severity Level Melaka = Medium (3): 7 Days` / `Priority (severity level) = High(3):5days` are labels, not the SLA. Never quote days as the deadline.
- Today no quest artifact carries the priority: `quest\redmine-sync.js:667` prints it to the console only; Description.txt, History.txt, `active.txt` blocks, and the briefing board have no priority or SLA column. Planned: `priority=` + `sla_deadline=` in the block, `Priority:` line in Description.txt, hours-left column in the briefing, UNBLOCK table mandatory for Critical/High (`etanah-knowledge/UNBLOCK-PLAYBOOK.md`).

Related: [[reference_perak_codev_scope]] · [[quick-patch-steal-risk]] · [[flowable-node-edge-trace]]
