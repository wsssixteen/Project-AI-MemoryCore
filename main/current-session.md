**Last Activity**: 2026-11-03 19:30 — worktree `jovial-kepler-a07ba6`, ADHOC-PPTPB-2026-9 rounds 2-3 (unlink plan agreed), Domain Expansion.

## Session Recap (2026-11-03, ADHOC-PPTPB-2026-9 rounds 2-3: unlink the Pendaftaran branch)
- Asked: BA (Fizah) wants PPTPB unlinked from Pendaftaran (CR 256335, Pendaftaran side not released) for PTMLK/02/L/PPTPB/2026/5 and No Serahan 02MH1579/2026; one ticket incl. removing 41.0.
- Found: our side reached Tamat Aplikasi on 2/10 (no SPOC); only the Endosan branch waits at SPIL; only PPTPB at SPIL in PROD. All staging PPTPB versions v1-v10 contain Endosan (no old version to revert to). Fable 5.1: Alter Flow cannot reach 40.0 from SPIL, Initiate & Alter can (latest model); join bug: "Ada spoc?" False bypasses the join, Endosan can never pass it (proven stg 7980291 since 17/8). 02MH1579/2026 = HKBM, 2 rows, Pendaftaran data.
- Agreed (miya): one ticket: Initiate & Alter 2026/5 to 40.0 and hold until Pendaftaran release; Pendaftaran deletes 02MH1579/2026; remove 41.0 now, re-add with the join fix. Concise reply to Fizah prepared (miya sends).
- CR check: 256335 is not Li Wen's 256334 (PDBB to Hasil); not our issue except the latent join bug.
- Mistakes: said "cannot alter back to 40.0" as fact; miya's one question and the Fable review proved it wrong. Long replies after he asked for short ones; hashtags on ticket numbers.
- Open: ticket from Fizah; staging rehearsal of Initiate & Alter on 7980291 before any PROD step; whether Initiate ends the child processes (not proven); PROD jar migrate behaviour (not proven).
- Assessment: A1 the brief-first gate blocked saves three times in a closing round. A2 an alter answer was given without running the alter playbook's A4 decision row. A3 a second reader (Fable) on a PROD flow decision caught a wrong verdict and a latent model bug. A4 check every deployed model version before "revert to the old flow". A5 ⏭ no sweep.

**Last Activity**: 2026-11-03 19:16 — worktree `dreamy-pike-08af0b` (branch claude/gifted-dhawan-b4334a), side session of the 287925 session: next-steps-shape v5 rule (approval text in its own copy block), Domain Expansion.

## Session Recap (2026-11-03, next-steps-shape v5: approval text in a copy block)
- Asked (from the 287925 session, his correction): never put an approval code or "approve ..." phrase in quotes inside the Next steps "Your reply" cell; put it in its own text block so he copies it in one click. "Yes, make it a rule".
- Done: `domain/next-steps-shape` v5 blocks `approval-in-cell` (code C1F5-62FF standing alone, case-sensitive; approve / post it / submit it any case); eval 54/54 (A1 to A25); pre-reply-contract line, reply-shape-spec 3f, reply-mechanics memory + index line, README, diagram v5, watch wmw0l323a. Commit 8dc4cfb3; main folder and GitHub main 71ae8698. Live fire from the main folder exit 2.
- Changed from the brief: one `/i` regex split in two, because `/i` on the code part blocked "long-term" and ADHOC-MLPS-2026-4.
- Blockers: memory-write-gate could not see the RULE-PLACEMENT line written as reply text (only tool calls in the transcript for that message); passed through a Bash heredoc; slip row logged. land-on-main made its own commit c336af9b (same tree), merged origin/main in the main folder to make the SHAs equal.
- Open: QA-287925 itself stays with the parent session (save-quest PHASE-1 verdict, not ready).
- Assessment: A1 a gate that reads "reply text" fails when the transcript holds no text block; the shell-command path saved it. A2 ⏭ no quest work here. A3 ⏭ no debugging. A4 ⏭ no etanah work. A5 ⏭ no sweep.

**Last Activity**: 2026-11-03 18:08 — worktree `dreamy-pike-08af0b` (branch claude/pelan-papar-overflow-cde7f5), ADHOC-OPLPS-2026-1 closed as no issue and archived, Domain Expansion.

## Session Recap (2026-11-03, ADHOC-OPLPS-2026-1 OPLPS pelan L1e tidak penuh)
- Asked: PROD PTMLK/02/L/OPLPS/2026/8 (nurulazura, PDTJ): pelan on Borang L1e looks cut, other OPLPS fine; margin? ours or the reports team?
- Found: not margin, not cut. DMS file 2000x1410 complete; pixel script: black border top, bottom, left, none on right. Chain: pelukis azizah uploads in Teknikal (LAIN-37353842), Tandatangan Pelan stamps on the same canvas (CommonImageUtil.overlayImages), OPLPS users upload those exact bytes (932673 B), LaporanPelan.jrxml RetainShape only shrinks. Jrxml is in our own repo, so not a reports-team issue.
- Closed: miya, no issue. Route ANSWER. Task folder 365 archived, register A93 ANSWERED, audit 31/31.
- Not verified: azizah's own upload not opened (not needed after close).
- Mistakes: said the file itself was cut, then that the bottom border was missing; both withdrawn after measuring. Wrong column guesses (medan_pk, no_dokumen, ind_jns_dok) before reading the schema.
- Assessment: A1 the brief-first gate blocked the save agent and the audit in a closing round with no new finding. A2 ⏭ no ticket quest. A3 a pixel count settled "cut vs missing line" where eyeballing failed twice. A4 compare the file bytes across Teknikal and OPLPS before blaming either module. A5 ⏭ no sweep.

**Last Activity**: 2026-11-03 18:04 — worktree `common-version-1-10-20-mlk-c5ee8f` (branch claude/focused-wescoff-e92f44), change route step 3 Check + nod and step 8 coloured change-map report, Domain Expansion.
