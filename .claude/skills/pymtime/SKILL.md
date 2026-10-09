---
name: pymtime
description: Remote control of みや's PymTime clock-in app (E:\Dev\scripts\PymTime) — skip / unskip a day, pause, status — AND diagnosing a colleague's pasted PymTime HANDOVER block (§Handover). Triggers — "===== PYMTIME HANDOVER", "pymtime handover", "handover from <colleague>", "colleague's pymtime", "continue pymtime", "work on pymtime", "pymtime feature", "pymtime roadmap" (→ read the project folder first), "/pymtime", "skip today", "skip tomorrow", "skip clock in", "skip clock-in today", "skip pymtime", "skip pymtime clock in", "skip attendance", "don't clock in today/tomorrow", "cuti hari ini", "EL today", "emergency leave", "did pymtime run", "pymtime status", "pause pymtime", "resume pymtime", "undo skip", AND the ProTime weekly plan (§Weekly plan) — "fill my protime plan", "fill the planner", "weekly planning", "my weekly planning", "plan the week in protime", "isi plan". ANY of these = invoke this skill BEFORE replying — the phrase alone never triggers an action; this skill's confirm step does.
---

# /pymtime — remote skip / status for the daily clock-in

> born via core/forge.js 2026-09-07 · eval: `domain/pymtime/eval.js`
> symptom: a loose phrase like "skip today" could act on the wrong day or the wrong thing with no visible trace on the laptop
> goal: every remote skip lands on the exact intended date and is confirmed in chat AND on the laptop before みや moves on
> goal_signal: skip.js verification line quoted in chat + `skip-set` event with `source=remote` in `.pymtime/log.jsonl` + toast fired
> retention: keep

**Any PymTime work beyond a skip / status / pasted handover** (a fix, a feature, a build, a design change): read `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\projects\coding-projects\active\PymTime\PROJECT.md` first (the MAIN checkout, always this full path; a session folder may hold an old copy). It is the project index (state, version record, architecture, proofs, roadmap).

