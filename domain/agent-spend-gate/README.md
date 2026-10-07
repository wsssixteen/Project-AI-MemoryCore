# agent-spend-gate

symptom: 2026-07-19: a canned workflow launched by name started 105 agents on the session model (Fable), 4.08M tokens, monthly limit hit mid-run. 2026-10-07 miya: "Use Opus 5.5 as the orchestrator and always try to use Sonnet 5.5 where possible on other matters to save time ... make sure it works as intended during Workflows"; that day `.claude/workflows/quest-phase0.js` named no model on any of its agents.
goal: no delegated agent runs on a model nobody chose: Opus 5.5 orchestrates, every delegated agent names its model, and that model is sonnet unless a reason for opus is stated
goal_signal: an Agent or Workflow launch passes with no block, and `system/telemetry/hook-fires.jsonl` shows its `spawn-telemetry` row with a model (Agent) or a `models` tally with no `none` (Workflow)
retention: rotate monthly
footprint: per-tool: 1 node process per Agent or Workflow call only (matcher `Agent|Workflow`), ~40 MB, exits in under 100 ms
state-scoped: no, state-agnostic. Model tiers are the same for every state.

Hook-only Feature (PreToolUse, matcher `Agent|Workflow`). The rule it hardens has one home: `.claude/CLAUDE.md` "Delegation Economy".

| Part | File |
|---|---|
| Hook | `agent-spend-gate.check.hook.js` |
| Script scan (shared with `domain/spawn-telemetry/`) | `workflow-models.js`: `agentCalls()` · `modelCounts()` · `reasonCount()` |
| Eval | `agent-spend-gate.eval.js` |
| Log | central telemetry `system/telemetry/hook-fires.jsonl` (rows `hook: agent-spend-gate`, written by `lib/hook-runtime.js`) |

## What it does

| # | Case | Verdict |
|---|---|---|
| 1 | Workflow launched by canned `name` with no `scriptPath` | BLOCK |
| 2 | Agent tool call with no `model` | BLOCK |
| 3 | Workflow `scriptPath` with no agent-count cap marker (`MAX_AGENTS` / `maxAgents`) | WARN |
| 4 | Workflow script (inline `script` or `scriptPath`) where any `agent()` call names no model | BLOCK, lines and labels listed |
| 5 | `model: 'haiku'`, Agent tool or workflow | BLOCK (banned from delegation, CLAUDE.md v1.68) |
| 6 | `model: 'opus'` or `'fable'` with no stated reason (workflow: one `// opus-reason: <why>` comment per such call; Agent tool: always, the plan row carries the reason) | WARN |
| 7 | the session itself is not on Opus 5.5 when a fan-out starts | WARN |

Bypass: みや writes `[skip-spend-gate: <reason>]` in his LAST message. A token written by the assistant (in a reply or inside the tool call) does not count.

**How a call "names a model"** (`workflow-models.js`): a `model:` key in the call's own arguments, or a constant declared in the same script as an object literal with a `model:` key and spread or passed into the call (`{ ...SONNET, label }`). `model: d.model` counts as chosen. Text inside strings, template literals and comments is never read as code.

**Layer choice (Rule 7)**: hook-only. The check is mechanical. **Trigger moment (Rule 8)**: PreToolUse on the two tools that can start an agent; nothing fires on any other tool. 

**Verify**: `node lib/eval-runner.js --only agent-spend-gate`.

## v2 (2026-10-07) — what changed and what was kept

Kept, unchanged: rule 1, rule 2, rule 3 (F2, F3, F5, F6 of the v1 eval still pass; F5 and F6 now use a fixture script because the eval file itself contains `agent(` text).
Added: rules 4 to 7, the script scan, the bypass.
Changed and named: (a) the v1 block text offered `haiku|sonnet|opus`; haiku was banned from delegation in CLAUDE.md v1.68, so the text now says sonnet and rule 5 blocks haiku. (b) The v1 text said "Bypass: include [skip-spend-gate: reason] in the reply", but v1 never read any bypass, so every block was absolute. The bypass now exists and reads his last message only.

## Adversarial scenarios (Rule 12)

| # | Scenario | Verdict |
|---|---|---|
| 1 | the old `quest-phase0.js` shape: multi-line template prompts, options with no model | fixture-added (F8 BLOCK, three lines named) |
| 2 | one agent without a model among several | fixture-added (F11) |
| 3 | `agent(` written inside a comment, a string or a prompt | fixture-added (F12: not a call) |
| 4 | `model:` written only inside the prompt text | fixture-added (F13 BLOCK) |
| 5 | a tier constant spread or passed whole | fixture-added (F14) |
| 6 | model chosen per item (`model: d.model`) | fixture-added (F15) |
| 7 | haiku in a workflow | fixture-added (F16 BLOCK) |
| 8 | haiku on the Agent tool | fixture-added (F17 BLOCK) |
| 9 | opus with no reason | fixture-added (F18 WARN) |
| 10 | opus with a reason comment | fixture-added (F19 silent) |
| 11 | two heavy agents, one reason | fixture-added (F20 WARN) |
| 12 | Agent tool on opus | fixture-added (F21 WARN) |
| 13 | bypass token in his last message | fixture-added (F22) |
| 14 | bypass token only in an older message | fixture-added (F23 BLOCK) |
| 15 | bypass token written by the assistant inside the tool call | fixture-added (F24 BLOCK) |
| 16 | session on Fable when a fan-out starts | fixture-added (F25 WARN) |
| 17 | a subagent's own transcript entry read as the session model | fixture-added (F27: sidechain entries ignored) |
| 18 | a wrapper function that sets the model once | fixture-added (F28) |
| 19 | brackets, quotes and a backtick inside the prompt | fixture-added (F29) |
| 20 | unreadable `scriptPath` | fixture-added (F30: WARN, no crash) |
| 21 | malformed stdin | fixture-added (F31) |
| 22 | `agentType` with no model | fixture-added (F32 BLOCK) |
| 23 | `myagent(` · `tools.agent(` · a variable named `agents` | fixture-added (F33) |
| 24 | a schema property named `model` inside the call's arguments | accepted-risk, pinned by F34: it reads as a chosen model; schemas are normally constants outside the call |
| 25 | the saved `quest-phase0.js` loses its models in a later edit | fixture-added (F36 to F38 go RED) |
| 26 | a child workflow started with `workflow()` | accepted-risk: only the launched script is scanned; the child is scanned when it is launched on its own |
| 27 | a regex literal holding a quote or a bracket inside a call | accepted-risk: rare in workflow scripts; worst case a false BLOCK, which his bypass clears |
| 28 | the model name changes (Opus 6) | handled in one place: the `ORCHESTRATOR` constant, next to the CLAUDE.md row it mirrors |
| 29 | hooks run from the main checkout while a worktree holds v2 | accepted-risk until merged to main |
| 30 | user reversal: "run this one fleet on opus" | handled: `// opus-reason:` in the script (WARN only, never a block), or his bypass |
