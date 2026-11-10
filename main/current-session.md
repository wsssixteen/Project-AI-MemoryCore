**Last Activity (288637 session)**: 2026-11-10 10:50 — worktree `internal-issue-prod-288637-a20b04`. 288637 (Internal Issue PROD, MCL PTMLK/01/L/MCL/2026/1) altered to 22.0 PYSKN5A for iskandarz, UPND unlink patched by infra, Redmine Resolved to Fizah, quest archived; alter tool PRE-ALTER CHECK built (FlowableAlter 33321e2, MemoryCore fbc9e563); Domain Expansion.

## Session Recap (2026-11-06 to 11-10, 288637 PROD alter + pre-alter check)
- Asked: /quest 288637 (alter back to Penyediaan Surat Keputusan & 5A, check the UPND notis unlink); close it fully; then build a Phase 0 into the alter tool with Fable 5.1 and brief him; DE.
- Done: Initiate & Alter to PYSKN5A, admin REST delete of penghantaranId on process 27070129, Alter Flow twice (second with nextUser=iskandarz) → row 2927154 live; 288637.sql unlink (umm_btrn_hantaran_notis 29128, 31383) run by infra and verified; Redmine notes #3 and #4; quest archived (bounty, FLOWABLE-KNOWLEDGE §23, playbook row 7); alter.js PRE-ALTER CHECK P1 UPND carry-over, P2 --assignee, P3 reach (tests 27/16/19), watch wmw4xs7t8.
- Found: Alter Flow cannot reach a parent node when the live tasks are in sub-flows; Initiate & Alter Reset=No copies penghantaranId from the UPND process and the page variable urusan=MCL does not stop it; the KMN list shows only notis rows with no penghantaran.
- Open: first live alter with the new check (watch); auto-delete of penghantaranId and the peranan check on --assignee were not built.
- Mistakes: planned the known §19 trap as check-after and left the assignee to agihan (3 PROD runs); slow and unclear on alter vs patch while he waited; slips plan-before-act ×2 + blocker.
- Assessment: A1 the alter tool had no pre-run check; now it has one and blocks without an approval code. A2 the quest Phase 0 named the trap but nothing made it a precondition. A3 the admin REST read of the new process variables found the cause in one call. A4 a cancelled or ended sub-flow plus a born UPND notis needs Initiate & Alter, a variable delete and an assignee. A5 ⏭ no sweep.

**Last Activity (288402 session)**: 2026-11-10 10:31 — worktree `quest-resume-ticket-239386-642586` (branch claude/esokongan-tracker-quest-4b3d58). 288402 (eSOKONGAN, PROD PLTP PTMLK/02/L/PLTP/2026/9) alter done, Redmine Closed, quest archived; Domain Expansion.

## Session Recap (2026-11-06 to 11-10, 288402 PROD alter)
- Asked: start /quest only for the eSOKONGAN ticket 288402; confirm it is a simple alter and pass it back; explain the tracker and the module; post the handover; explain the flow with a diagram; check if it can be archived; DE.
- Done: PROD Alter Flow to SPI (faridmajid) via alter.js with --add-var aliranKerjaId=40433 (the parent aliran); Redmine Resolved to Fizah, Idris verified, ITSO Closed; quest archived (Task folder to Archive, block to active-archive.txt, project folder to archive/); knowledge note in FLOWABLE-KNOWLEDGE.md §13.
- Found: Pendaftaran cancelled serahan 02N902/2026 (child aliran 44986) and left the PLTP with 0 active tugasan; the same 0-active state is why Pergerakan Fail says "Maklumat tiada dalam rekod sistem!"; --var fails there because the row is absent, --add-var on the parent works.
- Open: none for 288402.
- Mistakes: wrote the ticket number with a hashtag in the archive reply (terse-gate caught it).
- Assessment: A1 the Edit tool cannot reach untracked main-only files from a worktree; a node write was the way round. A2 the archive dry-run caught the missing Bounty block before any move. A3 ⏭ no debugging, the state was read in one query. A4 a cancelled serahan in another module leaves our urusan with no tugasan; the fix is an alter, not code. A5 ⏭ no sweep.
**Last Activity (PT plot 100 adhoc session)**: 2026-11-10 10:30 — worktree `jovial-kepler-a07ba6`. ADHOC-PT-2026-17 (stg1 PTMLK/02/L/PT/2026/18, Penyediaan Risalat MMKN - PDT): the 100.00 under Tindakan is the area percentage total jumlahPeratus (PelupusanExcelReaderHelper.java:2862), a footer cell left from the TRG table (mlkMaklumatPlotTable.xhtml:175-177), not tax; saved, audit 31/31, block active. Domain Expansion.

## Session Recap (2026-11-06 to 11-10, ADHOC-PT-2026-17)
- Asked: where the 100.00 comes from when kadar cukai is RM66; can it ever be other than 100; do the requirements want a title on that column; the Java file's full path; save adhoc; DE.
- Done: answer with SELECTs; PROD PT: 198 with luas > 0 (100.00), 3 zero luas (0), 3 no plots (blank); stg1 199/3/6; requirements 216013 + 220410 have no Peratus column; save-set (Task folder 382, register A100, LATENT-BUGS L39, qa_doc), audit 31/31.
- Found: RM66 = jumlah_cukai_tnh on plot 50103 (kadar 11.00); the footer only ever reads 100.00, 0 or blank.
- Open: his call on a ticket to remove the leftover isPT footer cell.
- Mistakes: none logged; five Stop-hook delta corrections on reply shape.
- Assessment: A1 one background sonnet save agent, audit failed once (register OPEN vs ANSWERED) and was fixed. A2 ⏭ no quest. A3 the leftover was found in two reads (xhtml footer + helper formula). A4 TRG-copied components carry orphan footer cells. A5 ⏭ no sweep.

**Last Activity (Masterline look-modes session)**: 2026-11-08 06:40 — worktree `session-orchestration-deploy-e6a380` (branch claude/masterline-look-modes-eecd24), delegated by the Masterline orchestrator. Four switchable looks built into the app prototype; Domain Expansion.
