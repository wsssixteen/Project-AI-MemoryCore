**Last Activity**: 2026-11-03 10:35 — worktree `dreamy-pike-08af0b` (branch claude/quest-workflow-diagram-b6c854), QA-287048 rework pass to BA, Domain Expansion.

## Session Recap (2026-10-30 to 11-03, ticket 287048 rework)
- Done: fix 9443c7e853 (Hantar needs a signature from the current round, also after Alter or Pembetulan), merged int-env a036d3d568 and stag-env 9f8f5d6a14. Redmine rework pass submitted 2026-11-02 12:25 to Fizah with `1. Scenarios covered.png`. stg1 PTMLK/03/L/PRBB/2026/12 altered to PB4CE for the Alter test (new a_tgsn 2884531).
- System landed on main: logic-blast-radius gate v4 (arrival paths, eval 51/51) 92e604e6; explain-diagram red only for issues 19f46992; CLAUDE.md v2.04 chat tables are normal Markdown, never code blocks, c770b98c.
- Open: his Alter test result on stg1 2026/12 not received. Redmine Pending User; save-quest WAIT.
- Wrong: gave two first-round permohonan as altered (query counted every document; slip row). Stripped colours when he asked for neutral. Wrote the BA note in my voice before reading Pena. Put tables in code blocks he never asked for.
- Assessment: A1 a merge commit carried conflict markers in land-on-main.jsonl for one commit (PowerShell 5 Set-Content has no -NoNewline); fixed 0b75a2aa. A2 two sessions wrote the same quest doc; the other DE did not know gate v4 had landed. A3 test-data query had no jns_dok filter. A4 the Alter scenario needs an alter to test because no live PB4CE holds an old signature. A5 ⏭ no sweep.
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
