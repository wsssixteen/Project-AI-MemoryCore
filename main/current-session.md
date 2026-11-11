**Last Activity (PROD patching tickets session)**: 2026-11-11 21:34 — worktree `jovial-kepler-a07ba6` (branch claude/prod-patching-tickets-11e7ee). Three Melaka PROD patch tickets done and Resolved to Fizah: 288962 alter OPLPS/2026/2 to Borang 4Ae/L1e, 288963 MLPS/2026/12 Tempat PT 2 to SEK II + pelan L1e swap, 288974 UPS_PLP/2026/15 tamatkan. Quests closed; Phase 2 waits for Redmine Closed. Domain Expansion.

## Session Recap (2026-11-11, three PROD patch tickets + patch-note generator)
- Asked: /quest the 3 PROD patch tickets; never ask Resolved again; every PROD patch note must list exactly what was patched (all patch types, built with Fable 5.2); fix the wrong 288974 note; keep "Can proceed to verify."
- Done: 288962 alter run with his approval; 288963 + 288974 patched by infra, PROD re-read and verified; all three Resolved to Nurhafizah 100% (read back). redmine-write-gate: standing Resolved rule now fires for a JS status write and when his message says submit (e3dfaa4a, eval 171/171). ticket-close-block --patch prints the note from the .sql itself; script-check rule 9 + patch-script-gate CHECK 8 need a reason per SET column and DELETE (1a99bf39, evals 27/27 + 42/42). Greeting restored (0c46d9ad). 288974 note corrected on Redmine (journal 2588114).
- Found: the 288974 script copied status_keputusan='Batal' and hubungan_aplikasi_id=NULL from 283980 with no reason; the hand-written note then described them wrong. PPTPB/2026/9 link is now null on PROD.
- Open: none. 288974 decided by miya 2026-11-11: link to PPTPB/2026/9 stays removed (PelupusanSuratStrategy reuses a linked UPS_PLP letter, this one was cancelled), Batal kept (15 of 15 ended UPS_PLP on PROD). All three archived at Phase 2 (Redmine Ready in PROD).
- Mistakes: asked for Resolved three times despite his standing rule; hand-wrote the 288974 note from memory; Fable build retired "Can proceed to verify" against his 4 Nov rule.
- Assessment: A1 gate fixes landed same turn, but the step-3 rider blocked edits again (logged, repeat). A2 patch path now generates its handover from the patch. A3 PROD re-read after infra ran caught nothing wrong. A4 copied columns from an analog script without a reason is the root slip. A5 ⏭ no sweep.
**Last Activity (287346 rework 2 session)**: 2026-11-11 21:35 — worktree `hakmilik-pejabat-awareness-32c5c1` (branch claude/ticket-287346-audit-95b5e8). ESOKONGAN 287346 MCL Kertas Pertimbangan PT rework 2: blank page fix pushed and in release 1.9.3; Domain Expansion.

## Session Recap (2026-11-11, 287346 MCL Kertas Pertimbangan rework 2)
- Asked: rework 2 fixes; Redmine prefill; MLIT test data; then the BA's blank page on stg1 PTMLK/02/L/MCL/2026/41; test with doc-sim; commit, push, tell the Baseline 1.9.3 session; DE.
- Done: cause = 2 empty BodyText paragraphs after the sign table before the KEPUTUSAN heading (pageBreakBefore) spill to a new page. Removed in TemplateKertasPertimbanganPentadbirTanah_MCL.docx, commit b273c6b63a on mlk/esokongan/287346; merged into mlk/release/1.9.3 (f29b747ef1), pushed. doc-sim /41: 4 pages, no blank; stress test old = blank page 4, new = none.
- Open: int-env deploy 60e19e2be2 (his password; b273c6b63a not on int-env); staged Redmine 287346 form; MLIT test /4 (norzaida) and /9 (sabrina); BA retests /41 on staging after the 1.9.3 build.
- Mistakes: template layout not checked before hand-over (slip quest/template-layout-not-checked).
- Assessment: A1 cross-session message to the Baseline session worked in one round. A2 Phase 1 template fixes have no layout check step. A3 doc-sim + Word render reproduced the BA page fast. A4 empty paragraph before a page break is a template class. A5 ⏭ no sweep.

