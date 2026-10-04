---
name: flowable-node-edge-trace
description: "trace real sequence flows before picking a node; admin app = PROD diagram + variable edit; BPMN source + export recipe; Petaling archive"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 03a62411-c3c7-4d25-98b4-5c5cbd94ec19
  modified: 2026-09-03T07:35:44.271Z
---

🚨 **Selecting a Flowable/BPMN target node by NAME or intent is BANNED. Resolve it by the graph edges.**

Two userTasks can carry the **identical** `receiveUserTask("<kod>","<peranan>")` — so the resulting `umm_a_tgsn` row (kod, peranan, pengguna) looks the same either way. They differ ONLY in their **sequenceFlow edges**. Picking the wrong twin misroutes the token even though the dashboard/DB looks correct.

**How to apply — emit a Node Edge-Trace table BEFORE any target pick or routing claim:**

| node id | name | receiveUserTask(kod,peranan) | INCOMING (source · condition) | OUTGOING (target · condition) | outgoing matches intended real next step? |
|---|---|---|---|---|---|

- Grep the `.bpmn20.xml` for the node's `id` to get every `sequenceFlow` where it is `sourceRef`/`targetRef` + the `conditionExpression`.
- The decider is the **OUTGOING** edge: where does completing this node actually send the token? That must equal the intended business next-step.
- If two candidate nodes share a kod, the one to pick is decided by edges + the variables that gate them (`pembetulanUnit`, `pembetulanPP`, `keputusan`, …), never by the name suffix.

**Why** (2026-09-03, QA-277926 — PROD): recovering a stranded MCL permohonan via Initiate & Alter, I picked **"3.0 Semakan Kemasukan Maklumat (Pembetulan)"** over the plain **"3.0 Semakan Kemasukan Maklumat"** purely on the name + "it came from a Pembetulan decision". Both are `receiveUserTask("SKM","PT")`, so the restored `umm_a_tgsn` row looked correct. But the (Pembetulan) node's **only outgoing edge** goes to `6.0 Penyediaan Laporan Tanah` (`MLK_PLP_MCL.bpmn20.xml` L710 → sid-E79BD73D) — it is the correction loop for the *Laporan Tanah* step, not the Borang-12A entry correction. The plain SKM (sid-DC02FA30) is the main-flow kemasukan node. One `grep` of the node id's edges — which I skipped — would have caught it before it hit PROD. Same family as the label→kod ban (resolve by the reference graph, not name resemblance) and verify-before-claim.

---

## Merged 2026-10-04: feedback_flowable_admin_diagram (was feedback_flowable_admin_diagram.md)

