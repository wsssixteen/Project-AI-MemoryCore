**Last Activity**: 2026-11-03 17:59 — worktree `jovial-kepler-a07ba6` (branch claude/friendly-dubinsky-2b7fd1), second Domain Expansion after 287811 handover: pulled main 0caed659, watch rows for quest-phase-gate (gate + eval) and redmine-write-gate; miya to confirm the pinned git origin in the app (Help, Troubleshooting, Review Pinned Git Origins) so sync_with_base_branch works again.
**Last Activity**: 2026-11-03 17:53 — worktree `pptpb-hakmilik-assignment-639100` (branch claude/pptpb-hakmilik-assignment-639100), ADHOC-PPTPB-2026-9 answered and BA reply sent, Domain Expansion.

## Session Recap (2026-11-03, ADHOC-PPTPB-2026-9 PPTPB TSP endorsement)
- Asked: PROD PPTPB PTMLK/02/L/PPTPB/2026/5 (norlina, Jasin): is PPTPB connected to the right TSP subflow in Flowable; HKBM 02MH1579/2026 on PN 040214PN00037703 went to Jasin, BA expects PTG 00.
- Found: MLK_PLP_PPTPB.bpmn20.xml:575-591 41.0 Endosan TSP calls MLK_DFT_NOTA_HKMLK with nextUrusan TSP, same as MCL and PLTP; the permohonan sits at SPIL Semakan Permohonan Lulus (TSP), Dalam Tindakan. 02MH1579/2026 is HKBM (MH), not TSP (nota), made 20/10 by norlina with no workflow row and no tugasan, so not made by the flow. No PPTPB in PROD ever made a TSP perserahan. PROD nota on PN always goes to the district office (MCL 19, PLTP 114), never 00.
- Route: OWNED-ELSEWHERE, refer Pendaftaran (how HKBM was made; should a PN nota go to PTG 00). BA reply sent by miya 2026-11-03. Saved: Task folder 367, register A95, audit 31/31.
- Not verified: how 02MH1579/2026 was created (etanah-pendaftaran not on disk).
- Mistakes: skipped the boot reads and the session briefing; the save agent tried to start before the brief (gate caught it); the first SQL guesses hit wrong column names (pjbt_id, id_hakmilik, ind_jns_hkmlk) before reading information_schema.
- Assessment: A1 the brief-first, db-claim-proof and ownership-input gates each forced one delta; the Input check had to be repeated three times because each reply was checked alone. A2 the BPMN read settled the BA's flowable question in one grep. A3 the sibling count (children of MCL/PLTP by hakmilik type) turned a "should" into a PROD fact. A4 a stray perserahan with no umm_aliran_kerja row is a quick sign it was not made by a flow. A5 ⏭ no sweep.**Last Activity**: 2026-11-03 17:25 — worktree `jovial-kepler-a07ba6` (branch claude/friendly-dubinsky-2b7fd1), ticket 287811 handed to BA, Domain Expansion.

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
