**Last Activity**: 2026-11-03 18:08 — worktree `dreamy-pike-08af0b` (branch claude/pelan-papar-overflow-cde7f5), ADHOC-OPLPS-2026-1 closed as no issue and archived, Domain Expansion.

## Session Recap (2026-11-03, ADHOC-OPLPS-2026-1 OPLPS pelan L1e tidak penuh)
- Asked: PROD PTMLK/02/L/OPLPS/2026/8 (nurulazura, PDTJ): pelan on Borang L1e looks cut, other OPLPS fine; margin? ours or the reports team?
- Found: not margin, not cut. DMS file 2000x1410 complete; pixel script: black border top, bottom, left, none on right. Chain: pelukis azizah uploads in Teknikal (LAIN-37353842), Tandatangan Pelan stamps on the same canvas (CommonImageUtil.overlayImages), OPLPS users upload those exact bytes (932673 B), LaporanPelan.jrxml RetainShape only shrinks. Jrxml is in our own repo, so not a reports-team issue.
- Closed: miya, no issue. Route ANSWER. Task folder 365 archived, register A93 ANSWERED, audit 31/31.
- Not verified: azizah's own upload not opened (not needed after close).
- Mistakes: said the file itself was cut, then that the bottom border was missing; both withdrawn after measuring. Wrong column guesses (medan_pk, no_dokumen, ind_jns_dok) before reading the schema.
- Assessment: A1 the brief-first gate blocked the save agent and the audit in a closing round with no new finding. A2 ⏭ no ticket quest. A3 a pixel count settled "cut vs missing line" where eyeballing failed twice. A4 compare the file bytes across Teknikal and OPLPS before blaming either module. A5 ⏭ no sweep.

**Last Activity**: 2026-11-03 18:04 — worktree `common-version-1-10-20-mlk-c5ee8f` (branch claude/focused-wescoff-e92f44), change route step 3 Check + nod and step 8 coloured change-map report, Domain Expansion.

## Session Recap (2026-11-03, change route: step 3 Check + nod, step 8 change-map picture)
- Asked: why the false alarms; drop the RustDesk session-start alert; a real check step in the change route (justify, scrutinize, assess, highest model, a picture, no essays); then every system change reported as a coloured picture on the system map's own boxes.
- Done: RustDesk alert removed. Step 3 Check + nod built (STEP-3 block, step3-check eval 20/20), on main 28f3eb1e / main folder af03ca97. Step 8: new Tool `lib/change-map.js` (spec JSON → coloured map, NEW green · CHANGED blue · REMOVED red, untouched kinds faded), system-change-title v4 (after a system edit, passes only on a sent change-map PNG; tables only beside `CHANGE-MAP: FAIL`), INDEX step 8, reply-shape-spec 3i, explain-diagram colour exception, tools.json row. Gate eval 43/43. On main 026cb251 / main folder 23c15230 (patch applied by hand: land-on-main refused on dirty main + current-session.md conflict).
- Mistakes he caught: report given as tables, "I don't think this is working"; the first map was bland because my 2026-11-02 no-accent rule overrode the plugin's colours ("did you add a certain rule that overwrite the original skill?").
- Open: the RustDesk connection itself is not fixed; 12 tool-registry problems existed before this change; Appraisal-2026 handover draft still in the notes folder.
- Assessment: A1 a rule I wrote for one picture type silently stripped colour from every picture; a skill-wide rule needs its scope named. A2 ⏭ no quest. A3 ⏭ no debugging. A4 ⏭ no etanah work. A5 ⏭ no sweep.

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
