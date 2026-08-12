---
name: feedback_template_ticket_data_patch
description: "Template ticket where a CC renders data → ALSO hand miya a VERIFY/PATCH SQL script for the data behind the CC, not just the code fix"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 97579cbe-6ede-4df5-bab3-b37436d781ae
  modified: 2026-08-12T11:45:20.861Z
---

🚨 On ANY etanah template (.docx) ticket where a content control renders per-application DATA (owner list, syarat, hakmilik, bayaran rows), fixing the CC tag / populator is only HALF the job — the template is a VIEW over DB data. I MUST also trace the CC → its data source and hand miya a **raw VERIFY SELECT** showing the actual rows the CC will render for the test permohonan, AND (if the test data is thin/missing) a **PATCH script** to populate it so the real / multi-row case can be exercised. Also state the coverage gap explicitly at hand-back.

**Why:** QA-273921 (2026-08-12) — we fixed `tanahDimilikiTable`→`pemilikBerdaftar` (nested-table hang), but the test permohonan `PTMLK/02/L/PPTPB/2026/6` has only 1 registered owner, so miya could NOT test the multi-owner `2)`/`3)` numbering, and I never offered a script to verify the owner rows or add a second owner. miya: *"WE KNEW THE CC TAG WAS PROBLEMATIC, BUT YOU FAILED TO SUGGEST TO ME THE SCRIPT TO PATCH THE MISSING DATA THAT WAS SUPPOSED TO USE THE CC TAG WE WERE FIXING."*

**How to apply:** at template-quest Recon/hand-back — (1) VERIFY SELECT (raw columns, run-connected-to-target-schema, no JOIN per [[feedback_never_hand_miya_a_query]] convention) of the CC's data rows; (2) PATCH script if data is thin; (3) coverage-gap line ("1 owner in test data → single-row tested, multi-row code-verified only"). Banned: shipping a data-rendering CC fix with no verify/patch script. Enforced by the `word-ui-vocab-gate` template-ticket emit + [[feedback_show_evidence_script_or_code]]. Nested-table mechanism + this rationale banked in etanah-knowledge `WORD-TEMPLATE-RENDERING.md` §4-5.
