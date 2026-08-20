---
name: feedback_de_disposition_table
description: "At the commit/push/merge-to-main step (DE step 10-11 / any close), the uncommitted-file dispositions MUST be shown as a TABLE (File | Disposition | Reason), not prose bullets"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 1a7da135-85bf-4ba2-be65-9ff1283730e7
  modified: 2026-08-20T02:45:48.727Z
---

At the **commit → push → merge-to-main** step (DE step 10-11, or any git close-out that lists uncommitted files), the uncommitted-file dispositions MUST be a **table**, mandatory:

| File | Disposition | Reason |
|---|---|---|
| `<path>` | discard / park / commit / keep-in-worktree | one-line why |

- Applies ONLY to this part (the commit/push/merge disposition list) — miya's explicit scope 2026-08-19.
- Dispositions vocab (de-step11-verdict-gate): `discard` (ephemeral marker) · `park` (left intentionally, reason) · `commit` (staged this turn) · `keep-in-worktree`.

**Why:** he reads the disposition list to confirm nothing of his was clobbered; a table scans faster than bullets. Related: [[feedback_reply_separation_of_concerns]] (tables carry content).
