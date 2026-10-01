# Current Session

**Last Activity**: 2026-10-01 17:05 — ADHOC-UPS-2026-1 (UPS_PLP common templates) saved + audit 28/28 · DE.

## Session Recap (2026-10-01, worktree pelupusan-template-verify-fe1bef)
- **Ask**: reload the 21 Sep template-usage audit; verify the 3 templates that go through etanah-common (miya thought "ulangan"); give urusan + tugasan for BA to test.
- **Found**: the 21 Sep session (archived "Etanah Melaka template usage audit") was never saved — found via transcript search. Re-verified: 3 common = SN_JPPH surat-SuratNilaianJPPH · CON_SRT_JT surat-SuratJabatanTeknikal · SMPG surat-SuratMaklumanKepadaPemegangGadaian, only via UPS_PLP / UPS_PS (MlkPelupusanPenyediaanSuratStrategy.java:62 → CommonPLPandBGNSuratStrategy.java:92). Ulangan JT is NOT common in Melaka (pelupusan own TemplateSuratUlanganJabatanTeknikal.docx). PROD: SN_JPPH 4 · CON_SRT_JT 1 · SMPG 0. 4th option BGN_UTILSM has no MLK surat_makluman.docx.
- **Test data (STG)**: PTMLK/02/L/UPS_PLP/2026/7 nazli · /03/.../2026/4 asikin · /02/.../2026/6 faridmajid, all at Penyediaan Surat.
- **Slips**: first adhoc-save writes landed in the worktree (no cd to main) — moved; notes.js --reset wiped the 2 extra test rows — re-added.
- **Carry forward**: send BA message; BGN_UTILSM check if BA picks it; 10 ukur/permit templates need etanah-teknikal locally.
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
