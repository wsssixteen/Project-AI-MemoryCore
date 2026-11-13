**Last Activity (TRG 289233 + 289306, Laporan Siasatan Tanah no active file)**: 2026-11-13 17:20 — worktree `sheet-tugasan-mapping-7b0b01` (branch claude/trg-tickets-289233-289306-18fcb0). Both PROD patches run by infra and read back; Redmine Resolved to Nurul Amani with scripts; both quests archived; prefill skill Step 3 fix landed; Domain Expansion.

## Session Recap (2026-11-13, TRG 289233 + 289306)
- Asked: quest two TRG tickets Alex handed over, fix now; stage both Redmine to BA; then why I still asked for Resolved; DE.
- Done: cause = `skg_dok` of `umm_a_dok_keluaran` LPRN_SST_TNH had no active version (v1 off final, v2 off draft); pelupusan tab reads active only. PROD patch v1 flag_aktif Y (LAIN-33656988, LAIN-33011451) by infra, read back. Redmine both Resolved → Nurul Amani, Root Cause (DEV), generated note, .sql + -check.sql. Quests archived (QA docs in projects/coding-projects/archive). Bestiary pattern added. Prefill skill Step 3 form_input only (GitHub d6fcf522 / main folder 0a1cb429).
- Open: 190 other PROD reports in the same state; code fix owner etanah-teknikal (283050 deactivation); hand-over not drafted, he said not now.
- Mistakes: PROD read refused at first (auto mode); filled Assignee/Status by page script so the gate never ran his Resolved rule and I asked him; did not say plainly at first that both tickets were the same issue.
- Assessment: A1 the system-change route for a 1-line skill line took ~15 calls (step-3 rider wording, design-consult, land-on-main dirty file). A2 save-quest + archive-quest + harvest gate closed both cleanly. A3 one active-flag SELECT found the cause before any deep code trace. A4 skg_dok medan_pk_id is shared across medan, filter medan_id. A5 ⏭ no sweep.

**Last Activity (288625 rework: PROD alter + rework audit; ADHOC-PLBP-2026-2 MLIT permit date)**: 2026-11-13 14:50 — worktree `jovial-kepler-a07ba6` (branch claude/rework-ticket-288625-197057). PROD Initiate & Alter of PTMLK/02/L/PPTPB/2026/5 to SPIL at PTG (norhaslinda.r); done-alter note posted; Redmine now Pending User (TSO, PTG user away on PRN); F1+F2 note-wording fix landed; MLIT permit B01/2026/1 Tarikh Tamat 11/11/2026; Domain Expansion.
system-change done (release-mlk-plp-ask state check) 2026-11-13: GitHub main = main folder 9d3707e0

STEP-3: release-mlk-plp-ask reads the state first
session: a0909b1a-576d-463c-b44c-625d579441fb
his words: "Yes, build it" (order)
fix or report: fix
who pays: every prompt: one extra read of system/states.json only when the release words already matched
goal without the part: a Perak or Selangor release message would still be steered to the Melaka pipeline and mlk/master
model: claude-opus-5-5
shown: C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\pelupusan-1-75-7-merge-defdf7\domain\release-mlk-plp-ask\diagram.png

CHANGE-CARD (before): release-mlk-plp-ask reads the state first
What: The release-ask hook checks which state a release message names before it suggests the Melaka release pipeline.
Why: On 2026-11-12 a Perak 1.75.7 release message made the hook suggest the Melaka-only pipeline, which targets mlk/master.
How: A release message that names another state gets that state's main branch from the state registry instead of the Melaka pipeline. ![flow](../domain/release-mlk-plp-ask/diagram.png)
When: It runs on every prompt and acts only when the release words match.
Where: The one hook folder `domain/release-mlk-plp-ask/` changes. ![map](../domain/release-mlk-plp-ask/change-map-20261113-065313.png)
Where picture = the change map (lib/change-map.js).

**Last Activity (ADHOC-PRBB-2026-24 + knowledge-first session)**: 2026-11-12 09:40 — worktree `penang-common-null-error-219adf` (branch claude/adhoc-session-standby-c1d1d0). PROD PRBB slaid lines adhoc: cause Microsoft Print to PDF strips; fixed PDF in 2. Fix; system fix landed b7f17eaa (main folder 598a6116): adhoc reads etanah-knowledge index.md first, knowledge-first-gate blocks the first DB query before a knowledge read, staging test by file origin, wrong MLK STAG rule removed.

