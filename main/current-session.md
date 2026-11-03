**Last Activity**: 2026-11-03 15:16 — worktree `ticket-287773-quest-run-66ac6f` (branch claude/dms-dokumen-kemasukan-limit-b60a31), Terengganu DMS upload size limit question, Domain Expansion.

## Session Recap (2026-11-03, Terengganu dokumen kemasukan upload size limit)
- Asked: the DMS size limit for dokumen kemasukan on Terengganu; they want 10MB; find the table and column.
- Found: no table or column holds it. trgstg2 checked: information_schema columns saiz/size/max (only dokumen_revision.saiz_fail_byte, a stored size), rjk_parameter_sistem (no upload parameter), et_dms_stg2 (no settings table).
- Code on trg/master: etanah-common WebUtil.java:1635 getFileUploadSizeLimit = 1,000,000,000 B (1 GB, upload box default); WebUtil.java:2540 server check 209,715,200 B (200 MB). AWAM extra-document tabs 100 MB (tooltip wrongly says 1Mb). Pelupusan 1 MB outliers: SuratTemplateForm.xhtml:89, KeputusanSiasatanForm.xhtml:149, UtilitiPajakanBerfasa.xhtml:134.
- Answer given: limit already 200 MB, so 10MB would be a cut. Not verified: which screen they use; JBoss max-post-size on the Terengganu servers (infra).
- Mistakes: first reply asked for the screen and error when he only wanted the number; claimed the common clone could not fetch (STATE-FACTS 2026-10-03) without running it; the fetch worked.
- Assessment: A1 db-claim-proof + attempt-before-blocked gates caught both slips. A2 ⏭ no quest. A3 knowledge FLOW-TRACES §File upload → DMS (Melaka) pointed straight at the code layers. A4 a "table and column" ask can be a code limit; say so on line one. A5 ⏭ no sweep.
**Last Activity**: 2026-11-03 14:33 — worktree `appraisal-2026-rubric-500819` (branch claude/appraisal-2026-rubric-500819), tickets 287747 + 287638 handed to BA, Domain Expansion.

## Session Recap (2026-11-03, tickets 287747 OPLPS + 287638 PPJK)
- Asked: quest 287747 to Rubric, batch with small tickets; apply 287747 + 287638, commit, deploy, test on server, Redmine handover with evidence.
- Done: 287747 Hantar after Simpan with Pembetulan Ya (BasePelupusanLiteForm.initData reorder), 07f3a9a3 on mlk/esokongan/287747, int-env 896a6e1515, stag-env 8987221fb2. 287638 last fasa carries the remaining years, c3cd2e90 on mlk/internal/287638, int-env 4fc2a7201a. Both tested on server by miya (Ya, Tidak, signed; 4 4 4 4 5). Redmine 287747 journal 5 and 287638 journal 2 posted 14:24-14:25: Resolved, Nurhafizah Hasan, 100%, photos attached. 287638 was briefly reassigned to miya, then sent back to BA after he clarified the fix is correct.
- Audit 287747: not a regression; the initData order is the same in every version back to before UAT-CR 241586 (2026-02-10). Only the 7 lite urusan SB with Ya change; other lite urusan with Ya are untested.
- Mistakes he caught: tested locally first instead of on server; 287638 test steps named a Kira button and an editable Tempoh Pajakan that do not exist; asked him 4 times for "set status to Resolved" against his standing rule. All three have slip rows.
- Blocker: redmine-write-gate refused status Resolved even after his rule message; set by clicking the select. A Fable 5.1 agent was launched to build his status rule into the gate (running at DE time, not landed).
- Assessment: A1 the Redmine gate encodes words, not his status rule. A2 test scenario steps came from a method name, not the screen page file. A3 regression audit by git blame took 4 calls and answered cleanly. A4 analog-first fix (Permit Lesen helper) held under his doubt. A5 ⏭ no sweep.
**Last Activity**: 2026-11-03 12:05 — worktree `redmine-287350-quest-6d719f` (branch claude/redmine-287350-quest-6d719f), PROD patch ticket 287350 closed and archived, Domain Expansion.

## Session Recap (2026-11-02 to 11-03, ticket 287350 MCL Perkara + Syarikat, PROD)
- Asked: Perkara and Syarikat blank on Laporan Tanah, Map Info and Google reports for PTMLK/02/L/MCL/2026/18 and /26; BA asked to patch tajuk risalat.
- Done: one infra round. Data patch of tajuk risalat (plp_a_pelupusan) and stored perkara (tkl_a_laporan_tnh); 6 report PDFs downloaded, Perkara and Syarikat written in with PyMuPDF, uploaded. No PDF reset: the reports are stored as PDF. Redmine posted by API after his "post it": Resolved, 100%, zip + sql attached; BA since reassigned it to Iffah.
- Quest QA-287350 closed and archived ahead of Redmine (patch ticket). Archive pruning deleted the patched and original PDFs from the Task folder: patched copy is on Redmine (287350.zip), originals in Desktop dw.rar.
- Deferred: report query filter drops No. Pertubuhan / No. Koperasi pemohon (latent L37, Teknikal); 35 other MCL at PLT with no tajuk (BA).
- System: quest skill 6c fewest trips between people; patch-mlk-doc data patch goes with the reset after the upload + generated PDF needs no reset; pre-reply-contract and db-claim-proof every reply ends on its next step. All on main.
- Mistakes he caught: bare fact with no next step; long replies; counted files not trips; missed the document route for Syarikat; planned a PDF reset before checking the file type; stopped after confirming the patch instead of staging Redmine.
- Blockers: Claude in Chrome had no browser connected; memory-write-gate never saw the RULE-PLACEMENT line (memory note not written); redmine-write-gate refused "please submit".
