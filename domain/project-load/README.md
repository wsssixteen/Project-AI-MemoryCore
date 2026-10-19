# project-load

symptom: 2026-10-08 miya: 'make sure everything WILL be loaded every single time we load a project'; he found the stale PymTime project folder himself. v2 2026-10-17 miya: 'a proper project management for you to be able to survive autocompactions & make use properly the jsonl ... I can confidently and without worry know you'll remember the critical & key details (like you've already agreed on a fix because of latest findings, then you suddenly forgot about it'
goal: a session that works on a project starts from that project's own documents, never from memory alone, and keeps its spec, hard rules, decisions and next step through every compaction, resume and new session
goal_signal: the first reply after a project is named, a compaction or a resume cites its START.md state (or the quest's Resume Point); no decision stated in a reply is missing from DECISIONS.md
retention: rotate monthly
footprint: per-prompt: 0 extra processes beyond the hook's own node start; one directory listing and a few small JSON reads; silent unless an alias matches or a compacted session lacks its card · per-turn: one child of the stop-claim-integrity bundle, silent unless the session is bound to a shape-2 project (then one 3 MB transcript tail read) · per-compaction: one node process reading the transcript once (PreCompact) and once more (SessionStart)

**What fires when**

| Hook file | Event | Fires | Does |
|---|---|---|---|
| `project-load.check.hook.js` | UserPromptSubmit | the prompt names a project's alias (whole word) | shape 1: the pointer to its index (unchanged since 2026-10-08) · shape 2: the PROJECT CARD on the first mention in the session, one pointer line after · binds the session in `log.jsonl`; marks it delegated only when its START BRIEF (first prompt) says to write `reports\<name>.md` (v2.1, 2026-10-19); `[project-unbind: <Name>]` turns that off · fallback: a bound session compacted with no card since gets the card on its next prompt |
| `project-load.resume.hook.js` | SessionStart, matcher `compact\|resume` | a compaction or a resume | the card of every bound project (or the projects his prompts name, if the log has no binding) and a QUEST CARD for each open ticket his prompts name (block fields + qa_doc `0. Resume Point`); under 9,200 characters in all; copies the compaction summary to `history\compactions.md` |
| `project-load.precompact.hook.js` | PreCompact (manual and auto) | before every compaction | copies his prompts (typed by him, or the brief of a delegated session) word for word into each bound project's `history\words.md`; never blocks |
| `project-load.save.hook.js` | Stop (child of `domain/bundles/stop-claim-integrity.json`) | a session bound to a shape-2 project ends a turn | BLOCKS a reply that states a decision when no bound DECISIONS.md was written this turn; BLOCKS a delegated session whose report is missing, lacks one of the six headings, or is older than the newest change in the folder since the session began; never blocks twice in a row |

**Contract**: the folder is the record, never memory or the compaction summary. The card is cut from `START.md` (Goal · Spec · Hard rules · State now · Next step · Open decisions) plus the last five DECISIONS.md rows; a section too long is cut with "read the file". The quest save path (active.txt · Task folder · qa_doc) is read, never written.

**Layer choice (Rule 7)**: hooks + a skill. Naming a project, a compaction, a resume and the end of a turn are fixed events, so hooks catch them in every session. What to write (START.md, a decision row, a report) is judgment, so it lives in the skill `.claude/skills/project/` (its body is re-injected after a compaction, up to 5,000 tokens) and in `project.js` commands.

**Trigger moment (Rule 8)**: each hook fires at the one moment it serves: a mention, a compaction, a resume, the end of a turn. The Stop child returns at once unless the session is bound to a shape-2 project; the SessionStart hook ignores startup and clear.

**Observability**: every fire appends one row to `domain/project-load/log.jsonl` in the MAIN checkout: `fired` (session, project, shape, card, report) · `bound` (via transcript) · `compact` (trigger, mined) · `resumed` (via session-start or prompt-fallback, chars) · `resume-empty` · `stop-check` (decision_shape, ledger_written, report, report_mtime, last_change, blocked, would_block) · `decided`. Every evaluation also lands in `system/telemetry/hook-fires.jsonl` through `lib/hook-runtime.js`.

**state-scoped**: no, state-agnostic. A project folder is keyed by its own name, never by an eTanah state; a quest card reads `quest/active.txt` whatever the state.

## What a project is

A folder `projects/coding-projects/active/<Name>/` in the MAIN checkout (the folder is not in git) that holds `project.json`:

| Key | Meaning |
|---|---|
| `name` | The project's name |
| `aliases` | Words that mean this project in a prompt (3 letters or more, whole-word match) |
| `repo` | The project's own code repo, when it has one (used by the save check) |
| `index` | The file to read first; default `PROJECT.md`. **Every new project (his ruling 2026-10-16) sets `index` to `START.md`**: a start file of about 5,000 tokens (what the project is, its hard rules one line each, where it stands, the next ticket), so loading a project costs little and history never sits in the read path. DawahMap is the first; PymTime and Eisenhower follow once DawahMap passes its 10-question test. |
| `shape` | `2` = the project system (2026-10-17): `START.md` with the six sections, `DECISIONS.md`, `history\`, `reports\`; the card, the decision gate and the shape-2 save checks apply. Absent or `1` = the 2026-10-08 folder (pointer only). Masterline is the first in shape 2. |

No registry to keep: the folders are the list. The other half is `lib/save-rules.js` (kind `projects`): at Domain Expansion it fails when the repo moved and the documents did not, and for shape 2 when START.md lacks a section (`project-shape2`) or a delegated report is older than its session's last change (`project-report-current`, read from the `stop-check` rows).

**New project**: `node domain/project-load/project.js new <Name> --aliases "a,b"` (templates in `templates/`). Everything else: `.claude/skills/project/SKILL.md`.

**Unbind / bind**: `[project-unbind: <Name>]` in a prompt · `node domain/project-load/project.js unbind <Name> --session <id> [--all]` · `bind <Name> --session <id> --report <file>.md`. Log rows `unbound` (report_only) and `bound` (via cli).

**Bypass**: `[skip-project-load: <reason>]` in the prompt (the card); `[skip-project-decision: <reason>]` · `[skip-project-report: <reason>]` in the reply (the Stop gate). An empty reason does not count.

**Eval**: `node domain/project-load/project-load.eval.js` (the 2026-10-08 prompt hook: 22 fixtures + registration, 30 checks) and `node domain/project-load/eval.js` (the project system: requirements 1-7, 28 scenarios, 50 checks). `--table` prints the scenario table.

**Version**: 2.1 — 2026-10-19: delegation from the start brief only, the written report path only; unbind marker and commands; eval 59 checks. Spec preservation: every 2.0 contract kept; the report binding narrowed.

**Version**: 2.0 — 2026-10-17. Spec preservation against 1.0: alias matching, the 30-minute re-arm, the bypass token, the shape-1 text and the log row fields are unchanged; additive.
