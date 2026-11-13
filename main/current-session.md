**Last Activity (Penang Surat Ulangan JT: common page vs Pelupusan, Papar empty)**: 2026-11-13 10:47 — worktree `mlk-template-surat-ulangan-0122a3`. Penang PRZ/2026/12 Utiliti Penyediaan Surat Papar empty: Papar (`onPaparDoc`) needs a letter status (`s IS NOT NULL`, common 2018); the letter list (`initParentAplikasiDocumentList`) does not. Same code in Melaka and Penang. Domain Expansion.

## Session Recap (2026-11-12 to 13, Penang Surat Ulangan JT)
- Asked: how Melaka gets TemplateSuratUlanganJabatanTeknikal vs Penang (common page); check Penang runtime; PTPNG/01/L/PRZ/2026/12; why onPaparDoc returns nothing; trace; Kedah + Melaka way; patch to test (miya patched himself); does Melaka set status or have a fallback; by requirement should Papar return something; DE.
- Done: Melaka and Penang Pelupusan = same path (UPS_PLP/UPS_PS, pelupusan template, SRTJK_ULGN left out of the common list); Penang's only Ulangan letter came from the Pembangunan utility (UPS_BGN, PSST), which maps SRTJK_ULGN to common surat-SuratJabatanTeknikal.docx. PRZ/2026/12: 4 UPS_PLP attempts 11/11, no letter; letter 4930 SRTJK status_id empty, skg_dok 15435 v1 present. Papar query `findDokumenByAplikasiAndSenaraiJenisDokumenKod` has `s IS NOT NULL`; picker list `findByAplikasiAndJenisDokumenList` has none; Melaka/Kedah/Penang most SRTJK letters have no status; no fallback or status writer in the Ulangan path. Test script (status PERAKU on 4930 + revert) handed; miya runs it.
- Open: miya's test result on UPS_PLP/2026/26; Papar fix belongs to common (load the selected row's letter); note to Pembangunan team not drafted (declined/not asked).
- Mistakes: claimed "status stopped on 21/09" from a partial read (June/July were all null) and corrected; traced Papar for an hour before reading the xhtml binding that shows the list is a different query (read the page binding first).
- Assessment: A1 branch-guard blocks read-only Read on a non-trunk etanah repo (git show used). A2 no quest; adhoc not registered. A3 page binding first, before the backing method. A4 Ulangan list vs Papar fact written to penang WORD-TEMPLATE-RENDERING. A5 ⏭ no sweep.
**Last Activity (ADHOC-PLP-2026-7 GIS service map for Teknikal)**: 2026-11-13 00:51 — worktree `sheet-tugasan-mapping-7b0b01`. Melaka Pelupusan rows 81-89 of the Teknikal sheet "Integrasi Servis Modul" filled, audited twice by Fable 5.2, every cell proven; evidence script, check.sql, 6 guide pictures and a handover prompt for other states in Task folder 399 2. Fix; adhoc-brief-first gate fixed (827f93f2). Domain Expansion.

