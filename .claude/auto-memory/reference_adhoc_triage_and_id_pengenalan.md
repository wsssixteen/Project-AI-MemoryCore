---
name: reference_adhoc_triage_and_id_pengenalan
description: Adhoc/BA-relay intake → classify via ADHOC-TRIAGE.md first; BA-quoted permohonan ref (PTMLK/../) resolves to aplikasi_id via umm_aplikasi.id_pengenalan
metadata: 
  node_type: memory
  type: reference
  originSessionId: 798ac8d3-7c79-4a74-88b3-8a714e7fe88a
  modified: 2026-08-26T06:07:11.145Z
---

Two intake facts, born from the 2026-08-26 PDTJ jabatan-teknikal adhoc (a simple DATA-QUESTION mishandled as a code trace):

1. **Classify before touching** — every adhoc/BA-relay ask goes through `projects/coding-projects/active/etanah-knowledge/melaka/ADHOC-TRIAGE.md` FIRST: DATA-QUESTION / DATA-PATCH / DIAGNOSIS / CODE-CHECK / FLOW-RECOVERY / ENV-VERSION / CAPABILITY / ACCESS / TEST-DATA / DEPLOY-VERIFY / TEMPLATE — each with a FIRST action + tool order. A relay can carry several asks; triage EACH. Auto-injected by `domain/adhoc-paste-detector` (widened 2026-08-26 to fire on freeform office-code/permohonan-id relays, not only labelled fields).

2. **BA reference → aplikasi_id** — the `PTMLK/02/L/PT/2026/1` string a BA quotes lives in **`umm_aplikasi.id_pengenalan`** (one query: `WHERE id_pengenalan = '<ref>'`). NOT `umm_p_aplikasi.no_rujukan_permohonan` (empty for PT — carries only stray KPM/KPG rows) and NOT the applicant IC. Recipe + trap table now in DATABASE.md §4.1. Before concluding a ref "doesn't exist on this env", test the column against a KNOWN-positive app.

Pairs with [[feedback_data_question_db_first]] (data question → DB-first) and [[feedback_never_hand_miya_a_query]] (I run the SELECT).
