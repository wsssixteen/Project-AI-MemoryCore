**Last Activity**: 2026-10-30 17:15 — worktree `baseline-wednesday-release-029181`, audit of DE and save-quest built, evaluated and live-checked, Domain Expansion 2 of 2.

## Session Recap (2026-10-30, same worktree, audit of "DE" and "save quest")
- Answer: DE alone now does save quest, enforced. Save quest picks Close or Archive from live Redmine: not Closed = Phase 1 only, Closed = Phase 2 (Phase 1 first when still open), patch ticket past "in work" = both together.
- Built, on main: `lib/save-quest.js` reads ticket_type (patch tickets were told "Do not archive" against the 2026-10-29 rule) · `quest/archive-quest.js` Step -1.5 refuses an archive the verdict does not allow, `--ahead-of-redmine "<his words>"` is the only override · `de-close-gate` C9 blocks a DE close on a touched ticket with no verdict or a stage not done, unless "Phase 1 not ready: <QA> ...".
- Evals: save-quest 69/69, feature 27/27, de-close-gate 44/44, archive Redmine gate 16/16, archive 27/27, archive-hold 27/27. Live: QA-287273 archive refused exit 3, nothing moved.
- Open: 287273 BA verify, planned-release list. Wrong-fix row 1 verdict names BUG-BESTIARY: write it at Phase 2.
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
