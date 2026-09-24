# db-claim-proof

symptom: 2026-09-24 #281392: miya - you failed again on your global rule, you claimed but did not provide script
goal: every DB fact miya reads arrives with the SELECT he can run to verify it
goal_signal: reply after a DB-query turn contains a SELECT ... FROM block
retention: rotate monthly

**What fires when**: Stop — reply ends a turn that ran a DB query tool (postgres/oracle query_database) and states findings

**Contract**: block unless the reply carries the proving SELECT (SELECT ... FROM) or a bypass with a real reason

**Layer choice (Rule 7)**: hook-only. Presence of a SELECT after a DB query is mechanical; the rule already lives in `feedback_show_evidence_script_or_code` and failed as prose.

**Trigger moment (Rule 8)**: Stop, only on turns whose own tool_use list holds a `mcp__postgres*/oracle*__query_database|count_rows` call — the reply is the moment the fact reaches miya.

**Observability**: `domain/db-claim-proof/log.jsonl`, one row per fire — `ts · tools (DB calls this turn) · outcome (pass|blocked|bypassed)`. Replay on the #281392 session transcript: 12 DB turns, 10 would have blocked (first = the DMMLMS claim). Eval: 20 fixtures, 22 adversarial scenarios.

**state-scoped**: no, state-agnostic — matches every postgres-* and oracle-* MCP.
