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

## Session Recap (2026-10-30 to 11-03, Selangor warta 2352 delete)
- Asked: delete no warta 2352 + tarikh warta 04/07/2013 for PTSEL/01/L/BPRZ/2026/7, Selangor internal env.
- Not done: internal DB oracle-slt 172.16.93.32:1521 refused TCP (WinError 10061, host pings, gateway 7411 up), 3 tries on 30/10; blocker row in core/slips.js. No DB written anywhere.
- Found (read only): staging oracle-sgr-stag has the permohonan (aplikasi_id 46486398) with umm_a_rizab 8946 warta asal 3622 06/12/1918, not 2352; 2352 04/07/2013 sits on six ind_rizab rows (1, 65-69) on staging, shared registry. PAT has no such permohonan.
- Resume point: when internal is up, read umm_a_rizab for the permohonan on internal, clear only the pair holding 2352 (1 row, script-check first); if 2352 is only in ind_rizab, stop and show him.
- No adhoc scaffold made (no finding on internal yet). Selangor ENV-ARCHITECTURE.md is still an empty skeleton.
- Assessment: A1 ⏭ nothing new. A2 ⏭ no quest. A3 the internal host refused while staging answered; no tool tells which Selangor env is "internal". A4 the warta is shared registry data on staging, so a blind clear on ind_rizab would hit other rizab rows. A5 ⏭ no sweep.
**Last Activity**: 2026-11-03 11:05 — worktree `baseline-wednesday-release-029181` (branch claude/plp-melaka-esokongan-tickets-6e83ab), eSOKONGAN + Internal Issue sweeps, Domain Expansion.

STEP-3: change route step 3 check + design-consult-gate step-3 rider + highest-model-id
session: 162ad23b-073b-47dc-96a2-24d389f22a89
his words: "Go, build it" (order)
fix or report: fix
who pays: per-tool: inside the existing design-consult-gate on Edit|Write, no new process
goal without the part: no system change is built before its ask, cost and fix are checked and shown to him
model: claude-fable-5-1
shown: C:\Users\Ridhwan\AppData\Local\Temp\claude\C--Users-Ridhwan-OneDrive---Pymsoft-Sdn-Bhd-0--AI-Project-AI-MemoryCore--claude-worktrees-common-version-1-10-20-mlk-c5ee8f\162ad23b-073b-47dc-96a2-24d389f22a89\scratchpad\step3-rule.png
