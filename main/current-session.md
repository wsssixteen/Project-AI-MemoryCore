# Current Session

**Last Activity**: 2026-10-06 23:15 — #283532 (PROD, batal two UPS_PLP) patched through infra, verified on PROD, Redmine submitted by miya, quest closed at Phase 1 · Domain Expansion run.

## Session Recap (2026-10-06 evening, worktree "patch-quest-283532-954012", QA-283532)
- **Ask**: run the patch quest for #283532, retrieve from Redmine, brief the steps. Then: stage Redmine, verify after infra, close quest, save quest, Domain Expansion.
- **Result**: PTMLK/01/L/UPS_PLP/2026/7 (3448936) and PTMLK/01/L/UPS_PLP/2026/10 (3469308) cancelled on PROD; both were held by fatimah.salleh@melaka.gov.my at UPS_PS, no active tugasan now. Infra ran at 17:11; re-read = 2 aplikasi rows Tamat / Batal / Tamat, 2 tugasan rows N / Selesai, 0 dashboard rows. Parent PTMLK/01/L/PT/2026/30 (nurul.izza@melaka.gov.my at SRMMKNPDT) untouched.
- **Script**: `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\Melaka\269. II #283532 - Pelupusan - UPS - Batalkan ID UPS (PROD)\2. Fix\283532.sql`, the #277442 shape (`etanah-knowledge/melaka/DATABASE.md` section 27) with the two ids.
- **Redmine**: form staged through the browser, miya submitted (Resolved, BA Nurul Amirah Nadiah, Root Cause (DEV), 283532.sql). Never went through In Progress. At save time Redmine = Ready in PROD (Amila Qistina Rohizat). `SAVE-QUEST → WAIT`: archive waits for Closed.
- **Quest state**: `status=closed phase=1`, doc `projects/coding-projects/active/QA-283532/QA-283532.md` (copied to the main checkout, the folder is ignored by git).
- **Slip logged**: `ask-back/searchable` (offered "want the code re-read?" for a fact one file read answers).
- **Not verified**: the cancel screen was read from master and has no UPS_PLP handling; it was not run with a UPS_PLP id. The Flowable process of each app stays open in the engine (not readable).
- **Tool gap**: `domain/sql-schema-verify/sql-schema-verify.js emit` pairs subquery columns and `SYSDATE` with the wrong table, so a correct script returned 7 rows and could not be stamped. Proposal logged.
- **Open**: archive #283532 once Redmine shows Closed (`node lib/save-quest.js QA-283532`).

**Last Activity**: 2026-10-06 15:40 — ADHOC-PT-2026-11 (Perak PT, load documents PROD to STAG): 122 `.main` paths listed and checked for infra · ProTime line now `<ENV> - <title>` · Domain Expansion run.

## Session Recap (2026-10-06, worktree "perak-permohonans-doc-paths-c1480c", ADHOC-PT-2026-11)
- **Ask**: paths of all documents for `PTPK/18/E/PT/2024/19` and `PTPK/13/E/PT/2023/2`, for infra to load from Perak PROD to STG. Then: prepare the adhoc for ProTime, save, commit, Domain Expansion.
- **Result**: 122 `.main` files (82 + 40) = 101 generated (`umm_a_dok_keluaran`) + 21 uploaded (`umm_a_dok_kmskn`), path in `et_dms.dokumen_revision.lokasi_fail`. His list file checked against PROD: 122 matched, 0 missing, 0 extra. File now at Task folder `1. Tasks\Perak\9. AH - PROD - PT - path dokumen untuk infra salin ke STG\2. Fix\PRK PROD paths.txt` (moved off his Desktop).
- **His corrections**: no `*` wildcard in paths for infra · no `.pdf` lines, `.main` only · the proof SELECT must run as handed (Perak PROD login `ET_READ` owns no tables, so it must be schema-qualified) · ProTime title starts with the env: `PROD - Load documents from PROD to STAG`.
- **Built**: `lib/adhoc-titles.js` prints `<ENV> - <title>` (eval 18/18) · adhoc-save + adhoc-titles skills say so · `lib/adhoc-save-audit.js` no longer counts another state's block as a clash on the same A# row.
- **Slip logged**: `answer-the-ask` (ProTime title without the env prefix; the instruction was in no loaded file).
- **Not verified**: STG `lokasi_fail_pdf` state (two STG queries timed out). If a document fails to open on STG after the copy, set `LOKASI_FAIL_PDF = NULL` for that revision (lever seen for WP, not proven for Perak).
- **Open**: infra copy · open one document per permohonan on STG · `lib/adhoc-save-audit.eval.js` was 19/24 on main before this session (5 stale fixtures, proposal logged) · the 20-scenario table for the adhoc-titles change was not written; 5 fixtures were added instead.
- **Knowledge banked**: `etanah-knowledge/perak/STATE-FACTS.md` § Document locator (main checkout only).
**Last Activity**: 2026-10-06 15:55 — `/doc-sim` built, eval 34/34, live run verified, quest skill made aware of it · #244600 cause reproduced offline, fix branch `a820679f80` reads both test pairs as the same

