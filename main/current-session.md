**Last Activity**: 2026-11-03 10:45 — worktree `redmine-issue-286988-203306` (branch claude/melaka-internal-env-issue-dc2cef), MCL internal flow + Notis 5A sign fix for 286610, Domain Expansion.

## Session Recap (2026-11-02 to 11-03, 286610 MCL internal for BA Mira)
- Done: PTMLK/01/L/MCL/2026/1 on MLIT: 16 variables restored on process 7887848 after the 14:03 re-initiate lost them; stray rows closed; Pembetulan flow passed 15:18 (Mira: "Flow yg pembetulan ok"), now 23.0 task 7888046. Notis 5A sign fix: SSKN5A += STATUS_PENYEDIAAN_BARU, STATUS_PENYEDIAAN_SEDIA in report.config.json, commit 75c17441de on mlk/esokongan/286610, int-env 81af580e95, pushed. Scenario picture sent.
- Not done: the fix is not seen on screen yet (falsifier row 6). If the signature persists, check the two active Notis 5A rows in skg_dok (14943990, 14944124). Who ran the variable writes and why Semakan logged Pembetulan false at 14:14 are not confirmed. ADHOC-MCL-2026-4 and -5 one-liners not updated: adhoc-brief-first blocked the write in DE (blocker slip logged).
- Wrong: told Mira the flow was OK before the lost variables surfaced; wrote her the wrong next tugasan once; first guessed the Word populator for a Jasper document; ran git fetch in his checkout (slip logged).
- Assessment: A1 adhoc-brief-first blocks DE saves of adhocs. A2 a re-initiate + alter drops process variables and no check says so. A3 git history of the earlier fix found the line after the populator guess failed. A4 report.config.json action lists per tugasan have no check against the DB status codes (DISEMAK vs SEMAK). A5 ⏭ no sweep.
**Last Activity**: 2026-11-03 10:26 — worktree `cool-margulis-5bb326` (branch claude/adhoc-quest-start-7cbcb5), ADHOC-MCL-2026-6 (287273 duplicate test data on staging), Domain Expansion.

## Session Recap (2026-11-02 to 11-03, ADHOC-MCL-2026-6)
- Asked: a staging No Resit that shows the PROD duplicate (same heir twice in Senarai Pemohon, Portal Awam MCL) for 287273.
- Found: the 287273 fix merges by versi + jenis + IC at draft creation (No Resit → Teruskan). Every build miya ran today merged. So same-IC rows cannot duplicate through the No Resit on a build with the fix, and no data patch changes that.
- Test data: No Resit 260806BSAT00425 (040107GMM00000959, AINAH + IDAH BINTI IDRIS, each 1/4 TMAME + 1/4 PMT), login alyaaqilah802@gmail.com. Without the fix: 4 rows. With the fix: 2 rows at 1/2. Needs a build without the fix (local mlk/master or stag-env deployed); not run.
- stg1 patches committed (test drafts only, no registry rows): drafts 63765, 63772, 63785, 63789 now 4 rows at 1/4 (new 61587-61590, 61625-61628). Revert in the qa_doc.
- Wrong: gave hakmilik ids for the No Resit box; claimed staging would show 4 from the branch, not the running build; gave 260923BSAT00240 (different IC, the fix does not merge it) and said finished; offered the Draf Permohonan route when the test must go through the No Resit. Slip rows logged for three.
- Open: BA reply not sent; the no-fix build test not run.

**Last Activity**: 2026-11-03 10:30 — worktree `pelupusan-1-9-1-deploy-99eee6` (branch claude/pelupusan-1-9-1-deploy-99eee6), Pelupusan 1.9.1 baseline to MR !12, Domain Expansion.

