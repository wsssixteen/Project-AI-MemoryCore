---
name: reference_perak_deploy_flow
description: "Perak etanah deploy/close flow — ticket branch (internal/<num>) off master, then merge/push to staging prk/stag-env"
metadata: 
  node_type: memory
  type: reference
  originSessionId: b1b3201c-7ff8-45c3-b969-f80bc749ba4c
  modified: 2026-08-28T07:52:37.389Z
---

🚨 Perak deploy/close flow (analog of the Melaka `deploy` skill; per みや 2026-08-28). Perak trunk = `master` (see [[reference_perak_codev_scope]]). Repo: `E:\Projects\Perak\etanah-pelupusan`.

**Order (only after local test passes on `master` with the fix uncommitted):**

| # | Step | Command |
|---|---|---|
| 1 | Confirm base | `git -C <repo> checkout master && git pull --ff-only` (behind must be 0) |
| 2 | Ticket branch off master | `git checkout -b prk/internal/<num>` (Perak convention per STATE-FACTS.md §2 = `prk/internal/<num>` / `prk/esokongan/<num>`; on 2026-08-28 I wrongly used bare `internal/<num>` for 277439/277115 — minor, staging merge was still correct) |
| 3 | Stage + commit the fix | `git add <files>` → STOP, show `git diff --cached` + drafted message for みや to approve → `git commit` |
| 4 | Push the ticket branch | `git push origin internal/<num>` |
| 5 | Deploy to staging | `git checkout prk/stag-env && git pull --ff-only && git merge internal/<num> && git push origin prk/stag-env` |
| 6 | Build + deploy staging server (appspk-stag) | みや runs the Perak build/deploy (server + script TBD — CONFIRM with みや) |
| 7 | Return to trunk | `git checkout master && git pull --ff-only` (never end on prk/stag-env or the ticket branch) |

**Notes / to-confirm with みや:**
- Ticket-branch name pattern: `internal/<num>` (some older history shows `mlk/internal/<num>` — Perak forked from Melaka; use `internal/<num>` unless told otherwise).
- Staging env branch = `prk/stag-env` (given by みや 2026-08-28).
- Perak build/deploy server + script for appspk-stag = UNKNOWN — ask みや before step 6.
- Commit gate identical to Melaka: never commit on `master`; show staged diff + message and wait for approval; only after `local_test_confirmed=true`.

Related: [[reference_perak_codev_scope]] · [[feedback_commit_deploy_runbook]] · [[reference_melaka_env_deploy_paths]]
