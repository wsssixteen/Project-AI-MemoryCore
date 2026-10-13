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
| 5 | `model: 'haiku'`, Agent tool or workflow | ON TRIAL since 2026-10-12 (CLAUDE.md v1.84): BLOCK without a `haiku-trial: <task>` mark, BLOCK at effort `low`; with the mark it runs, is warned and is logged. Section "Haiku 5.5 trial" below |
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

## Haiku 5.5 trial (since 2026-10-12)

His words: "Please update the ban on Haiku 5.5, though we will need to audit. We will take the change to audit if Haiku is fit enough for what kinds of tasks."

| | |
|---|---|
| Before | every haiku agent was blocked (CLAUDE.md v1.68, 2026-08-16: a weaker reader can return a partial result that nobody sees) |
| Now | a haiku agent runs when its launch says what kind of task it is: `haiku-trial: <task>` in an Agent prompt, or one `// haiku-trial: <task>` comment per haiku `agent()` call in a workflow. Never at effort `low`. Without the mark it is blocked as before |
| The rule for whoever launches it | only a task whose every answer a script or a second reader checks. The answer is data, not truth |
| The ledger | `haiku-trial.jsonl`. The gate writes one row per marked launch. The orchestrator adds one row per checked result: `{"ts","task","checked_by","right","wrong","partial","seconds","tokens","note"}` |
| retention of the ledger | keep until the audit has ruled, then consume into the audit's result |

### What Anthropic's own pages say

Read by a research agent on 2026-10-12. Re-read by the orchestrator the same day: three of the four pages were fetched again (the product page, the prompting guide, the models overview; not the Haiku 5.5 overview page) and every row below stands. The rows marked "added on the re-read" are new. Each row names its page.

