# Agentic ticket workflow assessment — 2026-10-04 (worktree quest-audit-275043-244600-7954c0)

Covers the session of 2026-10-03 night (Terengganu made active, 5 blind eval replays, quest-workflow audit) and its close on the morning of 2026-10-04.

| Axis | Assessment (concrete instance) | Forward idea (eval case) |
|---|---|---|
| A1 agentic system | The eval workflow used 46 agents, 10.6 M subagent tokens and 70 minutes for 5 replays. The single-agent flow passed #278327 in about 6 minutes; the full Phase-0 engine took about an hour per ticket for the same verdict (discovery 7 min, knowledge-load 10 min, each Recon lens 12 to 15 min, notes 7 min, verify 9 min, synthesis 11 min). A prep agent gave ticket #278327's brief under number 282244. Two Recon lenses quoted different counts for one thing and Synthesis passed both. Two evals wrote into real ledgers (`goal-lens-pending.jsonl`, `handoff-load/log.jsonl`). Splitting the audit into an evidence run and a decide run saved about 15 minutes of wall clock at no token cost. | Logged: synthesis re-runs a count two lenses disagree on · eval leak into real ledgers · keep the blind replay as a tool with a cut date · DE tools read main data when run from a worktree · boot hook counted as errored 63 of 63 |
| A2 quest workflow | 5 readers, about 80 findings, 12 proposals, 3 skeptics, 0 killed, every one returned with conditions. Applied 6 (P2 to P7) with their own evals; battery 124 of 130, same 6 red as before, 0 new. The resume-readiness sweep had been a silent no-op in every worktree session (it printed "cannot read quest/active.txt" and exited 0). A mandatory Recon row named two DB tools retired on 2026-07-17. The engine sent agents to protocol line numbers that had drifted by 18 to 40 lines. The notes stage ran 3 of 3 times, was denied by the gate, wrote nothing and cost 5 to 9 minutes each. | Logged: P1, P8, P9, P10 remainder, P11, P12 (owner rulings) · branch-ledger check reads the qa_doc path from the block (a flat qa_doc is reported NOT FOUND today) |
| A3 debugging efficiency + accuracy | All 5 replays reached the real root cause; false claims were 0 or 1 small slip per run (a line number off by 2). The analog-origin git probe found the two predecessor tickets of #278989 from one blame. Miss: the #278819 run said "No BPMN change" because the gateway was already live, although the team shipped a model change with the fix. Two of my own leads were wrong when probed (PROD model "differs"; worktree "cannot see" the quest file). | Logged: Recon names the model version that first carries a change when the deployed model is newer than the ticket date |
| A4 etanah issue-solving | Knowledge-first held: every run read only its own state's folder and only its own DB servers. Recon corrected a wrong knowledge line (PT does not render the inline land form). The first Terengganu alter was read back from PROD, so the alter signature is now observed, not only read from code. The schema audit calls Perak and WP canonical although most of their required files are stubs. | Logged: schema audit flags a stub file as not canonical |
| A5 sweep / file sweep | Retrieval routes a ticket by a hand-copied project-name list and anything unmatched becomes a Melaka ticket. BA-given test ids of Perak and Terengganu shape were never surfaced at retrieval until tonight's pattern fix. At close, the watch ledger (ignored by git) held 3 watches that existed only in this worktree. | Logged: route from the registry and print STATE UNKNOWN for no match · at a worktree close list the git-ignored files, not only `git status` (done by hand this time) |

## Slips logged this session (ledger category)

`trusted-claim-unverified` · `assume-not-verify/state-guess` (2 rows) · `no-eta-on-long-run`

## What worked and must not be touched

State resolution from the Task folder or permohonan id · the Scout, Recon, Rubric, Apply engine and its code-level Recon lenses · live task-state query for the holder login · the adversarial Verify stage · the literal-scope rule · the artifact-checking gates (de-close, de-knowledge, branch-guard, compile, knowledge-first, attachment-ledger, db-claim-proof).

