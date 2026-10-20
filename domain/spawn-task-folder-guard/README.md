# spawn-task-folder-guard

symptom: 2026-10-17 miya after the DawahMap folder test landed in a worktree copy: "Are you f stupid? You ran it and it failed" and "please fix this mistake so that you won't repeat it"; the spawn_task reply had said fresh worktree
goal: no start button is ever offered for a job that cannot run in the git worktree copy the button creates
goal_signal: a spawn_task call naming a gitignored or untracked folder is blocked with the path named; a spawn_task on a tracked folder passes
retention: rotate monthly
footprint: per-tool: 1 node process and up to 4 git calls, only when spawn_task is called (a few times a week); 0 cost on every other tool

**What fires when**: PreToolUse, matcher `mcp__ccd_session__spawn_task` — a spawn_task start button is about to be offered for a job whose folder (`cwd`) or an absolute path its prompt names is gitignored or untracked in its git repo.

**Contract**: block the spawn_task call. The button opens a fresh git worktree copy, which never holds gitignored or untracked folders, so the job cannot run there. The block names each such path and the two ways that work: do the job in this session, or move a session into the folder with `mcp__ccd_directory__change_directory` after his nod. Fails open on any error (no git, bad input). Bypass: `[skip-spawn-task-folder-guard: <reason>]` inside the task prompt, only when the task needs none of the named paths.

**Layer choice (Rule 7)**: hook-only. The failing condition is mechanical (`git check-ignore` / `git ls-files` on the named path) and it must hold every time; a skill or a memory would have to be remembered at the moment of the call, which is exactly what failed on 2026-10-17.

**Trigger moment (Rule 8)**: the one spawn_task call itself. No narrower moment exists, and no broader one is needed: the hook costs nothing on any other tool.

**Observability**: every evaluation appends one row to `domain/spawn-task-folder-guard/log.jsonl`: `ts · decision (pass | block | bypassed | fail-open) · checked (number of paths) or paths (each blocked path with its reason) or token or error`. Central telemetry rows land in `system/telemetry/hook-fires.jsonl` through `lib/hook-runtime.js`.

**Eval**: `node domain/spawn-task-folder-guard/spawn-task-folder-guard.eval.js` (21 fixtures, the replay first) · `--table` prints the 20 adversarial scenarios with their verdicts.

**state-scoped**: no, state-agnostic. It reads git status of whatever path the task names.
