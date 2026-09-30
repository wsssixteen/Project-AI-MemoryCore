# Current Session

**Last Activity**: 2026-09-30 15:58 — QA-281423 consultation answered (Pemilik Tanah source mapping posted by miya to Teknikal) · closed + archived · DE.

## Session Recap (2026-09-30, QA-281423, worktree session-256334-recovery)
- **Ticket**: Teknikal Laporan Tanah 2.3(b)(xi) Pemilikan dan Alamat shows the Pemohon (SYARIKAT A), not the Pemilik Tanah (LIOW ENG KEONG). PTMLK/03/L/PRBB/2026/14 on MLIT. Syakir (Teknikal) asked Pelupusan for the data mapping.
- **Answer**: umm_a_pihak_bkptg holds only the Pemohon (flag_pemohon Y). Owner = ind_pihak_bkptg via idHkmlk → active ind_versi_dhd (versi_akhir_id) + flag_kuatkuasa + JENIS_PB_KEEMPUNYAAN. Trap: every PRBB pemohon row has jns_pihak_bkptg_id 625 (432/433 MLIT). Individu/Syarikat = jns_no_id 452/456.
- **Saved**: archive/QA-281423.md · DATABASE.md §30 · urusan/PRBB-TICKETS note · Task folder → Archive\.
- **Slips (miya)**: 2× ticket-writing-style — long sentences; implication instead of statement. Also: miya rejected bossy wording; Redmine needs Textile (pasted markdown table flattened).
- **Open**: feedback_ticket_writing_style memory not yet sharpened (worktree guard blocked the edit) — do from main checkout.
**Last Activity**: 2026-09-30 15:30 — ADHOC-PERMIT-2026-1 all-urusan early-mint audit saved as bug awareness (LATENT-BUGS L16/L17) · save routing fixed (DE Step 7 table + adhoc-save row 6) · adhoc-save-audit moved to Task folder v13 · DE.

## Session Recap (2026-09-29 → 2026-09-30, ADHOC-PERMIT-2026-1, main checkout)
- **Ask**: read-only audit, is any Melaka pelupusan urusan minting No Lesen/Permit before its issuing tugasan (class of #273461 / #282061)?
- **Answer**: only skrin 338 `MlkPengiraanBayaranLesenForm.performCustomSave():647` mints early; mounted in 4 urusan (PLPS, PPJK, PPTPB, PSBS; PROD = stg2). PROD 2026 counters issued 62 numbers: PPTPB 6 early (fix = #282061 R1) · PLPS 3 residue (#273461) · PPJK latent (0 apps at PYSK) · PSBS latent throw (no counter, `retrieveRunningNumberCode():361`) · MLPS/PRBB/PRU/lite clean. Side: `0402DIS2024000574` A02/2026/13 via Utiliti with no register row (L11 shape, hypothesis).
- **Saved**: ADHOC-REGISTER A36 · qa doc `ADHOC-PERMIT-2026-1.md` · PERMIT-LESEN-RUNNING-NUMBER.md §All-urusan early-mint audit · LATENT-BUGS L16 (PPJK) + L17 (PSBS) + L11 extended + sweep-log row · BUG-BESTIARY family-map line · bug-db index rebuilt (29).
- **Built**: expansion-protocol Step 7 table ("bug awareness" row → LATENT-BUGS.md · "index.md is the router" row) · adhoc-save SKILL rows 2 (Test data in qa_doc, v13) + 6 (bug awareness) · `lib/adhoc-save-audit.js` v13 (1. Brief via task-folder.js, `## Test data` check, retired-notes-txt check), eval 21/21.
- **Open (miya's rulings)**: PPJK guard now or wait · PSBS guard now or wait · check server.log 2026-09-14/15 for A02/2026/13.
- **Round 2 (15:45, "do it all")**: de-knowledge-gate v2 router check (bake homes must be in etanah-knowledge/<state>/index.md; eval 18/18) · audit-briefing no longer offers false RETIRE rows (own-log hooks + Agent-only hooks classified; 0 retire candidates) · sql-schema-verify + attachment-ledger-gate wrapped with hook-runtime (smoke-tested, telemetry rows written) · MAS 29 Sep diary merged into `current/2026-09-29.md` Session 7, stray root file removed. **Redmine ticket NOT raised** — miya wanted internal save only (slip `reask/misread-intent`); L16/L17 stay internal.

**Last Activity**: 2026-09-30 15:25 — MLIT internal deploy card · pelupusan build died at antrun zip (concurrent deploy-pendaftaran-it.sh) · ADHOC-VIEW-2026-1 scripts handed for all envs · DE.

## Session Recap (2026-09-28 → 2026-09-30, melaka-internal-deploy worktree)
- **Deploy card**: internal = one host `172.16.100.162`, `deployment-scripts/mlit`, `sh deploy-<module>.sh`, branch `mlk/int-env`.
- **Pelupusan build failure (2026-09-28 10:49)**: first failure `maven-antrun-plugin (replace-properties): Problem creating zip: .../target/etanah-pelupusan.war (No such file or directory)` after 59.8 s; everything below it was cascade. `ps` showed `deploy-pendaftaran-it.sh` (pid 1817149, pts/2, started 10:36, 21+ min). HYPOTHESIS, unconfirmed: concurrent run on mirage1. miya never pasted the re-run result.
- **ADHOC-VIEW-2026-1**: Alex asked whether the views include expired lesen/permit. Yes — no status filter (same as KL). PROD evidence: all 3148 permit rows `flag_permit = KuatKuasa` incl. 731 past `trkh_tamat`, so status never flips on expiry; filter by `tarikh_tamat` / `bakitempoh`. Neither view exists yet on STG2 · STG1 · MLIT · PROD (information_schema, 2026-09-30). Scripts handed in chat; PROD via infra needs `et_main.` prefix + miya's nod.
- **Slip (self)**: first answer told miya to filter `flag_permit = 'Kuatkuasa'` before checking the data; corrected after the PROD query.
**Last Activity**: 2026-09-30 15:22 — Baseline Pelupusan 1.7.0 closed: BAQA passed, `mlk/master` = `365fe73629` · DE.
