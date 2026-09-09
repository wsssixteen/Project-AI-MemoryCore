---
name: feedback_flowable_admin_diagram
description: "🚨 Flowable admin app (…/flowable-ui/admin/#/process-instance/<id>) is BOTH the PROD read surface (diagram = engine truth) AND an in-place WRITE surface (Variables tab Add/Update) — consider a variable edit BEFORE alter or hotfix on any gateway failure; catalogue = etanah-knowledge/UNBLOCK-PLAYBOOK.md U2"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 95051a81-4a1c-4543-ba85-76d5e29dd4e1
  modified: 2026-09-09T02:21:41.945Z
---

For any PROD flowable routing / gateway / wrong-tugasan ticket, the Flowable admin app is the first surface, for reading AND for the quick unblock.

Read (2026-09-08 #278580): when the engine DB is not reachable, open the process-instance diagram; the green node is the engine truth for the current tugasan. Compare to `umm_a_tgsn` via `ind_tgsn.kod`.

Write (2026-09-08 #278218, Perak PROD, audited by an independent Fable pass): the instance page's Variables tab can Add / Update / Delete process variables. A gateway that throws `Cannot resolve identifier '<var>'` or `No outgoing sequence flow` is unblocked by adding the variable the form should have emitted, with the value the code would derive, type string, before the officer clicks Hantar. The token does not move. Caveat: `nextUser*` is wiped at Hantar (`CommonBPMServiceClient.submitBpmOutcome()` `:596-612`), so the companion to set is `pejabatKod`.

Steps.
1. process id from `umm_aliran_kerja.process_instance_id` (latest, `flag_flowable=Y`).
2. Melaka `https://etanah-app.melaka.gov.my/flowable-ui/admin/#/process-instance/<id>` · Perak `https://appspk.perak.gov.my/flowable-ui/admin/#/process-instance/<id>`. miya signs in and clicks; Ruri never types into PROD.
3. Variable name from the gateway `conditionExpression` in the state's `flowables-bpmn/<KEY>.bpmn20.xml`; value from `new BpmNameValue(PelupusanConstant.<CONST>` in the form.
4. Verify after Hantar: successor row in `umm_a_tgsn`, no new error-store row.

Why: on #278218 a day went to deploy forensics while this ten-minute route existed. Mechanics: `etanah-knowledge/melaka/FLOWABLE-KNOWLEDGE.md` §6c (read) + §6d (write), `perak/FLOWABLE-ALTER.md` §2.3, catalogue `etanah-knowledge/UNBLOCK-PLAYBOOK.md`. Related: [[flowable-node-edge-trace]] · [[reference_perak_hotfix_and_error_store]] · [[quick-patch-steal-risk]].
