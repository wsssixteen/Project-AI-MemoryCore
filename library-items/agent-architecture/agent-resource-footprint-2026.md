# Agent resource footprint — research + audit (2026-09-29)

Researched 2026-09-29 after the 2026-09-28 RAM incident (laptop hung at 93-96% RAM, 60 GB commit). Feeds system-rules Rule 7 and the resource-guard design. Re-research if older than 60 days.

## What happened (verified)

| Fact | Evidence |
|---|---|
| Every Claude Code session started all 21 user-scope stdio DB MCP servers (~23 processes, ~2.4 GB) | process trees 2026-09-22/28; 412 python + 139 pgedge for ~19 sessions |
| Finished sessions were never archived; 233 open sessions, 153 archived after a 14-gate safety check | session list 2026-09-28 |
| Fix: `E:\Dev\scripts\db-gateway` (shared, lazy, idle-stop HTTP gateway) → commit 60 GB → 12 GB | memory `project_db_gateway` |
| Task Scheduler default priority 7 starved the gateway while paging | gateway start took minutes until `-Priority 4` |

## External findings (web, sources checked by the researcher)

| # | Finding | Source |
|---|---|---|
| 1 | Stdio MCP servers start per session and live for the session; Tool Search defers schemas only, never the stdio process | code.claude.com/docs/en/mcp · anthropics/claude-code#97388 |
| 2 | `enabledMcpjsonServers` etc. gate project `.mcp.json` approval only; nothing reaps an idle session's MCP children | code.claude.com/docs/en/mcp · #81247 · #30595 |
| 3 | Same incident reported upstream: every session boots the whole server set, ~17 GB for 5 sessions; open, no fix | anthropics/claude-code#82952 |
| 4 | Idle desktop sessions keep full process trees (183 sessions → ~160 GB RSS); closed not-planned | #76268 · #82034 · #28860 (shared MCP daemon request, closed duplicate) |
| 5 | Windows orphan/respawn leaks incl. pdf-viewer, context7, playwright MCP respawn loops | #90362 · #67888 · #67163 |
| 6 | Prior art for our gateway: cache `tools/list`, spawn on first call, idle-shutdown (dsh-lazy-mcp, mcp-lazy-proxy, MCP Aggregator 30 min idle) | github xz-dev/dsh-lazy-mcp · sarthakpranesh/mcp-lazy-proxy · blog.lhotka.net 2026-02-15 |
| 7 | Localhost HTTP MCP needs a bearer token + Host/Origin check (DNS rebinding) | rafter.so · typescript-sdk GHSA-w48q-cv73-mx4w — db-gateway already has both |
| 8 | Each hook command spawns its own process; UserPromptSubmit hooks block the prompt; bundling cuts spawn cost | code.claude.com/docs/en/hooks · karanb192/claude-code-hooks |
| 9 | Windows **commit charge vs commit limit** predicts hangs better than working set / RAM % | comcomponent.com working-set-vs-commit |
| 10 | Worktrees are not garbage-collected; OneDrive + git thrashes small files | #26725 · #43730 · microsoft/WinDev#75 |

## Internal audit (2026-09-29, verified by controller)

| Component | Trigger | Cost |
|---|---|---|
| Hooks | UserPromptSubmit 36 · Stop 42 · PreToolUse 30 · SessionStart 13 · PostToolUse 7 commands | ~60-70 node spawns per prompt and per reply end; p50 ~1.2-1.4 s per hook |
| codegraph MCP | per session | cmd + node + conhost |
| pdf-viewer (claude.ai account plugin) | per session | npx node ×2 + cmd + conhost; toggle only in claude.ai settings |
| DB MCP (20) | on demand via db-gateway | 0 per session |
| Worktrees | per session | 56 dirs, 15.35 GB; delete frozen since 2026-09-27 |
| `system/telemetry` | every hook fire | 64 MB, no rotation (breaks Rule 6) |
| WaRead Watcher | scheduled | last exit 0xC0000409, invisible in-session |
| Observatory | manual | zero OS resource telemetry |

## Decisions (2026-09-29, per みや)

- system-rules **Rule 7** added + enforced at birth (forge `--footprint`, component-birth-gate `footprint:`).
- Monitoring must be **mechanical** (fires and acts), not a UI — design in `main/todo.md` Q1 "resource-guard".
- Open follow-ups in `main/todo.md` Q1.
