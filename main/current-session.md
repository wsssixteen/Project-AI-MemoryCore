# Current Session

**Last Activity**: 2026-09-24 18:55 — #281392 4Ae hotfix (DMMLMS) shipped on mlk/hotfix/281392 → int-env 70c28f0157 + stag-env ba79202142; reset script rev 2; hotfix audit built (hotfix skill · HOTFIX lane · quest-exists-gate · db-claim-proof); QA-281392 archived + bounty · DE.
**Last Activity**: 2026-09-24 18:55 — Selangor PLMS adhoc answered (pelan GPTOL patch location = permohonan, not versi lesen); ADHOC-SGR-PLMS-2026-1 closed + archived; DE.

## Session Recap (2026-09-24 evening, gptol-patching-location worktree)
- **Ask**: PLMS Penyediaan Borang (PYB4AE, langkah PYB4AE_2 Maklumat Pelan L1e): when patching the pelan GPTOL, patch permohonan or versi lesen? Is it by No Lesen? **State = Selangor** (みや said so only at close).
- **Answer**: permohonan. `PelupusanReportService.getLaporanBorangL1e()` reads `UMM_A_DOK_KELUARAN` by the PLMS aplikasi + `GPTOL`, then latest active `DOKUMEN` (medan UMM_A_DOK_KELUARAN, medan_pk = adk id). No Lesen only drives the MLMS branch, which still ends on an aplikasi. `IND_VERSI_PERMIT_LESEN.PELAN_DOK_ID` = decoy, never read.
- **Evidence**: Selangor `sgr/master :1951` + `origin/master :2126/:2304`; Perak `master` same shape + oracle-prk-stag langkah/skrin rows. oracle-slt REFUSED (WinError 10061) so Selangor DB not read.
- **Slip**: `state-assumed` — answered on Perak code because Melaka had no PLMS; never asked/derived the state (Selangor also has PLMS). Caught by みや's close message.
- **Closed**: ADHOC-SGR-PLMS-2026-1 archived (quest/active-archive.txt block + qa_doc projects/coding-projects/archive/ADHOC-SGR-PLMS-2026-1/). Knowledge: selangor/STATE-FACTS.md PLMS pelan section + perak/STATE-FACTS.md §10.
- **Open**: none. If a real patch comes, give the PLMS permohonan id + env and pull its GPTOL rows first.
**Last Activity**: 2026-09-24 18:47 — #280895 UPP Langkah 2 blank for MCL: blind Rubric re-run overturned cycle-1 (int-env working copy masked the thrower) → fix `0c074d07a2` on `mlk/esokongan/280895`, merged stag-env `5f60caef17`, miya PASS on internal · quest closed + archived + bounty · DE.

