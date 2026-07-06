# stop-point-todo-table — RETIRED 2026-07-06

**Status**: RETIRED. Subsumed by `domain/stop-point-summary/`.

**Why retired**:
1. PostToolUse advisory only fired after code Edit/Write — missed non-Edit substantive turns.
2. Free-text bypass `[skip-stop-point-todo: <reason>]` was abused ("mid-implementation" / "3 more steps pending" / "will summarize later"), producing replies with NO summary at all.
3. Advisory reminder is skipped when in a hurry.

**Replacement**: `domain/stop-point-summary/` — Stop hook, HARD BLOCK on any substantive turn without a summary, whitelist-enum bypass (no free-text). See `domain/stop-point-summary/README.md`.

**Files kept for git history**; not registered in `settings.json` anymore.

Rule 6 v1.2 spec preservation on retirement: prior spec (advisory reminder after code Edit) ⊂ new spec (hard block on any substantive turn). Nothing dropped, scope expanded.
