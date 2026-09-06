# turn-ledger

symptom: 2026-09-04 miya: 'you still haven't answered the monitoring part' — no ledger can say which quest/phase a block served, whether it was true or false, or what a turn cost (reply-log = rhythm only)
goal: one wide row per user turn in system/telemetry/turns.jsonl carrying tool calls, hooks fired, true/false blocks, bypasses, user signal and quest phase, so gate rulings and cost per phase are read from data
goal_signal: after a Stop, turns.jsonl has a row whose turn_id equals current-turn-<sid>.json turn_id
retention: keep

**What fires when**: Stop — every Stop (not stop_hook_active) — reads the transcript tail for the current turn window

**Contract**: append ONE turns.jsonl row; absorb reply-log fields; emit a goal-lens prompt for up to 3 features that BLOCKED this turn and lack a mechanical goal_signal

**Layer choice (Rule 7)**: hook-only — the finished turn is observable only at Stop; zero model judgment in the writer. The judgment half (goal-lens notes) is a CLI, `lib/goal-lens.js`, not a skill.

**Trigger moment (Rule 8)**: Stop is the only moment the whole turn (tools + hooks + reply) exists; it is also the moment reply-log already fired, whose fields this absorbs — net registrations: 0 (reply-log unregistered at birth).

**Observability**: every fire appends ONE wide row to `system/telemetry/turns.jsonl` (schema plan §M.3: turn_id · session_id · opened/closed · qa · phase · tool_calls · tool_names · assistant_msgs · reply_chars · hooks_fired · hook_ms · blocks[] · bypasses[{token,hook,fp,reason}] · suppressed · user_signal · gap_since_prev_minutes) plus a one-line summary to `domain/turn-ledger/log.jsonl`. Known limit: Stop-sibling hook rows may not yet exist when the row is written — `lib/turn-report.js` recomputes hook stats by joining `hook-fires*.jsonl` on turn_id, so the join is authoritative, the row's hooks_fired is a floor. Goal-lens prompts (features that BLOCKED this turn, cap 3) are emitted as Stop advisory context and parked in `goal-lens-pending.jsonl` until `lib/goal-lens.js note` answers them; `goal_signal_regex` features are judged mechanically into `domain/<feature>/goal-log.jsonl` with no model input.

**state-scoped**: no, state-agnostic (`qa` is data; no state literal).

**Rollback**: see NUKE-MARKER.md — remove the Stop registration, restore the `reply-log.js` Stop entry (`node "${CLAUDE_PROJECT_DIR}\lib\hook-runtime.js" --wrap "${CLAUDE_PROJECT_DIR}\.claude\hooks
eply-log.js" Stop`), delete the folder; `lib/turn-context.js` fields in hook-fires rows are additive and may stay.
