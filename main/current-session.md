# Current Session

**Last Activity**: 2026-09-30 16:45 — redmine-write-gate v1.3 (field reads no longer count as a write) · DE.

## Session Recap (2026-09-30, redmine-write-gate v1.3, main checkout)
- **Ask**: the gate blocked `node <scratchpad>/audit.js` on 2026-09-28 (http.get only, read `i.done_ratio`). Refine so bare field reads do not count; keep every real write blocked.
- **Built**: `isMutation()` = write verb (method/`-X`/`--request`/`-Method`/quoted `'PUT'`/`requests.put(`/wget) OR request body (`-Body`, curl `-d/--data*/-F/-T`) OR payload KEY (`issue: {`, `notes:`, `status_id:` …). A read (`i.done_ratio`, `i['notes']`) no longer counts. Eval 56/56 (F39 = the 09-28 replay, F40-F55 new, F31 re-shaped, F31b added). Commit b570ad8a. README v1.3 + 23-row scenario table.
- **Denied**: F19b (writer saved under the exempt name passes) blocked by the auto-mode classifier; miya ruled skip — F19 + F29 already cover the exemption.
- **Watches**: new wmuns52kg on the hook (5 sessions) · wmumjs1ma (v1.2) resolved ok as superseded.
- **Slips (miya)**: 2× answer-the-ask — asked for one sentence / very short sentences, got bullets + a table.

**Last Activity**: 2026-09-30 16:10 — ADHOC-PRBB-2026-6 (PROD Pembatalan Permohonan Jana ralat) closed OWNED-ELSEWHERE (common/GIS) + archived · adhoc "move BA downloads" step built · DE.

## Session Recap (2026-09-30, ADHOC-PRBB-2026-6, worktree melaka-pembatalan-ralat-f283f4)
- **Ask**: PDTMT PROD, Utiliti Proses Pembatalan Permohonan PTMLK/01/L/PRBB/2026/13 @ SaffuanH, klik Jana → ralat NPE `this.gisRequestService is null`.
- **Root cause (PROD server.log)**: `relation "et_ptg.log_service" does not exist` ×6 09:50-10:03, all Pembatalan Jana. GIS log table missing in PROD GIS DB (common 1.6.7 logging, commit e2ee7f9adc) + common `PostgresUpdateService` null helper turns it into an NPE. **Not ours** — common told with the error line only.
- **Parked**: pelupusan try/catch in `PelupusanIntegrateGISService.insertChartingTolak` built + compiled then DISCARDED; kept as option in the qa_doc. Pelupusan tree clean.
- **Built**: adhoc detector step 1a (MOVE attached Desktop/Downloads files into the brief folder) + audit check "BA downloads MOVED" + adhoc-save row — eval 15/15, commit c6d4a079.
- **Knowledge**: LATENT-BUGS L18 · ADHOC-TRIAGE rule 6 (mask NPE → read the server.log line before it) · urusan/PRBB-TICKETS note. Bounty e862cc7a.
- **Slips (miya)**: adhoc-scaffold-misread (read "build it, verify" as the etanah fix, asked for JBoss) · module-boundary-overreach (drafted common hand-off offering to carry their script to infra). Memory: feedback_other_team_message_not_our_issue + module_edit_boundary "never carry".
- **Open**: empty source Task folder `244. AH ...` (`0. Brief`, `2. Fix`) locked by Explorer — files are in Archive\, delete the empty shell once Explorer is closed. DB gateway backends blocked by Windows Application Control this morning.

**Last Activity**: 2026-09-30 15:58 — QA-281423 consultation answered (Pemilik Tanah source mapping posted by miya to Teknikal) · closed + archived · DE.

## Session Recap (2026-09-30, QA-281423, worktree session-256334-recovery)
- **Ticket**: Teknikal Laporan Tanah 2.3(b)(xi) Pemilikan dan Alamat shows the Pemohon (SYARIKAT A), not the Pemilik Tanah (LIOW ENG KEONG). PTMLK/03/L/PRBB/2026/14 on MLIT. Syakir (Teknikal) asked Pelupusan for the data mapping.
- **Answer**: umm_a_pihak_bkptg holds only the Pemohon (flag_pemohon Y). Owner = ind_pihak_bkptg via idHkmlk → active ind_versi_dhd (versi_akhir_id) + flag_kuatkuasa + JENIS_PB_KEEMPUNYAAN. Trap: every PRBB pemohon row has jns_pihak_bkptg_id 625 (432/433 MLIT). Individu/Syarikat = jns_no_id 452/456.
- **Saved**: archive/QA-281423.md · DATABASE.md §30 · urusan/PRBB-TICKETS note · Task folder → Archive\.
- **Slips (miya)**: 2× ticket-writing-style — long sentences; implication instead of statement. Also: miya rejected bossy wording; Redmine needs Textile (pasted markdown table flattened).
- **Open**: feedback_ticket_writing_style memory not yet sharpened (worktree guard blocked the edit) — do from main checkout.
**Last Activity**: 2026-09-30 15:30 — ADHOC-PERMIT-2026-1 all-urusan early-mint audit saved as bug awareness (LATENT-BUGS L16/L17) · save routing fixed (DE Step 7 table + adhoc-save row 6) · adhoc-save-audit moved to Task folder v13 · DE.
**Last Activity**: 2026-09-30 16:05 — ADHOC-PERMIT-2026-1 CLOSED + archived (miya ruling: PPJK/PSBS fix in a future release or when a ticket lands) · Next steps rows now need a "What it means" sentence (next-steps-shape check) · 6 overdue watches resolved · DE.
