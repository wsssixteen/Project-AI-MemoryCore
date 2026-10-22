---
name: protime-plan
description: Update みや's ProTime "My Weekly Planning" — plan tickets, key in the day's adhocs in his wording, mark a ticket resolved, fix or remove a line, show a day, check the twice-daily run. ALWAYS invoke on — "/protime", "/protime-plan", "protime", "update my protime", "update protime", "fill protime", "isi protime", "key in protime", "add to protime", "add to today", "protime adhoc", "adhoc for protime", "did the plan fill", "plan status", "fill my protime plan", "weekly planning", "I just finished a ticket, add it", "resolve it in protime". Same script as the scheduled Windows task, so the skill and the scheduler cannot drift.
---

# /protime-plan — one door to his ProTime plan

> born via core/forge.js 2026-10-14 · Feature `domain/protime-plan/` · eval `node domain/protime-plan/eval.js`
> symptom: 2026-10-14 miya: "can you now create a skill from it? I can simply invoke it and you can update my protime very easily without explaining again"
> goal: every ProTime change he asks for is made by the same script the scheduler runs and read back from ProTime, with adhoc lines in his wording
> goal_signal: the reply carries the script's `WRITTEN and read back` line
> retention: keep · footprint: on-demand: one node process per command, ~60 MB, one ProTime login

**One source.** Every action runs `domain/protime-plan/protime-plan.js`, the same file the Windows task `\MemoryCore\ProTime Weekly Plan` runs. The run times and the planning rule are printed from that file and from `task.xml`, never copied here:

```bash
node domain/protime-plan/protime-plan.js --rules
```

Adhoc wording (the judgment half): `.claude/skills/adhoc-save/SKILL.md` § "Adhoc title (ProTime)". The script refuses a line that breaks his format (`lintLine`), so a bad line never reaches ProTime.

## Steps

| He says | Run | Then |
|---|---|---|
| "status", "did it run" | `--status` | paste the verdict and the `next:` line |
| "show today" / a date | `--show YYYY-MM-DD` | one drawing of the day: plan, adhoc, resolved |
| "update my protime", "key in today's adhocs" | 1. `--sessions YYYY-MM-DD` 2. title each ask with the wording rule 3. show the lines in one drawing 4. on his yes, `--add-adhoc YYYY-MM-DD "<line>"` per line | the read-back line of each command |
| "I finished <ticket>", "add <ticket> to today" | `--show` first; on the day → `--resolve YYYY-MM-DD <ticket>`; not there → `--add-plan YYYY-MM-DD <ticket>`, then `--resolve` | read-back line |
| "resolve that adhoc line" | `--resolve YYYY-MM-DD entry:<entry id>` | read-back line |
| "fix that line" | `--rename YYYY-MM-DD <entry id> "<new line>"` (adds the new line, then deletes the old one) | read-back line |
| "remove that line" | `--remove YYYY-MM-DD <entry id>` | only on his word, one line at a time |
| "run it now", "fill the plan" | dry first: no flag (morning) or `--night`; then the same with `--live` | read-back line |

Run every command from the MemoryCore root. A session folder works too: the log is always the main checkout's.

## Rules for me

- Show before write: a line he has not seen is never written. Exception: a `--live` run he asked for, and the scheduled runs.
- One drawing per reply, never a long table of lines.
- `WRITTEN and read back` is the only proof. Without it, say it is not written.
- An entry he typed or edited is renamed or removed only on his word for that one entry.
- ProTime's create-or-update call replaces a whole day: never call it. Adds go through the script.

## Checks

`node domain/protime-plan/eval.js` holds this skill and the script together: every command named here must exist in the script, every on-demand command of the script must be named here, the run times must match `task.xml`, and every full example line in the wording rule must pass the script's line check. A change on either side that breaks the other turns the check red.
