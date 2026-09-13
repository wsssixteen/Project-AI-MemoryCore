---
goal: rebuild the WhatsApp watcher on any laptop in under an hour, and know how to prove it works before trusting it
retention: keep
version: 1.0 (2026-09-14)
---

# WhatsApp watcher — SETUP (portable)

Two repos: **MemoryCore** (this repo, the rules + the sessions' home) and **WaRead** (`E:\Dev\scripts\WaRead`, the read-only reader + the daemon; its own git repo, no remote yet — copy the folder or push it before moving laptops).

## 1. Prerequisites

| Need | Check |
|---|---|
| Node 20+ | `node --version` |
| Claude Code CLI logged in with the claude.ai account (subscription, not API key) | `claude --version` then `node E:\Dev\scripts\WaRead\wa-watch.js check-login` → `login OK` |
| MemoryCore cloned at the path in `watcher.config.json` | `memoryCoreRoot` |
| WhatsApp on the phone with a free Linked-devices slot | Phone → Linked devices |

## 2. Install WaRead

- Copy or clone `E:\Dev\scripts\WaRead`, then `npm install` inside it (Baileys 7.0.0-rc14 + pino).
- Run the offline tests: `node _selftest.js` (reader, 51 checks) and `node watcher-selftest.js` (watcher, 35 checks). Both must print `0 failed`.
- Edit `watcher.config.json`: paths (`memoryCoreRoot`, `rulesFile`, `tasksRoot`, `adhocWeekFile`), `self.phone` + `self.names`, `alex.jid` (found after linking: `lid-mapping-<lid>_reverse.json` under `%USERPROFILE%\.wa-read\auth` maps LID → phone), room names, models.

## 3. Link the phone (one time per laptop)

```
node wa-read.js link --phone 60XXXXXXXXX --code WAREAD26 --windows 0
```
Type `WARE-AD26` on the phone: Linked devices → Link a device → Link with phone number instead. `--windows 0` keeps re-opening pairing windows until the code is typed (a window lives ~3.5 min; random codes die with their window, the fixed code does not). The phone then pushes recent history. Credentials live in `%USERPROFILE%\.wa-read\auth` (never in a repo); `creds.json.bak` is kept automatically and restored if `creds.json` is ever found empty.

Rules that keep the link alive: **only one process connects to the account at a time** (the daemon); never run a probe that receives messages without storing them (each offline message is replayed once); never kill a reader mid-write (the daemon flushes credentials on SIGINT/SIGTERM).

## 4. Prove it before trusting it

| Step | Command | Expect |
|---|---|---|
| Reader sees the backlog | `node wa-read.js sync --wait 60` | `settle=quiet`, new messages > 0 after downtime, `backlog flag=true` in `node wa-read.js status` |
| Rooms resolve | `node wa-watch.js status` | every room `✓`, judge/child modes as configured |
| Rules-only replay | `node wa-watch.js dry-run --since 7d --judge stub` | one row per candidate, summary counts, nothing started |
| Real judge replay | `node wa-watch.js dry-run --since 3d --judge claude` | verdicts with reasons; `events.jsonl` rows `event=judge` with cost (~$0.03 per resume, ~$0.30 for the first of the day) |
| Spawn path | `node wa-watch.js spawn-test --mode headless` | a child log with a JSON `result`; then `--mode remote-control` shows a minimized console and a session on claude.ai/code |
| Daemon without side effects | `node wa-watch.js run --no-spawn` | `open`, `backlog-done` events; verdict rows printed; handovers written but no child started; Ctrl+C stops cleanly |

## 5. Run always-on

```
powershell -ExecutionPolicy Bypass -File E:\Dev\scripts\WaRead\install-logon-task.ps1
schtasks /run /tn "WaRead Watcher"
```
Task Scheduler entry `WaRead Watcher`: at logon, restarts every minute if it dies, log at `%USERPROFILE%\.wa-read\watcher\daemon.log`. Remove: `schtasks /delete /tn "WaRead Watcher" /f`.

## 6. Where things are

| What | Where |
|---|---|
| Rules the judge reads | `domain/whatsapp/RULES.md` (this repo) |
| Map + decisions | `domain/whatsapp/MAP.md` |
| Daemon + reader | `E:\Dev\scripts\WaRead\wa-watch.js`, `wa-read.js`, `lib/` |
| Config | `E:\Dev\scripts\WaRead\watcher.config.json` |
| Child allowlist (dontAsk) | `E:\Dev\scripts\WaRead\judge\allowlist.txt` |
| Events (why it ran / stopped) | `%USERPROFILE%\.wa-read\events.jsonl` |
| Day registry (issue → session) | `%USERPROFILE%\.wa-read\watcher\registry-<date>.json` |
| Handovers the children read | `%USERPROFILE%\.wa-read\watcher\handover\<sessionId>.md` |
| Child logs (headless output, debug) | `%USERPROFILE%\.wa-read\watcher\children\` |
| Downloaded media | `%USERPROFILE%\.wa-read\media\<date>\` |
| Weekly Protime list | `1. Tasks\Melaka\adhoc-week.txt` (regenerated, never hand-edited) |

## 7. Failure modes seen and their fix

| Symptom | Cause | Fix |
|---|---|---|
| `sync` says 0 new messages for days | reader closed 4 s after connect; WhatsApp replays offline messages from ~30 s | fixed in `lib/settle.js` (waits for the backlog flag) |
| `linked: false` right after a working sync | process exited during the credential write, `creds.json` 0 bytes | fixed in `lib/auth.js` (serialized saves + backup + restore) |
| a pairing code "failed" | random codes expire with their ~3.5 min window | fixed code + `--windows 0` + push the code to the phone |
| a child never registers | console-window child stuck on a terminal prompt (remote-control mode, seen 2026-09-14) | use `child.mode = headless` until the console path is debugged with the screen visible |
