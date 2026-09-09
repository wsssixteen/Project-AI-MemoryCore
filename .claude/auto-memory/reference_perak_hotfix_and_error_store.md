---
name: reference_perak_hotfix_and_error_store
description: "🚨 Perak HOTFIX box = http://192.168.18.110:8080/<module> (shares PROD DB, footer Branch Name = build truth); ralat 'ID Rujukan' = ET_SISTEM.PT_APPLICATION_EX_ENTITY (host + Build Time in STACK_TRACE); infra request must name exact ref prk/esokongan/<num> — #278218 hotfix was built from master"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 95051a81-4a1c-4543-ba85-76d5e29dd4e1
  modified: 2026-09-08T10:39:10.201Z
---

**Perak deploy-verification facts (verified 2026-09-08, #278218):**

| Fact | Detail |
|---|---|
| Hotfix box | `http://192.168.18.110:8080/etanah-pelupusan` — reachable from the office network (HTTP 200); shares the PROD DB; `ET_SISTEM.PT_APPLICATION_INSTANCE` 2242 (PROD pelupusan = 2081, `192.168.18.83`) |
| Footer = build truth | `Tarikh Kemaskini` (build time MYT) · `Common Version` · `Module Version` · `Branch Name` (git-commit-id-plugin). A ticket branch off master keeps master's pom, so only `Branch Name` proves the branch |
| Error store | `ET_SISTEM.PT_APPLICATION_EX_ENTITY` — `APPLICATION_EX_ENTITY_ID` = the ID Rujukan on the ralat dialog; `STACK_TRACE` starts with `URL / Application, host:<ip> / Exception message / Build Time`; `CREATED_BY` = login. Query with `DBMS_LOB.INSTR(STACK_TRACE,'<identifier>')>0` |
| Infra request | name the exact origin ref `prk/esokongan/<num>` (check `git ls-remote --heads origin`). `esokongan/278218` did not exist → infra built `master` → fix absent → user re-tested twice, same ralat |
| Staging MCP | `oracle-prk-stag` = `etstagnp` default `ET_MAIN_STAG`; `ET_FLOWABLE_STAG.ACT_HI_VARINST` / `ACT_HI_ACTINST` prove what a deployed fix emitted |

**Why:** 2026-09-08 the "PRK 218 & 109" session found the stale build, then retracted the finding when miya said the hotfix box was not reachable and to trust infra. It was reachable, the footer said `master`, and the error store had two rows from that host with the master Build Time. **How to apply:** on any "fix didn't work" report, read the footer of the exact host the user tested on and pull the error-store rows for that host BEFORE touching code. A finding backed by a live read is not withdrawn on a premise; re-check the premise. Related: [[reference_perak_deploy_flow]] · [[reference_perak_codev_scope]] · [[feedback_verify_before_claim]] · [[feedback_attempt_before_claiming_blocked]]
