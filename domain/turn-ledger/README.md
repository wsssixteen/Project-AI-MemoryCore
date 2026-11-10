# turn-ledger

symptom: 2026-09-04 miya: 'you still haven't answered the monitoring part' — no ledger can say which quest/phase a block served, whether it was true or false, or what a turn cost (reply-log = rhythm only)
goal: a feature that blocked a turn is judged against its goal_signal_regex without model input, and the judgment is a row in that feature's goal-log.jsonl
goal_signal: after a Stop that blocked a feature with a goal_signal_regex, that feature's goal-log.jsonl has a row for the turn
retention: keep
footprint: none: a library required in-process by domain/turn-log's Stop hook; it registers nothing and runs no process of its own
boundary: covers the bypass-token parse, the user signal, the goal lens and the wrong-fix advisory of one turn · never writes a turns file, a ledger or a pending queue · stops when a README has no goal (no verdict is invented)

**2026-11-10 (turn-log, stage 8 of the over-complexity audit)**: the WRITER moved to domain/turn-log. The Stop hook this folder once held (`turn-ledger.check.hook.js`) is now `turn-ledger.js`, a library with no entry point: `system/telemetry/turns.jsonl`, `domain/turn-ledger/log.jsonl` and the `goal-lens-pending.jsonl` parking are no longer written. What stayed here is judgment, not logging: `parseBypasses`, `userSignal`, `goalLens`, `advisoryLines`.

**Layer choice (Rule 7)**: library. Its caller is one Stop hook; a second registration would read the transcript twice.

**state-scoped**: no, state-agnostic.

**Rollback**: see NUKE-MARKER.md. `git mv domain/turn-ledger/turn-ledger.js domain/turn-ledger/turn-ledger.check.hook.js` and restore its Stop registration; the old logs on disk are untouched.
