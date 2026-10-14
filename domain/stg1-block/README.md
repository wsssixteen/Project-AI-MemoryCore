# stg1-block

symptom: miya 2026-10-14: 'I thought I already asked you to add a note to remember we are not using stg1' then '/goal fix your self why such a simple instruction needs so many times'
goal: no stg1 query runs unless miya asked for stg1 in that message
goal_signal: every stg1 tool call in a turn where miya did not name stg1 is refused with the stg1-block message
retention: rotate monthly
footprint: per-tool: 1 node process only when a stg1 tool is called, under 50 MB, ends at once

**What fires when**: PreToolUse — a tool call to the stg1 database (mcp__postgres-mlkstg1-pg__*)

**Contract**: BLOCK unless miya's own latest message names stg1

**Layer choice (Rule 7)**: TODO(forge): hook-only | skill-only | hook+skill — justify.

**Trigger moment (Rule 8)**: TODO(forge): justify this is the LEANEST trigger.

**Observability**: every fire appends to `domain/stg1-block/log.jsonl` — TODO(forge): state what each line carries so an audit can read the fire history.

**state-scoped**: TODO(forge, Rule 11): `yes, keyed by <X>` | `no, state-agnostic`.
