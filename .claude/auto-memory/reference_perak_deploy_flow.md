---
name: reference_perak_deploy_flow
description: "Perak deploy flow — a fix reaches staging AND prod ONLY via master; prk/stag-env is NOT the deployed artifact; verify by host footer before claiming deployed"
metadata: 
  node_type: memory
  type: reference
  originSessionId: b1b3201c-7ff8-45c3-b969-f80bc749ba4c
  modified: 2026-09-08T13:09:40.870Z
---

🚨 Perak deploy/close flow. Perak trunk = `master` (see [[reference_perak_codev_scope]]). Repo: `E:\Projects\Perak\etanah-pelupusan`.

🚨 **CORRECTION (VERIFIED live 2026-09-08, #277115 rework — this replaces the old "deploy = push prk/stag-env" step).** The staging host `appspkstg.perak.gov.my` footer reads `Branch Name: master`, `Module Version: 1.74.0`. **Both staging and PROD serve builds cut from `master` (release/1.73.x → 1.74.x). `prk/stag-env` is a parallel branch ~1297 commits ahead of master but is NOT what any running server builds — merging a fix only to `prk/stag-env` deploys it to NOTHING.** Proven on #277115: cycle-2 fix `872e33a17d` merged to prk/stag-env (`590771f37f`), reported "dah merge ke staging", but `git merge-base --is-ancestor 872e33a17d origin/master` = NO → prod stayed blank. Same failure family as #278218 one day earlier (wrong ref → infra builds master → WAR lacks fix). See etanah-knowledge/perak/BRANCH-AND-DEPLOY.md §3.

**Order (only after local test passes with the fix):**

| # | Step | Command |
|---|---|---|
| 1 | Confirm base | `git -C <repo> checkout master && git pull --ff-only` (behind must be 0) |
| 2 | Ticket branch off master | `git checkout -b prk/esokongan/<num>` (or `prk/internal/<num>` / `prk/hotfix/<num>` per tracker — STATE-FACTS §2) |
| 3 | Stage + commit the fix | `git add <files>` → STOP, show `git diff --cached` + drafted message for みや to approve → `git commit` |
| 4 | Push the ticket branch | `git push origin prk/<tracker>/<num>` |
| 5 | **Merge to master (this is what deploys)** | `git checkout master && git pull --ff-only && git merge --no-ff prk/<tracker>/<num> && git push origin master` — a release action, needs みや's explicit go |
| 6 | Infra builds/deploys master to staging then PROD | みや / infra; then **read the target host footer** (Branch Name + Module Version + Tarikh Kemaskini) to CONFIRM the fix landed — never claim "deployed" from a branch merge |
| 7 | Return to trunk | `git checkout master && git pull --ff-only` |

**Hard rules learned:**
- A fix reaches a running env ONLY when it is in `master`. `prk/stag-env` proves nothing.
- Before any "deployed / merged to staging" handback, read the host footer AND `git merge-base --is-ancestor <fix> origin/master`. See [[feedback_deploy_truth_gate]].
- The 2026-08-28 note that "staging merge to prk/stag-env was still correct" for 277439/277115 was WRONG — corrected here.

Related: [[reference_perak_codev_scope]] · [[feedback_deploy_truth_gate]] · [[feedback_perak_branch_from_master]] · [[feedback_commit_deploy_runbook]] · [[reference_melaka_env_deploy_paths]]
