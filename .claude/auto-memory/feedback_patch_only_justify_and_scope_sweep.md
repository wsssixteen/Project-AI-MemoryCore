---
name: feedback_patch_only_justify_and_scope_sweep
description: "A data-patch-only handback (no code fix same turn) MUST carry (a) the write-path code that caused the bad/missing data + why patch-only, and (b) a scope-sweep SELECT proving how many permohonan are affected and that only they are patched"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3241f471-6355-4e04-8116-26e09ebc0bd9
  modified: 2026-09-07T02:23:30.428Z
---

🚨 When handing back a **data patch with NO code fix applied in the same handback**, two things are MANDATORY, or the patch is not handed over:

1. **Why patch-only** — name the CODE that produced the bad/missing data as a full address `<repo>\path\File.java:line` (the WRITE path, not the crash line), and state why it is a data patch now and not a code change: one-off legacy row · forward creation already prevented · code guard/backfill owed under a separate ticket.
2. **Scope sweep** — the SELECT that swept ALL similar records + its result, proving exactly how many permohonan are affected and that the patch targets ONLY them. NAME this permohonan. No blanket patch without the sweep; no "only this permohonan" claim without the query that proves it.

**Why** (みや 2026-09-07, ADHOC-PRBB-2026-5): on the PROD PRBB `/12` Borang 4Ce NPE, みや asked two things — *"what code caused the data missing?"* and *"you did a good job searching and mentioning only this permohonan — make that mandatory."* A patch with no named cause reads like a blind guess; a "only this one" claim with no sweep is an assertion, not proof.

**The proof shape that satisfied it**:
- Cause = `etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\service\impl\PelupusanSpocService.java` `populateAppPihakBerkepentinganList()` manual-pemohon branch — builds the pihak row from `maklumatPemohonManual` JSON (nama/jenis/noPengenalan/noTel only), never sets address, never backfills from the registered account by IC → blank `bandar_daftar_id` → NPE at `MlkBorang4CeForm.java:477`.
- Sweep = `WHERE id_pengenalan LIKE 'PTMLK/%/L/PRBB/%' AND jns_pemohon_id IS NOT NULL AND bandar_daftar_id IS NULL` → 1 row (`/12`); `/11` already patched under #275501.

**How to apply**: canonical home = `.claude/skills/script-check/SKILL.md` rule 8; the SCRIPT-CHECK emit line carries a rule-8 clause. Code fix shipped in the same handback → `⏭ N/A — code fix applied`. Related: [[feedback_prod_patch_infra_handoff]] · [[feedback_script_check_before_patch]] · [[feedback_data_question_db_first]].
