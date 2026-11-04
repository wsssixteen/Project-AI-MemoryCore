**Last Activity**: 2026-11-04 22:40 — worktree `ticket-275608-reply-7d6b89` (branch claude/redmine-data-patches-583794), PROD data patches 288169 + 288261 Resolved to Fizah, Domain Expansion.

## Session Recap (2026-11-04, PROD data patches 288169 and 288261)
- Asked: run 2 Redmine data patches; then "replace" not "upload" for an overwrite; then hand both back to the BA.
- Done: 288169.sql (6 umm_a_jabatan_teknikal rows agensi 8 → 6) and 288261.sql (3 UPDATEs) + renamed pelan PDF; infra ran them; PROD re-checked; both tickets Resolved to Fizah 22:33 with his note "have patched the data in PROD. Can proceed to verify."; patch-mlk-doc infra box says "replace" (8ebb3381); redmine-phase1-prefill Step 4 carries the PROD note (main 66cfedae).
- Found: BA named agensi 6002 but the bad rows sit on agensi 8 (named MPAG 21/07 to 13/08); a PROD patch is checked by the user through the TSO, never by the BA.
- Open: QA-288169.md and QA-288261.md are not in the main folder (worktree guard); drafts in this session's scratchpad. Quests stay Phase 1 until Redmine shows Closed.
- Mistakes: wrote the internal-deploy note ("Please help to verify") on a PROD patch; Stop corrections for a part path, a missing proving SELECT, and the change map; memory-write-gate refused the speech example 3 times (rule went into the skill instead).
- Assessment: A1 memory-write-gate cannot see a RULE-PLACEMENT line written in the same message as the edit. A2 the prefill skill had no PROD-patch note shape. A3 ⏭ no debugging. A4 an agensi renamed for a window leaves rows pointing at the wrong agency. A5 ⏭ no sweep.
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
