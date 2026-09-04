---
name: reference-etanah-bpmn-source
description: "Where etanah Flowable BPMN lives (melaka + kedah exports, PLP at root / other modules in subfolders), the parsed form to read instead of raw XML, and the one-download modeler export recipe (don't re-search)"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 7c041fc7-5cfe-4fee-8506-80f07b8e82bc
  modified: 2026-09-04T03:48:12.141Z
---

Etanah Flowable BPMN exports live at `projects/coding-projects/active/etanah-knowledge/<state>/flowables-bpmn/` — **MAIN repo working tree ONLY, ABSENT from worktrees** (a worktree search of `E:\Projects\Melaka` finds nothing — 2026-06-15 wasted tokens re-discovering this).

**Layout (2026-09-04, per みや)**: ROOT = our module only, `MLK_PLP_*.bpmn20.xml` (parents + `SUB_JBTN_TEK → SUB_UPN → SUB_UPW`). Other modules in `<MODULE>/` subfolders (`TKL/ DFT/ BGN/ KKS/ CONSENT/ STR/ LLG/ AMB/ HSL/ SEDIA/ STN/ SKG/ SPC/` — never a folder named `CON`, `PRN`, `AUX`, `NUL`: reserved Windows names, OneDrive refuses them). PLP flows only reach `TKL/` (ST, PPM, CM, CL, CL_LP, PA_B1, B2_PU, PRZ_PU — teknikal-owned), `DFT/MLK_DFT_NOTA_HKMLK`, `HSL/MLK_HSL_ISPEKS`; the rest never touch PLP. Root also carries `_manifest.json` (modeler export list) — 5 stale root files are NOT on the MLIT modeler (`INTEGRASI_TEK`, `MLPS`, `SPP`, `UPL`, `SUB_UPW`; SUB_UPW verified = deployed bytes). `kedah/flowables-bpmn/` mirrors the layout (232 models from `kedit.kedah.gov.my`).

**Read the PARSED form, not raw XML** — `etanah-codemap/bpmn_flow.json` (from `bpmn_flow.py`, reads the ROOT = PLP only, by design): tugasan kods, sequenceFlow graph, serviceTask beans, callActivity module routing (`MLK_TKL_*` = etanah-teknikal — auto-flags the QA-262755 trap). Raw `.bpmn20.xml` is 5–450 KB each.

**Refresh recipe (proven 2026-09-03)**: modeler REST `GET /flowable-ui/modeler-app/rest/models?filter=processes` → `GET …/models/<id>/bpmn20`, bundled in-page into ONE blob download, split by `projects/coding-projects/active/ADHOC-FLOWABLE-2026-1/tools/split_bundle.py` (writes the layout above). Full recipe + Kedah `SUBPROCESS:` annotation convention + deployed-vs-copy checks: `etanah-knowledge/melaka/FLOWABLE-KNOWLEDGE.md` §12. Modeler UI: https://mlit.melaka.gov.my/flowable-ui/modeler/#/processes. Modeler store ≠ engine (`act_re_procdef`, J8).