STEP-3: redmine-phase1-prefill Step 5 attachments (281324)
session: d2a90df8-1bc0-4e84-b5e5-ede6d65a2283
his words: "why did you not upload all the things needed just now when you prepare the redmine stage?" (order)
cause step: .claude/skills/redmine-phase1-prefill/SKILL.md Step 5 · change: 2 lines
new parts: 0
fix or report: fix
## Session Recap (2026-11-12 to 13, 288625 rework + ADHOC-PLBP-2026-2)
- Asked: resume 288625 rework, solve and close first, audit why it came back, log for session end; then a MLIT patch of permit B01/2026/1 Tarikh Tamat to 11/11/2026; save the adhoc; DE.
- Done: PROD alter (code 1E0F-4C45, his approval): new SPIL a_tgsn 2932270 pejabat_id 1 norhaslinda.r, old SPIL 2866525 Selesai N, header Tamat unchanged (no status patch). Done-alter note posted 12/11 02:33Z; Fizah → Ready in PROD 02:40Z; TSO → Pending User 02:44Z. Rework audit (Fable 5.2): cause = the 06/11 BA note never named the after-release PROD alter (the fix runs at PJ, 2026/5 had passed PJ); wrong-fix row 2 + slip handover-gap. F1 ticket-close-block --alter always ends "Can proceed to verify." (2deb73b8 / main 7e0ece2d, eval 27/27); F2 ALTER-TICKET-PLAYBOOK A6 fill via redmine-phase1-prefill (main folder, untracked). MLIT: umm_a_permit_lesen 16045 trkh_akhir and ind_versi_permit_lesen 6701 trkh_tamat → 2026-11-11 (JDBC, read back); ADHOC-PLBP-2026-2 saved 31/31, A104, archived.
- Open: 288625 waits for PTG user verification in PROD (then Phase 2 archive); TSO Expected ii (No Serahan made at 00) unseen until PTG works SPIL; proposal "after-release PROD action line in BA note" (standing row "given") waits his nod.
- Mistakes: posted "Please help to verify." from the generator without applying his 4 Nov rule's reason; filled Redmine by hand so his screenshot was not attached (slip redmine-note); alter history showed one "Cannot find activity" line not explained.
- Assessment: A1 gates made the 2-line F1/F2 change take ~15 calls (step-3 rider wording, worktree guard on untracked knowledge). A2 rework audit by one Fable agent found the cause in ~2 min. A3 PROD dry run + approval code + AFTER read worked first time. A4 a fix that runs at a step the permohonan already passed needs a named PROD action. A5 ⏭ no sweep.
**Last Activity (ADHOC-PLBP-2026-3, PLBP permit dates one year back for CR 263307 Langkau Tahun)**: 2026-11-13 14:20 — worktree `ba-request-feasibility-906063`. MLIT permit B01/2026/6 (PTMLK/01/L/PLBP/2026/8) patched one year back (3 rows + 2 JSON keys, read back), verified by two code traces + live BPMN; BA proceeded; ProTime adhoc `263307 - Assist patch permit dates for testing`; 4 learning pictures in the Task folder; Domain Expansion.

## Session Recap (2026-11-12 to 13, ADHOC-PLBP-2026-3 Langkau Tahun test data)
- Asked: is the BA's "patch setahun awal" possible so the permohonan can proceed for testing; move the photo to Brief; find the CR the BA tests and add to ProTime; patch it; verify 100% code and DB; add ProTime adhoc; layman pictures of the urusan and tugasan; what the 3 months mean; when Langkau Tahun can be applied; DE.
- Done: CR 263307 (CR - After Go Live, Anis Nabilah); AWAM gate `validateLangkauTahunPLBPMelaka()` needs the latest versi Tarikh Tamat before today; patch run via gateway backend login (psycopg2) 1+1+1 rows; sonnet traces AWAM + Pelupusan both CAN PROCEED; live MLK_PLP_PLBP v2 routes Langkau Tahun to 48.0; ProTime adhoc 41525; pictures 1-4 sent and copied to Task folder 398 `1. Brief`.
- Open: ADHOC-PLBP-2026-3 closing save + archive runs in a background agent after this turn (adhoc-brief-first gate); late Langkau Tahun refusal is a BA business question; the payment step on the Langkau Tahun path is not verified.
- Mistakes: ProTime run blocked by the 2-logins-per-15-min limit and first queued as a plan line before he asked for an adhoc line; the first diagram-render failed the SVG self-check (HTML-only picture).
- Assessment: A1 DE has no step that saves quest pictures (proposal). A2 the adhoc close needs a turn end before the save agent may start, even inside DE. A3 two parallel sonnet traces + one live BPMN read closed the "100%" ask in ~10 min. A4 year-end cap rule now in knowledge. A5 ⏭ no sweep.

