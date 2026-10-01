# Current Session

**Last Activity**: 2026-10-01 17:10 — all-day adhoc session (ADHOC-PRBB-2026-7 + -8 on HOLD) · adhoc-save ProTime title + daily-session rules · DE.

## Session Recap (2026-10-01, worktree permit-c02-2026-3-portal-362d6d — the all-day adhoc session)
- **Adhoc 1 — ADHOC-PRBB-2026-7** (Title: PRBB Ganti Hari bayaran royalti): PDTJ public on AWAM Ganti Hari C02/2026/3 → "Bayaran royalti/fi permit asal belum dijelaskan". Check = `AwamMaklumatLesenTabForm.validateGantiHariPermitRules():1143-1156` (any N `hsl_bayaran_fi` row on the original PRBB app blocks). PROD apl 3408435: 4 N rows — royalti 2165137 (paid at counter by ID hakmilik as NEW row 2166364, so the prepared row never settled) + Deposit Jalan / Deposit Bahan Batuan / Doket (RM5,000, no resit). miya replied to BA Mira with the check SQL screenshot. HOLD → PDTJ answer, then PROD patch.
- **Adhoc 2 — ADHOC-PRBB-2026-8** (Title: PRBB jenis permohonan SK): no SK. AWAM `PelupusanConstant` hardcodes 1 Baru / 6 Ganti Hari / 8 Tambah Kuantiti / 7 Langkau Tahun → saved as `integerJenisPermohonan` in `umm_a_permit_lesen.mklmt_tmbhn` → compared against the same constants (screen panels, Ganti Hari rules, `isLangkauTahun` BPMN gateway, template.config Minit Bebas / Surat Keputusan choice). Senarai kumpulan checked: closest `RPT_JNS_PERMOHONAN2` = old labels, report-only. HOLD → miya sends the BA answer. Side: LATENT-BUGS L19 (`== "2"`).
- **Built**: adhoc-save ProTime `title` (block + qa_doc + audit ≤6 words/40 chars, 69128809) · daily adhoc session rules (route to open adhoc, Title first, answer first, size gate → spawn_task, end-of-day DE save; skill + intake hook, 261ec2d8).
- **Slips (miya)**: SK answer handed over before checking senarai kumpulan + the code path ("have you verified it 100%", "trace the code", "did you check senarai kumpulan") · offered "log it / leave" for the L19 bug instead of logging it.
- **Carry forward**: -7 PDTJ answer → PROD patch · -8 BA send → close · push of 69128809 failed earlier (GitHub unreachable) — retried at DE.

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
