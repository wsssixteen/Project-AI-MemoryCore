---
name: feedback_etanah_git_separate_clone
description: "🚨 ALL etanah git that WRITES (fetch/branch/commit/merge/push/worktree) runs in a SEPARATE clone off the server, NEVER miya's working repo (E:/Projects/Melaka/*). His repo's refs/reflog/tracking must never move because of me. Supersedes the in-repo-worktree approach."
metadata:
  node_type: memory
  type: feedback
---

🚨 NEVER run write-side git (fetch that moves refs · branch create · commit · merge · push · worktree add) inside miya's working repo `E:/Projects/Melaka/etanah-pelupusan` (or awam/common/spoc). Those operations move the refs, reflog and branch-tracking that HIS SourceTree reads — even a worktree shares his `.git`. That is what caused the 2026-09-21 mess (his local `mlk/stag-env` showed a growing "19 to push" — a latent master-tracking exposed + churned by my in-repo fetches/worktrees + reset advice).

**The rule**: for any etanah commit/merge/deploy work, use a SEPARATE clone off the server, outside his project tree:

```
git clone ssh://git@172.16.93.167/etanah-pelupusan  E:/Dev/etanah-work/etanah-pelupusan   # one-time, reusable
cd E:/Dev/etanah-work/etanah-pelupusan
# branch / commit / merge / push here — his repo is never touched
```

Reuse the same clone across sessions (just `git fetch` inside IT). His working repo stays read-only to me: I may READ it (log/status/reflog/diff) to diagnose, never WRITE.

**When miya asks me to fix HIS local repo** (tracking, stale counts, refresh): I DO have access — use it and fix it directly (e.g. `git branch --set-upstream-to=origin/mlk/<x> mlk/<x>`), read the reflog/config to find the cause on the FIRST turn; do NOT hand him copy-paste commands or theorize about SourceTree across turns. Reading his repo is allowed and expected; the ban is on WRITE-side work landing there as a side effect of MY build/merge activity.

**Diagnosis reflex**: "SourceTree shows wrong ahead/behind" → first command is `git -C <repo> status -sb` + `git for-each-ref --format='%(refname:short) => %(upstream:short)' refs/heads` to catch a mis-set upstream. Do not theorize.

Supersedes [[feedback_worktree_cleanup_after_merge]] (that rule cleaned up worktrees I should not have created in his repo at all).