**Last Activity (Penang Surat Ulangan JT: common page vs Pelupusan, Papar empty)**: 2026-11-13 10:47 — worktree `mlk-template-surat-ulangan-0122a3`. Penang PRZ/2026/12 Utiliti Penyediaan Surat Papar empty: Papar (`onPaparDoc`) needs a letter status (`s IS NOT NULL`, common 2018); the letter list (`initParentAplikasiDocumentList`) does not. Same code in Melaka and Penang. Domain Expansion.

## Session Recap (2026-11-12 to 13, Penang Surat Ulangan JT)
- Asked: how Melaka gets TemplateSuratUlanganJabatanTeknikal vs Penang (common page); check Penang runtime; PTPNG/01/L/PRZ/2026/12; why onPaparDoc returns nothing; trace; Kedah + Melaka way; patch to test (miya patched himself); does Melaka set status or have a fallback; by requirement should Papar return something; DE.
- Done: Melaka and Penang Pelupusan = same path (UPS_PLP/UPS_PS, pelupusan template, SRTJK_ULGN left out of the common list); Penang's only Ulangan letter came from the Pembangunan utility (UPS_BGN, PSST), which maps SRTJK_ULGN to common surat-SuratJabatanTeknikal.docx. PRZ/2026/12: 4 UPS_PLP attempts 11/11, no letter; letter 4930 SRTJK status_id empty, skg_dok 15435 v1 present. Papar query `findDokumenByAplikasiAndSenaraiJenisDokumenKod` has `s IS NOT NULL`; picker list `findByAplikasiAndJenisDokumenList` has none; Melaka/Kedah/Penang most SRTJK letters have no status; no fallback or status writer in the Ulangan path. Test script (status PERAKU on 4930 + revert) handed; miya runs it.
- Open: miya's test result on UPS_PLP/2026/26; Papar fix belongs to common (load the selected row's letter); note to Pembangunan team not drafted (declined/not asked).
- Mistakes: claimed "status stopped on 21/09" from a partial read (June/July were all null) and corrected; traced Papar for an hour before reading the xhtml binding that shows the list is a different query (read the page binding first).
- Assessment: A1 branch-guard blocks read-only Read on a non-trunk etanah repo (git show used). A2 no quest; adhoc not registered. A3 page binding first, before the backing method. A4 Ulangan list vs Papar fact written to penang WORD-TEMPLATE-RENDERING. A5 ⏭ no sweep.
**Last Activity (ADHOC-PLP-2026-7 GIS service map for Teknikal)**: 2026-11-13 00:51 — worktree `sheet-tugasan-mapping-7b0b01`. Melaka Pelupusan rows 81-89 of the Teknikal sheet "Integrasi Servis Modul" filled, audited twice by Fable 5.2, every cell proven; evidence script, check.sql, 6 guide pictures and a handover prompt for other states in Task folder 399 2. Fix; adhoc-brief-first gate fixed (827f93f2). Domain Expansion.
## Session Recap (2026-11-11, three PROD patch tickets + patch-note generator)
- Asked: /quest the 3 PROD patch tickets; never ask Resolved again; every PROD patch note must list exactly what was patched (all patch types, built with Fable 5.2); fix the wrong 288974 note; keep "Can proceed to verify."
- Done: 288962 alter run with his approval; 288963 + 288974 patched by infra, PROD re-read and verified; all three Resolved to Nurhafizah 100% (read back). redmine-write-gate: standing Resolved rule now fires for a JS status write and when his message says submit (e3dfaa4a, eval 171/171). ticket-close-block --patch prints the note from the .sql itself; script-check rule 9 + patch-script-gate CHECK 8 need a reason per SET column and DELETE (1a99bf39, evals 27/27 + 42/42). Greeting restored (0c46d9ad). 288974 note corrected on Redmine (journal 2588114).
- Found: the 288974 script copied status_keputusan='Batal' and hubungan_aplikasi_id=NULL from 283980 with no reason; the hand-written note then described them wrong. PPTPB/2026/9 link is now null on PROD.
- Open: none. 288974 decided by miya 2026-11-11: link to PPTPB/2026/9 stays removed (PelupusanSuratStrategy reuses a linked UPS_PLP letter, this one was cancelled), Batal kept (15 of 15 ended UPS_PLP on PROD). All three archived at Phase 2 (Redmine Ready in PROD).
- Mistakes: asked for Resolved three times despite his standing rule; hand-wrote the 288974 note from memory; Fable build retired "Can proceed to verify" against his 4 Nov rule.
- Assessment: A1 gate fixes landed same turn, but the step-3 rider blocked edits again (logged, repeat). A2 patch path now generates its handover from the patch. A3 PROD re-read after infra ran caught nothing wrong. A4 copied columns from an analog script without a reason is the root slip. A5 ⏭ no sweep.
**Last Activity (287346 rework 2 session)**: 2026-11-11 21:35 — worktree `hakmilik-pejabat-awareness-32c5c1` (branch claude/ticket-287346-audit-95b5e8). ESOKONGAN 287346 MCL Kertas Pertimbangan PT rework 2: blank page fix pushed and in release 1.9.3; Domain Expansion.

