# Current Session

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

## Session Recap (2026-09-29 → 2026-09-30, ADHOC-PERMIT-2026-1, main checkout)
- **Ask**: read-only audit, is any Melaka pelupusan urusan minting No Lesen/Permit before its issuing tugasan (class of #273461 / #282061)?
- **Answer**: only skrin 338 `MlkPengiraanBayaranLesenForm.performCustomSave():647` mints early; mounted in 4 urusan (PLPS, PPJK, PPTPB, PSBS; PROD = stg2). PROD 2026 counters issued 62 numbers: PPTPB 6 early (fix = #282061 R1) · PLPS 3 residue (#273461) · PPJK latent (0 apps at PYSK) · PSBS latent throw (no counter, `retrieveRunningNumberCode():361`) · MLPS/PRBB/PRU/lite clean. Side: `0402DIS2024000574` A02/2026/13 via Utiliti with no register row (L11 shape, hypothesis).
- **Saved**: ADHOC-REGISTER A36 · qa doc `ADHOC-PERMIT-2026-1.md` · PERMIT-LESEN-RUNNING-NUMBER.md §All-urusan early-mint audit · LATENT-BUGS L16 (PPJK) + L17 (PSBS) + L11 extended + sweep-log row · BUG-BESTIARY family-map line · bug-db index rebuilt (29).
- **Built**: expansion-protocol Step 7 table ("bug awareness" row → LATENT-BUGS.md · "index.md is the router" row) · adhoc-save SKILL rows 2 (Test data in qa_doc, v13) + 6 (bug awareness) · `lib/adhoc-save-audit.js` v13 (1. Brief via task-folder.js, `## Test data` check, retired-notes-txt check), eval 21/21.
- **Ruled 2026-09-30**: PPJK + PSBS fixed in a future release or when a ticket lands (LATENT-BUGS L16/L17 carry the ruling + earliest tugasan: PPJK 43.0 PYSK, PSBS PRMMKNPTGT) · register A36 → LATENT · block archived, Task folder → Archive\. Still optional: server.log 2026-09-14/15 for A02/2026/13.
- **Round 3 (16:00)**: miya "not sure what you're talking about ... next steps without short explanation" → Next steps table is now `# | Action | What it means | Your reply` (injector) + `domain/next-steps-shape` Stop check in the stop-reply-shape bundle (eval 8/8; blocks the exact flagged table) · slip `reask/jargon-next-steps` · 6 overdue watches resolved ok on telemetry/eval evidence, 2 left open (redmine status-write path, BA pass-note template: not yet exercised) · `quest/active-cli.js archive` now repoints the archived block's qa_doc to archive/ (was a manual fix).
- **Round 2 (15:45, "do it all")**: de-knowledge-gate v2 router check (bake homes must be in etanah-knowledge/<state>/index.md; eval 18/18) · audit-briefing no longer offers false RETIRE rows (own-log hooks + Agent-only hooks classified; 0 retire candidates) · sql-schema-verify + attachment-ledger-gate wrapped with hook-runtime (smoke-tested, telemetry rows written) · MAS 29 Sep diary merged into `current/2026-09-29.md` Session 7, stray root file removed. **Redmine ticket NOT raised** — miya wanted internal save only (slip `reask/misread-intent`); L16/L17 stay internal.

**Last Activity**: 2026-09-30 15:25 — MLIT internal deploy card · pelupusan build died at antrun zip (concurrent deploy-pendaftaran-it.sh) · ADHOC-VIEW-2026-1 scripts handed for all envs · DE.
