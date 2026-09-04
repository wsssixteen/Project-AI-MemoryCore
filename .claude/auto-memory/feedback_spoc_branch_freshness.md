---
name: feedback_spoc_branch_freshness
description: "🚨 Local E:\\Projects\\Melaka\\etanah-spoc-hasil checkout is a Perak-merged `master` (stale for Melaka); deployed Melaka SPOC = origin/mlk/stag-env (STG) / mlk/int-env / mlk/release/x — read via git show/grep on the remote ref, and verify branch freshness before ANY \"0 hits in SPOC\" negative"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 749395d5-4aa3-4094-a978-6969d625ae2d
  modified: 2026-09-02T07:58:30.796Z
---

The local `etanah-spoc-hasil` working tree is NOT Melaka code. On 2026-09-02 it sat on `master` at a 2026-08-13 Perak release merge (pom 0.1) with zero Ganti Hari UI, while STG ran Melaka SPOC from `origin/mlk/stag-env` (pom 3.0.0) which has the full PRBB Ganti Hari counter page (`MelakaStrategy.java` radio 1 Baru / 2 Ganti Hari / 3 Langkau Tahun, `protected/mlk/perserahan/component/maklumatPerserahan/MaklumatPermohonanJenisDanTujuanPermitPRBB.xhtml`).

**Why:** I asserted "SPOC has zero Ganti Hari code" and "SPOC saves nothing" from the stale local tree and built a whole SPOC handoff on it. A grep negative is only as good as the branch it ran on.

**How to apply:**
- Before any SPOC claim: `git -C E:\Projects\Melaka\etanah-spoc-hasil fetch origin '+refs/heads/mlk/*:refs/remotes/origin/mlk/*'` (read-only, no checkout — spoc is never-edit), then `git grep -n <pat> origin/mlk/stag-env -- src` and `git show origin/mlk/stag-env:<path>`.
- Pick the ref by env: STG = `origin/mlk/stag-env`; internal = `origin/mlk/int-env`; a release = `origin/mlk/release/<x>`. State the ref in every cite.
- Emit the branch + last-commit date of whatever tree a negative was grepped on. A "0 hits" without that line is not evidence.
- Same discipline for etanah-awam / etanah-pelupusan: `git branch --show-current` + `git log -1` before trusting a negative.

Related: [[feedback_module_edit_boundary]] · [[feedback_attempt_before_claiming_blocked]] · [[feedback_verify_before_claim]]
