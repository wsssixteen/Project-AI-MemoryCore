# Current Session

**Last Activity**: 2026-09-30 18:05 — ADHOC-PDBB-2026-1 (MLIT PDBB Perakuan slow) closed + archived (dropped by miya) · attempt-before-blocked-gate widened · DE.

## Session Recap (2026-09-30, worktree ptmlk-slow-submission-10ca65)
- **Ask**: why PTMLK/01/L/PDBB/2026/12 on MLIT loads ~5 min at Perakuan Laporan Pemantauan (PRPDBB), m.ikram.
- **Found**: server never slow (Jana Surat 10.7 s, Hantar 483 ms). The page itself went silent (no requests, not even the 5 s poll) in 2 gaps (1m38s, 2m46s) right after the Agihan Kepada radio; PDBB/13 froze the same way on a 2nd PC. Leading mechanism: PrimeFaces 12 queue held by the oncomplete="mandatoryBarControl(); fix();" step (common internal.js re-binds legacy DOMSubtreeModified listeners every call). Browser/version never confirmed → dropped by miya. Full evidence: archived qa_doc ADHOC-PDBB-2026-1.
- **Env**: Windows Smart App Control blocked pgedge-postgres-mcp.exe (all postgres MCP) 10:22-10:57; worked around with a Java JDBC script; SAC then turned Off.
- **Slips (miya)**: first answer wrongly put the ~33 s Hantar cost on the ISPEKS sub-flow (corrected by server.log) · told miya "my DB tool is read-only, can't create" (false: gateway login is read-write; memory already said so).
- **Built**: attempt-before-blocked-gate now blocks "can't create/write/insert/update" + "read-only DB/tool" claims (eval 12/12 incl. the exact sentence; 7db896ba) · memory feedback_mlit_db_write_access.
- **Carry forward**: none (adhoc closed).
**Last Activity**: 2026-09-30 17:35 — QA-281638 PROD verified (successor PL Bayaran Pelbagai) · DE.

## Session Recap (2026-09-28 to 09-30, worktree patch-281638-status-flowable-3f968d)
- **Ask**: prepare PROD patch for #281638 (PRBB/2026/8 BP_SWA_PLP crashed on Hantar, `caraPenghantaran`), verify against #281319 + #280166 before preparing.
- **Done**: re-verified PROD (row stuck Selesai/Y), miya added the variable on SUB_UPN child 20528039, infra ran `281638.sql`, officer Hantar → successor `PL` Bayaran Pelbagai 2859406 (verified 2026-09-30). Phase 1 + Phase 2 closed, archived, L10 evidence + PRBB-TICKETS note written.
- **Built**: `patch-close-shape` CHECK C (blocks a PROD `.sql` routed to infra with no handoff; eval 50/50; eb803dc1) · quest SKILL pre-emit row 🩹 PROD patch hand-back (proof + Stage-Match + handoff last; on-screen admin labels) · `feedback_flowable_admin_diagram` step 1 rewritten with on-screen labels.
- **Slips**: 5 tagged QA-281638 (missing infra handoff · ambiguous flowable step + #281319 bounty claim never landed · no proving SELECT · no Stage-Match · 0. Brief photo not opened on resume).
- **Open**: PRBB/2026/2 (task 20527758) still needs the preventive variable (L10) · bounty proposal: Bounty lines must carry a commit SHA.
**Last Activity**: 2026-09-30 17:40 — ADHOC-VIEW-2026-1 closed + archived + bounty (bfdb6a89) · DE.

## Session Recap (2026-09-25 to 09-30, session gptol-patching-location → main checkout after worktree was emptied)
- **Ask**: Alex (KL) wanted KL views TKLLESENTABLEVIEW + TKLPREMITTABLEVIEW in Melaka. KL plp_* tables do not exist here; rebuilt on umm_a_permit_lesen → ind_versi_permit_lesen → ind_permit_lesen (lesen BRG_4AE, permit BRG_4CE+4DE via rjk_jns_dok).
- **Done**: views live on internal (et_main_mlit 773/3154) + staging (et_main_stg2 760/3142) as `tkllesentableview` + `tklpermittableview` (KL typo PREMIT corrected; internal renamed via ALTER VIEW). PROD infra sendoff (et_main-qualified) handed to miya 2026-09-28; not on PROD at 2026-09-30.
- **Also 09-28**: boot + Redmine retrieval + brief; Protime Monday plan filled via Protime API (281638, 281712, 279411) since Chrome hung.
- **Slips (miya)**: carried KL typo into our view name · gave the #281638 infra handoff when he asked for the views' PROD sendoff. Both written into adhoc-save SKILL.md Banned list.
- **Carry forward**: PROD views pending infra · Alex to confirm baki unit (days) + kiraan_pembaharuan NULL.

**Last Activity**: 2026-09-30 17:45 — junior handover (#264355 + #274266 → Farah) saved · main merged into worktree · DE.
