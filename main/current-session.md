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

## Session Recap (2026-10-05 evening, main checkout, #268173 Kedah development quest)
- **Ask**: brief Izz's Kedah ticket #268173, then (his /goal) build a "development" quest path, like the patch path, and run it fully on this ticket. He chose: role = guide Izz · register Kedah as active · he hates a list presented as complete when it is not.
- **Why the path exists**: my first guide for Izz was a 6-row list read from the symptom screen. He asked "are you sure those are the things left?" and "how much does our table help?" (about a third). Slip logged `assume-not-verify` (two rows were guesses).
- **Kedah registry** (`system/states.json`, `etanah-knowledge/kedah/STATE-FACTS.md`): scope active · prefix `PTKED` (was `PTKDH`) · GitLab `git@10.16.63.27:etanah/<repo>.git`, same repos as Melaka · pelupusan trunk `kdh/development` · env `kdh/int-env`, `kdh/release/uat` · Redmine projects 321 / 296 / KED_03_Pelupusan. NOT known: database (no access), local checkout, Task folder, awam trunk. `validate kedah` still ✗ on the missing checkout.
- **Quest doc**: `projects/coding-projects/active/QA-268173/QA-268173.md` — 9 requirements, 20 facts, 7 work packages, 38 touch-points, 5 decisions (D1-D5, owners Chan Jun / Amin), check queries for Kedah, skeptic audit, coverage count. `node quest/dev-map-check.js 268173` → OK.
- **Izz's branch**: `kdh/cr/268173` @ `a3693e05e3` (1 commit, 72 lines in `kdhMaklumatTanah.xhtml`). 1 of 38 touch-points started, 0 finished. His block is ungated and the component is mounted on 4 pages.
- **Biggest findings**: a tugasan's langkah and screens are database rows · the fine is PLPS-only in 4 Java/xhtml guards · the bill is written from a stale total unless Kira runs first · an MLPS SKM config entry already exists and conflicts with the CR · the portal still saves the amount after the fields are removed · Kedah MLPS already charges a fee at submission (decision D2) · no applicant "please pay" message exists anywhere.
- **Delegation**: 4 Sonnet readers (Kedah pelupusan · Bayaran Pelbagai and flow · Melaka DB model · portal) + 1 Fable 5.1 skeptic. Fable found 6 missing + 5 wrong claims; I re-read each cited line, and found a 4th mount it missed.
- **System change** (uncommitted): `.claude/skills/quest/SKILL.md` step 6d + section "Development path" (D1-D8, `path=development`) · `.claude/skills/quest/QA-NNN-template.md` development blocks · NEW `quest/dev-map-check.js` + `quest/dev-map-check.eval.js` (21/21 green). Watches `wmuvdadfk`, `wmuvdadm7` added before the edits were committed.
- **Not reachable**: the live Kedah flow modeler (redirects to login); flow facts come from the 2026-09-03 export.
- **Open for miya**: send the guide to Izz (it is his message) · local Kedah checkout yes/no · commit the MemoryCore changes.

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
