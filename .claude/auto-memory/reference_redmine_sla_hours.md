---
name: reference_redmine_sla_hours
description: "🚨 Redmine Priority = SLA clock in HOURS (Critical 1 h · High 6 h · Medium 22 h · Low unconfirmed), NOT the 'N Days' severity custom-field label; priority is not loaded into any quest artifact yet (redmine-sync prints it once, :667)"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 95051a81-4a1c-4543-ba85-76d5e29dd4e1
  modified: 2026-09-09T02:56:10.547Z
---

Per みや 2026-09-09 (#278218 retrospective):

| Redmine Priority (`issue.priority.name`; enumeration ids Critical=4, High=3, Medium=2 default, Low=1) | SLA from `created_on` |
|---|---|
| Critical | 1 hour |
| High | 6 hours |
| Medium | 22 hours |
| Low | not stated, confirm before using |

- 🚨 The hours are WORKING hours, 08:00 to 17:00 (みや 2026-09-09): a High ticket raised at 16:00 is due 14:00 the next working day. Weekend and public-holiday handling not yet stated.
- The custom fields `Priority Severity Level Melaka = Medium (3): 7 Days` / `Priority (severity level) = High(3):5days` are labels, not the SLA. Never quote days as the deadline.
- Today no quest artifact carries the priority: `quest\redmine-sync.js:667` prints it to the console only; Description.txt, History.txt, `active.txt` blocks, and the briefing board have no priority or SLA column. Planned: `priority=` + `sla_deadline=` in the block, `Priority:` line in Description.txt, hours-left column in the briefing, UNBLOCK table mandatory for Critical/High (`etanah-knowledge/UNBLOCK-PLAYBOOK.md`).

Related: [[reference_perak_hotfix_and_error_store]] · [[quick-patch-steal-risk]] · [[feedback_flowable_admin_diagram]]
