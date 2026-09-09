---
name: pymtime
description: Remote control of みや's PymTime clock-in app (E:\Dev\scripts\PymTime) — skip / unskip a day, pause, status. Triggers — "/pymtime", "skip today", "skip tomorrow", "skip clock in", "skip clock-in today", "skip pymtime", "skip pymtime clock in", "skip attendance", "don't clock in today/tomorrow", "cuti hari ini", "EL today", "emergency leave", "did pymtime run", "pymtime status", "pause pymtime", "resume pymtime", "undo skip". ANY of these = invoke this skill BEFORE replying — the phrase alone never triggers an action; this skill's confirm step does.
---

# /pymtime — remote skip / status for the daily clock-in

> born via core/forge.js 2026-09-07 · eval: `domain/pymtime/eval.js`
> symptom: a loose phrase like "skip today" could act on the wrong day or the wrong thing with no visible trace on the laptop
> goal: every remote skip lands on the exact intended date and is confirmed in chat AND on the laptop before みや moves on
> goal_signal: skip.js verification line quoted in chat + `skip-set` event with `source=remote` in `.pymtime/log.jsonl` + toast fired
> retention: keep

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

## Why this exists (2026-09-07)
みや asked for a remote skip path for emergency leave ("connect through claude remote session"). The phrase set is loose ("skip today", "skip attendance") — so a **mandatory ask-back with the real date + a visible confirmation** is the safety gate, the same pattern as the confirm-gated Submit / Clock-in-now buttons in the app.
