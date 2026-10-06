# Current Session

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

**Last Activity**: 2026-10-05 17:00 — #278909 (PT Risalat MMKN, cycle 2) review of Farah's rework → shared docx conflict resolved by us → merged to `mlk/int-env` `d0f2177f02` → Redmine handover drafted → Phase 1 closed (cycle 2) · Domain Expansion run.

## Session Recap (2026-10-05, worktree "review-farah-ticket-rework-64d3c2", #278909 takeover review)
- **Ask**: review Farah's latest rework on #278909, then merge to internal Melaka and prepare the Redmine handover, then save quest + Phase 1 close + Domain Expansion.
- **BA cycle (2026-10-03, MLIT)**: point 6 Perakuan PTG in the Risalat MMKN for PT. Fields not filled (No. Pengenalan, Lot/PT, Tujuan, Penjenisan, Premium), numbering `1.` where 6.1 / 6.2 belong, alignment.
- **Farah `5fca34a75d`**: Java rows added to `populatePTGParagraph_PT_Tolak` / `_PT_Lulus` in `etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\constant\PelupusanWordCCMethodConstant.java`; PT sections edited in the shared `additionalJKKLParagraph.docx`; 8 PT templates indent only. Reviewed by diff: right shape, PT sections only, other urusan untouched.
- **Conflict**: the shared docx had also changed on master (Aaron `ca5811afe2`, #246512, new section `paragraphPTGPPJKLulus`). I first stopped and asked who should rebuild it. みや: "We should resolve the conflict, please remember this rule." Then: merged `origin/mlk/master` into the ticket branch, resolution = master's file + Farah's 3 PT sections, checked section by section, opened in Word with repair off, compile green.
- **Git**: `mlk/internal-issues/278909` @ `7cc4c84e1e` → `mlk/int-env` @ `d0f2177f02` (10 ticket files). Not on staging (he asked internal only).
- **Gate**: commit blocked on no local test. He wrote `[risk-ok: 278909 BA tests on MLIT]`. Falsifier ledger written into the quest doc (4 rows, row 4 = his accepted risk).
- **Not verified**: no Risalat generated with the fix. Test rows: `PTMLK/01/L/PT/2026/35` and `/27` @ muhammadshafiq@melaka.gov.my (PRMMKNPTG, MLIT).
- **Handover shape he asked for**: BA note, "Thank you very much.", blank lines, then "Dev notes:" (branch, master merge, conflict line, int-env merge). Root cause + Solution drafted. He posts.
- **Rule saved**: a merge conflict found while reviewing a colleague's branch or helping a deploy is ours to resolve, docx included (`.claude/auto-memory/feedback_commit_deploy_runbook.md`, top block).
- **Redmine at close**: Resolved, assignee Nurhafizah Hasan, 100%. Quest block `status=closed`, `closed_cycle2=2026-10-05`.
- **Open**: his internal deploy + a rendered check · planned release list · optional Java tidy (Farah's rows vs the PT PBN sibling shape) · knowledge candidates below need a main-checkout session (the etanah-knowledge folder is not in a worktree) · an empty `3. Rework\Brief` folder was created in the Task folder by the status flip.
- **Session friction worth knowing**: this worktree session cannot edit the main checkout's quest doc with the Edit tool. The ledger and resume point were written by script after his "write the ledger". `quest/active.txt` in the main checkout was updated through `active-cli` and sits uncommitted there.

**Last Activity**: 2026-10-05 16:00 — #246923 (PLPS Risalat MMKN, cycle 2) review of Ammar's fix → merged to `mlk/int-env` `3fa76655c6` → Redmine handover drafted → Phase 1 closed · Domain Expansion run.

## Session Recap (2026-10-05, worktree "quest-run-ticket-review-613e4d", #246923 takeover review)
- **Ask**: run quest on #246923 and review the ticket. Ammar had committed on 2026-10-02, set it Resolved and passed it back with "can help review".
- **Open item**: only item f (BA 2026-09-15): at PTG the Risalat MMKN stops at Item 5, expected up to Item 6.
- **Ammar's fix**: etanah-pelupusan `mlk/qa/246923v2`, `e2a2680e8a` + `15fb754499`. One-time refill of the Risalat on first open of PRMMKNPTG (`MlkKertasTemplateForm.repopulateRisalatPlpsPtgOnFirstOpen`) + the three PTG tasks removed from the PLPS generic-template block in `template.config.json`.
- **Review**: logic holds on every link I could read (task stamp written by `PelupusanTemplateUtil.saveDocuments`, stored document reprocessed in place, both templates carry `paragraphPTGPLPS`, Sedia action does not exclude it, PTG task is in the allow list). Never run by anyone. Confidence given to miya: 80% fix, 65% ticket pass.
- **Deploy prep**: miya ruled internal only. Merged v2 into `mlk/int-env` → `3fa76655c6`, pushed, compile green. One conflict in `MlkKertasTemplateForm.initData()` resolved to int-env's layout + Ammar's three-line call. Staging NOT merged. miya runs the mlit deploy himself.
- **Handover drafted** (not posted): Root cause + Solution in Malay, short colleague-fix note to Mira, fields. Text is in the qa_doc.
- **His rulings**: a ticket branch goes to staging ONLY when he names staging (added to `feedback_commit_deploy_runbook`) · keep both branches · **if #246923 comes back as Rework it goes back to Ammar** (in the quest block `close_note` + qa_doc).
- **Open**: miya's mlit deploy + Item 6 check + posting the note · the `Co-Authored-By: Claude` line in Ammar's two commits is now on int-env, asked three times, not ruled. Do not ask again; raise only if the branch heads to a release.
- **Test data**: stg2 PTMLK/02/L/PLPS/2026/17 at PRMMKNPTG (muhammadshafiq@melaka.gov.my) · mlit has no PLPS app on the PTG step, nearest PTMLK/01/L/PLPS/2026/21 at SRMMKNPDT (sanarimah@melaka.gov.my).
**Last Activity**: 2026-10-05 01:45 — boot audit + system structure: batch 1 LIVE on main (`19bc4963` · `a954de41` · `6beed4ba`), handover written, two read-only Workflow runs in flight (verification `wf_49cf7fce-b89` · batch-2 design `wf_923b9eaf-18e`). NOT a session close; no Domain Expansion run.
