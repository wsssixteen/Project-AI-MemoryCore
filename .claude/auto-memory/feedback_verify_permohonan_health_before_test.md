---
name: feedback_verify_permohonan_health_before_test
description: "Before handing miya a test permohonan, verify it can ACTUALLY run the target flow — not a broken/force-positioned one whose upstream Flowable variables are unset"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1a7da135-85bf-4ba2-be65-9ff1283730e7
  modified: 2026-08-18T12:25:49.031Z
---

🚨 Before handing miya ANY test permohonan, verify it is a PROPER one that can actually run the target step — never a broken one or one force-positioned into the middle of a flow whose upstream variables are unset.

**Why:** 2026-08-18 QA-274914 (PPTPB, mlit). I handed two apps to be Init-Altered straight into **Penyediaan Laporan Tanah**. That teknikal child `MLK_TKL_ST` starts with an exclusive gateway "skipPengagihan?" (`sid-512991E7`) whose only arms are `${skipPTB == "false"}` / `${skipPTB == "true"}` and it has **no default**. Init-Alter skipped the upstream steps that set `skipPTB`, so `skipPTB` was blank → neither arm matched → `org.flowable.common.engine.api.FlowableException: No outgoing sequence flow of the exclusive gateway '…' could be selected`. miya hit it twice; the fix was fine, the test data was not.

**How to apply — before offering a test app:**
- Prefer a permohonan that reaches the target tugasan **ORGANICALLY** (submit through the real flow), so all gateway variables are set — never one Init-Altered into the middle of a teknikal sub-flow.
- If you must Init-Alter, set the required Flowable Variables in the alter screen (e.g. `skipPTB=false`), Reset Flowable Variables = **No** (copies previous vars). See [[project_local_deploy_hibernate_overlay]] family + FLOWABLE-KNOWLEDGE §6/§8b (bare-variables trap).
- A gateway with all-conditional arms + no default throws this exact error when its variable is unset (FLOWABLE-KNOWLEDGE §10.1). If a handed app might land on such a gateway with a blank var, it is NOT a proper test app.
- Health-check the app first: does it have a live engine task, is it on the migrated version, are the flow variables the target gateway reads actually set.
