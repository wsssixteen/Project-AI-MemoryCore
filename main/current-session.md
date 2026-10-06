# Current Session

**Last Activity**: 2026-10-06 23:15 — #283286 (Ammar's fix, `getPtgLogo` → `getLogoPTG`) reviewed · quest saved and Phase 1 closed (review only, no commit of ours) · Domain Expansion run.

## Session Recap (2026-10-06 night, worktree "ticket-283286-review-bab0c9", #283286 colleague review)
- **Ask**: double check the fixes for #283286. Then (his /goal): check if Ammar updated his branch, save quest, close quest, Domain Expansion.
- **Ticket**: Internal Issue, BA Anis Nabilah. Common renamed the logo method (#279620, from common 1.7.8-MLK). Pelupusan must call the new name. One call site: `etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\constant\PelupusanReportMethodConstant.java` `PelupusanReportMethodConstant.populateImagePath():558`.
- **Ammar's branch `mlk/internal/283286`**: `c6296fa681` (16:41, the rename) + `2b6d37206a` (17:10, common version in `pom.xml` 1.7.5-MLK → 1.9.2-MLK.beta.patch4). Both are on `mlk/int-env`. On `mlk/stag-env` he merged the rename then put the old line back (`3db4027e7d`), so staging is unchanged in effect.
- **Verdict**: fix complete and consistent on internal. Common `825794699d` (1.9.2-MLK.beta.patch4) has `getLogoPTG()`.
- **My two misses**: (1) I called the common version in `pom.xml` "the pin"; he could not follow and said so hard. (2) My first verdict ("incomplete, builds should fail") came from the local tracking ref; Ammar had already pushed the missing half. Slips `reask/invented-label`, `verify/stale-local-ref`.
- **Watch points** (in the quest doc): a later re-merge of the branch into staging brings only the common version, not the rename (git sees it as merged) → revert `3db4027e7d` in the same merge · a release must point at a released common (1.7.8-MLK or newer), not the beta.
- **Not verified**: the internal build result and the rendered Slip Akuan Penerimaan.
- **State**: `QA-283286` status=closed, Redmine = Resolved (with BA), archive waits for Redmine Closed. Quest doc `projects/coding-projects/active/QA-283286/QA-283286.md` (main + worktree copies identical). No etanah repo touched, no Redmine write.

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
