---
name: feedback_awam_test_scenario_entry_key
description: AWAM test scenarios need a per-urusan ENTRY KEY (carian-rasmi urusan MCL/PSBS/PLTP/PPTPB/PRBB → No Resit Carian Rasmi; PPJK → No Warta+Tarikh); only Pelupusan/staff uses the standard Permohonan ID + login
metadata: 
  node_type: memory
  type: feedback
  originSessionId: cdad55c7-8c42-4190-bc82-985e967bd74c
  modified: 2026-08-20T08:10:48.091Z
---

When preparing a test scenario for an **AWAM** ticket, the entry key differs by urusan — do NOT default to "Permohonan ID + login". That is the **Pelupusan / staff-side** pattern only. Check what extra data the urusan's entry screen demands and provide it in the scenario.

**Why:** みや 2026-08-20 — an AWAM MCL scenario is unrunnable without the **No Resit Carian Rasmi**; the applicant portal starts at `CarianRasmiHakmilikForm.xhtml` and blocks entry until a valid receipt is given. I handed a 276074 scenario with just "any urusan + login" and missed it.

**How to apply:** at test-scenario prep for ANY AWAM ticket, resolve the entry key FROM the urusan first:
- carian-rasmi urusan (**MCL · PSBS · PLTP · PPTPB · PRBB · CRHM\***) → **No Resit Carian Rasmi**, derived from the DB for the target env (4–7 validations, incl. 6-month recency + V6/V7 data-state). Query + validations in `projects/coding-projects/active/etanah-knowledge/melaka/TEST-PERMOHONAN-INDEX.md` § No Resit Carian Rasmi.
- **PPJK** e-Mohon Perizaban → **No Warta + Tarikh Warta** (entry at `AwamSemakanKewujudanRizabForm.xhtml`).
- lesen-renewal flows → **No. Lesen**.
- **Pelupusan / staff** → standard **Permohonan ID + pengguna_semasa login**.

Extend the per-urusan list as new urusan surface. Links: [[feedback_awam_no_permohonan_id]] · [[feedback_pengguna_semasa]]
