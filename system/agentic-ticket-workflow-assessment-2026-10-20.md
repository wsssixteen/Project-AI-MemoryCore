# Agentic ticket workflow assessment — 2026-10-20 (session permohonan-stg2-stg1-issue)

| Axis | Instance this session | Assessment |
|---|---|---|
| A1 agentic system | `lib/audit-briefing.js --days 7` printed "0 hook fires · 0 turns" while ticket-gate, alter-ticket-gate and five Stop hooks visibly fired this session | The audit reads an empty telemetry source; every "never fired" row in its NOT WORKING block is unproven. The RETIRE list it hands miya must not be acted on until the source is fixed. |
| A1 agentic system | DB gateway on 127.0.0.1:7411: task "running", listener dead (`OSError: [WinError 64]`), `schtasks /run` alone did nothing | The memory fix line (`schtasks /run`) is not enough when the task is alive but its socket died; `/end` then `/run` restored it. The session's MCP tools stayed failed after the restore. |
| A2 quest workflow | Test permohonan PTMLK/02/L/MLPS/2026/6 handed back; it moved to the next tugasan before miya used it | The hand-back gate checks the login exists, not that the row is still at the tugasan at hand-back time. |
| A3 debugging | stg1 vs stg2 stuck question answered from ENV-ARCHITECTURE §4a + DEV-TESTING-HACKS in minutes, then counted | Knowledge-first worked: the mechanism was already written. Only the count was new. |
| A4 etanah issue-solving | Same permohonan id = two different permohonan on stg1 and mlit | A test-data line that names only the id is ambiguous across envs; the env must travel with it. |
| A5 sweep | ⏭ no multi-ticket sweep this session | — |

Proposals logged (`core/slips.js --type proposal`): A1 telemetry source · A1 gateway health probe · A2 re-read at hand-back · A4 env on every test-data line.

## Session verify-issue-265109-fixes (#265109 takeover review)

| Axis | Instance this session | Assessment |
|---|---|---|
| A1 agentic system | MLIT MCP link died after a gateway restart; I called it "DB refuses connection" | the gate caught the false claim, but nothing tells the session its MCP link (not the DB) is the dead part |
| A2 quest workflow | save-quest said KEEP-DELEGATED for a ticket we had taken over (block still `delegated_to=Ammar`) | the takeover step in the quest skill never flips `status=delegated` back, so the resolver gives the wrong verdict |
| A3 debugging efficiency | colleague commit = int-env-only commit 67dda807e2 copied + new work; found by diffing both | worked, but it was found by hand; a tool could list "this commit repeats commit X" |
| A4 etanah issue-solving | ticket-close-block.js guessed `mlk/qa/265109` (old branch) and printed a wrong git block | branch guess ignores `active.txt branch=`; `--branch` fixed it |
| A5 sweep | audit-briefing run from a worktree read 0 hook fires and flagged 80+ live hooks as "never fired" | telemetry lives in the main checkout; the worktree run is a false alarm |
## Session ticket-285171-goal-quest (2026-10-19 → 2026-10-20)

| Axis | Finding (instance) | Proposal |
|---|---|---|
| A1 agentic system | `lib/audit-briefing.js` run from this session folder printed "0 hook fires · 0 turns" (telemetry is only in the main folder); from main it needs over 160 s | read main's telemetry from a worktree (logged) |
| A2 quest workflow | a held quest's "groundwork in QA-282303.md" note was never written there; the code lived only in a 507-message transcript | ⏭ already covered: hold step 4 resume-readiness check; this hold predates it being run |
| A3 debugging | "1.10.5 has the API" was stated from master source + compile; the jar proved it only after miya asked | jar-check advisory (logged) |
| A4 etanah | "REPORT-API watermark" = the "(REPORT API)" title prefix, not an image; BA screenshots confirm | ⏭ fact written to QA-285171.md Ship — Verify |
| A5 sweep | ⏭ no sweep or file sweep ran this session | — |

## Session melaka-staging-flowable-perf (ADHOC-PRBB-2026-15)

| Axis | Instance this session | Assessment |
|---|---|---|
| A1 agentic system | `adhoc-brief-first` blocked a read-only `adhoc-save-audit.js` run after the save agent reported, so the "audit N/N PASS" line could only be relayed, not re-checked | The gate treats the audit (a read) like a save write; the skill's own step 4 asks for that re-check. |
| A2 quest workflow | Briefed "one bad JVM, restart helps" before asking for the error text; miya's screenshot overturned it within minutes | For a "slow / fails" ask on a screen, the page error is the cheapest falsifier and should be asked for (or read from the log) before any inference. |
| A3 debugging | Id-block gap reasoning (block 14130001 had 0 committed rows) looked strong but explained nothing the FK error did not | Side-channel evidence is a hypothesis; marked as such too late. |
| A4 etanah issue-solving | FK `act_fk_task_exe` on Alter Flow = stale `act_ru_execution.task_count_`; 3 live executions affected; Initiate & Alter works | Written to FLOWABLE-KNOWLEDGE §20 + LATENT-BUGS L25. |
| A5 sweep | ⏭ no multi-ticket sweep this session | — |

Proposals logged: A1 audit-read exemption in adhoc-brief-first · A2 ask for the page error before a "slow/fails" diagnosis.