## Session Recap (2026-09-24, form-4ae-no-resit-hotfix worktree)
- **Ask**: PROD hotfix the day after release 1.6.3 — Borang 4Ae "No. Resit null" + 31/12/2026 for `PDTJ.600-2/9/79` (lesen M081). Later: mirror PROD on stg2, reflect the Utiliti No Resit edit through every tugasan, 2027 Maklumat Jadual, renumber to real ticket #281392, push for release team, audit the whole run and build the fixes.
- **Root causes (4, all shipped on `mlk/hotfix/281392` off master 1.6.3)**: `c9daff1081` DMMLMS missing from populateNoResit/TarikhPertama (PROD app still DMMLMS 908, STAG was OMLPS 647) · `e58e197538` first-year receipt never reached versi 0 · `ffd72cc005` Semakan (SMB, shared skrin 378) overwrote first-year receipt with renewal row 1 · `225deaf56a` Maklumat Jadual ignored selected Tahun.
- **Envs**: stag-env `ba79202142` · int-env `70c28f0157` (compiled green with capped javac memory; machine commit charge exhausted by 374 python + 110 pgedge-postgres-mcp leftovers). Renumber 280176→281392 by revert + re-merge, no force-push.
- **Reset**: Task `2. Fix\281392-reset.sql` rev 2 — Pengesahan renames ind_permit_lesen M081→A02/2026/11 + adds notis/tgsn_dok/langkah rows; rev 1 would have failed. Test: nurulazura (Utiliti) → shahniza (SMB) → nazli (SB), M081, Tahun 2027.
- **Audit built** (worktree `7372050` + `00f1e90`): `hotfix` skill · etanah-intake-gate HOTFIX lane (24/24) · `quest-exists-gate` (20/20) · `db-claim-proof` (20/20) · test-scenario-login-gate blank-stderr fix (7/7) · BRANCH-AND-DEPLOY.md §8 (was removed twice by an external writer — OneDrive worktree sync suspected; restored from git).
- **Closed**: QA-281392 archived (Task folder → Archive, bounty: BUG-BESTIARY DMMLMS pattern · LATENT-BUGS L11 false "Telah disimpan!" · TEST-PERMOHONAN-INDEX · MLPS-TICKETS note).
- **Slips**: evidence-without-script · wrong-test-data · test-scenario-incomplete · blast-radius-unverified · finding-not-traced · quest-not-created · reask/verbose ×2 · claim-without-artifact (§8; likely an external revert, see above).
- **Open**: BA retest 225deaf56a on staging · db-claim-proof block vs warn + quest-exists-gate edit-time (miya's rulings) · refinement proposal: core/slips.js add --qa auto-fill · leftover process cleanup needs miya's nod.

## Session Recap (2026-09-23 → 24, quest-280895-rubric-compare worktree)
- **Ask**: run /quest 280895 to Rubric, compare with prior findings, brief fix + next steps + test scenario. Then close, commit, stag-env, archive.
- **Root cause (static-proven on origin/mlk/master)**: panel `maklumatUrusanPRBB` in `MlkMaklumatPermohonanPembatalanForm.xhtml:98-99` used a NEGATIVE urusan list → renders for MCL/PPTPB → `mlkMaklumatUrusanForm.xhtml:54` reads `mbb.keputusanMMKN`, absent on the Pembatalan bean → PropertyNotFoundException at render → blank page.
- **Prior findings corrected**: cycle 1 read `:99 rendered="#{isPRBB}"` from the int-env working copy (#279615 commit `3e0154db9e` never left int-env) and chased an isMCL theory; its stg2 test app UPP/2026/2 actually cancels PT/2026/33 (MCL one on stg2 = UPP/2026/3).
- **Shipped**: cherry-pick `3e0154db9e` → `0c074d07a2` "Ref #280895 - UPP - KMPPP - change panel maklumatUrusanPRBB rendered to isPRBB only" · pushed · stag-env `5f60caef17` · repo back on mlk/master. miya tested PASS on internal (PTMLK/01/L/UPP/2026/1 @ iskandarz).
- **Owed (miya)**: deploy stag-env to staging before BA retest · post Redmine RC/Solution (in archive QA-280895.md §Ship) · include branch in next release. PROD UPP/02/4 (MCL), /02/5 /02/6 (PPTPB) unblock on release.
- **Born**: quest SKILL.md resume step 4 off-baseline read rule · BUG-BESTIARY pattern · LATENT-BUGS L9 (keputusanMMKN, PRBB-origin cancel) + L8 → FIXED.
- **Slips**: verify-before-claim (working-copy read) · stalled after "go create the branch" (permission classifier failure, then waited instead of retrying).
**Last Activity**: 2026-09-24 18:45 — #278909 (PT Risalat MMKN Tolak + ada pemilikan) root-caused + audited; fix = 3 missing template docx; DELEGATED to junior Siti Farhanih (みや guides); Redmine note drafted, NOT posted.
**Last Activity**: 2026-09-24 18:50 — #280540 BA data ask answered (Kadar Pengiraan Per per env, before/after MLKIT test); QA-280540 Phase 1 closed; DE.

## Session Recap (2026-09-24, pptpbl-fees-export worktree)
- **Ask**: BA (Mira) on #280540: what is Kadar Pengiraan Per for all Kategori on MLKIT + MLKSTG, is the maintenance page saving it.
- **Finding (DB-proven)**: Per is ONE field on Kod Fi `hsl_fi_pejabat.unit_pengiraan_id`; row `hsl_fi_kadar.kadar_pengiraan_id` empty on every PPTPBL row. Form field sits beside Kategori/Jenis but saves to the Kod Fi, so one change hits all rows. Row edit = delete+insert (MLKIT 307→2040, 318→2041). Re-added 2041 Unit Ukuran Luas stayed empty in DB.
- **Test**: みや set MLKIT Per = Meter Persegi (16:07) → PTMLK/03/L/PPTPB/2026/5 Pertanian Lain-lain = RM20 x 80 m² = 1,600 (fix follows the page). MLKIT still Meter Persegi; MLKSTG Lot.
- **Delivered**: Task folder `280540.xlsx` (MLKSTG · MLKIT Sebelum · MLKIT Selepas; joined per-row view + table.column source row) + `280540.sql` (subquery joined view, no JOIN). Redmine reply (short) posted by みや.
- **Closed**: QA-280540 Phase 1 (status=closed, commit 66777ba6d5, on int-env + stag-env). Phase 2 archive after BA confirms.
- **Slips**: ticket-context-skipped · scope-overreach (verdict columns for BA) · output-shape (row-only data, no joined per-row parent view) · reask/verbose ×2 · reask/redundant.
- **Open**: MLKIT Per back to Lot (みや decides) · PROD PPTPBL Per = Lot before release · maintenance page Unit Ukuran Luas not persisting on re-added row (unconfirmed, needs one retest).
