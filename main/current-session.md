# Current Session

**Last Activity**: 2026-10-02 17:45 — ADHOC-PRBB-2026-11 assist BA Fizah: PROD permit C02/2026/3 data + MLIT 4-row explanation + tugasan all-daerah query · adhoc saved 28/28 · Phase 2 archived + bounty · DE.

## Session Recap (2026-10-02, worktree permit-c02-2026-3-query-dba198, session 6)
- **Ask**: BA Fizah (Nurhafizah Hasan) via WhatsApp: tujuan, kuantiti diluluskan, tempoh diluluskan + maklumat tanah for No Permit C02/2026/3; why internal shows 4 rows; query id permohonan at a tugasan for all daerah.
- **Done**: PROD 1 row (apl 3408435): MERATAKAN TAPAK, 5000 meter padu, 30 hari 21/08-29/09/2026, GM 230 Lot 2211 Mukim Ayer Panas. MLIT 4 rows = follow-on permohonan (OPRBB asal, PRBB Ganti Hari, 2x PDBB) copy permit asal, test data, no alter no patch. Tugasan query already all-daerah; added daerah column via `ind_pejabat`. Task `263. AH - PROD - PRBB - Query data permit C02-2026-3 dan tugasan semua daerah` (now Archive\) with `2. Fix\ADHOC-PRBB-2026-11-check.sql`. ProTime title `Assist BA - Adhoc Query Data PRBB Permit C02/2026/3 & Tugasan Semua Daerah`.
- **Knowledge**: PERMIT-LESEN-RUNNING-NUMBER.md § One permit number on many aplikasi · index.md 2 quick-links (lookup code table `rjk_senarai_ahli_kumpulan`, permit approval data).
- **Slips**: answered on PROD before checking which env the BA's screenshot came from (she was on internal) · first reply lacked the proving SELECT (db-claim-proof stop) · guessed a lookup table name instead of reading DATABASE.md.
- **Open**: none.

**Last Activity**: 2026-10-02 17:35 — #282587 review of Farah's fix → Phase 1 CLOSED · D1 run stg2+mlit · merged int-env e16fd046ec + stag-env 387011c8fc · PROD 282587.sql on Redmine (checked safe) · pass-note tool fixed · DE.

## Session Recap (2026-10-02, worktree review-282587-quest-4e465d)
- **Ask**: start quest, review Farah's #282587 fix, brief; then patch, PROD script, deploy, Redmine handover.
- **Done**: Farah `0229aee7d9` (R1 Minit Bebas in PSBS SKM list + R2 Tangguh Formula Premium) correct, no correction. D1 (6 PSBS langkah 1878→1140) was missing: we ran it on stg2 + mlit (rollback-guarded, 6 each). PROD `2. Fix\282587.sql` (et_main) attached by miya, safety-checked. Merged + miya deployed internal + staging. miya posted pass note. active.txt status=closed. Red-box photo `2. Fix\1. PYMB - skrin Maklumat Tanah seperti SKM.png`.
- **Built**: `ticket-close-block.js` colleague-fix shape (no list, no commit block, branch only if history lacks it, AWAM keeps it) + `ba-names.json` (Amirah→Mira, Nurhafizah→Fizah) + `--prod-script` + full `Attach:` path · quest SKILL § Hand-over + deploy 6b + memory ticket-writing-style 2b.
- **Slips (miya)**: `brief/ambiguous-owner` (didn't say D1 script was ours) · `reask/format` (Amirah + Farah's commit block) · `full-path` (short attach path).
- **Open**: KP SBTM (11282) left for BA to test later · Phase 2 archive after BA verifies · #282587 must be on planned release list with 282587.sql · sql-schema-verify emit cross-products columns (12 false rows), stamped by hand.

**Last Activity**: 2026-10-02 17:22 — ADHOC-PRBB-2026-10 AWAM Slip Permohonan 500 on Hantar = common #282299 (report API for MLK), all modules hit · casual suggestive message + evidence scripts for miya · adhoc saved 29/29 · DE.

## Session Recap (2026-10-02, worktree redmine-issue-282198-8c1eb9, session 4)
- **Ask**: BA relay, AWAM MLKSTG PRBB Baru cara bayar Kaunter, Hantar -> ralat ID Rujukan 64602.
- **Done**: `et_sistem_stg2.pt_application_ex_entity` 64602 = `500 "Failed to generate report."` at common `BaseReportService.printReportUsingAPI():723`; common commit `8fb3d0334d` (#282299, azizam) routes MLK slip + senarai semak to report API. 20/20 slip errors today on `1.7.21-MLK.beta.patch.282299.1`; modules Consent/Pengambilan/Pendaftaran/Pelupusan. Input check clean (AWAM passes only praAplikasi). Task `262. AH - MLKSTG - AWAM - Slip Permohonan gagal jana (common 282299)` with combined check script.
- **Learned (miya)**: WhatsApp replies casual + suggestive ("nampak macam isu common X ni... ada hit lain juga"), always ship the evidence script; error store needs `et_sistem_<env>.` prefix (unqualified gave 42P01, stg1 default gave 42501). Memory `feedback_other_team_message_not_our_issue` updated.
- **Open**: miya sends common message + screenshot · ProTime title `AWAM slip permohonan gagal jana` · Senarai Semak (same #282299 change) not checked.

**Last Activity**: 2026-10-02 15:51 — #282198 PT Minit Bebas PROD document patch done by infra (file replaced + PDF reset) · Redmine close drafted · patch-mlk-doc + quest patch path hardened · DE.
