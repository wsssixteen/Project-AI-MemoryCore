# Current Session

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

## Session Recap (2026-10-01 → 10-02, main, Farah review)
- **Ask**: review Farah's work on #264355 (PRU AWAM surat) + #274266 (PT Maklumbalas Tangguh peranan), prep each for BA. No commit/push/Redmine without nod.
- **#264355**: AWAM `mlk/qa/264355v2` 7544d52688 letter fix PASS (adds PLP_PRU_SRTLULUS + Tolak skips PL rule) → merged to int-env 28e9b9d080 (conflict at AwamDashboardVO.java:547 vs yihkitc PLBP line, kept both, compile green). Pelupusan `mlk/qa/264355` 2736c9a0be notifikasi HELD (fires at Pengesahan before letter visible, ~14 urusan, repeats). miya posted BA pass + deploys AWAM internal.
- **#274266**: Farah's 4-statement script never ran; dropped her ind_pejabat_tgsn stmt, added flag_aktif to umm_a_tgsn. miya ran role fix on internal + full setup on stg2 (both verified). PROD = `3. Rework\274266.sql` (et_main, 6 stmts, catalog-checked, stamped) attached on Redmine (md5 match). BPMN not needed: PROD MLK_PLP_PT v13 = stg2 v5 (28.1/29.1 present) → PROD PT Tangguh has no tugasan until script runs.
- **Built/changed**: memory end-of-task-brief-shape (bullets + steps-only table) · feedback_script_file_naming (.sql always, Redmine = same file, read+replace stale same-name) · script-check rule 7 v4 · ticket-writing-style 2b (pass note for someone else's ticket) · FLOWABLE-KNOWLEDGE §16.
- **Slips (miya)**: told him to upload `#274266.txt` (wanted .sql) + stale 274266.sql left in Task folder (`script-file-type`) · over-long pass note on Farah's ticket · first review missed Farah's pelupusan notifikasi commit (searched AWAM only).
- **Spawned**: reply-shape build (task_a825f80a) · stg1→stg2 align (task_689d1837, ran: ADHOC-STG-2026-1) · deterministic workflow start + DE workflows check (task_ae2dbe14).
- **Open**: miya's #274266 note edit not saved on Redmine · 264355 notifikasi BA scope · both tickets need the baseline (7544d52688 AWAM, 71a78d7da6 PLP) · PROD 274266.sql should run soon.
**Last Activity**: 2026-10-02 11:30 — Baseline Pelupusan 1.8.0 closed (BA passed, merged to mlk/master 547fa95b8a) · AWAM 1.11.1 PDBB fixes · push gate v4 + foreign-merge-check + carry-over gate · DE.
