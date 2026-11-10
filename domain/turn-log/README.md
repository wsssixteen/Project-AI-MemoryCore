# turn-log

symptom: miya 2026-11-06: "I can bet my life that you've failed to reach the goal of what I told you on what I expect of Monitoring and Observability. You wont have enough data logged."
goal: every audit question (what did he ask, what did I understand, what did I choose, what did it cost) is answered from one file in one query
goal_signal: after a Stop, system/telemetry/turn-log/<machine>-<YYYY-MM>.jsonl holds a turn row whose turn_id equals the open stamp turn_id, and node lib/events.js --turn <id> prints it with his words
retention: rotate monthly
prune_after: turn-log month files 180 days · hook-fires month files 30 days (lib/housekeeping.js pruneByMonth, Domain Expansion step 12.5 and the system audit)
footprint: per-turn: runs inside the one existing Stop registration (no new process, replaces the turn-ledger registration); one bounded backward read of the transcript (48 MB cap, normally under 2 MB), about 30 MB RAM, one append per turn
boundary: covers the turn, tool and slip rows of this machine and the acting hook rows in system/telemetry · never blocks a turn, never edits another part's log, never reads outside the transcript and the telemetry folder · stops when a write fails (fail-open, row dropped, report only)
self_audit: every Stop reads its own turn row back from the month file (same event_id); a miss writes one fail row to domain/turn-log/log.jsonl; `node lib/events.js --audit` prints the share of turns with an ask, a model, a ticket, a restated ask and a cause step, and exits 1 on a turn row without turn_id
diagram: domain/turn-log/diagram.png
replaces: (1) system/telemetry/hook-fires*.jsonl quiet rows and the shared file name (acting rows only, per-machine month files) · (2) system/telemetry/turns*.jsonl (the turn-ledger Stop writer) · (3) domain/turn-ledger/log.jsonl (a copy of turns) · (4) domain/skill-invocation-log/log.jsonl (a Skill call is now a tool row)
state-scoped: no, state-agnostic (`qa` is data; no state literal)

**What fires when**: Stop — every Stop of the main session, including the re-entry after a Stop block (a re-entry writes a newer `rev` of the same turn and only the tool calls not yet written).

**Contract**: one JSONL per machine per month, `system/telemetry/turn-log/<machine>-<YYYY-MM>.jsonl`; three row kinds; a field the hook cannot know is null, never guessed. `lib/events.js` is the one reader.

**Layer choice (Rule 7)**: hook-only. The finished turn (tools, hooks, reply) exists only at Stop, and the writer has no model judgment. The reader is a CLI (`lib/events.js`), not a skill.

**Trigger moment (Rule 8)**: Stop is the only moment the whole turn exists. It takes the registration slot of the old turn-ledger hook, so the net count of registrations is 0.

**Observability**: the Feature is the log. Its own health is the read-back in `self_audit`; a failed read-back is the only row in `domain/turn-log/log.jsonl`.

## Rows

| kind | written by | when | key fields |
|---|---|---|---|
| `turn` | this hook | each Stop (`rev` 1, 2 ... on re-entry; readers keep the highest) | see below |
| `tool` | this hook | once per tool call of the turn | `session_id`, `turn_id`, `seq`, `tool`, `target` (160 chars, secrets masked), `result` (ok / error / refused / null), `dur_ms` (transcript timestamps, null when a side is missing) |
| `signal` | the NEXT turn | how he reacted to the previous turn (reask / correction / nod) | `turn_id` (the previous one), `next_signal`, `by_turn_id` |
| slip | `core/slips.js add` (stays in `system/slips.jsonl`) | when a slip is logged | the old fields plus `event_id`, `turn_id`, `session_id`, `session_src`, `his_words`, `his_words_src`, `repeat_of`, `rule_expected`, `part` |

Every row: `v` (2), `kind`, `event_id`, `machine`, `ts`.

