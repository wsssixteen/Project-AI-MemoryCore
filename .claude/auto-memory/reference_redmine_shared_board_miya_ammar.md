---
name: reference_redmine_shared_board_miya_ammar
description: "Saved Redmine filter — OPEN tickets assigned to みや + Ammar (assignee ids 1311, 1218); pull it up on \"any other tickets to do?\", \"tickets under Ammar and me\", \"Perak & Melaka tickets\", \"other tickets I can work on?\""
metadata: 
  node_type: memory
  type: reference
  originSessionId: 186a0d2f-c9fd-4aa7-9bd7-2258614c96d2
  modified: 2026-08-28T02:40:18.387Z
---

みや's saved Redmine board — **OPEN tickets assigned to both みや and Ammar** (assignee ids `1311` + `1218`), grouped ungrouped, columns: project · tracker · status · priority · subject · assigned_to · updated_on · done_ratio.

**URL** (host `172.16.90.169`):
```
http://172.16.90.169/redmine/issues?utf8=%E2%9C%93&set_filter=1&f%5B%5D=status_id&op%5Bstatus_id%5D=o&f%5B%5D=assigned_to_id&op%5Bassigned_to_id%5D=%3D&v%5Bassigned_to_id%5D%5B%5D=1311&v%5Bassigned_to_id%5D%5B%5D=1218&f%5B%5D=&c%5B%5D=project&c%5B%5D=tracker&c%5B%5D=status&c%5B%5D=priority&c%5B%5D=subject&c%5B%5D=assigned_to&c%5B%5D=updated_on&c%5B%5D=done_ratio&group_by=
```

**Fire on**: "are there any other tickets to do?" · "what are the tickets under Perak & Melaka" · "what are the tickets under Ammar and me" · "are there other tickets I can work on?" · any ask for the shared open-ticket standing across みや + Ammar.

**How to serve**: this is the LIVE shared board — the two-person superset. For みや's own ranked list use [[feedback_board_from_redmine_first.md]] / the `list-redmine` skill (`redmine-board.js`) first; this URL is the wider net (adds Ammar's open tickets + covers Perak & Melaka projects together).

**Note**: filter is `status = open` only — no project filter, so it returns every project (Perak, Melaka, …) both are assigned to.
