---
name: feedback_worktree_cleanup_after_merge
description: "🚨 After using temp git worktrees for an etanah commit/merge, REMOVE every one (git worktree remove) in the SAME session — a worktree holding a branch locks it, so miya cannot check that branch out."
metadata:
  node_type: memory
  type: feedback
---

🚨 A git worktree that has a branch checked out LOCKS that branch — `git checkout <branch>` in miya's main checkout fails with "already checked out at <worktree>". So miya cannot inspect the branch.

**Rule**: whenever I create temp worktrees to commit/merge on the shared etanah repo (isolated-worktree discipline, the 275500 lesson), I MUST remove ALL of them before handing back — same session, not "later":

```
git worktree remove "E:/Projects/<wt-name>"   # for each; branches stay on origin, nothing lost
git worktree list                              # confirm only mlk/master remains
```

**Why** (2026-09-18, eSOKONGAN 280176/280132/280191): I left 5 temp worktrees (`wt-esokongan-280176` etc.) after commit+merge+push. Each locked its ticket branch. miya: *"I cannot check branches like 280176."* All work was already committed + pushed, so removal was zero-risk — I just forgot the cleanup half of the discipline.

Pairs with the 275500 lesson (use isolated worktrees for etanah commit/merge so miya's live checkout is never mutated) — creating them is half; **removing them is the other half**. Deploy-guard false-positives on `--force`, so remove without `--force` (clean worktrees remove fine) or `rm -rf` + `git worktree prune`.