## Session Recap (2026-10-05 midday to 2026-10-06 15:55, main checkout, offline document generator → `/doc-sim`)
- **Ask**: an offline reproducer for #244600 (first Kemaskini, no edit, versi goes up). Widened by him mid-run to a complete template generator. Then: make it an invokable skill the quest knows about, save, Domain Expansion.
- **The tool**: `E:\Dev\scripts\EtanahTemplateGen\` (outside the repo; it compiles against the local WAR). Boots the app's own Spring beans outside JBoss against the local `etanahDS` schema, read-only, and calls `PelupusanTemplateUtil.processTemplate()`. Stops before `saveDocuments()`. 2 to 3 minutes a run.
- **The Feature**: `domain/doc-sim/` (runner `doc-sim.js`, `doc-sim.eval.js` 34/34, `log.jsonl`, README, NUKE-MARKER) + `.claude/skills/doc-sim/SKILL.md`. Census: PROPER. No hook.
- **Quest awareness** (`.claude/skills/quest/SKILL.md`): step 6e (`doc-sim applies` / `doc-sim n/a` at Phase 0) · 2 phase-table rows (Recon, Rubric falsifier) · 1 sentence in the falsifier ledger bullet · 1 hand-back row (`DOC-SIM:` line). Additive.
- **#244600 finding**: PTMLK/01/L/PPTPB/2026/15 @ azmezan@melaka.gov.my and PTMLK/03/L/PRZ/2026/2 @ nfadzilah@melaka.gov.my (PRMMKNPDT, stg2). A no-edit Word save drops run font size 12 (`sz=24`) on `jabatanTeknikalPT` / `jabatanTeknikalPRZ` + `namaJT` because the Normal style is 12. Compare at `f14c58ae64`: CHANGED (10 and 15 paragraphs, format only). Compare at `a820679f80` (`PelupusanWordLogUtil.kandungan`, branch `mlk/review/244600`): SAME on both pairs.
- **Not done on purpose**: nothing written into the #244600 quest doc. Another live session owns it (worktree `ticket-244600-review-89e02d`, copy newer than main's). No etanah repo touched.
- **Limits**: runs the classes of the local deployed WAR (a Java fix must be deployed first) · no screen, no save · screens and Jasper reports not attempted · filled RAHSIA files sit in `E:\Dev\scripts\EtanahTemplateGen\out\` until deleted.
- **Watches added**: `wmuwdrxf2` (quest skill rows) · `wmuwdrxng` (doc-sim skill).
- **Open for miya**: tell the #244600 session the offline result (both pairs SAME on `a820679f80`) · option to test an undeployed Java fix is not built · delete `out\` when #244600 closes.

**Last Activity**: 2026-10-05 23:00 — Kedah registered active · #268173 (Izz's UAT-CR, MLPS) run as the FIRST development quest · development path built into the quest skill · nothing committed, no Redmine write, no etanah code changed
