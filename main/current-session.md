# Current Session

**Last Activity**: 2026-10-03 (Sat night) — Terengganu made an ACTIVE state: registry flipped, knowledge folder filled from live sources, harness made state-aware, 5 modules cloned, PROD read fixed, evals + quest audit run.

## Session Recap (2026-10-03, worktree quest-audit-275043-244600-7954c0, Terengganu support prep)
- **Ask**: Terengganu support starts 2026-10-04. Prepare everything a full quest needs, run real quests on Terengganu pelupusan as evals, fix, then audit the quest workflow in general (no state-specific patches, no context trimming).
- **Registry**: `system/states.json` terengganu `excluded` → `active` (Task folder, DB MCP map, schemas incl. PROD, Redmine project `esokongan-terengganu`, branch shapes, work clone root, 9 modules). `lib/states.js` id regex accepts the 7-segment `PTTRG/<pejabat>/<sub>/<letter>/<URUSAN>/<yyyy>/<seq>`. CLAUDE.md v1.77.
- **Knowledge** (`etanah-knowledge/terengganu/`, main repo, untracked): 17 files written from live staging + PROD + GitLab + code, each fact-checked by a second agent (about 110 corrections), plus `urusan/` precedent files (2481 tickets) and `flowables-bpmn/_engine/` (live PROD + staging models). Old scaffold backed up in `outputs-temp/terengganu-knowledge-backup-2026-10-03/`.
- **Key facts** (all in `terengganu/STATE-FACTS.md`): live queue = Redmine `esokongan-terengganu`, mostly PROD support (alter tugasan, data patch). Staging = one DB `trgstg`; stg2 fresh (BA), stg1 frozen and the only reader of the shared engine schema `et_flowable17_stg`. Schema names equal Melaka's, the MCP server name is the discriminator. PROD read works (`et_main` + `et_flowable17`). PROD and staging models are byte-identical for 23 of 24 keys. A failed agihan shows as a pool row (`~`, no holder), never `flag_gagal_agih`.
- **Git**: live server = GitLab `git@10.16.63.27:etanah/<repo>.git`; old `172.16.93.167` refuses auth. Trunk `trg/master` (1.36.0). Ticket branch in a worktree of `E:\Dev\etanah-work`. 5 modules cloned under `E:\Projects\Terengganu` (teknikal, uam, integration, dms, pembangunan). All 9 repos have a codegraph index. Compile green for 1.35.3 and for trunk 1.36.0 (`E:\Dev\etanah-work\wt-trg-master`).
- **Harness**: 8 fixers + reviewer: ticket-load-verify, ticket-gate rows 0 / 0.6 / 1c / 1d, archive + delegate + backfill + bulk, etanah-intake-gate, adhoc-paste-detector, bug-db, adhoc-register, latent-bugs-gate, probe-local-only-gate, redmine-sync abbreviations, redmine-board per-state table, urusan-tickets `--state`, close-phase + verify + retrieve-redmine + script-check + quest skill wording, quest-protocol 3.9, compile toolchain JDK 17. Side fix: `turn-ledger.eval.js` no longer wipes `goal-lens-pending.jsonl`.
- **PROD credential**: gateway entry `postgres-trgprd-pg` now carries the DBeaver password (per みや); backup `~\.db-gateway\backends.json.bak-20261003124914`.
 (Alex did 282723 alter; 282721 unlink via infra) · voice map artifact · patch-close-shape CHECK D/E · reconcile closed 5 quests · DE.

