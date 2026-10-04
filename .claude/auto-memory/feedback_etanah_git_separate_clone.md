---
name: feedback_etanah_git_separate_clone
description: "writes in a separate clone; ticket branch first; hotfix off master; master merge --no-ff; no name in refs; remove worktrees; stash = \"stash <ticket>\""
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

Supersedes (merged above) (that rule cleaned up worktrees I should not have created in his repo at all).

---

## Merged 2026-10-04: feedback_branch_before_merge (was feedback_branch_before_merge.md)

> 🚨 NEVER commit a fix straight onto an env/main branch. ALWAYS create the ticket branch first, commit there, THEN merge/cherry-pick into stag-env/int-env. Applies during quest, not just Phase 1 close.

🚨 A fix ALWAYS lands on its OWN ticket branch FIRST, never straight onto an env or main branch.

Order, every time, no exception:
1. `git checkout mlk/master && git pull --ff-only` (fresh base).
2. `git checkout -b mlk/esokongan/<num>` (or `mlk/<tracker>/<num>`).
3. Commit the fix on that branch.
4. THEN merge --no-ff into mlk/stag-env, and cherry-pick / merge into mlk/int-env.

**Banned**: committing or cherry-picking a fix DIRECTLY onto mlk/int-env or mlk/stag-env with no ticket branch behind it. This session (#279711, #279787, 2026-09-17) both fixes went straight to int-env with no ticket branch and never reached staging — the board went blind and BA could not retest. みや: *"always create the fixes in a fucking branch before merging into any main branches."*

**Why the branch must exist**: it is the single source the env merges pull from; without it a rework has nothing to reset (see the 279615 v2 mess), staging never gets the fix, and the commit is orphaned on one env. Pairs with (merged above) and [[feedback-commit-deploy-runbook]].

---

## Merged 2026-10-04: hotfix-branch-from-master (was feedback_hotfix_branch_from_master.md)

> 🚨 PROD hotfix on an already-released ticket → new branch mlk/hotfix/<ticket> off latest origin/mlk/master; old ticket branch is reference only

A PROD bug on a ticket that is already closed, verified and released goes on a NEW branch `mlk/hotfix/<ticket>` cut from the latest `origin/mlk/master` (fetch first). Never commit to or re-merge the old `mlk/esokongan/<ticket>` branch — the old ticket is reference only.

**Why:** 2026-09-24 4Ae "No Resit null" hotfix (#280176 in release 1.6.3) — I put the fix on the closed ticket's branch; みや corrected it. Infra builds a separate on-site local server from the hotfix branch so users keep working before the next baseline, so the branch must be clean = released tip + the fix only. Remote precedent: `origin/mlk/hotfix/269437`, `origin/mlk/hotfix/271234`.

**How to apply:** at hotfix start → `git fetch` → `git checkout --no-track -b mlk/hotfix/<ticket> origin/mlk/master`. To test on staging, patch staging data to the PROD shape (patch + reset script) instead of hunting for a lookalike record. The branch number is the hotfix's OWN Redmine ticket (2026-09-24: #281392, not the closed #280176) — if work starts before the ticket exists, renumber via revert + re-merge, never force-push (steps in §8). Full rule: etanah-knowledge/melaka/BRANCH-AND-DEPLOY.md §8. Related: (merged above) (merged above).

**Mechanism (built 2026-09-24):** the `hotfix` skill carries the 10-step workflow; the etanah-intake-gate HOTFIX lane injects the invoke on "hotfix / released yesterday / dah release / closed ticket"; `domain/quest-exists-gate` blocks an etanah commit whose #ticket has no quest block + Task folder, or whose # differs from the `mlk/hotfix/<n>` branch.

---

## Merged 2026-10-04: feedback_master_merge_no_ff (was feedback_master_merge_no_ff.md)

> 🚨 Every merge into mlk/master (pelupusan + awam) is git merge --no-ff, a real merge commit; never a fast-forward, because a fast-forward hides who merged and when from managers and SourceTree

Merges into `mlk/master` are always `git merge --no-ff <branch>`. A fast-forward only moves the label and writes no merge commit, so history never records who merged and when. miya wants that moment visible to managers.

**Why:** 2026-09-04, #277697. I fast-forwarded `mlk/master` onto `0b7b5cff37`. SourceTree showed only the 3 Sep commit date, no merge line, no 4 Sep entry. miya: *"This is a problem for managers checking if their employees are doing work… now hidden due to this fast-forwarding thing."* Then: *"no-ff rule from now on."*

**How to apply:** `release-prep.js merge-to-master` now does `--no-ff` behind a drift guard. Both local etanah repos carry `branch.mlk/master.mergeoptions=--no-ff`. For a branch-owner-ordered manual merge, checkout master, `git merge --no-ff <branch>`, push, then bypass the push gate with the reason. Related: [[feedback-commit-deploy-runbook]] · [[feedback-commit-deploy-runbook]].

---

## Merged 2026-10-04: feedback_no_name_in_branches (was feedback_no_name_in_branches.md)

> 🚨 BANNED — never put my name (\"ruri\" or any form) in a git ref (branch OR tag), even for local-only safety/checkpoint refs

🚨 **BANNED**: never create a git ref — **branch OR tag** — whose name contains "ruri" (or my name in any form) — not on remote, not even as a local-only safety/pre-merge checkpoint.

**Why**: みや caught `ruri/pre-master-merge-1.3.1` in his Eclipse (2026-08-11). Hunting it revealed I'd been stamping my name on pre-merge safety checkpoints as **tags** (`refs/tags/ruri/pre-master-merge-1.3.1` · `-1.1.0` · `pre-internal-271985`) AND a leftover branch (`ruri/internalmerge-271985`). All local-only, all deleted. I made them as personal safety nets before master merges — but git's reflog already preserves the old ref, so a named checkpoint is redundant AND stamping my name on it is the violation. Refs are shared vocabulary; my identity does not belong in the repo's ref namespace, branch or tag.

**How to apply**:
- Need a safety net before a risky merge? Rely on the reflog / the existing branch ref — do NOT cut a `ruri/...` branch. If a real checkpoint branch is genuinely needed, name it by PURPOSE with no personal prefix (e.g. `mlk/pre-merge-1.3.1`), and prefer asking みや first.
- All working branches follow the established convention: `mlk/<tracker>/<num>` (see (merged above) family / BRANCH-AND-DEPLOY.md).
- Clean up any stray `ruri/*` local branches when found.

🚨 **Branch NAME = the exact tracker-derived name, NOTHING added** (2026-08-20, #276504 — miya furious twice). The `<tracker>` for an **INTERNAL ISSUE** ticket is **`internal`**, so the branch is **`mlk/internal/<num>`** — NOT `mlk/internal-issue/<num>`. **Never invent a suffix or an abbreviation**: I created `mlk/internal/276504-permfix` (made-up `-permfix` suffix AND a made-up "permanent fix"→"permfix" abbreviation) to avoid clobbering a colleague's same-named remote branch. Both are banned — invented abbreviations violate the no-fake-savings rule, and a suffix is not the convention. If a colleague already owns `mlk/<tracker>/<num>`, **build on top of his commit** (branch off his SHA, add your commit) — do NOT replace his fix, do NOT rename around it. When a colleague's fix is already on a diverged env branch, **cherry-pick your delta onto the env branch** rather than a full merge (a master-based branch merged into a long-diverged `mlk/int-env` drags the whole divergence into conflict).

---

## Merged 2026-10-04: feedback_worktree_cleanup_after_merge (was feedback_worktree_cleanup_after_merge.md)

> 🚨 After using temp git worktrees for an etanah commit/merge, REMOVE every one (git worktree remove) in the SAME session — a worktree holding a branch locks it, so miya cannot check that branch out.

🚨 A git worktree that has a branch checked out LOCKS that branch — `git checkout <branch>` in miya's main checkout fails with "already checked out at <worktree>". So miya cannot inspect the branch.

**Rule**: whenever I create temp worktrees to commit/merge on the shared etanah repo (isolated-worktree discipline, the 275500 lesson), I MUST remove ALL of them before handing back — same session, not "later":

```
git worktree remove "E:/Projects/<wt-name>"   # for each; branches stay on origin, nothing lost
git worktree list                              # confirm only mlk/master remains
```

**Why** (2026-09-18, eSOKONGAN 280176/280132/280191): I left 5 temp worktrees (`wt-esokongan-280176` etc.) after commit+merge+push. Each locked its ticket branch. miya: *"I cannot check branches like 280176."* All work was already committed + pushed, so removal was zero-risk — I just forgot the cleanup half of the discipline.

Pairs with the 275500 lesson (use isolated worktrees for etanah commit/merge so miya's live checkout is never mutated) — creating them is half; **removing them is the other half**. Deploy-guard false-positives on `--force`, so remove without `--force` (clean worktrees remove fine) or `rm -rf` + `git worktree prune`.

---

## Merged 2026-10-04: stash-ref-stability (was feedback_stash_ref_stability.md)

> For cross-session persistence, identify git stashes by descriptive-message grep, not stash@{N} position — position drifts every time a new stash lands on top.

For any git ref written into cross-session state (`active.txt` block, `QA-NNN.md § Resume Point`, feedback memory), identify **stashes by descriptive-message grep**, NEVER by `stash@{N}` position.

**Why:** 2026-07-13 — I wrote `stash_ref=stash@{0}` into `active.txt` for QA-259112 on 2026-07-08. Five days later on resume, `git stash list` had the QA-259112 entry at `stash@{1}` (a new stash `269918` landed on top while みや was working other tickets). Content untouched, position drifted. If the resume instruction had said "pop stash@{0}" verbatim, we would have popped the wrong stash (269918).

**How to apply:**
- **Write** the stash with a **verbose, self-identifying `-m` message** that includes the QA number, the approach name/version, and the from-branch: `git stash push -m "QA-259112 Approach C WIP — 5 files (populator REVERTED for eSokongan #268637). Stashed FROM mlk/esokongan/268637v2 @ 66c77a313e. Pop onto mlk/master."`.
- **Persist** in `active.txt`: BOTH `stash_ref=stash@{N}` (current position at hold time — audit trail) AND `stash_ref_note=identify by message "<verbatim grep string>"`. The `_ref` is the snapshot; the `_note` is the anchor.
- **Resume instruction** in `QA-NNN.md § Resume Point`: never bare `stash@{0}` — always include the grep pattern: `git stash list | grep "QA-259112 Approach C" → pop that N`.
- **Same principle for `reflog@{N}`, `HEAD~N`, or any other position-indexed git ref.** Only commit SHAs and stable branch names are stable across sessions.

Related: [[project-onedrive-worktrees]] (verify handoff state at boot — same family of "written-state-goes-stale" failure mode).

---

## Merged 2026-10-04: feedback_stash_naming_convention (was feedback_stash_naming_convention.md)

> Git stash messages use \"stash <ticket-number>\" — simple, greppable, one ticket per stash

Every `git stash push` carries the message **`stash <ticket-number>`** — e.g. `git stash push -m "stash 273294"`. Nothing else: no dates, no WIP prose, no file lists, no branch names.

**Why:** みや asked for this on 2026-08-04 after a session where fixes had to be parked while he tested a different ticket in a parallel session. The existing stash list had drifted into 20 entries with no shared shape — `2/6/26`, `bugfix`, `WIP on mlk/master: 37587a365a ...`, `239386 MPT — 22 files (Java+xhtml) + L1 override protected/common/; incl. L3 plot-gate eq URS_PT; parked 2026-07-20 ...`. His words: *"We should probably have a stash naming convention as well. Something simple like stash and ticket number is enough."* A stash you cannot identify at a glance is a stash you will not restore.

**How to apply:**
- Push: `git stash push -m "stash <ticket>"` — one ticket per stash, never bundle two tickets' work.
- Find it by **message grep**, never by `stash@{N}` — positions drift every time a new stash lands on top (see (merged above)): `git stash list | grep "stash 273294"`.
- If a ticket genuinely needs two stashes, suffix minimally: `stash 273294 b`.
- Context, reasoning and file inventories go in the quest MD (`projects/coding-projects/active/QA-<n>/QA-<n>.md`), never in the stash message — same discipline as [[Tasks folder file format]].
- Record the stash in the quest's `active.txt` block so a cold resume can find it.

Related: (merged above) · [[Tasks folder file format]]
