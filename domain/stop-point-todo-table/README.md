goal_status: draft (derived from hook-header on 2026-09-06; promote with node lib/goal-backfill.js promote stop-point-todo-table)
symptom: not recorded at birth (pre-Rule-13 feature)
goal: stop-point-todo-table.discipline.hook.js — PostToolUse hook on Edit | Write | NotebookEdit Soft reminder: after any code-file Edit/Write, inject a context line nudging Ruri to emit a "what to do next" table (Ruri's part | みや's part) before stopping the turn.
goal_signal: a fire on: its trigger
retention: rotate monthly
# stop-point-todo-table — RETIRED 2026-07-06

**Status**: RETIRED. Subsumed by `domain/stop-point-summary/`.

**Why retired**:
1. PostToolUse advisory only fired after code Edit/Write — missed non-Edit substantive turns.
2. Free-text bypass `[skip-stop-point-todo: <reason>]` was abused ("mid-implementation" / "3 more steps pending" / "will summarize later"), producing replies with NO summary at all.
3. Advisory reminder is skipped when in a hurry.

**Replacement**: `domain/stop-point-summary/` — Stop hook, HARD BLOCK on any substantive turn without a summary, whitelist-enum bypass (no free-text). See `domain/stop-point-summary/README.md`.

**Files kept for git history**; not registered in `settings.json` anymore.

Rule 6 v1.2 spec preservation on retirement: prior spec (advisory reminder after code Edit) ⊂ new spec (hard block on any substantive turn). Nothing dropped, scope expanded.