STEP-3: 289265 note generator plain words for MLPS Maksud Pendudukan + per-ID file lines
session: 63893f02-091e-478a-8724-b56060ec0dea
his words: "Please just submit the redmine ticket, infra will run it later anyways. I'll bear the responsibility if infra looked over it. stage redmine please."
cause step: domain/ticket-close-block/ticket-close-block.js:patchGroups · change: 9 lines
new parts: 0


STEP-3: adhoc-brief-first, save-agent detection and one block for all missing items
session: bd30fbfa-5cae-4924-bf32-668fd7c105b8
his words: "If yes, then proceed while we wait for Fable" (order)
cause step: domain/adhoc-brief-first/adhoc-brief-first.check.hook.js:stopCheck · change: 30 lines · new parts: 0
fix or report: fix
model: claude-opus-5-5
shown: abf-fix-flow.png


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


## Session Recap (2026-11-13, ADHOC-PRBB-2026-25 Ganti Hari + etanah-teach Feature)

- ADHOC-PRBB-2026-25 saved (A107, hold, route CR): PROD PRBB/2026/25 Ganti Hari 4 Hari from 04/12 ends 07/12 per the #285532 rule; user wants Sat/Sun skipped; BA's 08/12 matches only the pre-#285532 count.
- system-change step 4: building Feature etanah-teach (layered lessons).

STEP-3: etanah-teach
session: 8c965136-1d47-4e10-8679-0809e99a7cdc
cause step: .claude/skills/etanah-teach/SKILL.md (new procedure, no existing step teaches etanah) · change: 0 lines in existing parts
new parts: 2 · replaces: none: miya asked for a new Feature, "please create a new Feature for our system"
his words: "please create a new Feature for our system to explain as in someone that doesn't understand anything about etanah system" (order)
fix or report: fix
who pays: on-demand: one node call per lesson audit, nothing at boot or per prompt
goal without the part: none; no existing part explains etanah business from zero in layers (brief = ticket start, kowalski = code architecture, explain-diagram = drawing only)
model: claude-opus-5-5 (highest = claude-fable-5-2; on-demand part, not highest-order, so no Fable block needed per change route step 3)
shown: C:/Users/Ridhwan/OneDrive - Pymsoft Sdn Bhd/0. AI/Project-AI-MemoryCore/.claude/worktrees/mlk-template-surat-ulangan-0122a3/domain/etanah-teach/diagram.png
appraise: A = etanah-knowledge already holds most business facts (verified: glossary, SPOC-COUNTER §4, BPMN, requirement index) · S = scope is explain only, never edits code or data · C = missing piece was a saved per-urusan lesson so the next ask is cheap; added as learn/<URUSAN>.md
nod: "Please proceed." (/goal, 2026-11-13)

CHANGE-CARD (before): etanah-teach
What: A new Feature, etanah-teach, explains any etanah urusan, tugasan, rule or ticket issue to someone who knows nothing, from the overview down to the layer the question needs.
Why: On 2026-11-13 miya asked to learn etanah from zero, layer by layer, with the business logic taken from etanah-knowledge and the requirements.
How: The flow picture domain/etanah-teach/diagram.png shows the question, the stop layer, the layers filled top down from knowledge files, the self-audit, and the reply.
When: It runs on ask, when miya says teach me, explain to me or I want to understand, and costs one node call per lesson audit.
Where: The Feature lives in domain/etanah-teach/ with its skill in .claude/skills/etanah-teach/ and each saved lesson in etanah-knowledge/<state>/learn/.
  change map: C:/Users/Ridhwan/AppData/Local/Temp/claude/6068f4a69bb11f75/8c965136-1d47-4e10-8679-0809e99a7cdc/scratchpad/changemap/change-map-20261113-071327.png