PymTime clocks みや into Protime once a day at a random time in his window. A **skip** is a flag file `skip-YYYYMMDD` in `%USERPROFILE%\.pymtime\`; anything that creates it (Settings page, reminder toast, or this skill) stops that day's clock-in. This skill only ever creates/removes those flags — it can **never** cause a clock-in.

## 1. Parse → then ASK BACK before touching anything

| He says | Meaning | Ask back (exact shape) |
|---|---|---|
| "skip today" / "skip" alone | ambiguous — skip WHAT? | `Skip the PymTime clock-in for TODAY (Mon 7 Sep 2026)? — yes / tomorrow / <date>` |
| "skip clock in today" · "skip pymtime" · "skip attendance" · "EL today" · "cuti hari ini" | clock-in skip, day = today | `Skip PymTime clock-in for TODAY (Mon 7 Sep 2026)? — yes / no` |
| "skip tomorrow" + any clock-in word | day = tomorrow | `Skip PymTime clock-in for TOMORROW (Tue 8 Sep 2026)? — yes / no` |
| "skip until Friday" · "skip 12–15 Sep" · "on leave next week" | range | `Skip PymTime clock-in Thu 10 → Fri 11 Sep 2026 (2 days)? — yes / no` |
| "undo skip" · "clock me in after all" | clear | `Remove the skip for <label> — PymTime WILL clock you in that day? — yes / no` |
| "did pymtime run" · "status" · "pymtime status" | read-only | no ask-back — run status and answer |
| "pause pymtime" / "resume" | task on/off | `Pause PymTime (no clock-ins until you Resume)? — yes / no` |

Rules:
- **Always name the real calendar date** in the ask-back (`Mon 7 Sep 2026`), never just "today" — run `date` first if unsure.
- **Today after the window has closed (≥ 10:00) is a no-op** — say so: "Today's window is already over (it {clocked in at HH:MM | did nothing}) — do you mean tomorrow?"
- **If today already clocked in** (status shows `clocked-in` today), a skip for today changes nothing — tell him, offer tomorrow.
- One-word "yes" from him = go. Anything else = re-ask or stop. Never act on the trigger phrase alone.

## 2. Act — one command, run from the PymTime folder

```bash
node E:\Dev\scripts\PymTime\skip.js today --source remote
```
```bash
node E:\Dev\scripts\PymTime\skip.js tomorrow --source remote
```
```bash
node E:\Dev\scripts\PymTime\skip.js 2026-09-12 2026-09-15 --source remote
```
```bash
node E:\Dev\scripts\PymTime\skip.js clear tomorrow --source remote
```
```bash
node E:\Dev\scripts\PymTime\skip.js list
```
Status (last run + planned skips + task state):
```bash
node -e "const s=require('E:/Dev/scripts/PymTime/setup.js');const k=require('E:/Dev/scripts/PymTime/lib/skip');console.log(JSON.stringify({lastRun:s.lastRun(),tasks:s.tasksState(),skips:k.listSkips().map(x=>x.label)}))"
```
Pause / resume (`false` = pause, `true` = resume):
```bash
node -e "console.log(require('E:/Dev/scripts/PymTime/setup.js').setTasksEnabled(false))"
```

## 3. Confirm back — visible in TWO places, always

1. **In chat** — quote the command's `verification` line verbatim, e.g. `PymTime will NOT clock in on Tue 8 Sep 2026.` plus `Planned skips now: …` from `allSkips`.
2. **On the laptop** — `skip.js` (without `--quiet`) fires a Windows toast *"PymTime will skip clock-in — Tue 8 Sep 2026 — set remotely"* so the change is visible on the machine itself, and the Settings page shows it as a chip with an ✕ undo.

If the command errors (`date is in the past`, `bad date`) — show the error, re-ask; never retry with a guessed date.

## Weekly plan — ProTime "My Weekly Planning" (added 2026-09-30)

Feature `domain/protime-plan/` (README has the rule + schedule). It runs by itself every Monday 08:30 and at logon until the week is done. On demand:

1. Dry run first, show him the printed plan:
   `node domain/protime-plan/protime-plan.js`
2. He asked to fill (or already said "fill") → write + read back:
   `node domain/protime-plan/protime-plan.js --live`
0. "did the plan fill" / "plan status" / "check Monday" → `node domain/protime-plan/protime-plan.js --status` and paste its verdict + `next:` line. Do that next action when it is mine to do.
3. Reply = the printed day lines + `WRITTEN and read back: N entries`. A result without that read-back line is NOT filled — say so.

Rule: 4 tickets a day; if they cannot fill every open day at 4, then 3 a day; leftover days stay empty; days that already have any entry are never touched. **Banned**: typing the plan in the ProTime page by browser · saying "filled" from a chat plan without the script's read-back line (2026-09-30: a session reported Wed-Fri filled while ProTime showed Thu/Fri empty).

## Handover — a colleague's laptop reports back (added 2026-09-28)

**The loop**: a colleague drops the PymTime zip into Claude Code; their Claude extracts it to `C:\PymTime`, reads its `CLAUDE.md`, opens the page (`start-page.js`), waits while they type the login (`wait-setup.js`), then runs `handover.js --json` (reuses the page's check after Save). Without Claude Code: `Check PymTime.bat`. It shows them READY / NOT READY and a block they paste to みや by WhatsApp / Teams / email. みや pastes it here. The `pymtime-handover` hook fires on the block's `===== PYMTIME HANDOVER v1 =====` / `===== END PYMTIME HANDOVER =====` lines in ANY session.

**The block** (written by `E:\Dev\scripts\PymTime\lib\handover.js`): `Person` (name + login local part) · `Result` (Verify headline) · `When` · `Build` (their version + folder) · `Laptop` (Windows, uptime, free RAM, CPU busy) · `Setup` (window, workdays, paused, Protime address) · `Checks` (counts, then every FAIL / warn / not-tested row; **the first FAIL is the cause, later ones follow from it**) · `Days` (last 10 workdays) · `Week` (7-day counts) · `Events` (notable log rows, repeats folded as `xN`).

**Procedure**
0. **A photo instead of text** (screenshot of the check window / Claude Code): read the image, transcribe the Result + every FAIL/warn row, mark the diagnosis *partial*, and ask for the text block (`PymTime handover.txt` beside `Start PymTime.bat`, or the box Claude Code showed).
1. **Cut block?** No first or END line = the chat app cut it. Say so and ask for the whole block (or `PymTime handover.txt` beside their `Start PymTime.bat`). Diagnose what is there, marked partial.
2. **Match the signature** (first match wins), then open the cited PymTime source to confirm before claiming it:

| Signature in the block | Cause | What the colleague does |
|---|---|---|
| `Build` older than `E:\Dev\scripts\PymTime\VERSION.txt` + a FAIL that a newer build fixes | old build | install the newest zip over the same folder |
| `Week` ps_fail (timeout N) high + `no-password` · FAIL "PowerShell … too busy" or "saved Protime password … not read in time" · low RAM / CPU 100% | PowerShell starved (v17: tasks at `<Priority>4`, run retries the decrypt through the window) | install v17+ (self-repair re-registers the tasks on the next run); close programs; password is fine, do NOT retype |
| FAIL "daily schedule" detail `ClockIn: priority` | pre-v17 tasks, not yet repaired | open the PymTime page once (or wait for the next run): self-repair fixes it |
| FAIL "daily schedule" detail `action` / "another PymTime folder owns the schedule" | two PymTime copies; the schedule points at the other folder | open `Start PymTime.bat` in the folder they want to keep, delete the other |
| `Setup` line `PAUSED` | paused on purpose or by accident | press Start on the page |
| FAIL "Protime shows YOUR attendance row" ("row was not found") | username spelling differs from Protime's | retype the username exactly as Protime shows it, Save |
| warn/FAIL "laptop clock and time zone" (N min ahead/behind) | clock skew | Windows Settings → Time → Sync now |
| warn "sits in a safe folder" (OneDrive / Desktop) | install place | move to `C:\PymTime`, Start PymTime there |
| verdict READY BUT NOT PROVEN with Protime reachable | a Protime answer was inconclusive | check again in 15 min |
| FAIL "Protime accepts your username and password" · `login-failed` | Protime password changed | open the page, retype the password, Test login, Save setup |
| `throttled` in Week | 3–4 logins within ~15 min | wait 15 min, check once |
| FAIL "Protime can be reached" · not tested Protime rows | not on office network / VPN | connect, check again |
| FAIL "Task Scheduler really starts PymTime" / "start itself" | IT policy or bad folder | extract to `C:\PymTime`, Start PymTime again; still failing → IT |
| FAIL "All PymTime files are here" · `node-missing` | half unzip / antivirus | unzip again over the folder; ask IT to allow `node.exe` |
| `Days` all `clocked` / `by-hand`, verdict READY | healthy | nothing |
| none of the above | unknown | read `E:\Dev\scripts\PymTime\FAILURE-MODES-AND-TESTS.md` + the check's source in `lib\verify.js`; never guess |

3. **Reply to みや**: first line = the cause in plain words (or "healthy"). Then the rows that prove it (quote them). Then a **sendable reply to the colleague** in a `text` block: plain short sentences, what to do, no jargon (same style as a BA-facing reply). If the fix is on our side (a PymTime bug), say that instead and name the file.
4. If the block shows a PymTime **bug** (not the colleague's setup), fix it in `E:\Dev\scripts\PymTime` like any bug: root cause first, then the fix, `_selftest.js`, and a new build.
5. **みや's ask wins**: if he only asks "what does it say", summarise; do not start a fix.
6. **Record it**: add a row to "Colleague installs" in `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\projects\coding-projects\active\PymTime\PROJECT.md` (section 7: date · person · build · verdict · note) and update its section 1. Installed = the install-day block says READY; proven = a second block after their first workday shows a clock-in made by PymTime.

Banned: diagnosing from memory without opening the cited source · asking the colleague for their password · telling them to re-enter a password when the signature is a PowerShell timeout (the 2026-09-28 misdiagnosis this loop exists to stop).

## Why this exists (2026-09-07)
みや asked for a remote skip path for emergency leave ("connect through claude remote session"). The phrase set is loose ("skip today", "skip attendance") — so a **mandatory ask-back with the real date + a visible confirmation** is the safety gate, the same pattern as the confirm-gated Submit / Clock-in-now buttons in the app.
