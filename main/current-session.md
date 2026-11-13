system-change step 4 (release-mlk-plp-ask state check) — nod given 2026-11-13: "Yes, build it"

STEP-3: release-mlk-plp-ask reads the state first
session: a0909b1a-576d-463c-b44c-625d579441fb
his words: "I saw you summon mlk's /mlk-release-... but still managed to do it correctly, I am worried this will be an issue in the future, can you audit and check." (order)
fix or report: fix
who pays: every prompt: one extra read of system/states.json only when the release words already matched
goal without the part: a Perak or Selangor release message would still be steered to the Melaka pipeline and mlk/master
model: claude-opus-5-5
shown: domain/release-mlk-plp-ask/diagram.png

CHANGE-CARD (before): release-mlk-plp-ask reads the state first
What: The release-ask hook checks which state a release message names before it suggests the Melaka release pipeline.
Why: On 2026-11-12 a Perak 1.75.7 release message made the hook suggest the Melaka-only pipeline, which targets mlk/master.
How: A release message that names another state gets that state's main branch from the state registry instead of the Melaka pipeline. ![flow](../domain/release-mlk-plp-ask/diagram.png)
When: It runs on every prompt and acts only when the release words match.
Where: The one hook folder `domain/release-mlk-plp-ask/` changes. ![map](../domain/release-mlk-plp-ask/change-map-20261113-065313.png)
Where picture = the change map (lib/change-map.js).

**Last Activity (ADHOC-PRBB-2026-24 + knowledge-first session)**: 2026-11-12 09:40 — worktree `penang-common-null-error-219adf` (branch claude/adhoc-session-standby-c1d1d0). PROD PRBB slaid lines adhoc: cause Microsoft Print to PDF strips; fixed PDF in 2. Fix; system fix landed b7f17eaa (main folder 598a6116): adhoc reads etanah-knowledge index.md first, knowledge-first-gate blocks the first DB query before a knowledge read, staging test by file origin, wrong MLK STAG rule removed.

## Session Recap (2026-11-11 to 12, ADHOC-PRBB-2026-24 slaid bergaris + knowledge-first fix)
- Asked: /quest adhoc PROD PRBB PTMLK/02/L/PRBB/2026/9 slide lines and not HD; fix the PDF and ask infra; test scenario; save the adhoc with my mistakes; Fable 5.2 audit then proper system change; answer BA Mira on Print to PDF; settle the fix by step-by-step popup questions (wayfinder method); then DE.
- Done: cause = PDF made with Microsoft Print to PDF (photos as strips, pdf.js seams); fixed PDF + .main in Task folder 2. Fix; BA reply on Print to PDF; qa_doc saved with M0-M12; Q1-Q12 agreed by popup; Fable audit found adhoc flow reads knowledge last and the knowledge gate ignores DB queries; build landed b7f17eaa (evals 27/27, 20/20, patch-mlk-doc PASS).
- Open: miya's stg1 upload test on PTMLK/02/L/PRBB/2026/19 (no infra, no DB patch, no script); MLK PROD infra replace of LAIN-37579215_1.main (no script); reply to BA after the test; knowledge-first-gate live fire not seen yet (watch row); knowledge-first-gate has no README (old gap).
- Mistakes: 0 etanah-knowledge files read on the adhoc; test type not said upfront; asked miya to fetch the file; wrote a wrong MLK STAG rule without audit; stretched his "answer BA first" into a rule about the first output; step-3 rider took a popup quote as his words.
- Assessment: A1 step-3 rider cannot pass a turn that quoted a popup answer (blocker logged). A2 adhoc flow now loads knowledge first. A3 a DB-first trace is now stopped before knowledge. A4 KEMASUKAN/KELUARAN meaning now in DATABASE.md. A5 ⏭ no sweep this session.

**Last Activity (Baseline 1.9.3 + 288625 session)**: 2026-11-11 22:30 — worktree `redmine-issue-288622-19563d`. Release 1.9.3 pushed twice (f29b747ef1 with 287346 b273c6b63a), BA passed, MR !19 (reviewer Yih Kit) open, stag-env caught up a1e3464244; 288625 PROD alter route tested on stg1; release script B1-B3 landed (52ea6814); Domain Expansion.

## Session Recap (2026-11-11, Baseline 1.9.3 + 288625 alter route + release script)
- Asked: deploy Pelupusan 1.9.3; then why the card was wrong and a fix; answer Fizah on 288625 (alter, re-sign, keep dates, which user); add 287346 b273 to the release; MR after BA pass; add Yih Kit; build B1-B3; DE.
- Done: 1.9.3 pushed (5b6d89d20e, then f29b747ef1 with b273), compiled, flowable listed, BA passed; MR !19 created, read back, reviewer Yih Kit (@cheowyihkit, Developer on GitLab); stag-env a1e3464244. 288625: stg1 Initiate & Alter straight to 41.0 Endosan > INTEGRASI > SPIL with pejabatKod=00 + pejabatHakmilik=00 PASS (no Pengesahan, no new Borang, no re-sign). Release script: push prints the card, card command, add-ticket after push, reviewers from config; eval 40/40; landed 52ea6814.
- Open: 288625 PROD Initiate & Alter tomorrow, after the 1.9.3 flowable is on PROD and 288625.sql ran: same three targets and two variables as the stg1 run, assignee norhaslinda.r@melaka.gov.my, dry run first, then his approval code. MR !19 waits for Yih Kit (merge rights on mlk/master not verified); then merge-to-master check.
- Mistakes: card typed from memory (wrong order, Domain/DB missing); answered "which date changes" instead of a way to keep the date; stg1 default assignee picked a PUU officer; hand-edited release state (now a script path).
- Assessment: A1 release card + post-push re-merge are now script steps. A2 the alter answer reached the right route only after his push. A3 stg1 rehearsal of the PROD alter found the assignee gap before PROD. A4 PPTPB endorsement routing by title category is now fixed in code and model. A5 ⏭ no sweep.
**Last Activity (PROD patching tickets session)**: 2026-11-11 21:34 — worktree `jovial-kepler-a07ba6` (branch claude/prod-patching-tickets-11e7ee). Three Melaka PROD patch tickets done and Resolved to Fizah: 288962 alter OPLPS/2026/2 to Borang 4Ae/L1e, 288963 MLPS/2026/12 Tempat PT 2 to SEK II + pelan L1e swap, 288974 UPS_PLP/2026/15 tamatkan. Quests closed; Phase 2 waits for Redmine Closed. Domain Expansion.

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
