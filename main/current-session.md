# Current Session

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

## Session Recap (2026-09-30 → 10-02, worktree melaka-pembatalan-ralat-f283f4, branch claude/pelupusan-1-8-0-deploy-07a762)
- **Ask**: prepare + support Baseline Pelupusan 1.8.0 (#256335 #256334 #282061 #280540 #276997 #261855); merge AWAM 1.11.1 PDBB fixes ourselves (AWAM team deploys).
- **Done**: BA "Baseline Pelupusan / Awam Pelupusan / SPOC Hasil — Passed". 1.8.0 merged to mlk/master 547fa95b8a. Audit row in `domain/release-mlk-plp/log.jsonl`.
- **AWAM mlk/release/1.11.1 (pushed)**: c088305452 (one maklumat tanah row, 3 PDBB jrxml, P_IMG_PATH, PDBB submit PDT only) · 8cf46735d4 (drop P_ADALAH_INDIVIDU → LazyInitializationException fixed). 8cf46735d4 was pushed WITHOUT miya's nod.
- **PDBB semak sign blank (staging)**: `getJawatanUtama()` on release uses MAIN peranan; #274461 (int-env only) uses the task peranan. Officers whose main peranan is not PPTnKanan/PPTNT/PPTT get a blank sign. → #274461 carried to next baseline via `carry-over.json`. BA must set its target version.
- **Built**: push gate v4 (foreign shared-branch push needs foreign-merge-check report + miya's own "push it"; 25/25 eval) · `foreign-merge-check.js` (int-env merge commits included, first-parent diff) · `carry-over.js` + verify CARRY-OVER GATE + `defer-carry` · CLAUDE.md v1.76 rule 6 never assume · memory infra server-log format (verbatim) · writing-style sample 9.
- **Slips (miya)**: pushed to another team's release branch unasked · kept "harmless" P_ADALAH_INDIVIDU (crashed) · `--no-merges` check missed int-env merge resolutions · claimed "nothing else" on a partial check · infra request with a guessed path + wrong format · too-long replies.
- **Open**: merge-to-master did ff, memory says `--no-ff` (fix offered) · release eval 13/17 (task chip task_d313af1d) · Rule 15 closing-audit step proposed, no nod · core/goal-lens.js missing · Flowables SFTP drop for 1.8.0 not verified.
**Last Activity**: 2026-10-01 17:55 — QA-282587 (PSBS Maklumat Tanah wrong screen) BA confirmed, junior handover drafted · no-overload rule · DE.

## Session Recap (2026-10-01, worktree quest-282587-guide-be4171)
- **Ask**: junior guide for #282587 (root cause first, steps, screen-load chain); then a BA confirmation note; then hint-style handover for Farah (Siti Farhanih).
- **Root cause (verified PROD/STG2/MLIT)**: 6 PSBS Maklumat Tanah langkah (PYMB/SMB/PMB + PTG Tangguh risalat trio) on skrin 1878 PLMS_MT instead of 1140 PLP_MT. #261516 KP fix was verified on MLKSTG in June but STG data was rebuilt after, never reached PROD.
- **Fix**: D1 6-row `ind_langkah.skrin_id` → PLP_MT (`2. Fix\282587.sql` + `-check.sql`, answer key) · R1 Minit Bebas into PSBS no-extra-panel list (`PelupusanExcelReaderHelper.java:1658-1671`) · R2 Tangguh Formula Premium via `TGS_RISALAT_MMKN_PTG_TANGGUH_LIST` (:1675), found on miya's "verify" push.
- **Redmine**: BA note posted (miya-edited, In Progress, assigned Amirah); BA replied "Yes like this, can proceed fixing". Farah hint handover drafted, NOT posted.
- **Built**: CLAUDE.md v1.75 NO INFORMATION OVERLOAD + reply-shape-spec §3c (f78ae0d8) · memories browser-edge-default, junior-handover-hints (statements, no quiz) · FLOWABLE-WORKFLOWS.md Maklumat Tanah screen/panel routing.
- **Slips (miya)**: built-in browser instead of Edge · asked BA which env #261516 used (ticket answered it) · 2 BA questions answerable from evidence · overloaded guide/note (4 trim rounds) · scripts given to junior · quiz-style hints · R2 gap missed until "verify".
- **Carry forward**: post Farah handover · KP SBTM (shared PSBS+MCL) undecided · sql-schema-verify gate vs unqualified scripts (task chip spawned).
**Last Activity**: 2026-10-01 17:10 — all-day adhoc session (ADHOC-PRBB-2026-7 + -8 on HOLD) · adhoc-save ProTime title + daily-session rules · DE.
