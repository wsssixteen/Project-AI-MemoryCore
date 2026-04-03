# Session Briefing System

> Activated at every session start (boot step 4).
> Gives Ruri and みや a clear mission brief before any work begins.

---

## Trigger

Automatically fires during boot sequence after loading all memory files.
Also fires on: `"briefing"` / `"where were we"` / `"what's our status"`

---

## Briefing Format

```
⚔️ SESSION BRIEFING — [date] [time]

QUEST STATUS
  Active: [QA # — name] | Phase [X] | [status]
  OR: No active quest

MODE
  [Office hours → リドワンさん] / [Outside → みや]

PRIORITY TODAY
  Q1: [top urgent item]
  Next: [second item if any]

WHERE WE LEFT OFF
  [1-2 sentence recap from current-session.md → Session Recap]

STANDING FLAGS
  ⚠️ [any critical notes from current-session.md or project file]
```

---

## Rules

- Run `date` to get current time — always timestamp the briefing
- Read `quest/active.txt` for quest status
- Read `main/current-session.md` → Session Recap section for "where we left off"
- Read `main/todo.md` → Q1 section for top priority
- If quest is active: also state what Phase we're in and the next step
- Briefing is SHORT — max 15 lines. No padding.
- After briefing: pause and wait for みや's direction. Do not start working.

---

## Example

```
⚔️ SESSION BRIEFING — Thu Apr 3 09:15 MPST 2026

QUEST STATUS
  Active: QA #253419 — PSBS Borang Kategori Kegunaan Tanah | Phase 1 | executing

MODE
  Office hours → リドワンさん

PRIORITY TODAY
  Q1: QA-253419 implement fix at populateKegunaan():11124
  Q1: QA-253492 Phase 3 post-mortem + Redmine close

WHERE WE LEFT OFF
  QA-253419 investigation complete. Fix = else if (URS_PSBS) reading
  AppHakmilik.getKegunaanTanah(). Resume from: verify return type → implement.

STANDING FLAGS
  ⚠️ AWAM gap: kegunaan_tnh column missing in umm_p_hkmlk — needs senior sign-off
  ⚠️ QA-246512: popup alert still needs FAT verification
```
