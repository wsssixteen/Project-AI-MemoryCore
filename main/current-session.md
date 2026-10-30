**Last Activity**: 2026-10-30 16:30 — worktree `redmine-issue-286988-203306` (session "30/10/2026 - 287350"), ADHOC-MCL-2026-3 answered to BA and saved, Domain Expansion.

## Session Recap (2026-10-30, worktree "redmine-issue-286988-203306", ADHOC-MCL-2026-3 MCL Laporan Tanah Perkara)
- ADHOC-MCL-2026-3: PROD MCL Laporan Tanah has no Perkara. Tajuk Risalat is never saved at SKM since 5734174bd9 (Aaron, 2026-06-19, ticket 265081) added else-return on empty premium in MlkMaklumatTanahLesenPendudukanForm.performCustomSave. PROD 0 of 37 MCL at PLT have it; PT, PLPS, PRBB, PLTP, PRZ all do. Requirement 223227 says the tajuk is created at SKM, verified 2026-05-21; its commits are all still in master.
- Answered BA in miya's words ("So need code fix"). Teknikal patches /18 and /26 through their own 287350. Save-set: Task folder 345, register A83, latent L31, audit 33/33. On hold + archive hold, waiting a code-fix ticket; not simulated on STG (candidate PTMLK/01/L/MCL/2026/21, login iskandarz@melaka.gov.my).
- Fix idea when the ticket comes: scope the 265081 premium block to showKemaskiniCukaiDialog, the same way the 287164 int-env change does.
- KPI: C2 row added. Pena: c60-c63 stored (BA decides on tickets, name the link first, other team's ticket stays out, his final reply).
- Slips: said "stops at premium check" five times without the link between premium and tajuk; repeated Teknikal's own ticket and permohonan in every draft; asked TSO for a ticket unasked; read the requirement only after the BA pointed at 223227.
- Improvement sweep: A1 two save agents at about 150k tokens each for an update a script could do · A2 adhoc route line tells me to ask TSO for a ticket while Pena lean forbids it · A3 cause found by git log -L only after he asked; run it at Recon for any shared-form save · A4 requirement-index not run on an adhoc, BA had to point at 223227 · A5 skipped, one adhoc, no sweep. Each logged as a proposal except A5.
- Open: code-fix ticket (BA decides); fix-photo Stop check keeps firing on BA brief screenshots, needed the skip token on every reply.

**Last Activity**: 2026-10-30 11:26 — worktree `jovial-kepler-a07ba6` (Internal Issue PROD 287186 + 287233), both closed and archived, Domain Expansion.

## Session Recap (2026-10-29 to 30, worktree "jovial-kepler-a07ba6", PROD 287186 PRBB + 287233 MCL)
- 287186: infra ran the resit-link patch (rows verified) · alter PL Kupon → 48.0 PYB4CE 08:15 (code A1E3-7EAD) · Redmine Resolved 100% to Amani with note · Closed on Redmine · archived.
- 287233: alter PYSKN5A → PKPPT 02:44 (code 3480-80C1) · Closed by Idris 09:21 · % Done 100 at 10:49 on "Set 287233 100%" · archived.
- System (all on main, last f4cf1ef6): go-reask-gate (new Stop gate) · stale-hooks-warn (new prompt advisory) · his-words reads past a compaction · redmine-write-gate takes "set <ticket> <n>%" and names the patch close on an approved Submit · playbook A7 CLOSE · quest 6c close line.
- Slips: re-asked approval after his go; kept "do not update %" into Resolve; Submit blocked twice after compaction; patch tickets not closed after handover (all logged).
- Open: proposal tracked — a quest doc born in a worktree lives only there (archive-quest refused until copied to main).

**Last Activity**: 2026-10-30 02:25 — worktree `rubric-code-review-2f5201` (261986 session), 261986 saved (Phase 1 closed), Domain Expansion.

## Session Recap (2026-10-29 to 30, worktree "rubric-code-review-2f5201", 261986 PSBS Risalat MMKN)
- 261986: commit 578af8ef1a (mlk/qa/261986v3) merged int-env ae10e5253e (Tolak conflict with CR 274600 resolved as their file + our edit). Redmine posted 2026-10-29 22:12: Resolved to Nurul Amirah Nadiah, 100%, 3 PDFs. Phase 1 closed 30/10; Phase 2 waits for Redmine Closed.
- System: redmine-write-gate v1.7 (harness text skipped, /goal args read as his words, "why not submitting" = go), GitHub main fdce114e.
- Slips: offered to combine PDFs unasked; said "not posted" for several turns without re-reading Redmine.
- Open: 261986 staging deploy (stag-env behind master, same Tolak conflict expected).

**Last Activity**: 2026-10-30 02:15 — worktree `ticket-286650-quest-188daf` (the ProTime + OT session), ProTime 29/10 checked, 282587 training script, 282587 archived, Domain Expansion.