**Last Activity (ADHOC-MLPS-2026-5 session)**: 2026-11-11 21:34 — worktree `quest-resume-ticket-239386-642586` (branch claude/melaka-prod-issue-a26366). PROD MLPS 4Ae adhoc answered, BA SME confirmed, archived; Domain Expansion.

## Session Recap (2026-11-11, ADHOC-MLPS-2026-5 MLPS 4Ae Tempoh Berakhir)
- Asked: adhoc PROD MLPS PTMLK/02/L/MLPS/2026/13 and /14: Rekod Pembaharuan Tempoh Berakhir set to 31/12/2026 comes back 31/12/2028 after Simpan; answer the BA's WhatsApp questions with simple diagrams; audit why the requirement was not read; conclude.
- Done: cause = migrated Jasin permit luput = start + 3 years; Maklumat Jadual keeps the permit dates when luput is not before 1 Jan of the Tahun Permohonan; Simpan rebuilds the renewal-year row from the Jadual dates. Requirement 218455 rule 2 (user keys the Jadual dates) makes it data entry + a user step, not a code bug. BA SME Mira via Fizah 16:22: "logic betul dah tu". Saved ANSWERED, register A102, archived (Task folder 391 to Archive), adhoc-save-audit 31/31 PASS. Knowledge: PERMIT-LESEN-RUNNING-NUMBER.md MLPS 4Ae section.
- Open: /2 /3 /5 /10 Tamat with 2027/2028 saved, not raised (miya's call); bounty stubbed (--allow-stub); workflow-gap proposal in slips (adhoc brief with "code issue" and no REQUIREMENT-MATCH), build later per miya.
- Mistakes: said "code issue" before reading the requirement (slip requirement-skip); first diagrams too complex, redrawn until two scenarios side by side.
- Assessment: A1 background sonnet saves ran while I answered the BA live. A2 the adhoc path has no requirement read unless the issue step is a flow step, callActivity or other module. A3 the code trace was right, the verdict was wrong until the requirement was read. A4 migrated Jasin luput = start + 3 is now in knowledge. A5 skipped, no sweep.
**Last Activity (Arabic class session)**: 2026-11-11 00:08 — worktree `arabic-1b6669`. Arabic class 2026-11-10, Lesson 15: dialogue + Exercises 1 to 6 worked, class closed (stopped at Exercise 6; next class starts Exercise 7, page 90). "Kalian" habit saved to class-vocab. New class-along breakdown format (one table per sentence, read right to left, roles from the class) in the arabic skill rule 3, landed main 78628d62. Weekly Arabic plan (Mon 5 words · Tue class · Wed baris · Thu rest · Fri fi'il + one exercise) and a 9-verb fi'il list written to the arabic journal Notes; the fi'il list is not confirmed as the teacher's list. Open: he triggers `/arabic` himself, no reminder exists; he is thinking of his own app for reminders; the Friday fi'il drill is not in the engine yet.

**Last Activity (288662 session)**: 2026-11-10 15:30 — worktree `quest-288662-rubric-audit-10a08a`. ESOKONGAN 288662 PLTP (Maklumat Tanah panels at PSPB / Minit Bebas / Keputusan Pendaftar) fixed, two cycles, Redmine Verified by Fizah; quest closed (waits for Redmine Closed); Domain Expansion.

## Session Recap (2026-11-10, 288662 PLTP Maklumat Tanah panels + Phase 0 audit)
- Asked: /quest 288662 until Rubric, audit Phase 0 in the background into todo; then apply, test on server, stage Redmine, save; rework for Keputusan Pendaftar; DE.
- Done: cause = SPI / Keputusan Pendaftar treat nextUrusan PSPB (Endorse Batal, 256091) as "anything else" and show Kadar Cukai + Syarat, so Simpan checks an empty premium (NPE). Fix in PelupusanExcelReaderHelper.initMode(): PSPB with PSPM at :1780 and :1824, PLTP Minit Bebas hides Syarat. Commits 7d65e42dfb (12:18) + 8f8ce94614 (14:48) on mlk/esokongan/288662, merged int-env + stag-env. miya tested staging (SPI, PYMB, PYSTP) and internal (KP 01N751/2026). Redmine journals #7 and #9; Fizah Verified.
- Found: the 06/11 session traced the same NPE and agreed the fix on WhatsApp but saved no adhoc (row A101 written late).
- Open: 288662 on the planned-release list; Phase 2 when Redmine Closed; todo Q1 "288662 Phase 0 audit" P1-P14 for miya's ruling.
- Mistakes: missed the adhoc at quest start; missed Keputusan Pendaftar (same branch 44 lines below, named in requirement 256091).
- Assessment: A1 one Fable audit agent ran beside the quest and found the B2 parser gap. A2 Phase 0 adhoc compare has no fallback source. A3 the fix was found fast; the sibling branch was not grepped. A4 stg1 alter candidates mostly have no live engine task. A5 ⏭ no sweep.
**Last Activity (288188 session)**: 2026-11-10 14:40 — worktree `hakmilik-pejabat-awareness-32c5c1` (branch claude/ticket-288188-quest-start-cb3845). QA-288188 PROD UPP document patch done and archived (Phase 1 + 2, patch ticket); Domain Expansion.

## Session Recap (2026-11-10, 288188 UPP signature patch)
- Asked: /quest 288188; make the files downloadable here (WhatsApp would not open); role line A; stage Redmine after verify; Phase 2 archive + DE.
- Done: Redmine New to In Progress 20%; matched ADHOC-UPP-2026-3 (A97, cause known); BA's signed letters for PTMLK/01/L/UPP/2026/19 and /20 checked (signature beside QR); role line set to Penolong Pegawai Daerah (as 287292); 288188.sql + LAIN-37525445_1.main + LAIN-37525562_1.main; infra ran replace + reset; PDF path empty verified on PROD; Redmine Resolved to Nurhafizah Hasan 100% submitted by miya; archived (archive/QA-288188).
- Found: peranan names live in rjk_senarai_ahli_kumpulan (DATABASE.md §16); the letter's role line prints "-" for signers whose PLP role is not primary (LATENT-BUGS L40 SUSPECT, owner etanah-common).
- Open: UPP/2026/18 and 36 open Semakan letters need Jana Semula before Selesai (untested, ADHOC-UPP-2026-3); bounty proposal (patch-mlk-doc rule 3 points at DATABASE §16) tracked.
- Mistakes: 6 schema queries to find the peranan table; Stop hooks asked twice for the proving SELECTs and a picture line.
- Assessment: A1 a document patch went from ticket to archive in one session because the adhoc held the cause. A2 save-quest PHASE-2 still needs the bounty block before archive-quest. A3 letter-check.py with --allow-empty matched the precedent letters. A4 a role-line "-" sits in common, not in the patch. A5 ⏭ no sweep.
**Last Activity (288533 + over-complexity audit session)**: 2026-11-10 12:51 — worktree `prbb-permit-id-fix-f122a5`. All eight ways of the over-complexity audit built side by side (3 sonnet builders) and landed on main f2ed718b; 288533 archived at Phase 2.

STEP-3: release-prep card + re-open after push (B1 B2 B3)
session: 2026-11-11 redmine-issue-288622 (Baseline 1.9.3)
his words: "okay build all" (order)
fix or report: fix
who pays: on-demand: one release run, push and card only
goal without the part: the card is typed by hand from the skill template and a post-push fix needs a hand-edited state file
model: claude-opus-5-5
shown: release-prep-b1-b2-flow.png
cause step: domain/release-mlk-plp/release-prep.js:cmdPush + cmdAddTicket · change: about 60 lines
new parts: 0

CHANGE-CARD (before): release-prep card + re-open after push
What: The release script prints the filled Baseline card after a push, and it can take one more ticket fix after the push.
Why: On 2026-11-11 the 1.9.3 card was typed from memory with Domain and DB missing, and the 287346 fix after the push needed a hand-edited state file.
How: The push step prints the card and add-ticket accepts a pushed release, as the flow picture release-prep-b1-b2-flow.png shows.
When: It runs when a release is pushed, when the card command is asked for, and when a ticket is added after the push.
Where: domain/release-mlk-plp/release-prep.js and the release-mlk-plp skill, as the change map shows.
Where picture = the change map (lib/change-map.js): change-map-20261111-140928.png

## system-change step 3 (2026-11-11, session b0c15c6f) — adhoc requirement before a code verdict

STEP-3: adhoc brief needs a requirement read before CODE-FIX or CR
session: b0c15c6f-3e06-4e9f-80cf-a1d0ffecaa74
his words: "I thought I asked for the build always later at the end of the session" (order)
fix or report: fix
who pays: per-turn: one more regex inside the existing adhoc-brief-first Stop check, only on a turn that carries an adhoc brief
goal without the part: Without it an adhoc brief can tell the BA "code issue" with no requirement read, as at 15:43 on ADHOC-MLPS-2026-5.
model: claude-opus-5-5 (urgent fix on his order, not held for a model switch)
shown: C:\Users\Ridhwan\AppData\Local\Temp\claude\f1bd93d17a856462\b0c15c6f-3e06-4e9f-80cf-a1d0ffecaa74\scratchpad\adhoc-req-flow.png
cause step: domain/adhoc-brief-first/adhoc-brief-first.check.hook.js:stopCheck · change: 17 lines
new parts: 0

CHANGE-CARD (before): adhoc requirement before a code verdict
- What: The adhoc brief Stop check of adhoc-brief-first blocks a brief whose route is CODE-FIX or CR until a REQUIREMENT-MATCH line has been written in this session.
- Why: On 2026-11-11 (ADHOC-MLPS-2026-5) I told the BA "code issue" at 15:43 and read requirement 218455 only when he asked, and the requirement made it a user step.
- How: The brief ends, the existing checks run, then the route line is read and a CODE-FIX or CR route without a requirement match is sent back, as shown in adhoc-req-flow.png .
- When: At the end of every turn that carries an adhoc brief or starts the adhoc save agent, inside the existing Stop check.
- Where: One check in domain/adhoc-brief-first/, its eval, and two sentences in .claude/skills/adhoc-save/, as shown in change-map-20261111-140632.png .
Where picture = the change map (lib/change-map.js).

CHANGE-CARD (after): adhoc requirement before a code verdict
- What: The adhoc brief Stop check of adhoc-brief-first now blocks a brief whose route is CODE-FIX or CR until a REQUIREMENT-MATCH line has been written in this session.
- Why: On 2026-11-11 (ADHOC-MLPS-2026-5) I told the BA "code issue" at 15:43 and read requirement 218455 only when he asked, and the requirement made it a user step.
- How: The brief ends, the existing checks run, then a CODE-FIX or CR route without a requirement match is sent back with the load and read commands, as shown in adhoc-req-flow.png .
- When: At the end of every turn that carries an adhoc brief or starts the adhoc save agent, inside the existing Stop check.
- Where: One check in domain/adhoc-brief-first/ with 11 new eval fixtures, and two sentences in .claude/skills/adhoc-save/, landed on main as a325f9fa, as shown in change-map-20261111-141051.png .
Where picture = the change map (lib/change-map.js).
