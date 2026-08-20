---
name: bpmn-check
description: BPMN change checklist for eTanah Flowable models — MANDATORY before speccing ANY modeler change (gateway, sequence flow, condition, callActivity map, new task), before handing miya modeler click-paths, before publishing a .bpmn20.xml fix, AND whenever miya asks a flowables question ("our flowables", "the flow", "expected flow", "tugasan pergi ke", "kenapa tugasan", routing between tugasan). Triggers — "bpmn-check", "/bpmn-check", "check the bpmn", "flowable", "flowables", "modeler change", "gateway condition", "sequence flow condition", "out parameter", "publish the model", "expected flow", "tugasan flow", any quest whose fix layer is Flowable/BPMN. FIRST ACTION on invoke — load projects/coding-projects/active/etanah-knowledge/melaka/FLOWABLE-KNOWLEDGE.md (§11 ownership + tugasan-resolution FIRST). Deterministic half runs via `node domain/bpmn-check/bpmn-check.js <file> [--baseline <old>]`; this skill owns the judgment half the validator cannot see.
---

# bpmn-check — the judgment checklist (v1.0, born via core/forge.js, QA-274914 2026-08-19)

> Why this exists: in ONE quest, four BPMN mistakes shipped or nearly shipped —
> the missing `<flowable:out>` (the ticket's original bug), a bare-EL crash on mlit
> (`Cannot resolve identifier 'pembetulanPP'`), a wrong discriminator variable
> (pembetulanUnit hijacked the Charting-Mohon correction), and a
> gateway-on-shared-path design the senior replaced with the in-corpus
> dedicated-task pattern. The validator catches structure; THIS checklist catches
> meaning. Full post-mortem + corpus census: domain/bpmn-check/README.md.

## Step 0 — run the validator first

- Locate/export the `.bpmn20.xml` → `node domain/bpmn-check/bpmn-check.js "<file>" --baseline "<pre-change file>"`
- Every 🚨 fixed; every ⚠ ANSWERED in writing (not waved through).

## Step 1 — the 10 judgment checks (emit the table, one verdict per row)

| # | Check | The question to actually answer |
|---|---|---|
| J1 | **Ticket-verbatim flow** | Write the BA's expected flow VERBATIM (task → task). Does the token's path match word-for-word — with NO visible task in between that BA didn't name? (Gateways are invisible to the officer; tasks are not. The Isu-1 miss: analogs route via Charting Mohon, BA's A7 said SKM → Penyediaan Laporan Tanah direct.) |
| J2 | **Variable semantics pinned** | For EVERY variable in a new/changed condition: WHO writes it (Java file:line or child out-map), WHEN, full value-space, and who ELSE uses the same variable. Prove the discriminator with a live-engine query (`act_hi_varinst` / `act_ru_variable`), never by name resemblance. (pembetulanUnit is ALSO set by the Charting-Mohon correction — name told a different story than the engine.) |
| J3 | **Dedicated-task over gateway-on-shared-path** | If a correction/variant must return somewhere different: COPY the task (PLTP "Semakan Kemasukan Maklumat (PP)" / PPTPB "(Pembetulan)" pattern) with ONE unconditional exit — do NOT bolt a conditional gateway onto a shared node. A dedicated task cannot misroute and cannot throw. |
| J4 | **Null-safety on writer-less paths** | Can ANY live token — especially a MIGRATED old process (migration moves the definition pointer ONLY, never backfills vars: CommonBPMServiceClient.java:448-533) — reach the new condition without the var set? Bare `${var==}` throws PropertyNotFoundException; `${execution.getVariable("var")==}` returns null → default. Corpus norm is bare (2028 vs 2) — bare is fine ONLY with a guaranteed writer on every inbound path. |
| J5 | **Child↔parent map audit** | Every var the parent routes on after a callActivity → in that callActivity's `<flowable:out>`? Every var the child needs → `<flowable:in>`? Diff the SAME child's maps against 2 sibling urusan (corpus: projects/coding-projects/active/etanah-knowledge/melaka/flowables-bpmn). The original QA-274914 bug was exactly a missing out. |
| J6 | **Loop termination** | For any correction loop: what MECHANICALLY resets the routing var so the second pass exits? Name the resetter (out-map + mandatory form field, listener, …). "The officer will pick Tidak" counts only if the field is mandatory. |
| J7 | **Shared-kod consequences** | New task reusing an existing kod: dedup is by engine taskId; config lookup is by kod+urusan (BpmCallbackService.java:378-384, :779-781) → same skrin, same peranan, same agihan for both tasks. Confirm that is wanted. |
| J8 | **Deployed-version reality** | Which engine is being tested? stg2 / mlit / PROD carry INDEPENDENT versions AND different child-model versions (mlit's MLK_TKL_ST throws on skipPTB where stg2's does not). Read `act_re_procdef.version_` on THAT engine — never trust a file. Stuck processes need Migrate Flowable BEFORE retest, and migrated tokens keep old vars (J4). |
| J9 | **Test-permohonan health** | The test app must reach the changed node ORGANICALLY (upstream vars set). An Init-Altered app entering a child mid-flow with unset vars (skipPTB) throws §10.1. Verify live task state + `act_ru_variable` BEFORE handing it over (memory: feedback_verify_permohonan_health_before_test). |
| J10 | **Blast radius by inbound census** | List EVERY inbound edge of each changed node (SKM had 3 entry paths — a changed exit affects ALL of them). Then list every OTHER urusan calling the same child model — a child-side change is multi-urusan by construction. |
| J11 | **Ownership boundary + tugasan resolution** (FLOWABLE-KNOWLEDGE.md §11) | For EVERY tugasan the BA names: resolve kod → owning model (parent userTask = ours · inside MLK_TKL_* = TEKNIKAL team, we cannot edit) → page → live holder, BEFORE flow reasoning. Our fix surface = the PARENT model only (route into child + receive it back). In-child flow or page bugs = cross-team handoff. |

## Step 2 — hand-off discipline (modeler click-paths for miya)

- Identify every arrow by **source-node → target-node pair**, never by label alone (two arrows can share a label/condition — the "which fucking arrow" incident).
- One instruction per arrow · state the Default-flow tick explicitly · name what must NOT be touched.
- After miya applies: get the exported XML (or re-pull the model) and re-run Step 0 on it — the APPLIED model is the truth, not my spec.

## Banned

- Speccing a modeler change without Step 1's table emitted.
- Declaring a BPMN fix "complete" while any BA-named flow segment is unverified (J1).
- Choosing a routing variable without live `act_hi_varinst` proof (J2).
- Handing a test permohonan without J9's health check.
