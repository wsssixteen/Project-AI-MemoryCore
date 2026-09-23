# Current Session

**Last Activity**: 2026-09-23 14:10 — #280176 regression audit (NO regression from 280176) → 2 new issues fixed + shipped int-env/stag-env (2013e8e935 Penyediaan list rebuild · 5d6c4a9a2e onSimpanTanah nomborLot→noLot all urusan) · probe-local-only rule born · DE stopped before step 10 per みや.

## Session Recap (2026-09-23, quest-280176-regression worktree)
- **Ask**: BA (Nurhafizah) PASSED 280176 on staging, then a colleague's two videos looked like regressions. Audit of `mlk/esokongan/280176` vs `mlk/master`: 3 files, none on the reported paths → **not a regression from 280176**.
- **Issue A** (video 1): Penyediaan Borang 4Ae Simpan multiplied Maklumat Tanah rows (stg2 apl 3412358 = 10 rows born 09:08:55). Root: `MlkPenyediaanBorang4AeL1eForm.performCustomSave():455` appended to a list pre-filled by `BasePelupusanLiteForm.initMaklumatBorang():541-801`; `PelupusanLiteService.populateAppPermohonanTanah():537` deletes+recreates. Masked before by the NPE. Fix = rebuild the list from the helper's displayed rows (analog Utiliti `syncMaklumatTanahFromPermitHelperForSave():1998-2027`). Commit `2013e8e935`.
- **Issue B** (video 2): OMLPS Utiliti Kemas kini No Lot saved old value. Static trace said it should persist; **local probe** (QA280176B-PROBE) proved `nomborLot=307 noLot=1` after the PLPS-only branch → `PelupusanMaklumatPermitLesenHelper.onSimpanTanah():3612` converts only for PLPS (aaron 4dad297088 2025-10; nurasia 0b70351f8c8 2026-04 added the OMLPS load half, never the save half). Fix = drop the urusan guard. Commit `5d6c4a9a2e`. Blast radius: only `nomborLot`-bound dialogs feed this helper; OPLPS binds `noLot` with `nomborLot` null; PT + Perserahan use `PelupusanExcelReaderHelper`.
- **Shipped**: branch merged `origin/mlk/master` (ca8acf73a6) → int-env `b7816982e7` · stag-env `7ae6152a4f`. Deploy cards handed (internal one-function; staging build+deploy). BA retest pending. Reset 2 (tanah dups) added to `2. Fix\280176-reset.sql`; RESET 1 re-run by みや 12:xx, verified live.
- **Rules born**: `feedback_probe_builds_local_only` (probes tested on local JBoss only; never merged to env/trunk/release) + Feature `domain/probe-local-only-gate` (PreToolUse Bash|PowerShell). Work-clone discipline held: all write-side git in `E:\Dev\etanah-work\etanah-pelupusan`; his tree only got the uncommitted local-test patch, then cleared.
- **Slips today**: `test-scenario/incomplete` (did not name the page-level Simpan as the step under test) · `stop-instead-of-action` (handed him the `git checkout -- .` line instead of clearing my own patch) · reask/verbose (long answers to short questions, ×3 corrections).
- **Open**: read-side guard `PelupusanSearchService.java:2064` + `:2110` (from 09-22 session, unverified whether still needed after the fill-empty-slot fix) · branch-ledger debt on 5 old quests (277697, 269704, 265109, 244600 +1) · 45 goal-lens prompts pending · 2 ghost Features in census.

## Session Recap (2026-09-22 → 23) — 3 /goal rounds
- **Board rewrite** (`43086a54` + `88c6be68`, on main): boot listing now 3 priority tables (Patching-PROD tracker 63/64/71 · eSOKONGAN 51 severity→due · Internal-fixes+other). Fixed TWO real bugs that had been silently EMPTYING the board: (B1) `isMe` now strips the Redmine `(Dev PLP)` role suffix — exact-match `ME` had put all 14 tickets in "others"; (B2) added `MLK_03_Pelupusan` to `MELAKA_PROJECTS` (4 tickets were flagged "outside Melaka"). `Days` = days since HE received (assignment-to-me journal), Due date kept. `domain/list-redmine/eval.js` 16/16.
- **redmine-sync v11** (`88c6be68`): rework folders counted by GENUINE reopens (OneDrive-proof, replaces v10 birthtime which missed #278699's 2nd reopen); each `N. Rework` gets `0. Brief` (BA attachments route here) + `2. Fix` (his upload workspace). `redmine-sync.eval` 17/17.
- **Board maintenance**: archived 280614 (Phase 2); closed 278580 + 280176 (Redmine-resolved); retrieved #264355 + #244600 (were missing from active.txt).
- **Reassigned tickets (item 6)**: 280029 = Ammar's Surat Ulangan JT fix — traced + banked to BUG-BESTIARY (CC bare-RPr → doc-default font; `rPrOrSdtPrFallback`; commits `01c501634c`+`6a74597c85`). 278909 (New) + 280166 (cross-module flowable/uam) closed as delegated-to-Ammar.
- **280895 quest → Rubric** (eSokongan, PRIORITY next session): UPP MCL papar-kosong. Root (90%): `MlkMaklumatPermohonanPembatalanForm.xhtml:32-45` declares 9 urusan flags but NOT `isMCL` → MCL app falls through negative-list panels → render exception → whole Langkah-2 blank. The BA VIDEO corrected the earlier sempadan theory (L8 getter already present :937). Apply next session (server.log names the throwing panel). Doc: `projects/coding-projects/active/QA-280895/QA-280895.md`.
- **Full-context audit**: `system/agentic-ticket-workflow-assessment-2026-09-23.md` (what he asked/questioned, bugs B1-B5, commits, residuals) + todo Q1 rows + proposals P1-P3.

## 🎯 HANDOVER — Focus tickets (load this after compaction)

| # | Type | Focus / next action | Effort | Why |
|---|---|---|---|---|
| **280614** | Data patch (PROD) | ✅ **APPLIED** (verified: permohonan /9+/10 tempat='-', lesen rows patched) → **close it** | done | patch ran |
| **280540** | eSOKONGAN code | build `PLP_BANGUNAN_*` flat-rate guard at `PelupusanMaklumatBayaranHelper.java:276` | build+test | recon done, net-new build |
| **246923** | template config | remove 3 dup keys (PRMMKNPTG/SRMMKNPTG/PRRMMKNPTG) from Block A in `template.config.json` | ~9 lines | rework, BA waiting |
| **274323** | Word CC | force `"RM 0.00"` in `PelupusanWordCCMethodConstant.java:4772` when royalti exempted | tiny | rework, BA waiting |
| **279711** | code (populator) | repoint `PelupusanWordCCMethodConstant.java:842-843` to gated `populateJawatanPegawaiSemak` + PPD branch in isValidUser :2043 | small | rework; ⚠️ MaklumatPemohon.docx shared-tag blast radius |
| **280176** | code (read-guard) | add `removeIf(getTarikhTamat==null)` at `PelupusanSearchService.java:2064` + `:2110` | 2 lines | rework; save-side fix shipped, read-side gap |
| **278909** | template add | add 3 docx twins + 3 config blocks (adaPemilikanTanah) mirroring Lulus family | medium | new; task folder unread — get Brief at Apply |

**280265** — patched (generateSurat 7547→YA); pending BA retest. Per DATABASE.md §24 the flip un-hides JPPH (show-goal); if BA needs re-add → Alex's DELETE pattern (BUG-BESTIARY §JT). Knowledge-first: read §24 on any JT ticket.
