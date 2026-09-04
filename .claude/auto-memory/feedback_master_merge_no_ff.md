---
name: feedback_master_merge_no_ff
description: "🚨 Every merge into mlk/master (pelupusan + awam) is git merge --no-ff, a real merge commit; never a fast-forward, because a fast-forward hides who merged and when from managers and SourceTree"
metadata:
  type: feedback
---

Merges into `mlk/master` are always `git merge --no-ff <branch>`. A fast-forward only moves the label and writes no merge commit, so history never records who merged and when. miya wants that moment visible to managers.

**Why:** 2026-09-04, #277697. I fast-forwarded `mlk/master` onto `0b7b5cff37`. SourceTree showed only the 3 Sep commit date, no merge line, no 4 Sep entry. miya: *"This is a problem for managers checking if their employees are doing work… now hidden due to this fast-forwarding thing."* Then: *"no-ff rule from now on."*

**How to apply:** `release-prep.js merge-to-master` now does `--no-ff` behind a drift guard. Both local etanah repos carry `branch.mlk/master.mergeoptions=--no-ff`. For a branch-owner-ordered manual merge, checkout master, `git merge --no-ff <branch>`, push, then bypass the push gate with the reason. Related: [[feedback_commit_subject_shape]] · [[feedback_ba_test_deploy_int_env]].
