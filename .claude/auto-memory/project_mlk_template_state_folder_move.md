---
name: project_mlk_template_state_folder_move
description: "RESOLVED 2026-09-03 — the #277697 template/MLK → template/state/MLK move was REVERTED on int-env; Melaka pelupusan templates stay at template/MLK/ everywhere. Kept as history in case the move is re-attempted."
metadata:
  node_type: memory
  type: project
  originSessionId: 13603ac8-4ed7-472b-bb74-e8fb10f64204
  modified: 2026-09-03T07:49:00.148Z
---

✅ RESOLVED / REVERTED 2026-09-03. The landmine below is CLOSED — kept only as history.

**What happened**: ticket **#277697** ("Template Logo / State code issue") briefly restructured Melaka pelupusan templates `template/MLK/…` → `template/state/MLK/…` and cherry-picked that onto `mlk/int-env`. On 2026-09-03 Aaron said "remove terengganu, undo the rest" — the state/MLK move was **reverted** (commits `19219814bb` + `cfd472a6d9`), and only the TRG-removal was re-applied (`ef67f4a4c1`, branch `mlk/internal/277697v3`).

**Current truth (verified 2026-09-03, `origin/mlk/int-env` = `d8b6cd20c1`)**:
- All Melaka pelupusan templates live at `template/MLK/…` + `template/MLK/references/…` on **both** `mlk/master` AND `mlk/int-env`.
- `template/state/MLK/` is **gone** (0 files).
- So a template ticket branched off `mlk/master` needs **no path relocation** to reach int-env — paths already match.

**If the state/MLK move is ever re-attempted** (watch for a fresh `template/state/MLK/` folder on int-env), the old trap returns: a master-based template ticket's files would land at the dead `template/MLK/` path and never be served. The fix then was `git mv` each touched template + reference file to `template/state/MLK/` before the int-env merge, and confirm with `git ls-tree -r origin/mlk/int-env --name-only | grep <TemplateName>`.

**#277295 outcome** (PRBB Lampiran A/B): cherry-picked clean to int-env (`c27700141e`) at `template/MLK/` — no relocation needed, because the revert had already restored that path.

Related: [[reference_melaka_env_deploy_paths]] · [[feedback_ba_test_deploy_int_env]].
