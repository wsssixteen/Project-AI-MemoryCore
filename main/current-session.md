**Last Activity**: 2026-11-04 17:55 — worktree `penang-common-null-error-219adf`, Penang Utiliti Penyediaan Surat Jana error (ADHOC-UPS-2026-2), Domain Expansion.

## Session Recap (2026-11-04, Penang UPS_PLP Jana null pejabat)
- Asked: Penang common screen CommonUtilitiPenyediaanSuratForm (menuId=934): Jana after search fails with null pejabat; compare Melaka, data or code.
- Done: form + PenyediaanSuratService identical Melaka vs Penang common (Penang pelupusan uses common 0.0.172-KDH.beta.patch2, clone on kdh/beta); cause = ind_pejabat_ursn has 0 rows for UPS_PLP in Penang (Melaka 5, MLK_SEDIA_SRT; Penang UPS_BGN 7, PNG_SEDIA_SRT). UPS_PLP.sql (7 inserts via seq_pejabat_ursn) + Fix.txt in 1. Tasks\Penang\7. AH - Internal - UPS_PLP - Penyediaan Surat Jana null pejabat\2. Fix; WhatsApp message (Short + Full, Pena clean) drafted for the Penang team.
- Found: each failed Jana click still saved a UPS_PLP aplikasi first: 16 rows with no tugasan (2026-11-02 to 11-04, noraini.haron, pejabat 01). Local JBoss not running, so no stack trace read.
- Open: miya sends the message + script; Penang team runs it on Penang IT; retest Jana. The 16 orphan rows untouched.
- Mistakes: two Stop corrections for missing proving SELECTs (db-claim-proof) and one for no git-history probe; the branch-guard blocked a Read on kdh/beta (read-only).
- Assessment: A1 branch-guard blocks reads, not only edits. A2 adhoc-save gate refused the save in the DE turn although the brief was given earlier. A3 DB-first found the cause in 4 queries once code was proven equal. A4 a new Penang urusan needs ind_pejabat_ursn rows per pejabat; the UPS_BGN rows were added the same morning. A5 ⏭ no sweep.
**Last Activity**: 2026-11-04 17:15 — worktree `appraisal-ratings-review-02cd68` (branch claude/appraisal-ratings-review-02cd68), session "2/11/2026 - appraisal flow", Appraisal-2026 talk flow kept in step with rows 54 to 58, appraisal finished, Domain Expansion.

## Session Recap (2026-11-04, Appraisal-2026 talk flow, page map and ticket cards aligned to his last rulings)
- Asked: keep chat-pack 13-presentation-plan.md, 12-who-does-what.md, 14-ticket-cards.md, 00-MASTER.md, START.md and infographics\appraisal-talk-flow.png in step with the rulings the home-laptop session relayed (DECISIONS rows 54 to 58); then one table per filled Part of the form; then two Redmine lookups (Lau Li Wen: Dev Hasil since June 2021, first ticket 98753).
- Done: steps 5 to 7 of the talk flow follow the five Part D rows by stage and the settled ranking; 286650 card added (165 cards); page map at 14 pages; picture redrawn and sent 4 times; every change confirmed to the peer by message. Per-Part tables delivered from the Word file of 02:14. START.md Phase marked FINISHED 2026-11-04 on the peer's save order; nothing to commit (project folder gitignored).
- Found: rows 59 to 62 (visuals pack 5 pages, form back to 11 pages, B4 screenshots) were written by the peer after my last sync, so 12-who-does-what.md still says 14 pages and a 4-page visuals pack; the peer owns the Word files and the final page map.
- Open: his picks never arrived here: Part A on page 2 (write or say), Department IT or ID, C1 at 5 or 4, which Development or CR tickets to name. Self-archive refused (a background watcher still live); he archives from the sidebar.
- Mistakes: terse-gate at 21 lines once (delta reply); three picture renders for text overflow before the lines fit.
- Assessment: A1 OneDrive sync lag (4 to 10 min) between the two laptops made every relay a wait loop; a shared ledger read from one side would have been cheaper. A2 ⏭ no quest work. A3 ⏭ no debugging. A4 ⏭ no etanah fix. A5 ⏭ no sweep.
**Last Activity**: 2026-11-04 17:00 — worktree `ticket-275608-reply-7d6b89`, REQUIREMENT 275608 PPTPB mapping reply posted to Anis, Domain Expansion.

## Session Recap (2026-11-04, 275608 PPTPB to Pendaftaran value mapping)
- Asked: Anis (BA) wanted the mapping of Kegunaan, Unit/Luas, Tarikh Kuatkuasa, Tarikh Luput for PPTPB (Raja, Pendaftaran, asked how Pelupusan passes them).
- Done: mapping verified on mlit PPTPB/2026/11 + master code; Redmine note posted by miya 08:53, matches the draft, assigned to Anis. Quest QA-275608 delegated, qa_doc written, PPTPB-TICKETS.md knowledge row added.
- Found: PelupusanPendaftaranService:232 fills land data for PT, PSBP, MCL only; PPTPB sends none. Same Endosan branch as ADHOC-PPTPB-2026-9.
- Open: miya to decide whether we add PPTPB to the service or Pendaftaran reads the tables.
- Mistakes: one Next steps row without a heading above (gate caught); guessed column name unit_luas_dipohon (real: unit_luas_dipohon_id).
- Assessment: A1 next-steps-shape caught a headless row. A2 quest flow fit a mapping-only requirement with no Rubric. A3 reading the service before the data answered the BA's real failure. A4 PPTPB dates live in mklmt_tmbhn JSON, not trkh_mula. A5 ⏭ no sweep.
**Last Activity**: 2026-11-04 17:00 — worktree `arabic-command-b8399a` (branch claude/appraisal-progress-review-1620f3), Appraisal-2026 finished, Domain Expansion.
