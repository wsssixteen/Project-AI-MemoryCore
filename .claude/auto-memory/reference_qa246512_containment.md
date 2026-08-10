---
name: reference_qa246512_containment
description: "#246512 (PTG/PPJK template fixes) containment — in master + all releases 1.1.0→1.3.1 + int-env; BUT the 06-26 \"missing points PTG template ppjk\" commit was REVERTED same day so that one change is live nowhere"
metadata: 
  node_type: memory
  type: reference
  originSessionId: b36b075d-5080-40f6-aef4-2649e5631270
  modified: 2026-08-10T01:48:39.618Z
---

**#246512** = a series of Melaka pelupusan **PPJK/PTG Word-template** fixes (KeputusanSyorPTG not displayed, template PPJK numbering, "ppjk tolak"). Branches: `mlk/qa/246512` + `mlk/qa-246512` … `v6` (etanah-pelupusan). Verified 2026-08-10.

**Containment** (by branch-tip ancestry, per BRANCH-AND-DEPLOY §3 — never hunt the env merge commit):
- Main body of fixes (merged Apr 7 → Jun 22, through v5 + the 06-22 "template ppjk tolak" fix): **in `mlk/int-env`, `mlk/master`, and every release `1.1.0`→`1.3.1`.** Any PROD build ≥ release 1.1.0 (built 2026-07-28+) carries them.
- 🚨 **The v6 tip `83e1427f` "#246512 - missing points PTG template ppjk" (2026-06-26) was REVERTED the SAME DAY by `b1ee3c12`.** Both the commit and its revert propagated everywhere, so the *net effect* = that specific change is **live in no environment**. If the "missing points on PTG template PPJK" symptom resurfaces, know the prior fix for it was pulled — it is NOT a regression of shipped code, it was never shipped.

**How re-checked**: `git merge-base --is-ancestor <sha> origin/mlk/<branch>` for each env/release tip; `git log --grep=246512` on master/int-env. Effective PROD state = everything through v5 + 06-22 fix, minus the reverted 06-26 change.
