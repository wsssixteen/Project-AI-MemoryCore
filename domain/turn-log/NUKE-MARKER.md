# NUKE-MARKER — turn-log

| Field | Value |
|---|---|
| Created  | 2026-11-10 |
| Session  | miya 2026-11-06: "I can bet my life that you've failed to reach the goal of what I told you on what I expect of Monitoring and Observability. You wont have enough data logged." |
| Files    | domain/turn-log/{turn-log.check.hook.js, turn-log.js, turn-log.eval.js, README.md, diagram.html, diagram.png} · lib/events.js (+ lib/events.eval via turn-log.eval) · edits: lib/hook-runtime.js, lib/dispatch-hooks.js, lib/turn-context.js, lib/housekeeping.js, lib/watch.js, core/slips.js, domain/turn-ledger/turn-ledger.js (renamed from the hook), readers (audit-briefing, turn-report, liveness-report, observatory, registry, sweep audit) · settings.json Stop entry · system/registry.jsonl line |
| Rollback | `git revert <change SHA>` (one commit) · put the turn-ledger Stop entry back in settings.json and remove the turn-log entry · `rm -rf system/telemetry/turn-log` (data only) |
| Retire   | 2026-12-10 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