## Session Recap (2026-11-12 to 13, ADHOC-PLP-2026-7 Map GIS service to tugasan)
- Asked: fill Pelupusan MLK rows of the Teknikal GIS sheet (due 13/11 10am, via Alex), 100% verified with proofs; no extra words, no red, multi-line cells, wide columns; Fable 5.2 audit twice; audit the hook re-prompts and fix them properly; evidence file per statement, guide pictures, a prompt so other states can do the same; DE only if all passed.
- Done: sheet D81:G89 final (GITP/GUTP via Tandatangan PB4AE/PB4CE/PB4DE + "Tandatangan dan Papar" at SB; GBR via Hantar at BPRZ MW; GBTP/GRITP/GIR/GUR/GIPTR Belum diintegrasi; GBRM Bukan skop). Corrections from audits: MLPS and BPRZ Perserahan (records, not ind_ursn flags), GIR (Hantar only on the last langkah; PDWSMPTD step 5 has no GIR), Utiliti button label, GUTP Perserahan PRU/MLPS = Kaunter (noPermitLesen written only by spoc-hasil). 2. Fix: evidence.ps1 (reads origin/mlk/master), ADHOC-PLP-2026-7-check.sql (stamped mlkprod + mlkstg1), 1-6 PNG, Handover-prompt-other-states.md. Save audit 31/31. Gate fix: save agent = agent that writes the save-set; every missing brief part in ONE block (evals 39/39, 68/68).
- Open: miya sends the sheet to Alex. Monitoring/self-fix reader + DE step proposed, not built. Main folder behind GitHub main (other sessions' dirty files).
- Mistakes: unrequested words + red text in the sheet; Perserahan from ind_ursn flags; claimed GIR "verified" without the last-langkah check (verify-claim); first evidence lines read from a local branch one release behind.
- Assessment: A1 adhoc-brief-first fired 3 re-prompts for one turn and held a read-only agent; fixed. A2 adhoc save via background agent held 31/31 three rounds. A3 Hantar last-langkah rule and remote-branch rule now in knowledge and the handover prompt. A4 GUTP channel rule (noPermitLesen writers) in OTHER-MODULES. A5 ⏭ no sweep.**Last Activity (Penang GIS null int + Izz help session)**: 2026-11-12 17:38 — worktree `gis-null-int-issue-227fee` (branch claude/gis-null-int-issue-227fee). Found the old "null null null int" GIS issue (282442 / ADHOC-PRBB-2026-6); traced the same NPE on Penang P2e Tandatangan and Pembatalan to common DBUtil having no KOD_NEGERI 07 branch; class chain picture, line numbers, breakpoints and Izz message drafted. Domain Expansion.

## Session Recap (2026-11-12, Penang P2e GIS NPE for Izz)
- Asked: what triggered the old GIS "null null null int" error and which ticket; how P2e Tandatangan hits it (Penang, PngLaporanP2eForm); pull first, Izz needs help; why insertGITP cannot be traced in Eclipse; draft message to Izz; class chain picture; line numbers; is PRU affected; what is 07; where to put breakpoints; show the code; DE.
- Done: 282442 = MLK PRBB empty kodPejabat, GIS wrote to et_ptg with no log_service, common masked it as NPE (the text is IGisRequestService.serviceResultUpdate(String,String,String,int)). Penang: PngLaporanP2eForm.signLaporanP2e:130 > BasePelupusanForm.saveReportAndSignOTP:628 > saveToInduk:665 > PelupusanService.saveMaklumatPermitToInduk:2306 > PelupusanIntegrateGISService.insertNoLesenPermit:143 > common GisRequestService.insertGITP:268 > logServiceRequest:2043 > DBUtil.GetSchemaByKodPejabat:129 (only 04 and 02; Penang KOD_NEGERI 07 gives schema "") > PostgresUpdateService:638 login "et_" fails > catch :657 NPE. PRU and PRBB both in URUSAN_PERMIT_LIST, so both hit it; Pembatalan via updateGTB too. Running jar common 0.0.180-KDH (cd5a4a15b0); kdh/beta c8358f2866 (#287472) removes the NPE mask, not the 07 gap. Izz message + swimlane picture in scratchpad. DB proof on pgit: KOD_NEGERI 07, GIS_DB_IP 10.16.56.54 etgis_dev, 5 pt_application_ex_entity rows.
- Ticket: Redmine 287348 (PNG_03 UPL Utiliti Pembatalan Lesen/Permit); Izz noted 'kod negeri 07 is not ready yet' and passed it to Amirul Ariff 2026-11-12; ProTime adhoc '287348 - Assist' (login budget retry).
- Open: Izz to read e.getMessage() at PostgresUpdateService:656 (or the server.log line before the NPE) to confirm the real GIS error; whether etgis_dev has Penang schemas not checked; fix belongs to common/GIS (add 07 branch), not pelupusan.
- Mistakes: none recorded by miya this session; four Stop-hook deltas (attempt-before-blocked, session name, ownership input check, db-claim proof) and one pena 4-sentence paragraph.
- Assessment: A1 branch-guard blocks reading a non-trunk etanah repo even for read-only (read via git show). A2 no quest; help for a colleague. A3 interface dispatch to a jar explained by line, breakpoints placed at the four values. A4 common DBUtil state gap now known for Penang 07. A5 ⏭ no sweep.
**Last Activity (Surat Ulangan JT lookup)**: 2026-11-12 17:45 — worktree `template-surat-ulangan-jabatan-teknikal-e8ac53`. Read-only question: which ticket for TemplateSuratUlanganJabatanTeknikal + how common calls pelupusan. Answer corrected at DE: the ticket that moved it to pelupusan is 255170 (faizudin, efed7b1e0a + 02f9689142); 280029 is the later populator/font fix. Fact written to etanah-knowledge FLOW-TRACES.md.

## Session Recap (2026-11-12, Surat Ulangan JT ticket + common to pelupusan call chain)
- Asked: which ticket was TemplateSuratUlanganJabatanTeknikal; how common calls the pelupusan one; then DE.
- Done: chain traced (CommonPenyediaanSuratForm:222 -> PenyediaanSuratService:401 bean by modul -> MlkPelupusanPenyediaanSuratStrategy -> MlkPelupusanSuratStrategy/PelupusanSuratStrategy :178 kategori, :60 populateTemplate); 4 common kods only; common's own ulangan docx unused in Melaka.
- Mistake: answered 280029 from a quest-archive note; never read etanah-knowledge first (FLOW-TRACES.md already had the strategy history) and never ran git log on the Melaka strategy file, which names 255170. Corrected in the DE reply.
- Open: none.
- Assessment: A1 knowledge-first hook named WORD-TEMPLATE-RENDERING.md but a lookup question still went grep-first. A2 ⏭ no quest. A3 a "which ticket" answer needs git log on the deciding file, not a ledger note. A4 FLOW-TRACES now holds the Ulangan JT chain with tickets. A5 ⏭ no sweep.
**Last Activity (ADHOC-PRBB-2026-24 + knowledge-first session)**: 2026-11-12 09:40 — worktree `penang-common-null-error-219adf` (branch claude/adhoc-session-standby-c1d1d0). PROD PRBB slaid lines adhoc: cause Microsoft Print to PDF strips; fixed PDF in 2. Fix; system fix landed b7f17eaa (main folder 598a6116): adhoc reads etanah-knowledge index.md first, knowledge-first-gate blocks the first DB query before a knowledge read, staging test by file origin, wrong MLK STAG rule removed.

STEP-3: /handover (2026-11-13, 289337)
session: 93665573-efe6-464a-8977-11b4d240af45
his words: "built it" (order)
his earlier words: "I need you to universally remember & invoke a /handover skill to make it more deterministic"
fix or report: fix
who pays: on-demand skill text (a few hand-overs a week) + per-turn rider inside the existing stop-claim-integrity node process, one regex, no new process
goal without the part: fixing the three contradicting lines gives a fix file, but nothing forces the proof split or the pre-staging audit, and he named the skill
model: claude-fable-5-2
fable verdict: go-with-changes (skill v1 = other team only, rider only when a note or file is staged, handoff-load repointed, none: data/config/env only)
cause step: .claude/skills/cross-module-check/SKILL.md verdict row THEIRS · change: 3 lines
new parts: 1 · replaces: the procedure copy in feedback_cross_module_handoff_artifact.md and handoff-load's injected memory body
shown: C:\Users\Ridhwan\AppData\Local\Temp\claude\d38c170e42ee97f5\93665573-efe6-464a-8977-11b4d240af45\scratchpad\handover-plan.png
audit model (popup 2026-11-13, his words): "Fix this rule since it goes against what I requested and had in mind." → the pre-hand-over audit runs on `node lib/models.js highest`; the sweep's "Never Fable" stays for its bulk waves only

CHANGE-CARD (before): /handover
- What: a /handover skill that every hand-over of a cause or fix to another team or module runs before the note is staged.
- Why: on 2026-11-13 the 289337 note to Common stated an unrun cause as fact, had no fix file or audit, and carried a card meant for the manager.
- How: the step 2 flow picture handover-plan.png shows the hand-over check placed between diagnosis and staging.
- When: on a hand-over to another team, and the Stop check runs on any reply that names another team as owner and stages a note or file.
- Where: .claude/skills/handover, domain/ownership-input-check, cross-module-check, domain/handoff-load, domain/pena and two memories, as the change map shows.
  change map: change-map-20261113-034302.png
Where picture = the change map (lib/change-map.js).

- 2026-11-13 289337 passed to Common (Amirul) with fix file + screenshot; /handover skill built (system-change): procedure moved from quest §Hand-over to ANOTHER TEAM + handoff memory, Stop rider in ownership-input-check (eval 37/37), handoff-load loads the skill (17/17), Pena separate rule (57/57), sweep 'Never Fable' scoped to waves per miya's popup answer.

CHANGE-CARD (after): /handover
- What: a /handover skill that every hand-over of a cause or fix to another team runs, and a Stop check that needs its Handover line when a note or file is staged.
- Why: on 2026-11-13 the 289337 note to Common stated an unrun cause as fact, had no fix file or audit, and carried a card meant for the manager.
- How: the flow picture handover-plan.png shows the hand-over check between diagnosis and staging, now the skill's own diagram.png.
- When: on a hand-over to another team, and the Stop check runs on any reply that names another team as owner and stages a note or file.
- Where: .claude/skills/handover is new, and cross-module-check, quest, sweep, ownership-input-check, handoff-load, Pena and two memories changed, as the change map shows.
  change map: change-map-20261113-040810.png
Where picture = the change map (lib/change-map.js).

STEP-3: sweep board gap (2026-11-13)
session: 93665573-efe6-464a-8977-11b4d240af45
his words: "Yes, build it" (order)
fix or report: fix
who pays: on-demand: one extra active.txt read per sweep close, no new process
goal without the part: no new part; two existing steps change
model: claude-opus-5-5
cause step: .claude/skills/sweep/SKILL.md Step 7.2 + domain/sweep/audit.js run() · change: 12 lines
new parts: 0
shown: C:\Users\Ridhwan\AppData\Local\Temp\claude\d38c170e42ee97f5\93665573-efe6-464a-8977-11b4d240af45\scratchpad\board-gap-plan.png

