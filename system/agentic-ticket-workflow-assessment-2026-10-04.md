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
