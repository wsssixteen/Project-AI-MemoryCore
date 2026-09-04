---
name: flowable-node-edge-trace
description: "🚨 Before selecting OR asserting ANY BPMN target node (Initiate & Alter / Alter / Move on the Flowable Alter Page, or \"where does this route next\"), TRACE its real incoming+outgoing sequenceFlows from the .bpmn20.xml — never pick by node NAME or intent. Two nodes can share the same receiveUserTask kod and differ ONLY by edges."
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
