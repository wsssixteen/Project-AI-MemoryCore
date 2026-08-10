# Improvement Sweep — 2026-08-10

> DE Step 7.5. Session was a single adhoc (case-insensitive fetch collision, both Melaka repos).
> No quest touched, no fan-out, no code compiled. Small session — the axes are answered honestly,
> including the ones that yielded little.

---

## A1 — Agentic system

**⏭ No fan-out this session.** Two repos, six commands, one controller. Delegating would have cost
more than it returned; the honest note is that the delegation-economy rule was *not* violated by
omission — a task this size correctly stays inline.

One adjacent finding does belong here, because it is about what the controller trusts. DE's
commit-scope rule says *every* modified path in `git status` is staged, authorship is not a filter
— which is correct in general and was actively dangerous tonight. Four files in this worktree were
**older** than `origin/main` (OneDrive sync lag), so their diffs read as deletions: 75 lines out of
`quest/active.txt` reverting QA-273201 to `status=active` and erasing QA-273455's whole cycle-2
rework block, plus the `ENV-ARCHITECTURE.md` and TRAINING-lane rows out of the knowledge index. A
literal reading of the rule commits a regression and calls it a save.

The rule is not wrong; it is missing a precondition. "Stage everything" assumes the working tree is
*newer* than HEAD. In a OneDrive-synced worktree that assumption does not hold.

## A2 — Quest workflow

**⏭ No quest was engaged.** Step 2c had nothing to write, correctly.

Two board findings the boot surfacer produced and nothing consumed: #274136 is assigned-open on
Redmine with no local `active.txt` block, and QA-273956 is locally `active` while Redmine has it
Ready-in-PROD under a different assignee. Both were surfaced at boot, both survived the session
untouched, and both will be surfaced again identically at the next boot. A flag that reprints
unchanged for days is not information any more.

## A3 — Debugging efficiency + accuracy

**The one real finding of the session, and it cost a cycle.**

I applied the `git-health` v1.0 Tier-1 recipe as written — add the negative refspec — and reported
progress on the strength of the case-collision error disappearing. The next fetch failed with
`incorrect old value provided`, because `packed-refs` is a single text file and stays case-sensitive
even on a case-insensitive filesystem, so the stale entries the config could not reach kept winning
the compare-and-swap. The recipe was incomplete and I had trusted it because it was ours.

Two things would have collapsed this:

1. **Verify by repetition, not by absence.** The first fetch was quieter, so it looked fixed. The
   actual proof is the *second* fetch producing no output at all. One clean run of anything
   idempotent proves nothing — it may simply have had work to do.
2. **A recipe we wrote is still a claim.** `verify-before-claim` is applied to code and to the
   database and not, apparently, to our own procedure files. v1.0 had never been executed
   end-to-end; it was written from a design memo on 2026-05-25 and stored as though tested.

Accuracy note in the other direction: I nearly handed back "which `259112` is live?" as a decision
for みや. The `ask-back-gate` caught it, and two commands (`merge-base --is-ancestor`, `rev-list
--count`) answered it completely — both branches merged, zero ahead, his superseded by aaron's. The
gate earned its slot tonight.

## A4 — Etanah issue-solving

**The fix existed and was never generalised.** `etanah-pelupusan` has carried
`^refs/heads/sgr/eSokonganCR/190869` since 2026-05-25 — the identical remedy, applied by hand to the
one branch that hurt that day. Nobody asked how many others there were. The answer was seventeen
folders in awam, and the problem then persisted for two and a half months at a cost of one
irritating error per fetch.

This is the same shape as the day's other session (a field lost in a merge-conflict resolution and
not noticed for four months): a correct local action that never became a sweep.

## A5 — Sweep / file sweep

**Untested assumption found: worktree files can be older than `main`.** DE step 0b checks whether
the *branch* is behind and fast-forwards it. It does not check whether the *working tree* is behind
— and with OneDrive syncing this repo across machines, a file can arrive stale after the merge. The
0b check passed cleanly tonight and the danger was entirely in what it does not look at.

---

## Proposals logged (see `slip-dashboard.md` → 💡 Open proposals)

| # | Axis | Idea | Eval case |
|---|---|---|---|
| 1 | A1 | DE step-10 **stale-overwrite guard** — before staging, for any modified file also touched by commits merged in at 0b, diff it; if the working copy only *removes* content those commits added, hold it out of the commit and surface it | Tonight's four files: `quest/active.txt`, `BRANCH-AND-DEPLOY.md`, `index.md`, `convention-check-gate.js`. Guard must catch all four and stage nothing else differently |
| 2 | A3 | **Idempotent-verify rule** — any fix to a repeatable operation is verified by running it *twice* and asserting the second run is a no-op; "the error stopped" is not the assertion | The refspec fix: fetch #1 succeeded-with-changes and would have passed a single-run check, fetch #2 was the real proof |
| 3 | A3/A4 | **Procedure files carry a last-executed stamp** — a skill's recipe that has never been run end-to-end is marked untested, so it is read as a hypothesis not an instruction | `git-health` v1.0, written 2026-05-25 from a design memo, never executed, incomplete for 2.5 months and trusted anyway |
| 4 | A4 | **Generalise-the-fix prompt at close** — when a fix lands as a config/exclusion/guard scoped to one instance, ask once whether siblings exist, and enumerate them cheaply | The lone pelupusan exclusion from 2026-05-25; one enumeration command would have found all 17 awam folders that day |
| 5 | A2 | **Stale-flag escalation** — a boot flag that reprints unchanged for N boots gets escalated or retired, not reprinted | #274136 missing-from-active.txt and QA-273956 Redmine divergence, both surfaced and unconsumed |

---

*Written at DE close 2026-08-10. Session scope was small; A1 and A2 are honest `⏭` on their primary
question with adjacent findings recorded rather than padded.*
