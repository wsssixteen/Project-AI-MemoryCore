---
name: feedback_simple_patch_still_needs_analog_check
description: A trivial-looking data-patch ticket STILL needs the Phase-0 prior-identical-ticket / working-analog search before scripting; skipping it ships an incomplete patch
metadata:
  type: feedback
---

🚨 A data-patch ticket that looks like a one-line UPDATE STILL requires the Phase-0 prior-identical-ticket + working-analog check BEFORE writing the script. Grep `quest/active.txt` + the ADHOC-REGISTER + closed tickets by SUBJECT for the same symptom family; read the closest prior ticket's shipped script and match its full shape.

**Why**: 2026-09-15 #279793 (MLPS "Tempat/Wilayah/Lokasi papar PT 1139 → patch to '-'") — I short-cut Phase 0, went straight to grep+DB, and shipped a `tempat='-'`-only patch. The identical prior ticket #278304 (closed 2026-09-04, sitting in active.txt with the same subject) shipped a **2-row / 2-column** fix: `umm_a_permohonan_tnh` row `tempat` **AND** `nama_kawasan_terlibat`='-', PLUS the source `ind_mklmt_tnh_permit_lesen` row `tempat`='-'. My patch missed `nama_kawasan_terlibat` and the source-lesen row. The grid only displays `tempat`, so the visible symptom was fixed and the ticket got Resolved — but the fix did not match the user-verified precedent (data-consistency + a future MLPS renewal re-copies 'PT '||no_lot from the un-patched source lesen).

**Domain fact (MLPS Tempat family #275587 → #278304 → #279793)**: MIGRATOR wrote `tempat = 'PT '||no_lot` on Jasin lesen rows in `ind_mklmt_tnh_permit_lesen`; an MLPS renewal copies land into `umm_a_permohonan_tnh` (`tempat` + `nama_kawasan_terlibat`). Full fix = patch BOTH permohonan columns + the source lesen `tempat`. See [[feedback_simplify_and_reference]] (working-analog-first) and etanah-knowledge BUG-BESTIARY:884 / DATABASE §6.1.

**How to apply**: at ANY data-patch ticket, before emitting the script, run the prior-ticket search and cite the closest precedent's shipped shape in the Rubric. If a column/row the precedent patched is not in my script, either include it or state why it is out of scope. Never let "it's just a patch" skip the analog read.
