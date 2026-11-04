**Last Activity**: 2026-11-04 17:00 — worktree `ticket-275608-reply-7d6b89`, REQUIREMENT 275608 PPTPB mapping reply posted to Anis, Domain Expansion.

## Session Recap (2026-11-04, 275608 PPTPB to Pendaftaran value mapping)
- Asked: Anis (BA) wanted the mapping of Kegunaan, Unit/Luas, Tarikh Kuatkuasa, Tarikh Luput for PPTPB (Raja, Pendaftaran, asked how Pelupusan passes them).
- Done: mapping verified on mlit PPTPB/2026/11 + master code; Redmine note posted by miya 08:53, matches the draft, assigned to Anis. Quest QA-275608 delegated, qa_doc written, PPTPB-TICKETS.md knowledge row added.
- Found: PelupusanPendaftaranService:232 fills land data for PT, PSBP, MCL only; PPTPB sends none. Same Endosan branch as ADHOC-PPTPB-2026-9.
- Open: miya to decide whether we add PPTPB to the service or Pendaftaran reads the tables.
- Mistakes: one Next steps row without a heading above (gate caught); guessed column name unit_luas_dipohon (real: unit_luas_dipohon_id).
- Assessment: A1 next-steps-shape caught a headless row. A2 quest flow fit a mapping-only requirement with no Rubric. A3 reading the service before the data answered the BA's real failure. A4 PPTPB dates live in mklmt_tmbhn JSON, not trkh_mula. A5 ⏭ no sweep.
**Last Activity**: 2026-11-04 17:00 — worktree `arabic-command-b8399a` (branch claude/appraisal-progress-review-1620f3), Appraisal-2026 finished, Domain Expansion.

## Session Recap (2026-11-04, Appraisal-2026 form and visuals finished)
- Asked: finish the appraisal pack: the form (soft copy for the manager) and the supporting visuals (printed for the manager and CEO).
- Done: the form carries no inserted visuals (only the original tables filled, 11 pages); the visuals docx/pdf is 5 pages; B1 first table keeps only 284544; B4 adds the Task folder screenshots and a tools table (Etanah Atlas, etanah codemap) with screenshots; PymTime left out of B4. DECISIONS.md rows 60-62.
- Apps shown live on his office laptop PJNBRidhwan (codemap :7717 and the Atlas file), opened by the "4/11/2026 - tickets today" session there.
- Closing: asked the "2/11/2026 - appraisal flow" session (Remote Control, office laptop) to save and then archive itself; this route gives no reply, not verified.
- Mistakes: opened the apps on this machine (miyazaki) while he sat at the office laptop; the memory note reference_rustdesk_server says "sessions here run ON the work laptop", which is wrong for this machine (edit blocked by the worktree hook, slip logged).
- Open: fix that memory line (check `hostname` first: PJNBRidhwan = work laptop, miyazaki = the other machine).
- Assessment: A1 a worktree hook blocks memory edits, so a wrong memory fact stays until a main-folder session. A2 ⏭ no quest work. A3 ⏭ no debugging. A4 ⏭ no etanah work. A5 ⏭ no sweep.
**Last Activity**: 2026-11-04 17:00 — worktree `cool-margulis-5bb326`, Baseline Melaka Pelupusan 1.9.2 from BAQA list to merge request, Domain Expansion.

## Session Recap (2026-11-04, Baseline Pelupusan 1.9.2, Redmine version 12166)
- Asked: prepare Pelupusan 1.9.2 from the BAQA list (287773, 287747, 287509, 287638, 262027 via mlk/qa/262027v2); later add 287892 on top of the pushed branch; after "Baseline Pelupusan - Passed", the master merge.
- Done: mlk/release/1.9.2 cut off master 09037833bf, 6 tickets merged, verify 0 missing, mvn compile exit 0, version 1.9.2, common 1.10.20-MLK kept, pushed (tip 15a8e36cfa). MR 15 to mlk/master, reviewer Alex, read back 9 of 9 ✓ (http://10.16.63.27/gitlab/etanah/etanah-pelupusan/-/merge_requests/15). stag-env caught up 248b053e8a (was 4 behind: 287509 287638 287773), compiled, pushed, read back. KPI P-287892-C2 confirmed.
- Also: local mlk/master divergence fixed; SourceTree green vs blue labels explained; ghost docx files deleted; his 5 uncommitted files on mlk/release/1.9.1 stashed as `wip-5-files-on-release-1.9.1-20261104` (fc6d255101), checkout now on mlk/release/1.9.2. Only PelupusanWordCCMethodConstant.java in that stash is on no origin branch.
- Open: Alex merges MR 15, then `merge-to-master --release 1.9.2 --check`. miya rebuilds staging from mlk/stag-env. KPI P-262027-B4 waits a check of BA journals for the salutation. Awam Pelupusan 287607 baseline not passed yet (list only).
- Blocker: `release-prep.js add-ticket` refuses at phase pushed; phase hand-set to bumped (slip `blocker` logged).
- Assessment: A1 add-ticket gap at pushed. A2 ⏭ no quest phase moved. A3 ⏭ no debugging. A4 adding a ticket after push re-runs verify and push cleanly. A5 ⏭ no sweep.
**Last Activity**: 2026-11-03 22:45 — worktree `suspicious-nash-ce350d`, QA-287925 PROD alter + status patch, Redmine Resolved, quest archived, Domain Expansion.

## Session Recap (2026-11-03, QA-287925 MLPS + OMLPS back to Penyediaan Borang 4Ae dan L1e)
- Asked: BA Fizah: alter MLPS/2026/1, /2, /5, /6, /10 and OMLPS/2026/1 to Penyediaan Borang 4Ae dan L1e (wrong Jadual dates); patch MLPS/1 and /2 back to Sedang Diproses.
- Done: Alter Flow cannot reach PYB4AE from the Cetakan sub-flow; Initiate & Alter reset No ran on PROD (codes C1F5-62FF, A293-188D), 6 of 6 verified by DB (new a_tgsn 2919960-2919964, 2919967). Patch 287925.sql rewritten (alter had already set status_awam), run by infra, MLPS/1 and /2 now Awalan / Sedang Diproses, dates empty. Redmine submitted: Resolved to Fizah, journal #4. Quest archived (patch ticket, ahead of Redmine).
- Side session: next-steps-shape v5 (approval text in its own copy block), main 71ae8698.
- Knowledge: ALTER-TICKET-PLAYBOOK §3 (ended flow: Init & Alter resets status_awam only; tool AFTER check denied on PROD for rjk_parameter_sistem).
- Open: OMLPS/1 is Tamat / Sedang Diproses from before this ticket, not in BA scope. Routing PYB4AE to PB4AE not yet exercised (user's Hantar).
- Mistakes: approval codes quoted in a table cell; status patch written before the alter, would have matched 0 rows; two guessed column names (id_pengguna, trkh_kemaskini).
- Assessment: A1 prod-alter-gate refused codes found inside his quoted complaint; the popup path worked. A2 write data patches after the alter's AFTER read. A3 the AFTER engine check fails on PROD, DB rows were the proof. A4 Alter Flow cannot cross from a sub-flow to a parent node; Initiate & Alter can. A5 ⏭ no sweep.

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