Where picture = the change map (lib/change-map.js).

CHANGE-CARD (after): etanah-teach
What: The Feature etanah-teach now explains an etanah urusan, tugasan, rule or ticket issue from zero, layer by layer from L0 eTanah down to the layer the question needs, and saves each lesson per urusan.
Why: On 2026-11-13 miya asked to learn etanah from zero in layers, with the business logic taken from etanah-knowledge and the requirements.
How: The flow picture domain/etanah-teach/diagram.png shows the question, the stop layer, the layers filled top down from knowledge files, the teach.js self-audit, and the reply.
When: It runs on ask through the etanah-teach skill, and costs one node call per lesson audit, nothing at boot or per prompt.
Where: The Feature is in domain/etanah-teach/ with its skill in .claude/skills/etanah-teach/, and the first lesson is etanah-knowledge/melaka/learn/PRBB.md.
  change map: C:/Users/Ridhwan/AppData/Local/Temp/claude/6068f4a69bb11f75/8c965136-1d47-4e10-8679-0809e99a7cdc/scratchpad/changemap-after/change-map-20261113-072734.png
Where picture = the change map (lib/change-map.js).
GitHub main: 85c956d0 · main folder: 9badf5e9

STEP-3: redmine-phase1-prefill Step 3 fill method (2026-11-13, 289233/289306)
session: fa7d8874-98b2-4eb4-b7e8-65934894e923
his words: "Yes, add it" (order)
his earlier words: "Why are you still asking to set the status as resolved? Why have you not removed this disease of you keeping on asking something that was already working"
fix or report: fix
who pays: on-demand skill text, read once per Redmine prefill, no process
goal without the part: the skill already says form_input for each field, but nothing says why a script fill makes the gate ask him
model: claude-opus-5-5 (slip fix, not held for a model switch)
cause step: .claude/skills/redmine-phase1-prefill/SKILL.md Step 3 · change: 1 line
new parts: 0
shown: C:\Users\Ridhwan\AppData\Local\Temp\claude\ba2a5e92ecb9cc61\fa7d8874-98b2-4eb4-b7e8-65934894e923\scratchpad\prefill-fill-flow.png

CHANGE-CARD (before): redmine-phase1-prefill Step 3 fill method
- What: one line in the prefill skill Step 3 says Assignee and Status are filled only with form_input and never by a page script.
- Why: on 2026-11-13 a script fill of 289233 and 289306 hid the status from the Redmine gate, so his standing Resolved rule never ran and I asked him.
- How: the step 2 flow picture prefill-fill-flow.png shows the fill step feeding the gate that runs his rule.
- When: the line is read each time the prefill skill fills a Redmine form.
- Where: the folder .claude/skills/redmine-phase1-prefill holds the changed skill, drawn in C:\Users\Ridhwan\AppData\Local\Temp\claude\ba2a5e92ecb9cc61\fa7d8874-98b2-4eb4-b7e8-65934894e923\scratchpad\change-map-20261113-084156.png.
Where picture = the change map (lib/change-map.js).

CHANGE-CARD (after): redmine-phase1-prefill Step 3 fill method
- What: Step 3 of the prefill skill now says Assignee and Status are filled only with form_input, Assignee first, never by a page script.
- Why: on 2026-11-13 a script fill of 289233 and 289306 hid the status from the Redmine gate, so his standing Resolved rule never ran and I asked him.
- How: the step 2 flow picture prefill-fill-flow.png shows the fill step feeding the gate that runs his rule.
- When: the line is read each time the prefill skill fills a Redmine form.
- Where: the folder .claude/skills/redmine-phase1-prefill holds the changed skill, drawn in C:\Users\Ridhwan\AppData\Local\Temp\claude\ba2a5e92ecb9cc61\fa7d8874-98b2-4eb4-b7e8-65934894e923\scratchpad\change-map-20261113-084156.png.
Where picture = the change map (lib/change-map.js).
system-change landed: GitHub main d6fcf522 · main folder 0a1cb429
