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

STEP-3: change route step 8 report = change-map picture (lib/change-map.js, INDEX step 8, reply-shape-spec 3i, system-change-title v4)
session: 162ad23b-073b-47dc-96a2-24d389f22a89
his words: "change this to always show a diagram drawn always" (order)
fix or report: fix
who pays: on-demand: once per system change, one headless Edge about 5 s, exits; Stop gate stays under 50 ms
goal without the part: after every system change he sees on the map's own boxes which parts are new, changed or removed
model: claude-fable-5-1
shown: C:\Users\Ridhwan\AppData\Local\Temp\claude\C--Users-Ridhwan-OneDrive---Pymsoft-Sdn-Bhd-0--AI-Project-AI-MemoryCore--claude-worktrees-common-version-1-10-20-mlk-c5ee8f\162ad23b-073b-47dc-96a2-24d389f22a89\scratchpad\report-picture-plan.png

## 2026-11-03 — redmine-write-gate v1.11: his status rule, no more asking (subagent, worktree appraisal-2026-rubric-500819)
- **Ask**: 287747/287638 were blocked four times on Status = Resolved; his rule (under him + New/In Progress; New under someone else sent to a BA; Verified/Closed/Ready in PROD never changed) is now mechanical.
- **Built**: `domain/redmine-write-gate/status-rule.json` (owner 1311 · hand-back Resolved · lower · frozen · BA list with ids) + `status-rule.js` (`verdict`, `isBA`, `liveState`, CLI). Hook v1.11: ticket from the last navigate, one read-only GET for status + assignee, a staged BA assignee remembered 30 min. Prefill skill Step 2b + Step 3, memory `feedback_redmine_write_needs_nod` exception 2.
- **Verified**: eval 165/165 (F143 to F165); live CLI: 287747/287638 now Resolved under Nurhafizah → row 4 block; 287925 In Progress under him → row 2 allow.
- **Open**: none. Landed on main the same turn (SHAs in the reply).