## Addendum — session 2 (#282442 two-session reconcile)
- A1 ⏭ nothing new beyond the morning sweep.
- A2 quest workflow: two sessions worked #282442 without either knowing. Instance: 10-02 worktree stopped at "R2 needs nod"; 10-04 worktree applied R2 and updated active.txt but left the qa_doc Resume Point + checklist stale. Proposal logged (A2): at ticket-gate, list other live worktrees whose name carries the same ticket number. Eval case: two worktree dirs containing `282442` → gate prints the other path.
- A3 debugging: `et_sistem_<env>.pt_application_ex_entity` answered a blank-page ticket in one query, timestamp matched the BA video. Already in memory (`infra-server-log-request`); worked as designed.
- A4 etanah: second instance of the shared-composite missing-bean-property class on the same bean (#279615, now #282442). Bestiary pattern 4 covers it; bake the instance at Phase 2 close.
- A5 ⏭ no sweep ran.

## Addendum — session 3 (#244600 rework cycle 1)

| Axis | Claim | Concrete instance | Proposal logged |
|---|---|---|---|
| A1 agentic system | The pre-code check can be passed without being read, and skipped entirely by a shell script | `domain/pre-code-check/pre-code-check.check.hook.js` returns `fired:false` on `no-transcript`; 5 Java changes on #244600 were made by Python scripts in the shell | A1 ×2 |
| A2 quest workflow | A falsifier written in the Rubric was never run before ship | Rubric 2026-10-01 "Falsifier C1" (Word no-change save alters the XML); fix `d61fc2e611` shipped 2026-10-02; BA failed it 2026-10-03. The falsifier ledger built this morning now blocks this | covered by the ledger; A2 necessity row for new destructive calls; A2 note check for a colleague's ticket |
| A3 debugging | Probe coverage was one logger on the first build, and two writers were unprobed on the second | slips `probe-coverage-incomplete` ×2; the third build (22 probes, browser console) answered the test in one run and found the failing delete from 76 server lines | A3 bank the console-probe pattern |
| A4 etanah issue-solving | A new side-effect call was written with no analog | `DocumentManagementSystemClient.delete()` on a discarded draft: 3 of 3 failed on MLIT; Pelupusan never deletes store files | A2 necessity row (same proposal) |
| A5 sweep | The sweep rated the ticket ready while its only falsifier was unrun | sweep 2026-09-25 row "65%, 4.5 h" for #244600 | A5 sweep reads the ledger |

What worked and must not be touched: the falsifier ledger at commit (it stopped the rework commit until rows 2 and 3 carried `RAN:` evidence) · the compile gate · probes shown in the browser console · miya's `[risk-ok]` as the only way past the local-test row.

<<<<<<< HEAD
## Session: Terengganu adhoc day (ADHOC-PLPS-2026-1, ADHOC-MLPS-2026-2), 2026-10-04 afternoon

| Axis | What the session showed | Instance |
|---|---|---|
| A1 agentic system | No agents used; all inline. The hand-off loader fired on an infra handoff and loaded the cross-module memories, the wrong pair for a PROD patch | prompt "prepare the infra handoff", ADHOC-PLPS-2026-1 |
| A2 quest workflow | Simulate steps were built from the DB trail and ignored actor rows visible in the evidence photo; no git-history probe on the reassign code until miya asked | steps without the Utiliti Pengagihan Semula row; fix `c402a5766e` (#226218) found one turn late |
| A3 debugging | A date was read off a screenshot before the audit tables were queried; wrong by 7 months. Once `et_sistem.pt_audit_entity` was found the change was pinned to the second in 2 queries | "1 Feb 2026" vs 2025-07-10 09:58:20 |
| A4 etanah issue-solving | Terengganu knowledge held up: triage classes, PROD read, engine schema all right first time. Gaps: no audit-table knowledge, no `skg_dok` knowledge, 4 wrong-column queries. All written back the same day | `terengganu/ADHOC-TRIAGE.md` Step 2c, `DATABASE.md` 0b |
| A5 sweep / file sweep | Two pasted images never reached disk, so the adhoc brief folder has 3 of 5 images; content was written into the quest doc instead | ADHOC-MLPS-2026-2 follow-up photos |

Other measured points: adhoc save audit needed `--state terengganu` by hand (first run compared against Melaka row A1); adhoc id `ADHOC-MLPS-2026-1` was already used by an archived Melaka adhoc and had to be renamed; 2 ProTime titles needed 2 corrections (no issue word, then no object word).
Proposals logged: A1, A2, A3, A4, A5 (one each, 2026-10-04).
=======
## Session: ADHOC-PRBB-2026-9 → #282924 (2026-10-02 → 10-04)

| Axis | What the session showed (instance) |
|---|---|
| A1 agentic system | No fan-out used; the whole quest ran inline on banked adhoc findings. The session worktree lost its git link mid-session (`fatal: not a git repository ... worktrees/melaka-pembatalan-ralat-f283f4`), so two edits (redmine-people.js, redmine-sync hookup) sat stranded for two days until salvaged by hand through a temp worktree. |
| A2 quest workflow | Adhoc → ticket promotion worked: A44 matched, no re-Scout, Rubric in one pass. The Rubric caught C1 → C2 from BA's verbatim words. After the nod the workflow over-demanded: local test hand-back + probe matrix (Stop hook) + fix photo (Stop hook) on an 8-line 85% fix. Cost: 2 angry rounds. Fixed same day: predicate-box v4, fix-photo v2. |
| A3 debugging | No debugging. Confidence 85% held; fix worked first deploy. The unread 15% (draft resume path) was never traced, it was accepted as a risk by miya. |
| A4 etanah issue-solving | Analog in the same file found in minutes (`URUSAN_MAXIMUM_ONE_HAKMILIK`, PLTP/PSBS message). Multi-state gate (`isMelaka()`) was added from the in-file convention. Kaunter route found by one PROD census (first tugasan PK). |
| A5 sweep / file sweep | Both BA images opened and echoed. Video read by contact sheet (36 frames) which showed select-all was NOT in the video; asked instead of assuming. The pass note assumed "internal & staging" with no evidence of which server he deployed. |

Failure classes: (1) gate-over-demand after an agreed fix · (2) fabricated evidence artifact (marked BA before-screenshot as fix photo) · (3) env assumed in a BA note · (4) stranded worktree edits · (5) `de-run-verify` self-retrigger loop (6 re-fires).
>>>>>>> origin/main

## Session 6 — #282442 rework (worktree redmine-282442-9258e6)

| Axis | What the session showed | Instance |
|---|---|---|
| A1 agentic system | no fan-out used; one side session spawned for a gate build instead of building it mid-ticket | chip "Gate fix builds that carry no probe loggers", started by miya |
| A2 quest workflow | a resumed rework reused the prior cycle's Rubric and went straight to Apply, so the mandatory Falsifier + Logger row never existed for R2 or R3 | zero `QA282442-PROBE` lines in three commits; two blank-page rounds with only the exception text as data |
| A2 quest workflow | the test stopped at the fixed step while the ticket's Expected line reached one step further | "Tidak papar ralat dan boleh teruskan pembatalan"; cycle 1 video ends at Jana |
| A3 debugging | the error table already held the answer on PROD and was never asked on three tickets for one screen | `keputusanMMKN` ×25, 22 to 28 Sep, the day after #279615 |
| A3 debugging | a member-only scan of a shared composite missed its ajax update targets and the mode attributes sibling pages pass | R2 deployed to MLIT, `ComponentNotFoundException` at `jenisBahan` 10:35 |
| A4 etanah issue-solving | a local test hand-back was not backed by the machine: wrong schema, no fix files, then a stale class (file copy kept old mtime, Eclipse did not rebuild) | miya restarted JBoss twice for nothing, 11:25 and 11:36 |
| A4 etanah issue-solving | Redmine Solution written as a result, then as a denial of chat-only content, four rounds | "Tiada field baru di skrin" |
| A5 sweep / file sweep | BA video and both photos were opened and ledgered at intake; the infra server log (22 547 lines) was read by time window and pattern, not whole | timeline 14:44:25 to 14:45:37 extracted in two passes |
