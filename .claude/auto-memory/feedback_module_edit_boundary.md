---
name: feedback_module_edit_boundary
description: "We only EDIT etanah-awam + etanah-pelupusan; common = pass/handoff; spoc (etanah-spoc-hasil) = never edit, cater from our side"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 57f2051a-5630-4266-ac01-a39e448c0c48
  modified: 2026-08-21T01:45:43.808Z
---

🚨 GENERAL RULE (みや 2026-08-21): we do **NOT** edit other modules' code. We edit ONLY **etanah-awam** and **etanah-pelupusan**.

- **etanah-common** — do NOT edit freely; "the least we can do is pass it if it's common" = hand off / propose to the common-owning team (a minimal common change only if explicitly agreed).
- **etanah-spoc-hasil (SPOC)** — NEVER edit. If a bug's root write is in spoc, **cater it from our side** (pelupusan/awam) — find a hook in a screen/tugasan WE own that can override or correct the behaviour, rather than fixing spoc's code.

**Why**: module ownership boundary — other teams own spoc/common; our commits there aren't wanted and won't be merged. **How to cater**: a bug can be ROOT in spoc/common but the fix is placed where OUR module reads/renders/validates the data (e.g. re-derive a flag at our tugasan's load time, like the AWAM `resetFlagWajibForPelupusan` pattern), correcting the shared data before it bites.

**Worked example** — QA-276549 (PRBB counter doc-mandatory): root write is `etanah-spoc-hasil PopulateDataUtil.populateAppDokumenKemasukanBySemakanDokumen:965` (spoc — off-limits). Cater from pelupusan: the SKM tugasan is `MlkSemakanPermohonanForm` (pelupusan), so re-derive/override the doc `adalahWajib` for SCR + PLP_RESITCUKAI there, keyed on `tarafTanah` (from `umm_aplikasi.mklmt_tmbhn`).

Related: [[feedback_stay_in_module]] · [[feedback_cross_module_handoff_artifact]] · [[feedback_cross_module_alert_at_intake]]
