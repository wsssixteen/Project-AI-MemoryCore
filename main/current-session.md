# Current Session

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

## Session Recap (2026-10-02, worktree redmine-issue-282198-8c1eb9)
- **Ask**: #282198 patch TSO's edited Minit Bebas (PTMLK/02/L/PT/2026/4) into PROD; then Redmine close.
- **Done**: target LAIN-37140956 rev 41444766 (versi 1, unchanged since 09-17). Deliverables in Task `2. Fix\`: `LAIN-37140956_1.main` (= `(1)(1).docx`, hash equal, rendered via Word, 3 signatures correct) + `282198.sql` (PDF reset, schema-verified PROD). Infra did both. PROD lokasi_fail_pdf NULL confirmed. Redmine close drafted with Root cause + Solution, NOT posted.
- **Built**: patch-mlk-doc STEP 2 = two separate infra copy boxes (miya's #281482 shape + data-patch shape), attachment = renamed .main, deliverables only `<num>.sql` + .main · `domain/patch-mlk-doc/deliverable-check.js` + 18-fixture eval · quest SKILL 6c (Phase 0 sets patch path, loads stored handoff, full path first) · quest SKILL Root cause + Solution on every Redmine hand-over · rootcause-format hook blocks hand-over without both rows (26/26).
- **Slips (miya)**: handoff from skill's own wrong STEP1/STEP2 block (`handoff/shape-not-loaded`) · BA docx attached under own name + relative paths (`handoff/attachment-not-target-file`) · PATCH-REQUEST txt instead of 282198.sql (`script/naming`) · Redmine close without Root cause/Solution (`redmine/rootcause-missing`).
- **Open**: miya opens doc in PROD (first view rebuilds PDF) · post Redmine close · saiz_fail_byte still old size (effect not verified) · memory feedback_prod_patch_infra_handoff not updated (worktree guard), skill carries the shape.
**Last Activity**: 2026-10-02 11:50 — Farah review #264355 + #274266 → both Phase 1 closed · 264355 AWAM merged int-env 28e9b9d080 · 274266 internal+stg2 patched, PROD 274266.sql attached · DE.
