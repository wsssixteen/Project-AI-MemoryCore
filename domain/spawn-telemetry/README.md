# spawn-telemetry

symptom: 2026-07-02 quest-system-audit run 1: 23 agents fanned out on the session model, 2.1M tokens, died at the usage limit; nothing recorded which model each spawn used, so the tiering rule could not be measured
goal: every agent or workflow spawn leaves one row saying which model it used, so the share of sonnet against opus is read from data
goal_signal: after an Agent or Workflow call, `system/telemetry/hook-fires.jsonl` has a new `hook: spawn-telemetry` row with `spawn_tool` and `model` (Agent) or a `models` tally (Workflow with a script)
retention: rotate monthly
footprint: per-tool: 1 node process per Agent, Task or Workflow call only, ~40 MB, exits in under 100 ms
state-scoped: no, state-agnostic.

Hook-only Feature (PostToolUse). Silent: it never prints and never blocks.

| Part | File |
|---|---|
| Hook | `spawn-telemetry.check.hook.js` |
| Script scan it borrows for a Workflow | `domain/agent-spend-gate/workflow-models.js` `modelCounts()` |
| Eval | `spawn-telemetry.eval.js` |
| Log | central telemetry `system/telemetry/hook-fires.jsonl` |

**Row shape**: `{ hook: 'spawn-telemetry', event: 'PostToolUse', mode: 'native', spawn_tool, model, models? }`. `model` = the call's own `model`, else its `subagent_type`, else `unspecified`. `models` (added 2026-10-07) appears only for a Workflow whose script could be read: one count per model named by its `agent()` calls, `none` for a call that named no model, `dynamic` for a model chosen per item.

**Read it**: count `models.sonnet` against `models.opus` over a week to see whether CLAUDE.md "Delegation Economy" is being followed; a `none` above zero means the spend gate was bypassed.

**Layer choice (Rule 7)**: hook-only, a mechanical log. **Trigger moment (Rule 8)**: PostToolUse on the spawn tools only.

**Verify**: `node lib/eval-runner.js --only spawn-telemetry`.