## Session Recap (2026-10-02, worktree quest-282587-guide-be4171, #282723 + #282721)
- **Ask**: start quests for 2 internal PROD tickets; alter /3 /4 /9 (282723); fix PRBB/2026/4 unpaid bills (282721); infra handoff; answer Mira; style audit + artifact; reconcile quests with Redmine; DE.
- **Done**: 282721 cause = cashier keyed hakmilik id, SPOC NO_FAIL made new paid fee rows, officer's 4 bills stayed N. Infra unlinked the 4 bills (`282721-amend.sql`); PROD 5 fi rows all Y. 282723 taken + done by Alex Ang (Initiate & Alter). Reconcile: 282198/282721/246923/280540/282723 closed, 282723 archived, #282966 synced as hold.
- **Built**: patch-close-shape CHECK D (#ticket line ≤10 words) + CHECK E (greeting inside fence), eval 59/59 · quest SKILL 6b ask "post it" as row 1 + DB-screenshot row · no-builtin-browser memory · speech entries 11/12 + BA short names · artifact Miya's Voice Map.
- **Slips**: built-in browser used after ban · Alter Flow vs Initiate & Alter · coordinate-click on PROD dropdown · tickets stolen (In Progress not set) · formal Malay root cause · overloaded infra handoff.
- **Open**: QA-280540 archive needs harvest · QA-282721 archive · #282966 hold · Flowable alter Playwright tool (todo Q1).

**Last Activity (prev)**: 2026-10-02 18:20 — #244600 Kertas versi fix (our side only) committed d61fc2e611 on mlk/qa/244600v3 · int-env 5df44b12cf · miya posted Resolved to Fizah · Phase 1 CLOSED · #275043 split to Ammar · handoff-load feature built · DE.
**Last Activity**: 2026-10-02 18:32 — ADHOC-STG-2026-1 stg1 synced to stg2 (pelupusan reference data, 178 ins / 8 upd, committed) · routine decision parked in todo Q1 · DE.

## Session Recap (2026-10-01→02, main checkout, ADHOC-STG-2026-1)
- **Ask**: check stg1 and stg2 are both up to date; stg1 to follow stg2 (trigger #274266 PT Tangguh setup).
- **Found**: both schemas share ONE flowable t_flowable17 (22 MLK_PLP_* same version + md5) · neither login can read the other schema · stg1 missing PDBB urusan (97 rows), PRBB Tambah Kuantiti (38), PT PYSKTPDT/PSKTPDT, PPTPB industri lookups, MCL smkn PLNASAL, AWAM slip params · 3 value diffs (PT PYSTP + PRBB PYRJKBBPTG nama, jns_dok keselamatan ×3).
- **Done**: generated kod-subquery script from stg2 rows, verified read-only, miya nod, ran on stg1 in ONE transaction (before/after check matched) → COMMIT; re-diff = PLP parity except MCL SPI. Task 255. AH - STG - PLP - stg1 ikut stg2 data rujukan (2. Fix\ADHOC-STG-2026-1.sql + -check.sql). Register A43. Tools in projects/coding-projects/active/ADHOC-STG-2026-1/.
- **Left out (stg2 ≠ PROD)**: MCL SPI peranan · ind_laporan PLP01 · PLP_BIL_THN_PERINGATAN param — miya's call.
- **Open**: stg1 cold restart (miya) · todo Q1 🌐 Env row: decide where/when env parity becomes a routine.
**Last Activity**: 2026-10-02 18:30 — #282442 Pembatalan Jana PRBB: R1 kod pejabat fallback `24c277d683` on `mlk/esokongan/282442`, cherry-picked int-env `495d16fe66`, MLIT tested pass · cross-module-check skill + ownership-input-check gate built · quest saved · DE.

## Session Recap (2026-10-01 → 02, worktree redmine-282442-9258e6, #282442)
- **Ask**: quest #282442 (ESOKONGAN, PRBB Pembatalan Jana ralat), audit why the 09-30 adhoc called it GIS, build a pre-handover check, deploy internal, Redmine handover.
- **Done**: root cause = `MlkUtilitiPembatalanPermohonanForm.initBPMFlow():346` sends "" kodPejabat for PRBB (helper `PelupusanExcelReaderHelper:854` skips PRBB) → common `DBUtil.GetSchemaByKodPejabat` falls to `ptg` → `et_ptg.log_service` missing → L18 NPE mask. R1 committed, int-env cherry-pick (merge conflicted on release 1.8.0), miya tested pass. D1 (8 PROD orphan UPP, 24 rows) checked safe, no script yet.
- **Built**: `domain/ownership-input-check` (Stop, stop-claim-integrity bundle, eval 22/22) · `.claude/skills/cross-module-check` (eval 29/29) · adhoc-save-audit OWNED-ELSEWHERE check (24/24) · quest Recon ownership row · Debug Ritual 7 · etanah-knowledge OTHER-MODULES.md (GIS kod→schema map moved there) · speech collection entry 8 (rojak Root cause/Solution).
- **Slips**: `wrong-owner-verdict` · `reask/voice-mismatch`.
- **Open**: rework cycle 1 (another session, 10-02) R2 `getKeputusanMMKN()` awaits nod · Redmine post (draft in qa_doc) · D1 delete script · planned-release list.
**Last Activity**: 2026-10-02 18:20 — #244600 Kertas versi fix (our side only) committed d61fc2e611 on mlk/qa/244600v3 · int-env 5df44b12cf · miya posted Resolved to Fizah · Phase 1 CLOSED · #275043 split to Ammar · handoff-load feature built · DE.

## Session Recap (2026-10-02, worktree quest-audit-275043-244600-7954c0, #244600 + #275043)
- **Ask**: paired quest 275043 + 244600 to Rubric, brief (miya auditing my brief), then split, apply, deploy, Redmine.
- **Done**: blind re-check held. Cause = two writers add versions: our Kertas page reload (`BasePelupusanDokumenForm` 3-arg save always new versi) + common `WordEditorService` draft on every Word close. Final fix all on our side: R1 in-place page-load save · `MlkKertasTemplateForm.onRefreshDokumen()` override (same content → remove new draft + restore counter, changed → `hantarDocument`) · G1 Aaron `d12a896b56`. Commit `d61fc2e611`, int-env merge `5df44b12cf`. Common hand-off dropped. #275043 delegated to Ammar.
- **Not tested locally**: miya deployed straight to int-env; BA Fizah is first tester (mlit PTMLK/02/L/PLTP/2026/7 @ faridmajid, versi 8). Posted note lacked the git block + Root cause/Solution fields (seen in sync).
- **Built**: `domain/handoff-load/` (loads cross-module hand-off procedure on hand-off prompts, upsm-mode bundle, eval 17/17) + quest SKILL hand-off row. Memory: ticket-writing-style "never restate the ticket", cross-module-handoff gate claim corrected.
- **Slips**: `reask/rambling` (long Redmine note) · `memory-not-loaded` · `reask/invented-label` ("close draft"). miya rule: our-side fix first, Fable audit before any other-module hand-off → add to Rubric AFTER this ticket is merged (pending).
- **Open**: Rubric rule above (build + eval later) · BA verify on mlit · #244600 on planned-release list · Phase 2 archive after BA passes.

**Last Activity (prev)**: 2026-10-02 18:14 — #277706 SPOC Tambah Kuantiti: answered Atierah note-15 no. 1 (table/column of AWAM pra data) · miya posted 05:06Z to Mira · Phase 1+2 closed + archived + bounty · DE.
