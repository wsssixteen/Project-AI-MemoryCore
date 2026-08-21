---
name: feedback_common_ticket_line_triage
description: "Common-scoped ticket → run the line-resolution triage at Phase 0 (owner-already-fixed? which common LINE is the fix on vs which line the target env builds? superset gate) BEFORE editing or planning a deploy — env builds mlk/beta, not mlk/master"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c99ab2f2-726b-47d6-98ad-45f6d8380746
  modified: 2026-08-21T08:29:31.600Z
---

🚨 When a ticket's fix lives in **etanah-common**, run this FIXED triage at Phase 0 (and before any deploy) — do NOT start editing common or planning a bump until all 5 answers are in hand. This is what stops the mid-deploy discovery.

## Common-ticket line-resolution triage (5 steps)

1. **Owner already fixed it?** — `git -C etanah-common log --oneline --all --grep="<ticket>"`. If a colleague (e.g. arkanharyo, the common team) already committed it → do NOT re-edit common; their version is canonical. Revert any local common edit of mine. (common = handoff per [[feedback_module_edit_boundary]].)

2. **Which common LINE is the fix on?** — `git -C etanah-common branch -r --contains <fix-sha>`. Note whether it's on `mlk/master`, `mlk/beta`, a release branch, or only an esokongan branch.

3. **Which common LINE does the target env build from?** — read the module pom pin on the env branch:
   `git -C etanah-pelupusan show origin/mlk/<env>:pom.xml | grep etanah.common.version`.
   🚨 **int-env AND staging build the common `mlk/beta` lane** (pin shape `1.3.x-MLK.beta.patchN`, a commit on `origin/mlk/beta`). `mlk/master` common is a SEPARATE/diverged lineage — a fix committed only to master is NOT on the lane int-env builds.

4. **Superset gate** (deploy skill §4b) — the version you'd bump the pin TO must be a superset of what the env currently pins, or the bump silently drops other tickets' fixes:
   `git -C etanah-common merge-base --is-ancestor <env-current-pin-commit> <new-version-commit>` → must be YES.

5. **Decide (no stop needed):**
   - Fix on the SAME lane the env builds **and** superset holds → bump the module env pin to the fix's version → deploy. (deploy §4b bump path.)
   - Fix on a DIFFERENT lane (e.g. `mlk/master`) than the env builds (`mlk/beta`) → the fix must be merged onto the env's lane + a NEW beta patch cut → **flag the common team** (arkanharyo) to do it; only cherry-pick onto `mlk/beta` + cut the patch ourselves with みや's explicit nod.
   - Fix not committed anywhere → hand Fix A to the common team.

## Why (2026-08-21, QA-276549)
I edited `CommonSemakanPanelForm.java` myself and started a deploy, THEN discovered: arkanharyo had already committed the fix (`4e4a052907`, released as common `1.3.10-MLK` on `mlk/master`), but int-env's pelupusan pins `1.3.9-MLK.beta.patch` off `mlk/beta`, and `mlk/beta` had **797 commits master lacked** (#276465/#264470/#268928…). Bumping int-env to 1.3.10-MLK would have DROPPED all 797. The fix was on the wrong lane for int-env. Every fact was one `git` query away at Phase 0 — running the triage first turns this whole blocker into a one-line "flag common to put it on beta."

## How to apply
Common scope detected (fix site under `etanah-common\`) → emit the 5 triage answers as a table BEFORE any common edit or deploy card. Related: [[feedback_module_edit_boundary]] · [[feedback_cross_module_alert_at_intake]] · deploy skill §4b.
