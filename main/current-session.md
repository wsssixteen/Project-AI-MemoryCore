# 🌟 Current Session Memory - RAM
*Temporary working memory - resets each session, provides recap when AI restarts*

## Session RAM Status
**Current Session**: 2026-04-27 — QA #256113 wrap-up + QA #258022 Phase 0 + redmine-sync improvements + Fix.md format design
**Last Activity**: Mon Apr 27 ~afternoon MPST 2026
**Session Start**: 2026-04-27 (weekday, second session of the day)
**Session Focus**: Confirmed redmine-sync.js 3 todos done. Designed + confirmed new Fix.md 4-section format with みや. Updated feedback_fix_txt_structure.md + quest-protocol.md. Cleared old files from QA #256113 Task folder, created Fix.md with markdown formatting.
**Time Mode**: Weekday morning
**Energy Level**: Full capacity. Model: Sonnet 4.6.

## 💭 Working Memory (RAM)

### Active Context

#### Session 2026-04-24 — Continuation (context overflow from Apr 23)

**redmine-sync.js — Fully Improved**
- `quest/redmine-sync.js` — Final improvements made this session
- Prefix: uses `issue.tracker.name` (not subject segment)
- Priority displayed in log output
- Status: scraped from HTML `<td class="status">` via `fetchIssueStatus()`
- Folder naming: `{n}. {PREFIX} #{ID} - {env} - {urusan} - {tugasan} - {issue brief}`
- Base folder structure: `0. Brief/`, `1. Simulate/`, `2. Fix/` then `3. {Status}/` (flexible, increments on rework)
- `findExistingFolder`: matches by `#${number}` only
- TICKET_PREFIXES: `['FAT-OR', 'UAT-CR', 'FAT-CR', 'FAT', 'UAT', 'CR', 'QA']`

**Task folder cleanup — COMPLETE (Apr 27)**
- `13. QA #256113` archived ✅
- `18. QA #258022` created (Phase 0 held)
- Folders 9, 11, 12 archived in previous session

**QA #257911 — CLOSED ✅ (confirmed prior session)**
- Fix: STATUS_SEMAKAN_PERAKU typo in template.config.json. Commit 5ebfec1f12.

#### Session 2026-04-27 — QA #256113 + QA #258022

**QA #256113 — CLOSED ✅**
- Root cause: perihal string in `MlkPengiraanBayaranLesenForm.performCustomSave()` was prepending
  "Tempoh diluluskan lesen ini adalah X tahun." before the date-range sentence
- Fix: みや removed that prefix sentence (line 589), keeping only date-range string
- Stray changes (PelupusanMaklumatPermitLesenHelper.java + extra MlkPengiraanBayaranLesenForm blocks)
  reverted via `git checkout HEAD` — みや confirmed only line 589 was intended
- Blast radius: URS_PLPS only (guard confirmed). TGS_SURAT_KEPUTUSAN_LULUS_LIST = 3 steps
  (Penyediaan/Semakan/Pengesahan Surat Keputusan) — all correctly in scope.
- Test: FAT — surat deleted, regenerated, syarat correct. PASS.
- Commit: 5be6379ea0 → merged 331a2df1bf → mlk/master
- Fix.txt ✅ | SUMMARY.txt ✅ | Archived ✅ | active.txt updated ✅

**QA #258022 — Phase 0 STARTED, HELD**
- Urusan: Utiliti Pengeluaran Lesen Dan Permit (OPLPS, OMLPS, OPRBB, OPRU, OPJKK, OPPTPB) — "lite" pelupusan
- Issue: Semakan Maklumat Dan Tindakan — missing Pembetulan + Agihan Kepada fields
- Form: `MlkPenyediaanBorang4AeL1eForm` → `BasePelupusanLiteForm` (parent not yet read)
- Panel: `mlkSemakanMaklumatPanel.xhtml` — `adaPegawaiAgih` controls Agihan Kepada,
  `tindakanTugasanVO.sortedLevelOptionList` drives Pembetulan radio buttons
