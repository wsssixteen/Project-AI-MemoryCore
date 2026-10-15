# stg1-block

symptom: miya 2026-10-14: 'I thought I already asked you to add a note to remember we are not using stg1' then '/goal fix your self why such a simple instruction needs so many times'; 2026-10-15: 'We have switched back to stg1 ... make it mechanical. Like a turn on/off or switch'
goal: the Melaka staging schema that is switched OFF is never used to find a root cause or prepare test data/scenarios without asking miya; a read of data that already lives only there is allowed and announced
goal_signal: every tool call to the OFF schema gets the reminder (announce 'Read from <schema>: ...'); write-like SQL on it is refused unless miya names it; the ON schema is silent
retention: rotate monthly
footprint: per-tool: 1 node process only when a staging DB tool is called, under 50 MB, ends at once

**The switch**: `system/melaka-env-state.json` `melaka_staging_schema` names the ONE staging schema that is ON. Only miya's own switch phrase changes it ("switched back to stg1", "switch to stg2"), via `domain/staging-schema-tracker`. Every reader follows it: this hook, `quest/env-switch.js` (refuses `--to` the OFF schema without `--miya-asked`), and the note on every env prompt (`banned_note`, rewritten at each switch). Unreadable or unknown value = stg2 ON (the rule before the switch existed).

**What fires when**: PreToolUse — a tool call to either staging database (`mcp__postgres-mlkstg1-pg__*` = stg1, `mcp__postgres-mlkstg-pg__*` = stg2). The ON schema returns at once.

**Contract** (narrowed 2026-10-14, switch added 2026-10-15): the ban on the OFF schema covers (a) finding a root cause and (b) preparing test data / a test scenario. It does NOT cover reading data that already lives only there. The hook ALLOWS a read and injects the reminder; it BLOCKS write-like SQL (INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE/CREATE/GRANT/REVOKE/MERGE) unless miya's latest message names that schema. It cannot see intent, so (a)/(b) stay a rule for the reply, not a block.

**Layer choice (Rule 7)**: hook-only. The trigger is a tool call, which a hook sees exactly; no procedure needs a skill.

**Trigger moment (Rule 8)**: PreToolUse on the two staging DB tools only, the moment the schema is touched.

**Observability**: fires are recorded by the shared hook runtime telemetry (`lib/hook-runtime.js`).

**state-scoped**: yes, Melaka only (the two Melaka staging schemas; another state's staging switch would be its own state file).