Turn row fields: `session_id`, `turn_id`, `prompt_id` (transcript promptId), `parent_turn_id` (null: main session only), `ts_open`, `ts_close`, `wall_ms`, `rev`; `ask` (his words verbatim through lib/his-words.js, 20,000 characters cap), `ask_kind`, `ask_matched`, `prompt_head`; `restated_ask`, `cause_step`, `change_lines`, `new_parts`, `quote_in_ask` (read from the reply's own lines, null when absent); `model`, `models`, `effort`, `tokens {in,out,cache_read,cache_create}`; `tool_calls`, `tool_names`, `assistant_msgs`, `reply_chars`; `files_touched`, `parts_created`, `parts_retired`; `skills_triggered`, `skills_invoked`; `hooks_run`, `hook_ms`, `hooks_quiet {hook:[runs,ms,event]}`; `gates_blocked [{hook,reason}]`, `gates_bypassed [{token,hook,typed_by,fp,reason}]`, `bypass_reason_unclassified`, `suppressed`; `qa`, `phase`, `status`, `qa_source`; `user_signal`, `next_signal` (null; the next turn's signal row fills it), `caused_by_turn_id`, `gap_since_prev_minutes`, `window_truncated`.

## The reply lines the hook reads

The hook reads the last assistant text of the turn. It takes these lines when present and writes null when absent:

- `You asked: <one line>` goes to `restated_ask`
- `Cause step: <file:function> · change: <n> lines · new parts: <n>` goes to `cause_step`, `change_lines`, `new_parts`
- `His words: "<quote>"` sets `quote_in_ask` (true when the quote is a substring of his prompt)

## What is read, what is written

- Reads the transcript backwards from the end in growing chunks (1, 4, 16, 48 MB) until the start of his prompt is inside the chunk; his prompt comes from `lib/his-words.js` and is matched to the stamp's prompt head.
- Reads `system/telemetry/current-turn-<sid8>.json` (the stamp `lib/turn-context.js` keeps) and writes `closed_ts`, `rev`, `tools_written` back into it.
- Reads the acting hook rows of this turn from `system/telemetry/hook-fires-<machine>-<YYYY-MM>.jsonl`, and the quiet-run counter that `lib/hook-runtime.js` keeps in the OS temp folder (`ruri-hook-runs/<sid8>.tsv`, not synced).
- Deletes other sessions' `current-turn-*.json` stamps untouched for 3 days (the old sprawl: 364 files, never deleted).
- Writes nothing else.

## Stopped by this change (the stop list of the audit)

| Stopped | Writer | Reader repointed |
|---|---|---|
| per-prompt quest-objective-anchor log (641 MB of counts) | `.claude/hooks/quest-objective-anchor.js` no longer appends | none read it by name; `lib/redmine-role.eval.js` pinned it and now pins its absence |
| watchlist countdown rows (5,583 of 5,617 rows) | `lib/watch.js tick` is a no-op; the countdown is the watch number minus the days since the watch | `lib/audit-briefing.js`, `lib/turn-report.js`, `lib/observatory.js`, `lib/watch.js` derive it the same way |
| goal-lens-pending parking (1,250 prompts, 14 answers) | `domain/turn-ledger/turn-ledger.js goalLens` no longer parks; the advisory line is the prompt | `domain/turn-ledger/goal-lens-pending.jsonl` is `regenerate`: housekeeping removes it after 30 days; readers already treat a missing file as zero |
| `current-turn-*.json` sprawl | the Stop hook and `lib/housekeeping.js` delete stamps untouched for 3 days | none |
| hook-fires quiet rows, shared file name | `lib/hook-runtime.js appendTelemetry` and `lib/dispatch-hooks.js` | `lib/audit-briefing.js`, `lib/turn-report.js`, `lib/liveness-report.js`, `lib/observatory.js`, `core/registry.js`, `domain/sweep/audit.js` |
| turns.jsonl, turn-ledger log.jsonl | the turn-ledger hook is now a library (`domain/turn-ledger/turn-ledger.js`) | `lib/events.js readTurns` serves the old row shape; the three reports above read it |
| skill-invocation-log | its writer is deregistered; the Skill tool row replaces it | `lib/observatory.js` reads Skill tool rows |

## Rollback

See NUKE-MARKER.md. Put the old registration of `domain/turn-ledger/turn-ledger.check.hook.js` back (it is `git mv`-ed to `turn-ledger.js` in this change), remove the `domain/turn-log` Stop entry, `git revert` the change. Old logs stay on disk untouched (nothing is deleted by this change).
