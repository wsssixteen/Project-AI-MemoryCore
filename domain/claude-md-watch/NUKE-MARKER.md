# NUKE-MARKER — claude-md-watch

| Field | Value |
|---|---|
| Created  | 2026-08-16 |
| Session  | Weekend audit close — miya: "SOLID PERFECT ROLLBACK system when touching CLAUDE.md + MOST ROBUST OBSERVABILITY; observe the specific things we touched, self-alert next run" |
| Files    | domain/claude-md-watch/ (check.hook.js, eval.js, NUKE-MARKER.md) + lib/watch.js + system/claude-md-watchlist.jsonl + settings.json SessionStart entry + registry.jsonl line |
| Rollback | rm -rf domain/claude-md-watch; rm lib/watch.js system/claude-md-watchlist.jsonl; remove settings.json SessionStart claude-md-watch entry; remove registry.jsonl line; git revert <ship SHA> |
| Retire   | 2026-09-15 if fired >=1x and no rollback |
