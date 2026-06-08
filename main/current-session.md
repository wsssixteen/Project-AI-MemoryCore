# 🌟 Current Session Memory - RAM

**Current session**: 2026-06-09 (Tue, early AM ~02:58 MPST). Theme: **QA-264293 (MLPS "Dikeluarkan" date) — wrong-fix → Scout/Recon/Rubric re-do → correct writer-side fix committed+pushed. QA-264347 done earlier; QA-262762 ghost cleaned.**

## High-Level Objective (AGENT_STATE)
- QA-264293: make Borang 4Ae + L1e show the correct "Dikeluarkan" (issue) date after Tandatangan.

## Current Progress (AGENT_STATE)
- **QA-264293 — fix committed + pushed (data verified; display NOT fully verified)**:
  - **Root cause** (via Scout→Recon→Rubric workflow): writer/reader **STORE MISMATCH**. Report reads `PelupusanReportMethodConstant.populateTarikh()` 3-tier fallback → Tier-1 `ind_versi_permit_lesen.trkh_keluaran` (NULL) → Tier-2 `AppPermitLesen.maklumat_tambahan` JSON key `tarikhKeluaran` (DB col `umm_a_permit_lesen.mklmt_tmbhn`) → Tier-3 `trkh_tamat` (NULL) → else `DateProvider.getDate()` baked into the stored PDF. Writers wrote `tarikhKeluaran` to the WRONG table (`ind_versi_permit_lesen.mklmt_bayaran`); the on-path apl-writer `saveMaklumatPermitLesen` never wrote the key. So all tiers empty → fell to the render-day fallback, frozen into the DMS PDF.
  - **Fix (sign-day, per みや)**: new `PelupusanService.stampTarikhKeluaranAppPermitLesen(Aplikasi, Date)` writes the `tarikhKeluaran` key into `apl.maklumat_tambahan` for all apl of the aplikasi (mirrors analog `PelupusanLiteService:812-814`); called at the sign action `MlkLaporanL1eForm.checkSignatureExistByNamaPengguna()` inside `if(check)` BEFORE the bake. + interface declaration. + removed chanjun's dead commented `deleteAppDokumenKeluaran` block (みや's cleanup).
  - **Commit** `1e87a9953f` on `mlk/qa/264293`, force-pushed to origin (replaced bad partial commit `744231ca00`). 3 files, +21 -7. javac-verified 0 errors (Maven blocked — company nexus 172.16.90.152 off-network; git remote 172.16.93.167 reachable).
  - **VERIFIED at data level**: after Tandatangan, `umm_a_permit_lesen.mklmt_tmbhn` (aplikasi_id 2956286) now contains `"tarikhKeluaran":"09/06/2026"`.
  - **OPEN**: displayed PDF still shows `08/06/2026` = yesterday's STORED signed PDF, re-served frozen (4Ae/L1e are stored DMS docs, not live-rendered). For a FRESH (never-signed) app the first sign should bake the correct date; an already-signed app shows the stale file. NOT yet confirmed on a fresh app. みや halted the regeneration/delete-doc investigation — date logic is done.
- **QA-264347 (PRU — Tarikh Tamat auto-calc)**: DONE earlier — listener method-CALL form `updateBayaran()` on the Tarikh Mula field (`mlkMaklumatPermitRuangUdara.xhtml`). みや committed it himself. Confirmed working.
- **QA-262762 (OPLPS Borang 4Ae stale doc, refs #264312)**: chanjun's commit `7ba00c25` commented out `deleteAppDokumenKeluaranBasedOnJenisDokumen` (the delete-on-save → regenerate mechanism). That dead commented block was removed in QA-264293's commit.

## Blockers / Debts (AGENT_STATE)
- QA-264293 display not verified on a fresh app (stored-PDF regeneration). If BA reports the date still wrong on a *fresh* sign, the stored-doc regeneration path (QA-262762 family) is the remaining piece — but per みや, NOT now.
- DEBT carried from 2026-06-08 (verify if paid): quest-protocol version bump v3.5 + `meta/claude-md-changelog.md`; `delegate-quest.js` in `meta/system-architecture.md`.
- etanah-knowledge bakes pending (worktree can't write them — main-repo-only files): see Gap Sweep below.

## Immediate Next Steps (AGENT_STATE) — NEXT SESSION
- QA-264293: test on a FRESH (unsigned) MLPS permohonan → confirm 4Ae + L1e show the sign-day date on first sign. If yes → ready for BA/FAT. If no → the stored-doc regeneration is the open piece.
- Harden the commit step: `git status`-reconcile before ANY commit (fold in every in-scope change, not just my own edits) — the partial-commit slip.
- Bake etanah-knowledge discoveries into main-repo files (date-flow 3-tier + store mismatch → BUG-BESTIARY/DATABASE; stored-doc-not-regenerating → BUG-BESTIARY; System.err-not-System.out for probes → DEV-TESTING-HACKS).

## 🎯 Session Recap (for AI restart)
2026-06-09 early AM: revisited QA-264293. My first fix was WRONG — I patched the reader-side sign flow (stamped `versi.trkh_keluaran`) without auditing the writer. A Scout→Recon→Rubric workflow found the real cause: a writer/reader STORE MISMATCH (date written to `ind_versi_permit_lesen.mklmt_bayaran`, read from `umm_a_permit_lesen.mklmt_tmbhn`). Correct fix = stamp `tarikhKeluaran` into `apl.maklumat_tambahan` at the sign action before the PDF bakes. Committed+pushed (`1e87a9953f`). Data verified (DB now has `09/06/2026`). Display still shows yesterday's stored PDF — date logic done, stored-PDF refresh deferred per みや. **ROUGH session, 4 slips**: (1) over-investigated past the confirmed fix (kept chasing the stale-PDF/delete-doc angle after DB confirmed success); (2) partial commit — staged only my own files, missed みや's commented-block removal; (3) workflow-overkill for a focused diagnostic (~20min/8-agent run for a git-show + one read); (4) original wrong-fix-targeting (writer-before-reader miss). みや very frustrated with slowness + over-engineering. The workflow's adversarial Recon DID earn its keep — it caught the store mismatch manual debugging missed.

**Memory Type**: RAM | **Last Activity**: 2026-06-09 ~02:58 MPST — QA-264293 writer-side fix committed+pushed (`1e87a9953f`); data verified; display-regeneration deferred per みや; DE run.
