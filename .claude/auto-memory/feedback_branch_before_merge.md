---
name: feedback_branch_before_merge
description: "🚨 NEVER commit a fix straight onto an env/main branch. ALWAYS create the ticket branch first, commit there, THEN merge/cherry-pick into stag-env/int-env. Applies during quest, not just Phase 1 close."
metadata:
  node_type: memory
  type: feedback
---

🚨 A fix ALWAYS lands on its OWN ticket branch FIRST, never straight onto an env or main branch.

Order, every time, no exception:
1. `git checkout mlk/master && git pull --ff-only` (fresh base).
2. `git checkout -b mlk/esokongan/<num>` (or `mlk/<tracker>/<num>`).
3. Commit the fix on that branch.
4. THEN merge --no-ff into mlk/stag-env, and cherry-pick / merge into mlk/int-env.

**Banned**: committing or cherry-picking a fix DIRECTLY onto mlk/int-env or mlk/stag-env with no ticket branch behind it. This session (#279711, #279787, 2026-09-17) both fixes went straight to int-env with no ticket branch and never reached staging — the board went blind and BA could not retest. みや: *"always create the fixes in a fucking branch before merging into any main branches."*

**Why the branch must exist**: it is the single source the env merges pull from; without it a rework has nothing to reset (see the 279615 v2 mess), staging never gets the fix, and the commit is orphaned on one env. Pairs with [[master_merge_no_ff]] and [[feedback_ba_test_deploy_int_env]].