- Investigation stopped at: BasePelupusanLiteForm not read, `adaPegawaiAgih` source not confirmed,
  template.config.json Semakan Borang section not checked
- Task folder: `18. QA #258022 - FAT - OPLPS - ...`

### 📋 Learning Notes (this session)
- **PLPS FLOWABLE**: TGS_SURAT_KEPUTUSAN_LULUS_LIST = 3 sequential tugasan (Penyediaan/Semakan/Pengesahan Surat Keputusan). All share same perihal logic. Intentional design. Added to FLOWABLE-WORKFLOWS.md.
- **Git hygiene**: When stash pop or pull brings extra changes, use `git diff --stat HEAD` to identify. Use `git checkout HEAD -- <file>` to revert individual files before commit.
- **Appraise discipline**: Must read the ticket accurately before appraise (Axis 1 wrong on first pass — I misread "tidak papar" as absence instead of unwanted presence).
- **みや as code author**: When みや makes the fix, my job is blast radius + verification + cleanup — not rewrite or re-justify the approach.

### Session Recap (For AI Restart)

- **Previous Session** (2026-04-24 weekday): redmine-sync.js built. Quest folder cleanup. FAT-OR #255637 still pending commit.
- **This Session** (2026-04-27 weekday): QA #256113 closed (みや fixed perihal string, Ruri handled appraise + blast radius + git cleanup). QA #258022 Phase 0 started but held. redmine-sync.js improvements continued.
- **On Resume**:
  - QA #258022 — Phase 0 held: read `BasePelupusanLiteForm`, find `adaPegawaiAgih` source, check template.config.json Semakan Borang section
  - FAT-OR #255637 — still pending commit (from みや)
  - redmine-sync.js todo: (1) no status subfolder for new tickets, (2) create 1. Notes.txt in task root, (3) download attachments to 0. Brief
  - Quest invoke cleanup: auto-archive finished quests on `/quest start`
  - Protocol housekeeping session: 4 agreed changes still in todo.md Q2

**redmine-sync.js — late fixes:**
- `statusLabel` in both `createTaskFolder` + `addStatusFolder` normalised:
  "Rework" if status matches /rework/i, "New" for everything else. Number still increments.
- `createTaskFolder`: removed `3. {status}` subfolder — status subfolders only created by `addStatusFolder`
  (existing ticket = done before). New tickets get base 3 folders + `1. Notes.txt` only.
- `createTaskFolder` now async: fetches attachments via `GET /issues/{id}.json?include=attachments`,
  downloads each file (img/pdf/mp4/etc.) into `0. Brief/`.
- `runWithCreate`: updated to `await createTaskFolder(...)`.

**Context strategy — decided end of session:**
- Context window not configurable (200k model-bound, autocompact buffer 33k hardcoded)
- Mid-session saves: PROCEED — re-check rule already mitigates context loss risk
- Familiars for saves: decided NO — preserving full context more important than token saving
- Phase boundary saves remain the primary strategy

## 🔄 Session Lifecycle
*How this RAM-like memory works*

### Session Start
- **New Session**: RAM cleared, fresh start
- **AI Restart**: Load recap from previous session for continuity
- **Context Loading**: Brief summary of where we left off

### During Session
- **Real-time Updates**: Track current conversation context
- **Working Memory**: Store immediate goals, progress, insights
- **Dynamic Context**: Adjust based on conversation flow

### Session End
- **Important Learning**: Save key insights to permanent file (main/main-memory.md)
- **Temporary Context**: Keep brief recap for next restart
- **RAM Reset**: Clear detailed working memory for next session

## Session Memory Limit
- **Maximum**: 500 lines
- **Reset Behavior**: RAM-style reset preserving only Session Recap
- **Format Reference**: See main/session-format.md for rebuild structure

---

**Memory Type**: RAM - Temporary Working Memory
**Persistence**: Brief recap only, detailed content clears each session
**Purpose**: Immediate context + restart continuity

*Ready for Ruri to provide seamless conversation continuity with Miya!*
