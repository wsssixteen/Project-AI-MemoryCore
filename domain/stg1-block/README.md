# stg1-block

symptom: miya 2026-10-14: 'I thought I already asked you to add a note to remember we are not using stg1' then '/goal fix your self why such a simple instruction needs so many times'
goal: stg1 is never used to find a root cause or prepare test data/scenarios without asking miya; a read of data that already lives only on stg1 is allowed and announced
goal_signal: every stg1 tool call gets the reminder (announce 'Read from stg1: ...'); write-like SQL is refused unless miya names stg1
retention: rotate monthly
footprint: per-tool: 1 node process only when a stg1 tool is called, under 50 MB, ends at once

**What fires when**: PreToolUse — a tool call to the stg1 database (mcp__postgres-mlkstg1-pg__*)

**Contract** (narrowed 2026-10-14, miya ruling): the ban covers (a) finding a root cause and (b) preparing test data / a test scenario. It does NOT cover reading data that already lives only on stg1 (example: 5 permohonan the BA created on staging, needed for Flowable links). The hook ALLOWS a read and injects the reminder: announce it in the reply as 'Read from stg1: <what and why>'. It BLOCKS write-like SQL (INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE/CREATE/GRANT/REVOKE/MERGE) unless miya's latest message names stg1. It cannot see intent, so case (a)/(b) stays a rule for the reply, not a block. env-switch --to stg1 still needs --miya-asked.

**Layer choice (Rule 7)**: TODO(forge): hook-only | skill-only | hook+skill — justify.

**Trigger moment (Rule 8)**: TODO(forge): justify this is the LEANEST trigger.

**Observability**: every fire appends to `domain/stg1-block/log.jsonl` — TODO(forge): state what each line carries so an audit can read the fire history.

**state-scoped**: TODO(forge, Rule 11): `yes, keyed by <X>` | `no, state-agnostic`.