> 🚨 Flowable admin app (…/flowable-ui/admin/#/process-instance/<id>) is BOTH the PROD read surface (diagram = engine truth) AND an in-place WRITE surface (Variables tab Add/Update) — consider a variable edit BEFORE alter or hotfix on any gateway failure; catalogue = etanah-knowledge/UNBLOCK-PLAYBOOK.md U2

For any PROD flowable routing / gateway / wrong-tugasan ticket, the Flowable admin app is the first surface, for reading AND for the quick unblock.

Read (2026-09-08 #278580): when the engine DB is not reachable, open the process-instance diagram; the green node is the engine truth for the current tugasan. Compare to `umm_a_tgsn` via `ind_tgsn.kod`.

Write (2026-09-08 #278218, Perak PROD, audited by an independent Fable pass): the instance page's Variables tab can Add / Update / Delete process variables. A gateway that throws `Cannot resolve identifier '<var>'` or `No outgoing sequence flow` is unblocked by adding the variable the form should have emitted, with the value the code would derive, type string, before the officer clicks Hantar. The token does not move. Caveat: `nextUser*` is wiped at Hantar (`CommonBPMServiceClient.submitBpmOutcome()` `:596-612`), so the companion to set is `pejabatKod`.

Steps.
1. Start from the stuck row's `umm_a_tgsn.id_bpm_task` → Melaka `https://etanah-app.melaka.gov.my/flowable-ui/admin/#/task/<id_bpm_task>`. On that page click the blue id next to **"Process Instance"** (check **"Process definition"** under it — e.g. `MLK_PLP_SUB_UPN:3` = the called child). NOT the task page's own Variables tab (task-local), and NOT `umm_aliran_kerja.process_instance_id` (main process only — wrong instance when the tugasan sits in a called `MLK_PLP_SUB_*`; #281319 slip, #281638 wording slip 2026-09-28: say the on-screen label, never "Process instance → child").
2. The link opens `…/flowable-ui/admin/#/process-instance/<id>` (Perak `https://appspk.perak.gov.my/flowable-ui/admin/#/process-instance/<id>`) → Variables tab → Add. miya signs in and clicks; Ruri never types into PROD.
3. Variable name from the gateway `conditionExpression` in the state's `flowables-bpmn/<KEY>.bpmn20.xml`; value from `new BpmNameValue(PelupusanConstant.<CONST>` in the form.
4. Verify after Hantar: successor row in `umm_a_tgsn`, no new error-store row.

Why: on #278218 a day went to deploy forensics while this ten-minute route existed. Mechanics: `etanah-knowledge/melaka/FLOWABLE-KNOWLEDGE.md` §6c (read) + §6d (write), `perak/FLOWABLE-ALTER.md` §2.3, catalogue `etanah-knowledge/UNBLOCK-PLAYBOOK.md`. Related: [[flowable-node-edge-trace]] · [[reference_perak_codev_scope]] · [[quick-patch-steal-risk]].

---

## Merged 2026-10-04: reference-etanah-bpmn-source (was reference_etanah_bpmn_source.md)

> Where etanah Flowable BPMN lives (melaka + kedah exports, PLP at root / other modules in subfolders), the parsed form to read instead of raw XML, and the one-download modeler export recipe (don't re-search)

Etanah Flowable BPMN exports live at `projects/coding-projects/active/etanah-knowledge/<state>/flowables-bpmn/` — **MAIN repo working tree ONLY, ABSENT from worktrees** (a worktree search of `E:\Projects\Melaka` finds nothing — 2026-06-15 wasted tokens re-discovering this).

**Layout (2026-09-04, per みや)**: ROOT = our module only, `MLK_PLP_*.bpmn20.xml` (parents + `SUB_JBTN_TEK → SUB_UPN → SUB_UPW`). Other modules in `<MODULE>/` subfolders (`TKL/ DFT/ BGN/ KKS/ CONSENT/ STR/ LLG/ AMB/ HSL/ SEDIA/ STN/ SKG/ SPC/` — never a folder named `CON`, `PRN`, `AUX`, `NUL`: reserved Windows names, OneDrive refuses them). PLP flows only reach `TKL/` (ST, PPM, CM, CL, CL_LP, PA_B1, B2_PU, PRZ_PU — teknikal-owned), `DFT/MLK_DFT_NOTA_HKMLK`, `HSL/MLK_HSL_ISPEKS`; the rest never touch PLP. Root also carries `_manifest.json` (modeler export list) — 5 stale root files are NOT on the MLIT modeler (`INTEGRASI_TEK`, `MLPS`, `SPP`, `UPL`, `SUB_UPW`; SUB_UPW verified = deployed bytes). `kedah/flowables-bpmn/` mirrors the layout (232 models from `kedit.kedah.gov.my`).

**Read the PARSED form, not raw XML** — `etanah-codemap/bpmn_flow.json` (from `bpmn_flow.py`, reads the ROOT = PLP only, by design): tugasan kods, sequenceFlow graph, serviceTask beans, callActivity module routing (`MLK_TKL_*` = etanah-teknikal — auto-flags the QA-262755 trap). Raw `.bpmn20.xml` is 5–450 KB each.

**Refresh recipe (proven 2026-09-03)**: modeler REST `GET /flowable-ui/modeler-app/rest/models?filter=processes` → `GET …/models/<id>/bpmn20`, bundled in-page into ONE blob download, split by `projects/coding-projects/active/ADHOC-FLOWABLE-2026-1/tools/split_bundle.py` (writes the layout above). Full recipe + Kedah `SUBPROCESS:` annotation convention + deployed-vs-copy checks: `etanah-knowledge/melaka/FLOWABLE-KNOWLEDGE.md` §12. Modeler UI: https://mlit.melaka.gov.my/flowable-ui/modeler/#/processes. Modeler store ≠ engine (`act_re_procdef`, J8).

---

## Merged 2026-10-04: reference_petaling_flowable_deployments (was reference_petaling_flowable_deployments.md)

> Past Flowable/BPMN deployment diagrams archived on the Petaling server at /home/ftpuser/files/flowable-diagrams — check here before assuming a BPMN version was never deployed

Past Flowable/BPMN deployment files (the `.bpmn20.xml` diagrams that were actually pushed to engines) are archived on the **Petaling server** under:

`/home/ftpuser/files/flowable-diagrams`

Use this path to check the history of past flowable deployments — i.e. which BPMN version/shape was deployed and when — before concluding a corrected diagram "was never deployed" or before preparing a redeploy. Complements (merged above) (the modeler is the live source; this ftp path is the deployment archive).

Host/IP for "Petaling" not yet pinned in this note — confirm with みや / cross-ref [[feedback-commit-deploy-runbook]] when an actual SSH is needed.
