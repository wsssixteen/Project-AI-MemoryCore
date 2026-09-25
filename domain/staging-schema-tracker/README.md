goal_status: declared (2026-09-23, written at the v2 refinement)
symptom: 2026-08-10 QA-273460 env declared ready without checking standalone.xml against the live stg2 target · 2026-09-23 a background <task-notification> naming "<ticket>-stg1.sql" flipped the pointer stg2→stg1
goal: the Melaka staging pointer (system/melaka-env-state.json) changes ONLY when miya explicitly switches it, and every env-prep / test-scenario prompt sees the live target plus a standalone.xml verdict
goal_signal: after a turn without a switch phrase, git diff system/melaka-env-state.json is empty; after a switch, the file's schema equals the phrase and log.jsonl has one `written` row carrying that phrase
retention: keep
# staging-schema-tracker (hook-only Feature, v2 — 2026-09-23)

**What fires when**: `UserPromptSubmit`, every prompt. Skipped whole when the prompt is a system or background notification (`<task-notification>`, `[SYSTEM NOTIFICATION - NOT USER INPUT]`).

| Branch | Predicate | Effect |
|---|---|---|
| (A) Switch | an explicit phrase in miya's own text: `switch (staging) to stgN` · `we switched to stgN` · `staging now stgN` · `use stgN` · `we're on stgN` · `set the env to stgN` | rewrites `system/melaka-env-state.json`, confirms with the phrase echoed, appends a `log.jsonl` row |
| (A) Refused | phrase negated · inside a question · two different targets · prompt names this tracker or its state file | pointer untouched; conflict and about-the-tracker cases print one advisory line and log a `refused-*` row |
| (B) Env / test | env-prep, test-scenario, `standalone`, `which schema` prompts | injects the live target + standalone.xml `etanahDS` verdict |

Never counted as miya's words: pasted blocks, fenced or inline code, double-quoted text, `>` blockquotes. Never counted as a stg token: file names, schemas, servers (`280166-stg1.sql`, `et_main_stg1`, `postgres-mlkstg1-pg`).

| Piece | File |
|---|---|
| Hook | `staging-schema-tracker.check.hook.js` (registered in `.claude/settings.json`) |
| Eval | `staging-schema-tracker.eval.js` — 43 fixtures in a temp sandbox (`STAGING_TRACKER_STATE_PATH` / `STAGING_TRACKER_LOG_PATH`); asserts the live pointer is byte-identical afterwards |
| Log | `log.jsonl` — `{ts, outcome: written\|refused-meta\|refused-conflict\|write-failed, target, phrase, current}` per pointer decision |
| State | `system/melaka-env-state.json` (prose mirror: `.claude/auto-memory/feedback_staging_schema_stg2.md`) |

**state-scoped**: yes, Melaka only — the state file name, the stg1/stg2 schema pair and the two MCP server names are Melaka literals. A second state needs its own `<state>-env-state.json` and schema map; recorded here so that build finds this coupling in one grep.