## Session Recap (2026-11-02 to 11-03, Pelupusan 1.9.1 baseline)
- Release 1.9.1: 287201, 286655, 287048, 286610 merged into mlk/release/1.9.1 (tip 3cf52efea6, common 1.10.20-MLK). BA passed baseline Pelupusan and Awam Pelupusan 2026-11-02. MR !12 to mlk/master, reviewer Alex. stag-env caught up to 7506e27958, compile green.
- Open: at 2026-11-03 10:07 origin/mlk/master is still 74982588f9, yet Redmine says "Released and ready in Prod : 02/11/2026" (Hakiim Majid) on all four. On his "merged": `node domain/release-mlk-plp/release-prep.js merge-to-master --release 1.9.1 --check` from the main folder.
- Awam stag-catchup for 1.15.1 refused: conflict in pom.xml and BaseConsentForm.java (consent changes 276583, 284760), and it would move common 1.10.19-MLK.beta.patch3 to 1.9.2-MLK. Nothing pushed. Slip row logged.
- Staging error 42342 (2026-11-02 18:56, PTMLK/01/L/MCL/2026/24, PSKN5A Selesai, null documentId): not from 1.9.1, PROD has it 4 times since July. Pembetulan branch has no null check (MlkSuratTemplateForm.java:3504-3507). Cause of the missing ID not proven. LATENT-BUGS L37. BA reply drafted.
- Quests saved at DE: 287201 + 286655 archived (Redmine Closed), 287048 Phase 1 closed (Pending User, user at a meeting), 286610 WAIT (Pending User).
- Assessment: A1 objective locks for 21 quests were injected on a "DE" prompt that named none. A2 287048's Resume Point said "Phase 0 done" while the fix was on PROD. A3 branch-guard blocked a Read on his checkout (mlk/int-env); git show on the release branch worked. A4 PROD release before master merge is not seen by release-prep. A5 ⏭ no sweep.

**Last Activity**: 2026-11-02 18:45 — worktree `ticket-287773-quest-run-66ac6f`, QA-287773 Phase 1 closed, Domain Expansion.

## Session Recap (2026-11-02, ticket 287773 PPTPB)
- Done: BA's fix, PT out of the PPTPB Agihan Kepada at Keputusan Pentadbir Tanah. Commit 193ca03bd0 on mlk/esokongan/287773, int-env 5a0906004f. Redmine posted 18:22 (journal 6): Resolved, Nurhafizah Hasan, 100%, his photo attached. Quest closed Phase 1, status WAIT until Redmine Closed.
- System landed earlier today: quest/place-file.js Tool + attachment-context reminder, quest and bpmn-check rules for the Flowable Save model Description (it replaces the old text), Pena flowable-description profile.
- Wrong: I advised the PT route from requirement 219931 on a 16:36 sync, BA wrote the opposite at 16:39. The v4 Flowable tidy left 174 of 249 arrows off the gateway diamonds, not saved. Both have slip rows; wrong-fix row 1 added.
- Open: (1) posted Solutions names KPT, his screenshot shows only PPD and KPPD, reason not verified. (2) MLIT PTMLK/03/L/PPTPB/2026/9 still with sabrina, must go back to PKPPT/suhaila. (3) MLIT engine v14 PT route undo not confirmed. All three are in the qa_doc Resume Point.
- Assessment: A1 save-quest read QUEST-STORY as MISSING for an absolute qa_doc, and the doc existed only in the worktree. A2 the Resume Point still said hold after the fix was posted. A3 Solutions text named KPT without being compared to the photo. A4 fix advice ran on a journal read 9 minutes old. A5 ⏭ no sweep run.

**Last Activity**: 2026-11-02 17:55 — worktree `mlk-prod-adhoc-issue-03dcca`, ADHOC-PPTPB-2026-8 archived to ticket 287773, Domain Expansion.
**Last Activity**: 2026-11-02 18:50 — worktree `sweep-orchestration-audit-39e710` (branch claude/redmine-quest-sweep-92d16e), eSOKONGAN sweep of 287346, 287509, 287607 finished, Domain Expansion.
