**Last Activity**: 2026-11-04 23:10 — worktree `sweep-orchestration-audit-39e710` (branch claude/todays-ticket-review-82c546), today's board, 287892, 286650 Zarul patch, 248290 coverage adhoc, Domain Expansion.

## Session Recap (2026-11-04, today's board + 248290 coverage per urusan)
- Asked: today's tickets; 275608 missing from the ranked board; BA reply on 287892; Zarul's nextUrusan=PSPM PROD patch for 286650; Fizah's OPLPS/2026/2 infra paths; peer appraisal request; Mira's question whether 248290 covers all 7 urusan; "save adhoc".
- Done: redmine-board counts "e-Tanah Melaka" as a Melaka project (07455cc9); 287892 BA reply posted; 286650 patch script + Redmine handover note drafted; ADHOC-PLP-2026-6 saved and archived (Task folder 374, register A98, audit 31/31 PASS).
- Found: 248290 covers PLPS, MLPS, PRBB, PRU, PPJK, PPTPB; PLBP's AWAM Status Permohonan dialog (paparanBorang4BeL2eDialog, StatusPermohonanForm.xhtml:993) is commented out; the print-once lock is only for 4Ae/L1e.
- Open: miya sends the corrected reply to Mira; 286650 handover note waits "post it"; ADHOC-PLP-2026-6 owes a quest-bounty harvest.
- Mistakes: said "PLBP not on PROD" from an assumption; he corrected it, re-answered from the code. Stop corrections: unqualified proving SELECTs, terse gate, next-steps row wording.
- Assessment: A1 adhoc-brief-first blocks the main-thread audit re-run after the agent reports (skill step 4 asks for it). A2 ⏭ no quest phase moved. A3 coverage question answered from code per urusan, not from a test. A4 an AWAM dialog commented out silently drops one urusan from a shared Requirement. A5 ⏭ no sweep.
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
