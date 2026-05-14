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

| | |
|---|---|
| **Quest status** | [active QA # / phase / status]  OR  [N closed yesterday / top held] |
| **Mode** | [Office hours → リドワンさん  /  Outside hours → みや] |
| **Priority today** | Q1: [top urgent item]  •  Next: [second item if any] |
| **Where we left off** | [1-2 sentence recap from current-session.md → Session Recap] |

| Standing flags |
|---|
| ⚠️ [flag 1] |
| ⚠️ [flag 2] |

Where would you like to start, <Mode name>?
```

---

## Rules

- Run `date` to get current time — always timestamp the briefing
- Read `quest/active.txt` for quest status
- Read `main/current-session.md` → Session Recap section for "where we left off"
- Read `main/todo.md` → Q1 section for top priority
- **Read `Feature/Forge-Self-Improvement-System/improvement-audit-log.md`** — count `- [ ]` (unchecked) entries. If N > 0, surface as a STANDING FLAG: `⚠️ N pending improvement-audit entries — review before dropping`. Never silently drop.
- If quest is active: also state what Phase we're in and the next step
- Briefing is SHORT — max 15 lines. No padding.
- **Closing salutation MUST inherit the name from MODE** (added 2026-05-14 by みや): if MODE says `Office hours → リドワンさん`, close with `Where would you like to start, リドワンさん?` — never switch names mid-briefing.
- **Standing-flags scope = ACTION-REQUIRED or AWARENESS-CRITICAL** (clarified 2026-05-14 by みや): things みや should know about or act on this session — environment drift, blocking dependencies, FAT-retest pending, sync issues, untested protocol changes that affect TODAY's work. NOT for general "watch-and-confirm-later" observations — those belong in `current-session.md` → Next Session Priority or Working Memory. If unsure: flag it ONLY if みや would course-correct on hearing it; otherwise drop to observation.
- After briefing: pause and wait for みや's direction. Do not start working.

---

## Example

```
⚔️ SESSION BRIEFING — Thu Apr 3 09:15 MPST 2026

| | |
|---|---|
| **Quest status** | Active: QA #253419 — PSBS Borang Kategori Kegunaan Tanah  •  Phase 1 executing |
| **Mode** | Office hours → リドワンさん |
| **Priority today** | Q1: QA-253419 implement fix at populateKegunaan():11124  •  Next: QA-253492 Phase 3 close |
| **Where we left off** | QA-253419 investigation complete. Fix = `else if (URS_PSBS)` reading `AppHakmilik.getKegunaanTanah()`. Resume from: verify return type → implement. |

| Standing flags |
|---|
| ⚠️ AWAM gap: kegunaan_tnh column missing in umm_p_hkmlk — needs senior sign-off |
| ⚠️ QA-246512: popup alert still needs FAT verification |

Where would you like to start, リドワンさん?
```

---

*Version: 1.1 | Last updated: 2026-05-14*
