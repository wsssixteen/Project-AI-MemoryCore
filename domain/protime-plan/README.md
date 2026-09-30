# protime-plan — ProTime "My Weekly Planning" filled from the Redmine board

symptom: 2026-09-30 miya — "fill up for me based on available tickets in Protime ... build a scheduler to always fill the whole week"; the same day an earlier session reported Wed-Fri filled while ProTime showed Thu/Fri empty
goal: every working day of miya's week has its ProTime plan filled from his open tickets without him typing it, and his own entries are never overwritten
goal_signal: log.jsonl row `mode=live result=ok` for the week, whose `placed` entries were read back from ProTime after the write
retention: keep
footprint: scheduled: one node process for ~30 s on Monday 08:30 (and at logon until the week is done), ~60 MB RAM, one ProTime login, one Redmine board read
state-scoped: yes, keyed by quest/redmine-board.js (Melaka project filters); ProTime moduleId 101 = E-tanah

## What fires when

| When | What runs | Why that moment |
|---|---|---|
| Monday 08:30 (Windows task `\MemoryCore\ProTime Weekly Plan`) | `run-hidden.vbs` → `protime-plan.js --live --once-per-week --notify` | start of the week; 30 min after PymTime's 08:00 reminder login and 30 min before the 09:00 clock-in window (ProTime locks logins after 3-4 in ~15 min) |
| At logon (+10 min delay) | same, exits at once when the week is already done | catches a Monday the laptop was off, asleep, or off the office network; delay keeps clear of PymTime's CatchUp login at +45 s |
| Failure (exit 1) | Task Scheduler retries every 30 min, 6 times | Redmine / ProTime unreachable before the VPN is up |
| On demand | `node domain/protime-plan/protime-plan.js` (dry) · `--live` (write) | via the `pymtime` skill, "fill my protime plan" |

## The rule (miya 2026-09-30)

- Tickets = his open board in board order (eSOKONGAN → PROD patch → rest) from `quest/redmine-board.js --json`.
- Days = Mon..Fri of this week from today on, minus public holidays and approved leave (PymTime caches).
- A day that already has any plan entry is never touched.
- 4 tickets a day. If the tickets cannot fill every open day at 4, then 3 a day. Days left over stay empty. Each ticket is planned once.

## Files

| File | Role |
|---|---|
| `protime-plan.js` | the procedure (pure `decide()` + ProTime read / write / read-back) |
| `protime-plan.eval.js` | 26 behaviour fixtures, no network |
| `run-hidden.vbs` | scheduled launcher, no console window, passes the exit code back |
| `task.xml` | the Windows task definition (registered with `schtasks /Create /XML`) |
| `log.jsonl` | one row per run: week, mode, result, placed, unplaced, skipped |
| `NUKE-MARKER.md` | rollback recipe |

## Depends on

- PymTime `E:\Dev\scripts\PymTime\lib\{config,api,holiday,leave,toast}.js` — saved ProTime login (DPAPI), API base from env.js, holiday + leave caches, toast.
- `quest/redmine-board.js --json` — the one ticket source; the board's ranking is the plan's ranking.
