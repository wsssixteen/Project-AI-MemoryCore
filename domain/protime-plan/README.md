# protime-plan — ProTime "My Weekly Planning" kept true, twice every working day

symptom: 2026-09-30 miya — "fill up for me based on available tickets in Protime ... build a scheduler to always fill the whole week"; 2026-10-13 miya — "it is better for you to update it daily ... check the tickets that we've done yesterday AND also check redmine ... removing tickets we didn't actually do for the day ... add the adhoc for night run as well"
goal: every working day of miya's ProTime plan shows the tickets and adhocs he really worked, without him typing them, and nothing he typed is ever changed or removed
goal_signal: log.jsonl row `mode=live result=ok` for the day, whose `created` and `removed` entries were read back from ProTime after the write
root_cause_of_symptom: 2026-09-30 a session showed a plan in chat and saved it as "filled" with no ProTime call. 2026-10-13 the weekly run filled Monday only (3 tickets on the board) and then never ran again that week, so new tickets and real work never reached the plan.
retention: keep
footprint: scheduled: one node process for about 30 to 60 s at 08:30 and 23:00 on working days (and at logon), ~60 MB RAM, one ProTime login per run, one Redmine read (the board in the morning; the day's updated tickets + their journals in both runs)
state-scoped: plan tickets yes, keyed by quest/redmine-board.js (Melaka project filters) and the Melaka Redmine project; adhocs no (every state, the state word is added to the line); ProTime moduleId 101 = E-tanah

## What fires when

| When | What runs | Why that moment |
|---|---|---|
| Mon to Fri 08:30 (Windows task `\MemoryCore\ProTime Weekly Plan`) | `run-hidden.vbs` → `protime-plan.js --auto --live --once --notify` = MORNING run | start of the day; 30 min after PymTime's 08:00 reminder login and 30 min before the 09:00 clock-in window (ProTime locks logins after 3-4 in ~15 min) |
| Mon to Fri 23:00 | same command = NIGHT run (`--auto` picks night from 18:00) | end of the day, after the work is done |
| At logon (+10 min delay) | same; `--once` exits at once when that run of the day is done | catches a run the laptop slept through; a night run that fires the next morning becomes that day's morning run, which settles yesterday anyway |
| Failure (exit 1) | Task Scheduler retries every 30 min, 6 times | Redmine / ProTime unreachable before the VPN is up |
| On demand | `node domain/protime-plan/protime-plan.js` (dry morning) · `--night` · `--day YYYY-MM-DD` · add `--live` to write | via the `pymtime` skill |

## The rule (miya 2026-09-30, changed 2026-10-13)

```
 MORNING RUN  08:30                    NIGHT RUN  23:00
 Settle the previous working day       Settle today
 (always, even if last night ran)
        |
 Top up today to 4 tickets
        |
 Plan the rest of the week (4 a day, else 3 a day)
```

Settle a day = make it say what was really worked:

| Case | What happens |
|---|---|
| Worked ticket of his, missing from the day | added as a PLAN entry (the number) |
| Worked ticket that was never assigned to him, missing | added as an ADHOC entry `<number> - Assist` (or the block's `title=`) |
| Adhoc started or worked that day, missing | added as an ADHOC entry in his wording (`protimeLine`) |
| PLAN entry this script placed, still PENDING, still the bare number, not worked | removed |
| Entry he typed, entry he edited, RESOLVED entry, any ADHOC entry | never touched |
| Public holiday, approved leave, weekend | day left alone |
| Redmine unreachable | nothing removed |

"Worked" = 2 or more turns on the quest in the turn ledger that day (`system/telemetry/turns*.jsonl`, the ledger's fallback guess `top-active` excluded), or a Redmine note he wrote that day. Adhocs: block `quest_start` = the day, or 2 or more ledger turns. An adhoc with no `title=` is listed in the run's notes and not written.

Plan rule (KPI 3, miya 2026-10-14): tickets = his open board in board order (eSOKONGAN → PROD patch → rest). Today is topped up to 3. A later day that already has any plan entry is not touched. 3 a day; days left over stay empty. A night run adds a worked ticket of his to the plan only while the day holds fewer than 3, finished ones first.

Plan or adhoc (miya 2026-10-14): a worked ticket is PLAN when it is his (first fix commit his, no other owner in our record) or he added his own fix or patch that day; a ticket someone else fixed is ADHOC `<number> - <action>`. Resolve: a plan ticket passed on in Redmine that day; an assist he worked that day; any other adhoc unless it waits on infra or a user. A day he approved line by line is left alone.

Adhoc wording: read from the 121 adhoc entries he keyed (2026-07-13 to 2026-10-12). The rule lives in `.claude/skills/adhoc-save/SKILL.md` § Adhoc title; this script only adds the env and state words.

## ProTime facts (proven 2026-10-13 on an empty day, test entries removed)

| Call | Behaviour |
|---|---|
| `POST staff-plan/bulk/create` | adds only, returns the new ids. The only write this script uses to add. |
| `POST staff-plan/bulk/create-or-update` | REPLACES the whole day for that category. Never used: it would delete his entries. |
| `DELETE staff-plan/<id>` | removes one entry |
| `GET staff-plan/self` | every entry has `id`, `status` (PENDING / RESOLVED), `categoryTask` (PLAN / ADHOC) |

Which entries are "placed by this script": the ids in `log.jsonl` (`created`), plus the names the old weekly rows placed (`placed`, it kept no ids).

## After a run: what happened, and what to do next

`node domain/protime-plan/protime-plan.js --status` (reads `log.jsonl` in the MAIN checkout, no network).

| Verdict | Meaning | Next action |
|---|---|---|
| FILLED | today a run added or removed entries, read back from ProTime | nothing |
| NOTHING TO FILL | today a run found the plan already true | nothing |
| FAILED | the last run today failed | the `next:` line (one fixed action per result, table `NEXT` in protime-plan.js) |
| DID NOT RUN | a working day, past 08:30, no row | run `--live` by hand, then check the Windows task |
| NOT DUE YET | before 08:30, or a weekend | nothing |

Where a run shows itself: a toast on the laptop (when it changed something, or a failure after 11:00) · one row in `log.jsonl` (failed rows carry `next`).

## Files

| File | Role |
|---|---|
| `protime-plan.js` | the procedure (pure `decide()` + `settle()` + `lintLine()` + ProTime read / add / delete / resolve / read-back) and the on-demand commands of the skill |
| `.claude/skills/protime-plan/SKILL.md` | the skill: one door for his asks; runs only this script; copies no rule (`--rules` prints them) |
| `redmine-read.js` | Redmine reads only (GET): tickets he wrote on a day, and whether each was ever his |
| `sessions.js` | his own prompts of a day, read from the session transcripts (`--sessions`) |
| `naming-cases.json` | 37 of his real ProTime adhoc lines beside what our records said; the blind naming test set |
| `eval.js` → `protime-plan.eval.js` | 93 fixtures, no network: planning, settle, his line format, the skill-script sync checks |
| `run-hidden.vbs` | scheduled launcher, no console window, passes the exit code back |
| `task.xml` | the Windows task definition (registered with `schtasks /Create /XML`) |
| `log.jsonl` | one row per run: day, run, mode, result, created, removed, placed, notes. Lives in the MAIN checkout only. |
| `NUKE-MARKER.md` | rollback recipe |

## Depends on

- PymTime `E:\Dev\scripts\PymTime\lib\{config,api,holiday,leave,toast}.js` — saved ProTime login (DPAPI), API base from env.js, holiday + leave caches, toast.
- `quest/redmine-board.js` — the ticket source for the plan, and the one home of the Redmine address and key.
- `system/telemetry/turns*.jsonl` (turn ledger) and `quest/active.txt` + `quest/active-archive.txt` — what was worked, and the adhoc titles.
- `.claude/skills/adhoc-save/SKILL.md` § Adhoc title — the wording rule for the title this script writes.
