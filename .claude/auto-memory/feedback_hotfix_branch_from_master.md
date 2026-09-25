---
name: hotfix-branch-from-master
description: 🚨 PROD hotfix on an already-released ticket → new branch mlk/hotfix/<ticket> off latest origin/mlk/master; old ticket branch is reference only
metadata:
  type: feedback
---

A PROD bug on a ticket that is already closed, verified and released goes on a NEW branch `mlk/hotfix/<ticket>` cut from the latest `origin/mlk/master` (fetch first). Never commit to or re-merge the old `mlk/esokongan/<ticket>` branch — the old ticket is reference only.

**Why:** 2026-09-24 4Ae "No Resit null" hotfix (#280176 in release 1.6.3) — I put the fix on the closed ticket's branch; みや corrected it. Infra builds a separate on-site local server from the hotfix branch so users keep working before the next baseline, so the branch must be clean = released tip + the fix only. Remote precedent: `origin/mlk/hotfix/269437`, `origin/mlk/hotfix/271234`.

**How to apply:** at hotfix start → `git fetch` → `git checkout --no-track -b mlk/hotfix/<ticket> origin/mlk/master`. To test on staging, patch staging data to the PROD shape (patch + reset script) instead of hunting for a lookalike record. The branch number is the hotfix's OWN Redmine ticket (2026-09-24: #281392, not the closed #280176) — if work starts before the ticket exists, renumber via revert + re-merge, never force-push (steps in §8). Full rule: etanah-knowledge/melaka/BRANCH-AND-DEPLOY.md §8. Related: [[branch-before-merge]] [[master-merge-no-ff]].

**Mechanism (built 2026-09-24):** the `hotfix` skill carries the 10-step workflow; the etanah-intake-gate HOTFIX lane injects the invoke on "hotfix / released yesterday / dah release / closed ticket"; `domain/quest-exists-gate` blocks an etanah commit whose #ticket has no quest block + Task folder, or whose # differs from the `mlk/hotfix/<n>` branch.
