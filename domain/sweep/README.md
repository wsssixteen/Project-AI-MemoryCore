# sweep — multi-ticket, multi-wave familiar sweep

**What fires when**: on purpose, `/sweep`. The Workflow runs W1+W2 and W3 for every ticket together, W4 per ticket, then closes with the audit Tool and the audit-and-refine step.

**Contract**: one ledger row per run in `log.jsonl`, written by `audit.js run --write` (never typed by hand), read back by its own self-audit. Every defect class in the row has a fix-now line and a refinement line with its accuracy effect. A class seen in 3 runs is marked REFINE NOW and is proposed through `/system-change`.

| Part | Path |
|---|---|
| procedure (Workflow) | `.claude/skills/sweep/SKILL.md` |
| audit Tool | `domain/sweep/audit.js` (`flag on/off` · `run` · `audit`) |
| run ledger | `domain/sweep/log.jsonl` (main folder; gitignored) |
| contract eval | `domain/sweep/eval.js` (23 checks; runs the Tool eval too) |
| Tool eval | `domain/sweep/audit.eval.js` (97 fixtures) |
| diagrams | `.claude/skills/sweep/diagram.png` · `domain/sweep/diagram.png` |
| design history | `projects/coding-projects/active/multi-ticket-sweep/DESIGN.md` (main folder, untracked) |

symptom: 2026-10-29 miya: "Does Sweep also have its own logs/observability/monitoring so that you can audit straight away each time it is summoned and suggest to me straight away?" then "add a step to always audit and straight away find the proper refinement, fixes, based on the goal of this capability without losing accuracy"
goal: every ticket in a sweep reaches a W4-audited Rubric whose fix is checked against evidence, at the lowest wall time and tokens that keep that accuracy
goal_signal: the close shows a ledger row written by audit.js, and every defect class in it has a fix-now line done or a refinement row in the close table
retention: keep (log.jsonl: one row per run + one self-audit row per audit; never pruned)
footprint: on-demand: 1 node process per audit call, streams the main hook log (~250 MB) in about 30 s, exits; flag on/off under 1 s
self_audit: `audit.js run --write` reads the row it wrote back from log.jsonl and checks run id, keys and that every defect class has a refinement; `audit.js audit` re-checks the last row; exit 1 on FAIL
state-scoped: no for the Tool; the wave prompts read the ticket's own state per the quest skill
diagram: .claude/skills/sweep/diagram.png
boundary: covers one sweep's familiar transcripts, the main hook log, the run ledger and the orchestration flag · never edits a transcript, a Task folder or a quest file, never re-runs a familiar · stops at the printed defect list and exit code; the controller re-runs or fixes

## What the two answer and write checks read (2026-11-02)

| Check | Counts as the defect | Does not count |
|---|---|---|
| `no-return-table` | no line with 2 or more pipes in any text message or `SubagentHandback` message | pipes in a shell command or a written file |
| `task-folder-write` | a Write or Edit into `1. Tasks`; a shell write whose destination is there; a move out of there; a destination the parse cannot place | a read or a copy out of `1. Tasks` to a path provably elsewhere |

`--controller-caught none` and `--w4-changed none` = an empty list. Why: run `esokongan-2026-11-02` raised 9 + 1 false alarms; exit 1 would have re-bought all 9 familiars, about 2.7M tokens.

## Accepted risks

| Risk | Why accepted |
|---|---|
| A script in another language that writes into `1. Tasks` (`python`, `node -e`) is not parsed | the shell parser reads shell only, and the old check never read these either; safety clause 6 in the familiar prompt bans the write |
| `task-folder-write` fails closed, so a destination held in a variable set outside the command, or a `1. Tasks` phrase inside a redirect target, can still flag | a false alarm costs one read of the detail line; a missed write costs a dirty Task folder |
| Hook-log rows carry no session id, so another session's suppressions inside the run window are counted | window bounded at both ends (run start to last familiar end + 15 min); the count is a liveness signal, not a bill |
| Familiars are matched by a 6-digit ticket number and a wave label in their description | the skill names every familiar `W<n> <wave> <ticket> <topic>`; an unmatched familiar is left out of the row, not mis-counted |
| `baseline-not-pinned` is a heuristic (etanah code read with no `origin/mlk/master` command) | severity warn; the controller re-checks that familiar's code claims |
| Token counts from transcripts differ from the Agent tool's own total | `subagent_tokens` = new spend (input + cache writes + output); cache re-reads kept apart in `cache_read_tokens` |
