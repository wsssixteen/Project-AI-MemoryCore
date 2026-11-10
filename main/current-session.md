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

## Session Recap (2026-11-06 to 10, auto-start: 08:30 sweep by the clock, WhatsApp fast lane, watcher health)
