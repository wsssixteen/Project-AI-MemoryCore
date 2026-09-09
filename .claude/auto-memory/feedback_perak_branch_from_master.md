---
name: perak-branch-from-master
description: 🚨 Perak quest = pull origin/master then branch prk/<tracker>/<num> off origin/master; never assume base or use prk/master
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 50e910ed-bdd4-4986-8675-e439a10dbaaa
  modified: 2026-09-07T07:42:48.591Z
---

🚨 Perak (PTPK / eSOKONGAN PERAK) quest branching, per みや 2026-09-07: ALWAYS `git checkout master && git pull --ff-only origin/master` FIRST, then branch `prk/<tracker>/<num>` off `origin/master`. There is NO `prk/master`. behind-count uses `origin/master`.

**Why:** I branched off `prk/stag-env` after finding master 1297 commits behind — みや overrode: the rule is master-based regardless. master is a release line (`release/1.73.x`), 0 ahead / 1297 behind stag-env (fully contained in it); the shared file (`SuratTemplateForm.java`) is ~identical on both (4456 vs 4457 lines) so master is a sound base. BA still tests on `prk/stag-env` (host `appspkstg.perak.gov.my`), so after committing to the ticket branch: merge to master (release) AND deploy to stag-env for BA.

**How to apply:** the FIRST quest action for any PTPK ticket is a fetch+pull of the state's repo (`E:\Projects\Perak\etanah-pelupusan`), then branch off origin/master. NEVER claim "no fix exists" for Perak without a fresh fetch (that was the 2026-09-07 false-claim slip — I ran git log on a 1297-behind un-fetched local). Canonical in `system/states.json` perak.trunk_ref=`origin/master` + branch_note, and `perak/BRANCH-AND-DEPLOY.md` §1. Related: [[state-aware-knowledge-load]] · [[no-name-in-branches]].
