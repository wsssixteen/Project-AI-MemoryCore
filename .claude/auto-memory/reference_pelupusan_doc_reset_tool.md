---
name: pelupusan-doc-reset-tool
description: "To re-test a regenerated Pelupusan document (L1e/4Ae/surat etc.), the \"reset\" = DELETE the related generated documents via PelupusanMaintenanceForm.xhtml — not SQL, not the flow auto-delete"
metadata: 
  node_type: memory
  type: reference
  originSessionId: a33c1df2-526f-458d-b2b8-b00a7858ef17
  modified: 2026-08-11T02:24:32.398Z
---

For "reset the generated document so it regenerates on re-test" on Pelupusan tickets, the reset is: **delete the related generated documents** using the internal maintenance tool at
`https://etanah-app.melaka.gov.my/etanah-pelupusan/protected/internal/PelupusanMaintenanceForm.xhtml`
(per みや, QA-273621, 2026-08-11).

Two mechanics I earlier proposed and みや corrected — do NOT default to them for this family:
- `status_id=NULL` SQL patch on `umm_a_dok_keluaran` — that was **#273956**, a *template-letter* (generateSurat) mechanic, a DIFFERENT ticket type.
- `pembetulan=true` flow auto-delete (`MlkLaporanL1eForm.overridePostSubmitMethod:207-211`) — inferred from code, NOT the operative test-reset みや uses.

⚠️ Provisional — みや flagged I'm new to this ticket family and told me not to be over-sure. Confirm the tool's exact delete scope before asserting it in a fix/hand-back. Related: [[feedback-ticket-type-vocab-tracking]] · [[reference_dms_document_patch]].
