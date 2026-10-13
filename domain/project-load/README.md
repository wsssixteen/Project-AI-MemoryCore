# project-load

symptom: 2026-10-08 miya: 'make sure everything WILL be loaded every single time we load a project'; he found the stale PymTime project folder himself
goal: a session that works on a project starts from that project's own documents, never from memory alone
goal_signal: the first reply after a project is named cites its PROJECT.md state (version, next phase)
retention: rotate monthly
footprint: per-prompt: 0 extra processes beyond the hook's own node start; one directory listing and a few small JSON reads; silent unless an alias matches

**What fires when**: UserPromptSubmit — the prompt names a project that has a folder projects/coding-projects/active/<Name>/ with project.json (matched by its aliases)

**Contract**: inject: read that project's PROJECT.md in the main checkout first, then only the file its table names; documents updated at every bulk change

**Layer choice (Rule 7)**: hook-only. Naming a project is a fixed text signature, so a hook catches it in every session; what to do next is one sentence, so no skill is needed. A project that has its own skill (PymTime: `.claude/skills/pymtime/`) keeps it.

**Trigger moment (Rule 8)**: UserPromptSubmit, silent unless an alias matches as a whole word. Announced once per session and project, again after 30 minutes (a compaction may have dropped it). There is no narrower moment: naming the project IS the moment of loading.

**Observability**: every fire appends one row to `domain/project-load/log.jsonl` in the MAIN checkout: `ts · action: fired · session · project · index_exists`. Every evaluation also lands in `system/telemetry/hook-fires.jsonl` through `lib/hook-runtime.js`.

**state-scoped**: no, state-agnostic. A project folder is keyed by its own name, never by an eTanah state.

## What a project is

A folder `projects/coding-projects/active/<Name>/` in the MAIN checkout (the folder is not in git) that holds `project.json`:

| Key | Meaning |
|---|---|
| `name` | The project's name |
| `aliases` | Words that mean this project in a prompt (3 letters or more, whole-word match) |
| `repo` | The project's own code repo, when it has one (used by the save check) |
| `index` | The file to read first; default `PROJECT.md` |

No registry to keep: the folders are the list. The other half is `lib/save-rules.js` (kind `projects`): at Domain Expansion it fails when the repo moved and the documents did not.

**Bypass**: `[skip-project-load: <reason>]` in the prompt. The block is advisory; it never blocks.

**Eval**: `node domain/project-load/project-load.eval.js` (replay + 22 adversarial fixtures + registration + the real PymTime manifest). `--table` prints the scenario table.
