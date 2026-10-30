**Last Activity**: 2026-10-30 16:45 — worktree `cranky-wilson-4cb38e` (branch claude/ticket-287292-return-audit-072795), 287292 returned by BA, re-patched, Redmine posted, quest saved, Domain Expansion.

## Session Recap (2026-10-30, worktree "cranky-wilson-4cb38e", 287292 PROD letter returned)
- 287292 came back because yesterday's patch used the ADO day (19, 19, 21 Oktober) while the BA asked for the first-generated dates (30/9, 30/9, 20/10, Document Maintenance = umm_a_dok_keluaran.created_date). Same request, our miss.
- Re-patched: 3 letters with first-generated dates + Hijri from e-Solat, 287292.zip + 287292.sql in the archived Task folder 2. Fix. Infra uploaded and reset PDFs (all 3 lokasi_fail_pdf empty). Redmine note 09:57 to Fizah, ProTime resolved. Redmine now Ready in PROD. SAVE-QUEST AHEAD, stays archived.
- System on main: patch-mlk-doc (2+ files = one <num>.zip, deliverable-check takes several names, eval 26/26; letter date = created_date, ADO day banned; infra boxes #<num> only, no description, no instruction lines). Knowledge WORD-TEMPLATE-RENDERING corrected. Pena c65.
- Slips: ba-spec-overridden, vague-term, wrong-rule-encoded, reask/redundant (QA-287292). I also held the upload for a BA answer after he said to do it straight away, and said "yesterday's patch wasn't wrong" before he corrected it.
- Not verified: where infra's file names LAIN-40346432 / 40346446 / 40346447 came from (no PROD, stg1 or stg2 row, not on local disk); the content of the uploaded files in PROD, BA verify is the check.
- Open: 285768 template fix prints each generation's day, so new letters show the ADO day, not the first-generated date; miya has not ruled. Infra box for data patches (memory infra-requests) still carries the #ticket sentence; only document boxes changed.
- Improvement sweep: A1 skipped, no agents this session · A2 a BA's explicit value was replaced with no check (proposal) · A3 date source took a second session (proposal: letter-dates script) · A4 returned archived quest invisible to save-quest (proposal) · A5 skipped, no sweep.

**Last Activity**: 2026-10-30 16:30 — worktree `redmine-issue-286988-203306` (session "30/10/2026 - 287350"), ADHOC-MCL-2026-3 answered to BA and saved, Domain Expansion.

## Session Recap (2026-10-30, worktree "redmine-issue-286988-203306", ADHOC-MCL-2026-3 MCL Laporan Tanah Perkara)
- ADHOC-MCL-2026-3: PROD MCL Laporan Tanah has no Perkara. Tajuk Risalat is never saved at SKM since 5734174bd9 (Aaron, 2026-06-19, ticket 265081) added else-return on empty premium in MlkMaklumatTanahLesenPendudukanForm.performCustomSave. PROD 0 of 37 MCL at PLT have it; PT, PLPS, PRBB, PLTP, PRZ all do. Requirement 223227 says the tajuk is created at SKM, verified 2026-05-21; its commits are all still in master.
- Answered BA in miya's words ("So need code fix"). Teknikal patches /18 and /26 through their own 287350. Save-set: Task folder 345, register A83, latent L31, audit 33/33. On hold + archive hold, waiting a code-fix ticket; not simulated on STG (candidate PTMLK/01/L/MCL/2026/21, login iskandarz@melaka.gov.my).
- Fix idea when the ticket comes: scope the 265081 premium block to showKemaskiniCukaiDialog, the same way the 287164 int-env change does.
- KPI: C2 row added. Pena: c60-c63 stored (BA decides on tickets, name the link first, other team's ticket stays out, his final reply).
- Slips: said "stops at premium check" five times without the link between premium and tajuk; repeated Teknikal's own ticket and permohonan in every draft; asked TSO for a ticket unasked; read the requirement only after the BA pointed at 223227.
- Improvement sweep: A1 two save agents at about 150k tokens each for an update a script could do · A2 adhoc route line tells me to ask TSO for a ticket while Pena lean forbids it · A3 cause found by git log -L only after he asked; run it at Recon for any shared-form save · A4 requirement-index not run on an adhoc, BA had to point at 223227 · A5 skipped, one adhoc, no sweep. Each logged as a proposal except A5.
- Ticket arrived: eSOKONGAN 287509 is this issue (assigned BA Nurul Amani, New). Adhoc promoted (A83 TICKETED) and archived, audit 30/30. QA-287509 block + doc carry the findings; block delegated per save-quest, quest not started.
- Open: QA-287509 fix when it reaches miya; fix-photo Stop check keeps firing on BA brief screenshots, needed the skip token on every reply.

**Last Activity**: 2026-10-30 16:30 — worktree `baseline-wednesday-release-029181` (branch claude/quest-workflow-diagram-979e64), 287273 MCL fixed and handed to BA, Phase 1 closed, Domain Expansion 1 of 2 (audit of DE and save-quest follows).

## Session Recap (2026-10-30, worktree "baseline-wednesday-release-029181", 287273 MCL 3 owners shown as 6)
- 287273 = adhoc ADHOC-MCL-2026-1 (register A77 now TICKETED). Fix in etanah-awam CarianRasmiHakmilikForm: rows of one owner on one title join into one pemohon, shares added as fractions; a title whose shares total over 1 is duplicate data, keeps one share. Commits 2026-10-30 12:14 and 14:43 on mlk/esokongan/287273, int-env merge 14:44. Tested by miya on MLIT (JAAFRI 2 rows, 1 name). Redmine journal #7: Resolved to Anis, 100%, 4 files. Phase 1 closed; Phase 2 waits for Redmine Closed.
- System (on main): next-steps-shape v4 (every quest stop shows the issue picture or `Diagram: none (<reason>)`), deploy 5b (a test row's condition is proven by one plain SELECT).
- Slips: test data taken from a query that JOINed receipt tables, so miya tested a normal case ("wrong test scenario", angry); commit gate blocked fix 2 until he said "test on server".
- Open: BA verify; planned-release list; audit of DE and save-quest in this same session, then DE 2.
**Last Activity**: 2026-10-30 11:26 — worktree `jovial-kepler-a07ba6` (Internal Issue PROD 287186 + 287233), both closed and archived, Domain Expansion.
