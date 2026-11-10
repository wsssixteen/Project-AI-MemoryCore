# wa-watch-health

symptom: 2026-11-06 miya: "check if the monitoring, observability and logging for every failure is also logged"; the check found the watcher had fired 0 sessions since 2026-09-14, its login dead since 2026-10-15 and the daemon stopped since 2026-11-03, with no alarm anywhere
goal: a stopped WhatsApp watcher, a dead Claude login or a message waiting to start is named in the first reply of the next session, never found weeks later
goal_signal: a session that starts while the watcher is stopped, its login is dead or a start is waiting shows a WA-WATCH line; a healthy watcher shows nothing
goal_signal_regex: WA-WATCH
retention: keep
footprint: per-session: one node process at session start, about 40 MB for under 1 second, reads the last 256 KB of one log file and up to 3 small JSON files
boundary: covers the WaRead events log and day registry files under the user profile, read only · never starts, stops or connects the watcher, never reads message text, never writes outside its own folder · stops none: report only

**What fires when**: SessionStart — every session start (startup, resume, compact)

**Contract**: reads the tail of the WaRead events log and the last 3 day registries; prints one alarm line per problem with its fix command; silent when healthy or when WaRead is not installed

**Layer choice (Rule 7)**: hook-only. The trigger is an event (session start) and the job is one file read with a fixed answer; there is no procedure for Ruri to follow, so no skill.

**Trigger moment (Rule 8)**: SessionStart, the broadest event, on purpose. The watcher dies while no session is open, so the next session start is the first moment anyone can be told. The cost is one 256 KB tail read; a healthy watcher prints nothing.

**Observability**: a fire appends one row to `domain/wa-watch-health/log.jsonl`: `ts` and `problems` (`stopped` · `login` · `waiting`). Central telemetry (`lib/hook-runtime.js`) carries every run, fired or not. The rows it reads are the watcher's own, in `%USERPROFILE%\.wa-read\events.jsonl`: `heartbeat` (every 5 minutes, with `pid`), `daemon-stop` (with `reason`), `judge-fallback`, `child-done`, `child-failed`, `child-retry`, `pending-carried`, `check-login`; and `pending` in `%USERPROFILE%\.wa-read\watcher\registry-<day>.json`.

**state-scoped**: no, state-agnostic. Machine-coupled, recorded here: the fix commands name `E:\Dev\scripts\WaRead` (override `WA_READ_ROOT`) and the log folder is `%USERPROFILE%\.wa-read` (override `WA_READ_HOME`).

**Picture**: `diagram.png` (source `diagram.html`).

**The three alarms** (each is one `WA-WATCH:` line with its fix command):

| Alarm | When | Fix it names |
|---|---|---|
| watcher STOPPED | a `daemon-stop` row is the newest sign of life, or the last heartbeat is older than 12 minutes and its `pid` is gone | `schtasks /run /tn "WaRead Watcher"` |
| Claude login DEAD | the newest login evidence is a failed `check-login`, a judge auth error or a child that failed on login | `claude login` (miya's step), then `wa-watch.js check-login` |
| starts WAITING | `pending` rows in the last 3 day registries | none needed: the running watcher retries every 5 minutes; `wa-watch.js status` lists them |

## Adversarial scenarios (system-design Rule 12, 2026-11-10)

| # | Scenario | Verdict |
|---|---|---|
| 1 | its own alarm text sits inside a log field | fixture-added: F14 |
| 2 | stdin is not JSON | fixture-added: F9 |
| 3 | broken lines in the log, broken registry JSON (also: read while the daemon is mid-write) | fixture-added: F8 |
| 4 | the log is far larger than the tail window | fixture-added: F12 (2 MB, tail only) |
| 5 | WaRead is not on this machine | fixture-added: F1 |
| 6 | WaRead is installed but the watcher never ran | fixture-added: F13 |
| 7 | the laptop slept; the heartbeat is late but the process lives | fixture-added: F5 (pid alive = not stopped) |
| 8 | the pid number is reused by another process after a stop | fixture-added: F6 (a stop row wins over the pid) |
| 9 | rows from the daemon before this change (no pid, no reason) | fixture-added: F15, F2 |
| 10 | `pending` in a registry is not a list | fixture-added: F17 |
| 11 | message words reach him through a session name | fixture-added: F7b (counts and times only) |
| 12 | a judge timeout is read as a dead login | fixture-added: F10, and WaRead selftest |
| 13 | judge down and the message is plain chat: a session fires for nothing | fixture-added: WaRead selftest (rules say skip) |
| 14 | a finished child's brief mentions "not logged in" and is read as a failure | fixture-added: WaRead selftest |
| 15 | a failed start is retried without end | fixture-added: WaRead selftest (5 tries; a login failure waits for a newer good check-login) |
| 16 | a waiting row is stranded when the day rolls over | fixture-added: WaRead selftest (carried into the new day once) |
| 17 | the daemon is killed with no stop row | fixture-added: F4 |
| 18 | worktree against main checkout paths | handled: the hook resolves its runtime from CLAUDE_PROJECT_DIR and its log from its own folder; run live in a worktree 2026-11-10 |
| 19 | two sessions start in the same second | accepted-risk: both only read; each may append one small log row, append-only |
| 20 | the alarm repeats at every session start until fixed | accepted-risk: that is the goal; one line per problem, silent again once fixed |
| 21 | rules-only judge fires on a ticket that already has an open quest | handled: the rules return follow-up for an open ticket (existing WaRead selftest) |
| 22 | the claude program is missing, so the child cannot start | handled: spawn error is logged as child-failed and the row waits |
| 23 | the daemon exits before its child ends, so the end is never logged | accepted-risk: the stop itself is alarmed; the child's own log file stays in `watcher\children` |
| 24 | the simplest instruction it could invert: "WhatsApp is read only" | handled: the check opens two kinds of local files and nothing else; it never loads the WaRead code |
