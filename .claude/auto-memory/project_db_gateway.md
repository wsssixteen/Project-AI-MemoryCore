---
name: project_db_gateway
description: "🚨 db-gateway (E:\\Dev\\scripts\\db-gateway, built 2026-09-28): ALL postgres-*/oracle-* MCP servers run behind ONE shared lazy gateway on 127.0.0.1:7411; how to check/fix/rollback; why"
metadata:
  type: project
---

**db-gateway** (built 2026-09-28 per みや, after the laptop hung at 93-96% RAM) = one Python process (Task Scheduler "DB Gateway", at logon + every 5 min, **Priority 4**) that serves all 20 database MCP servers to every Claude session over `http://127.0.0.1:7411/<name>/mcp`. A database server starts only on its first tool call, is shared by all sessions, and stops after 10 idle minutes; `tools/list` comes from `%USERPROFILE%\.db-gateway\tools-cache.json` so opening a session starts nothing.

- **Tool names are unchanged** (`mcp__postgres-mlkprod-pg__query_database` etc.): `~/.claude.json` keeps each name, only the transport became `http`. Hooks like prod-db-confirm still match.
- **Why it wasn't the default**: Claude Code starts every stdio MCP server in `~/.claude.json` for every session (no per-session on/off for user-config servers); 21 DB servers × 19 sessions ≈ 45 GB commit on a 15.4 GB laptop. Anthropic did not add a gateway; we built it.
- **Check**: `<oracle venv>\Scripts\python.exe E:\Dev\scripts\db-gateway\db_gateway.py status` (live servers + config drift). Oracle venv real path = `%LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Local\oracle-mcp\venv` (MSIX-virtualized; Claude-launched processes see it as `AppData\Local\oracle-mcp`).
- **DB tools failing / "Connection refused"** → gateway down: `schtasks /run /tn "DB Gateway"`, then `status`. Log `%USERPROFILE%\.db-gateway\gateway.log`, events `events.jsonl`, backend stderr `backends.log`.
- **Add a database**: add a normal stdio `postgres-*`/`oracle-*` entry to `~/.claude.json` → `db_gateway.py migrate` → restart the task.
- **Rollback**: `db_gateway.py rollback` (restores stdio entries from `backends.json`) + `schtasks /delete /tn "DB Gateway" /f`. Pre-migration backup: `%USERPROFILE%\.db-gateway\claude.json.backup-20260928-113701`.
- Credentials moved to `%USERPROFILE%\.db-gateway\backends.json` (never in git); bearer token in `token`; Host header checked.
- Proof: selftest 22/22 (laziness, cache, sharing, idle stop, crash restart, 401/404, migrate/rollback); `claude mcp list` = 20/20 `(HTTP) - Connected` with 0 servers started; real `SELECT current_database()` on mlkstg through the gateway OK.
- Lessons: Task Scheduler default priority 7 (below-normal CPU + low memory/I-O priority) starved the gateway for minutes while the laptop paged — always `-Priority 4` for daemons. `postgres-trgstg1-pg` / `trgstg2` are slow/unreachable on the network (same as before the gateway).
- Sessions opened BEFORE 2026-09-28 11:37 still hold their own stdio servers until restarted; restarting the Claude app moves them all onto the gateway.

- **`OSError(22, 'An Application Control policy has blocked this file')`** (2026-09-30) = Windows **Smart App Control** blocking the unsigned `C:\Users\Ridhwan\AppData\Local\pgedge-postgres-mcp\pgedge-postgres-mcp.exe` (all postgres MCP down; oracle ones fine, they run on signed Python). Check `HKLM:\SYSTEM\CurrentControlSet\Control\CI\Policy` VerifiedAndReputablePolicyState (1 = On, 0 = Off) + CodeIntegrity event 3077. SAC has no allow-list: miya turns it Off (Windows Security, App & browser control) or I query through JDBC meanwhile (see [[feedback_mlit_db_write_access]]).

Related: [[project_onedrive_worktrees]] · [[feedback_observability_vs_monitoring]].
