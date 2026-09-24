# quest-exists-gate

symptom: 2026-09-24 #281392: miya - you failed to create a task folder, an adhoc or a proper numbered ticket after I gave you a ticket number
goal: no etanah commit leaves the machine without a quest block and Task folder for its ticket
goal_signal: blocked commit followed by redmine-sync or ADHOC scaffold, then the same commit passes
retention: rotate monthly

**What fires when**: PreToolUse Bash|PowerShell — `git [-C <dir>] commit` whose command names an etanah repo path and a `#<ticket>`.

**Contract** (block, exit 2):
- branch is `*/hotfix/<n>` and the commit names a different # → a hotfix commit carries its OWN ticket number
- no `qa=QA-<ticket>` block in the MAIN repo `quest/active.txt` → remedy `node quest/redmine-sync.js <ticket>`
- block exists but `task_folder` is missing on disk
- block `status=archived` → a released ticket reworked is a hotfix (own #)
Bypass: `[skip-quest-exists: <real reason>]` in the assistant turn; a reason starting with `<` (the gate's own help text) never bypasses.

**Layer choice (Rule 7)**: hook-only. The scaffold is a mechanical fact (a block + a folder exist); the judgment half lives in the `hotfix` skill, fired by the etanah-intake-gate HOTFIX lane.

**Trigger moment (Rule 8)**: the commit — the last point before the work leaves the machine, and the first point where the ticket # is written down. Firing at prompt time would guess the #; firing at edit time would block exploration.

**Observability**: `domain/quest-exists-gate/log.jsonl`, one row per fire — `ts · ticket · repo · branch · outcome (pass|blocked|bypassed) · reason`. Hook-level `dur_ms` in `system/telemetry/hook-fires.jsonl`. Eval: `node domain/quest-exists-gate/quest-exists-gate.eval.js` (20 fixtures, 22 adversarial scenarios).

**state-scoped**: no, state-agnostic — the active.txt block and its task_folder path carry the state; the repo regex lists module names only.
