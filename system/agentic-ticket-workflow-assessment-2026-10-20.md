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
