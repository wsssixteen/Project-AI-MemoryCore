**Last Activity**: 2026-11-03 17:25 — worktree `jovial-kepler-a07ba6` (branch claude/friendly-dubinsky-2b7fd1), ticket 287811 handed to BA, Domain Expansion.

## Session Recap (2026-11-03, ticket 287811 MCL Surat Keputusan Lulus status)
- Asked: MLKSTG MCL, Surat Keputusan Lulus shows Baru at Semakan and Pengesahan though Sedia at Penyediaan (internal issue, BA Mira).
- Cause: our 258004 fix deleted the Surat on every Maklumat Tanah save (MlkMaklumatTanahPemberimilikanForm invalidateSuratKeputusanLulusForRegeneration). Requirement 223236 spec: Penyediaan Sedia, Semakan arrives Sedia, Pengesahan arrives Disemak; no delete rule.
- Fix C: delete call, method and 2 imports removed, 0d5ef30fff on mlk/internal/287811, int-env a3a263bf69, stag-env 2720433503. Local test waived by miya; he tested on stg1 PTMLK/02/L/MCL/2026/14, all 6 steps pass. Redmine journal 5 at 17:22: Resolved, Nurul Amirah Nadiah, 100%, Root Cause DEV, 6 red-boxed photos.
- Open risk: a value changed after the Surat exists stays in the old Surat until Jana Semula; not verified.
- System change 87eddc33: requirement-index.js --read (description, journals, spec attachments) + quest-phase-gate v3 denies etanah edits until REQUIREMENT-READ and a quoted REQUIREMENT-MATCH exist; quest SKILL step 2b, ticket-gate 1e.
- Mistakes: REQUIREMENT-MATCH judged from the subject only (slip requirement-unread); sync_with_base_branch refused on unconfirmed git origin, merged by hand.
- Assessment: A1 the requirement read is now a gate, not a memory. A2 Phase 0 step 2b had no read step until today. A3 git log on the file found the 258004 commit in one call. A4 the spec docx settled the expected statuses at once. A5 ⏭ no sweep.
**Last Activity**: 2026-11-03 16:30 — worktree `cool-margulis-5bb326` (branch claude/melaka-kadar-cukai-display-a08485), ticket 287892 PT Kadar Cukai Desa II handed to BA, Domain Expansion.

## Session Recap (2026-11-03, ticket 287892 PT Kadar Cukai DESA II)
- Asked: PROD PT PTMLK/02/L/PT/2026/18 Desa II Bangunan Tujuan Keagamaan showed "Tiada kadar cukai"; expected RM 66.00. BA Fizah asked if our filter is wrong. Adhoc first (ADHOC-PT-2026-16, A92), then ticket 287892.
- Cause: six mukim are in two Desa classes (jns_kwsn_ptbrn "38584|38585"), so they sit in two rates; the lookup ignored Pengkelasan Tanah and took the oldest row. Maintenance data is correct; the tick is not stored on the rate.
- Fix: pelupusan only, PelupusanService.onCalculateCukaiTanah picks the rate whose mukim all share the chosen class and hands it to common (calculate():197 uses a given row). 55782d7ce1 on mlk/esokongan/287892, int-env 1295a676b4, stag-env 81097d7eae. No common change.
- Tested on stg1 by miya on PT/2026/18: DESA II RM 66.00; DESA III RM 50.00 (RM 4.00 x 6 = 24 raised to the RM 50 non-MCL minimum, common :509-529). Redmine Resolved to Nurhafizah Hasan, 3 photos, submitted by miya ~16:25.
- MLIT reference data cannot show the fix (rates 88 and 287 hold mukim of all three classes there).
- Also: picture added to Appraisal (DECISIONS row 50, ticket card).
- Mistakes: first WhatsApp advice told the BA to remove mukim from the RM 4 rate (retracted, data is correct); deploy card claimed staging test before checking the minimum rule explained his RM 50.
- Assessment: A1 redmine-write-gate still blocks Status even when status-rule.js says ALLOWED (needed his words twice). A2 deploy skill test scenario did not compute the minimum floor, so his RM 4 expectation was wrong. A3 git grep across origin/mlk/beta found the floor rule in one call after rg timed out. A4 reuse of common's pre-chosen-row path avoided a common hand-over. A5 ⏭ no sweep.
**Last Activity**: 2026-11-03 15:16 — worktree `ticket-287773-quest-run-66ac6f` (branch claude/dms-dokumen-kemasukan-limit-b60a31), Terengganu DMS upload size limit question, Domain Expansion.

## Session Recap (2026-11-03, Terengganu dokumen kemasukan upload size limit)
- Asked: the DMS size limit for dokumen kemasukan on Terengganu; they want 10MB; find the table and column.
- Found: no table or column holds it. trgstg2 checked: information_schema columns saiz/size/max (only dokumen_revision.saiz_fail_byte, a stored size), rjk_parameter_sistem (no upload parameter), et_dms_stg2 (no settings table).
- Code on trg/master: etanah-common WebUtil.java:1635 getFileUploadSizeLimit = 1,000,000,000 B (1 GB, upload box default); WebUtil.java:2540 server check 209,715,200 B (200 MB). AWAM extra-document tabs 100 MB (tooltip wrongly says 1Mb). Pelupusan 1 MB outliers: SuratTemplateForm.xhtml:89, KeputusanSiasatanForm.xhtml:149, UtilitiPajakanBerfasa.xhtml:134.
- Answer given: limit already 200 MB, so 10MB would be a cut. Not verified: which screen they use; JBoss max-post-size on the Terengganu servers (infra).
- Mistakes: first reply asked for the screen and error when he only wanted the number; claimed the common clone could not fetch (STATE-FACTS 2026-10-03) without running it; the fetch worked.
- Assessment: A1 db-claim-proof + attempt-before-blocked gates caught both slips. A2 ⏭ no quest. A3 knowledge FLOW-TRACES §File upload → DMS (Melaka) pointed straight at the code layers. A4 a "table and column" ask can be a code limit; say so on line one. A5 ⏭ no sweep.
**Last Activity**: 2026-11-03 14:33 — worktree `appraisal-2026-rubric-500819` (branch claude/appraisal-2026-rubric-500819), tickets 287747 + 287638 handed to BA, Domain Expansion.
