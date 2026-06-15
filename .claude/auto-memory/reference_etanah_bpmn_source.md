---
name: reference-etanah-bpmn-source
description: "Where etanah Flowable BPMN lives + the parsed form to read instead of raw XML (don't re-search)"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 7c041fc7-5cfe-4fee-8506-80f07b8e82bc
---

Etanah Flowable BPMN deployment files live at `projects/coding-projects/active/etanah-knowledge/melaka/flowables-bpmn/MLK_PLP_<URUSAN>.bpmn20.xml` — **MAIN repo working tree ONLY, ABSENT from worktrees** (that's why a worktree search of `E:\Projects\Melaka` finds nothing — 2026-06-15 wasted tokens re-discovering this). 22 files (one per urusan + `MLK_PLP_SUB_*` sub-processes + `MLK_*_INTEGRASI_TEK`).

**Read the PARSED form, not raw XML** — `etanah-codemap/bpmn_flow.json` (from `bpmn_flow.py`): compact, token-cheap, holds tugasan kods, the sequenceFlow graph, serviceTask delegate beans, and callActivity module routing (`MLK_TKL_*` = etanah-teknikal — auto-flags the QA-262755 trap). Raw `.bpmn20.xml` is 5–200 KB each + verbose → expensive + error-prone to re-read. General principle: **pre-parse any verbose format (BPMN XML, big configs) once into a lean queryable JSON, then read that** — cheaper + more accurate than re-reading raw each time.

**Latest source (may be newer than local copies)**: Flowable modeler UI at https://mlit.melaka.gov.my/flowable-ui/modeler/#/processes — search `mlk_*`. Use to refresh the local `flowables-bpmn/` copies when a flow may have changed.