| Point | What the page says | Page |
|---|---|---|
| What it is for | high-volume, latency-sensitive work: classification, routing, extraction, sub-agent tasks; "best suited to more narrowly scoped tasks" | https://platform.claude.com/docs/en/models/haiku-5-5/overview · https://www.anthropic.com/claude-haiku-5-5 |
| As a sub-agent | it "pairs well with Opus 5.5 and Sonnet 5.5 as a subagent on coding work" | https://www.anthropic.com/claude-haiku-5-5 |
| Price per million tokens | Haiku 5.5: 0.10 in, 0.50 out (0.50 and 2.50 above 100K-token prompts). Sonnet 5.5: 2 in, 10 out | https://platform.claude.com/docs/en/models/overview |
| Cautions | with a long agent prompt at low effort it can stop early and hand the task back; at low and medium effort it can report work as done without running a check; at low effort it can skip a search | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-haiku-5-5 |
| Which effort (added on the re-read) | `low`: chat, short tool tasks, simple high-volume requests; "in long agent prompts, the model is more likely to skip a search, stop early, or skip a check at this level". `medium` is the default: "start here for most work, including agentic coding". `high` "suits knowledge work, longer agent tasks, and strict instruction following". At `xhigh` and `max`, run the same evals on Sonnet 5.5 and compare | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-haiku-5-5 |
| Its place beside the larger models (added on the re-read) | Sonnet 5.5 and Opus 5.5 "remain better choices for complex agentic coding tasks"; the models table calls Haiku 5.5 the "fastest" of the four | https://www.anthropic.com/claude-haiku-5-5 · https://platform.claude.com/docs/en/models/overview |
| Two texts Anthropic gives for agent prompts (added on the re-read) | against early stopping: "Keep working until everything the user asked for is done, and only stop to ask when you can't go on without the user or before a risky step. When the work the user asked for is done and checked, stop and report." Against unchecked "done": run "a real check that exercises the change before reporting it done". Going from `low` to `medium` "roughly halved early stopping" and "more than doubled the output tokens" | same prompting guide |
| What this means for our price (added on the re-read; my reading, not the page's) | the low price holds for prompts up to 100 K tokens. An agent here starts with about 88 K tokens of this repository's own context, so most of its requests are near or over that line and are billed at the higher rate (0.50 in, 2.50 out). That is still a quarter of the Sonnet 5.5 rate, not a twentieth | https://www.anthropic.com/claude-haiku-5-5 |
| Not found | how to detect a partial result from a worker; absolute speed figures | - |

**Rules for a Haiku 5.5 agent that follow from these pages** (in force with the trial mark; the gate checks the first two, the launcher answers for the rest):

1. Never effort `low` (the page names skipped searches, early stops and skipped checks there). `medium` by default; `high` for a long agent task or one that must follow instructions strictly.
2. The launch states the task kind (`haiku-trial: <task>`), so every use is a row in the ledger.
3. Only narrowly scoped work whose every answer a script or a second reader checks: classification, extraction, routing, listing, summarising. Not a cause, a call chain or a review that decides a fix.
4. The agent's prompt says to keep working until all of it is done and checked, and, where it changes code, to run a real check before reporting done.
5. The answer file is the data. The agent's own summary of it is not (round on larger inputs: it wrote "36 answers" over a file of 37).

### The audit this trial feeds

| Question | How the ledger answers it |
|---|---|
| For which kinds of task is Haiku 5.5 fit here? | per task kind: the share of answers right, wrong and partial against the script or the second reader. At least 10 checked answers of a kind before a ruling on it |
| Is it faster and cheaper in practice? | seconds and tokens per task, against the same task given to sonnet |
| Does the old risk show? | the count of "partial" rows that only the check caught |
| The ruling, per task kind | allowed without a mark · stays on trial · banned. It is written into CLAUDE.md Delegation Economy and into rule 5 above |

First task kinds to try, each with a script as its judge: finding a hadith by its number · cutting a quotation by its first and last words · sorting rows into given classes · extracting named fields from one file.

### First round of the audit (2026-10-12)

Four task kinds, each given once to Haiku 5.5 and once to Sonnet 5.5, both at effort medium, same words. A script judged every answer. The rows are in `haiku-trial.jsonl` (`"round":"2026-10-12 first"`).

| Task kind | Answers | Haiku 5.5 | Sonnet 5.5 |
|---|---|---|---|
| extracting named fields from a file (10 small JSON files) | 10 | 10 right · 22 s · 94 K tokens | 10 right · 13 s · 89 K tokens |
| sorting rows into given classes (30 sentences, 4 classes, 7 rows built to mislead) | 30 | 30 right · 17 s · 93 K tokens | 25 right, 5 wrong · 13 s · 90 K tokens |
| cutting a quotation by its first and last words (12 Arabic passages) | 12 | 12 right · 33 s · 103 K tokens | 12 right · 20 s · 91 K tokens |
| finding every place a function is used in one file (15 places) | 15 | 15 right · 18 s · 92 K tokens | 15 right · 20 s · 90 K tokens |

| Question of the audit | What this round shows |
|---|---|
| For which kinds of task is Haiku 5.5 fit here? | fit on all four: 67 of 67 answers right, none wrong, none left out |
| Is it faster and cheaper in practice? | not faster here (17 to 33 s against 13 to 20 s). Not smaller in tokens: about 88 K of every agent's tokens is this repository's own start-up context, the same for both models. The price per token is what differs (table above) |
| Does the old risk show? | no partial answer in this round. The tasks were small, so the round does not test it |
| Where was there an error? | Sonnet, on the sorting task: five longer words (universe twice, Muslims, prophets, Islamic) put in the class the rule kept them out of |

Limits of this round: one run per kind · small, narrow tasks · an agent may answer by writing its own script (two said they did), so this measures the agent with its tools, not its reading alone · not tried: finding a hadith by its number, reading many or large files, review, synthesis, a trace across files. The old risk lives in those.

Ruling after this round: the four kinds **stay on trial** (the mark and the ledger stay; none is banned). "Allowed without a mark" for a kind needs a second round on larger inputs, and that ruling is the owner's.

### Second round of the audit (2026-10-12): review

A harder kind, one the first round did not try: reading rule-bound cards and reporting what is wrong. Five steps of the DawahMap walk, each read by Haiku 5.5 and by Sonnet 5.5 with the same words, both at effort high. One Sonnet checker then tried to refute every finding; a finding it let stand is a "real issue". The orchestrator read every real issue before applying it, and the two gravest refuted ones. Rows: `"round":"2026-10-12 second"`. Run `wf_747b399f-841`.

| Step read | Real issues | Haiku 5.5: found · missed · refuted | Sonnet 5.5: found · missed · refuted |
|---|---|---|---|
| 5 (five cards) | 3 | 3 · 0 · 6 | 2 · 1 · 9 |
| 7 (two cards) | 1 | 1 · 0 · 1 | 1 · 0 · 4 |
| 8 (four cards) | 1 | 1 · 0 · 4 | 0 · 1 · 10 |
| 10 (three cards) | 5 | 4 · 1 · 2 | 4 · 1 · 6 |
| 11 (four cards) | 4 | 4 · 0 · 3 | 3 · 1 · 7 |
| **all** | **14** | **13 · 1 · 16** of 31 raised | **10 · 4 · 36** of 51 raised |

What it shows: on this review Haiku found more of the real issues (13 of 14 against 10 of 14) and raised fewer findings that did not hold (16 against 36). Its one miss is the old risk in small: a real issue left out with no sign of it.

Limits: one run · the judge of "real" was itself a Sonnet agent, not a script, so the counts are a second reader's opinion · only the orchestrator's reading stands behind the refuted ones, and it read two of them · no time or token figure per agent (the run gave only the total: 13 agents, 1.67 M tokens, 12 minutes).

Ruling after two rounds: the five kinds tried **stay on trial**. Nothing so far speaks against Haiku on them, and nothing here was faster or cheaper in tokens. Lifting the mark for a kind is the owner's ruling.

How the round was built: a script made the four tasks and their truth files from the DawahMap app's cards and page shell (10 card files · 30 written sentences · 12 commentary passages cut by `lib-sources.js` · one regex over `template.html`); eight Agent calls; a second script compared each answer file with the truth. The scripts were one-off and are not kept in this folder.

Changed and named (v3, 2026-10-12): rule 5 no longer blocks every haiku agent. What stays: no mark, blocked; effort `low`, blocked. Eval 40 to 45 fixtures (F41 to F45).

### Round on larger inputs (2026-10-12, from the DawahMap session)

Why: the first round's ruling said "allowed without a mark" needs a round on larger inputs. This round aims at the risk the old ban named: a result that is partial and gives no sign of it. One Haiku 5.5 agent and one Sonnet 5.5 agent, same words, effort medium, each given all three tasks in one prompt. A script built the truth files before any answer was read and judged every answer. Rows: `"round":"2026-10-12 larger inputs (DawahMap session)"`.

| Task kind | Answers | Haiku 5.5 | Sonnet 5.5 |
|---|---|---|---|
| listing every hadith token across 33 card files, with the field each sits under | 37 | 37 right | 37 right |
| reading a 123-line file where later blocks replace earlier entries: the first eight words of each final reply | 55 | 55 right | 55 right |
| finding a hadith by collection name and number among 382 kept files (3 of the 15 are not kept) | 15 | 15 right, the 3 answered "none" | 15 right, the 3 answered "none" |
| the three together, per agent | 107 | 143 s · 212 K tokens · 42 tool uses | 125 s · 142 K tokens · 16 tool uses |

| Question of the audit | What this round shows |
|---|---|
| Is Haiku 5.5 fit for these kinds? | yes: 107 of 107 right, nothing left out, nothing invented for the three that are not kept, every later replacement applied |
| Is it faster or cheaper in practice? | no: slower (143 s against 125 s) and one and a half times the tokens (212 K against 142 K). Only the price per token is lower |
| Does the old risk show? | not in the answers. It showed in the agent's own closing report: Haiku wrote "36 answers" for the first task while its file held 37, all right. The answer file is the data, the agent's summary of it is not |

Limits: one run · the inputs are larger than the first round's but still mid-size (33 files, one 28 KB file, 382 small files) · both agents say they used only Grep and Read, as told; that is their word, not checked.

No new ruling from this round. A third round on real sub-tasks of quest #284201 was run the same day by another session (ledger rows `third (quest #284201)`), and it wrote the ruling per task kind. This round adds 107 script-judged answers to that ruling's first row (a list or fields that a script checks in full: Haiku 5.5 allowed, with the mark and the script) and changes none of its rows. Lifting the mark stays the owner's ruling.

Owner's word on 2026-10-12, when asked for a ruling: "what did the audit found, why is it slower and not cheaper? Did you start collecting data that is meaningful? If yes & you need more data, keep it." The data is meaningful and not yet enough (one run per kind, mid-size inputs, one quest of real work), so the trial mark stays on every kind and the ledger keeps growing. Why slower: only the wall time was measured; what was seen is that Haiku took more tool steps for the same answers (42 against 16 in this round). Why not cheaper in tokens: every agent first loads this repository's own start-up context (about 88 K tokens), the same for both models, and Haiku's extra steps add to it; the saving is in the price per token only.
