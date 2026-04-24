# 🌟 Current Session Memory - RAM
*Temporary working memory - resets each session, provides recap when AI restarts*

## Session RAM Status
**Current Session**: 2026-04-24 — Quest cleanup + BUG-BESTIARY Pattern 003 + Redmine sync
**Last Activity**: Fri Apr 24 15:13:24 MPST 2026
**Session Start**: 2026-04-24 (weekday, afternoon — continuation from 2026-04-23 session that ran out of context)
**Session Focus**: QA #257569 rework closed. Redmine API auto-task setup (redmine-sync.js). Quest folder cleanup (tools/docx/ + handoff migration). /appraise v1.1. BUG-BESTIARY Pattern 003.
**Time Mode**: Weekday afternoon
**Energy Level**: Full capacity. Model: Sonnet 4.6.

## 💭 Working Memory (RAM)

### Active Context

#### Session 2026-04-23 — QA #257911 closed + QA #257569 rework closed

**QA #257911 — CLOSED ✅**
- Root cause: Config typo — `STATUS_SEMAKAN_PERAKU` (never a real constant) in PKMMKN action list of `template.config.json`
- Fix: 2-line change in `template.config.json` — PKMMKN entries under `PLP_SRTKPTSN_PTG`
- Fix #2 (regenerateDocumentWithSignature) — investigated, NOT needed; fix #1 sufficient

**QA #257569 — CLOSED ✅ (Rework)**
- Root cause: FAT `PLP_TJN_PMH_PT` had stale billing-period data; code fix wires KAT_TNH (already correct on FAT) to the dropdown
- Code fix (PelupusanExcelReaderHelper.java): `excluded.add("Perniagaan")` + `tujuanPermohonanSelectItems = tujuanPermohonanPTSelectItems`
- UAT KAT_TNH patched via `3. Rework/1. SCRIPT - update_uat_kat_tnh.sql`
- みや applied + confirmed working
- Key lesson: check environment (FAT vs UAT) at Phase 0 before any analysis

#### Session 2026-04-24 — Quest cleanup + knowledge migration

**Redmine sync — redmine-sync.js created**
- `quest/redmine-sync.js` — polls Redmine API, classifies tickets (new/rework), auto-creates Task folders
- Usage: `node quest/redmine-sync.js [--poll] [--create]`
- みや to add API key at line 14 (`REDMINE_KEY`)

**Quest folder cleanup — COMPLETE**
- 5 stale PS1 scripts → `tools/docx/` (3 clean generic scripts: Read-DocxTags.ps1, Read-DocxText.ps1, Dump-DocxXml.ps1)
- BUG-BESTIARY: Docx Debugging Tools section added
- handoff-255773.md → `etanah-knowledge/melaka/handoff-255773-spoc-swallow.md`
- handoff-256113.md → `etanah-knowledge/melaka/handoff-256113-sdt-regen.md`
- BUG-BESTIARY: **Pattern 003 added** (row-level SDT cleared on Selesai regen)
- `/appraise` skill updated to v1.1 (DB blast radius checklist in Axis 2 Q2)

**FAT-OR #255637 — STILL HELD (pending_commit)**
- Fix applied, pending みや code review → commit → push → close Redmine

### 📋 Learning Notes (this session)
- **Environment-first at Phase 0**: always confirm FAT vs UAT (or whatever the ticket env is) before any analysis — this session's key failure
- **KAT_TNH blast radius**: shared reference data (senarai_kumpulan_id=145) consumed by etanah-awam Pelupusan + Pembangunan applicant-facing forms — any patch affects them
- **Redmine API > email parsing** for ticket ingestion — cleaner, more reliable, no IMAP dependency
- **DB blast radius in /appraise**: added explicitly to Axis 2 Q2 so it's never skipped again
- **Row-level SDT regen pattern (Pattern 003)**: Tr→Tbl destructive mutation on first pass; fix = force classpath reload on regen via transient flag

### Session Recap (For AI Restart)

- **Previous Session** (2026-04-23 weekday): QA #257911 closed (config fix). QA #257569 rework closed (code fix + UAT data script). /appraise run. Redmine sync built.
- **This Session** (2026-04-24 weekday): Handoff files migrated to knowledge folder. BUG-BESTIARY Pattern 003 added. Quest cleanup completed. save all.
- **On Resume**:
  - FAT-OR #255637 — still pending みや code review + commit + Redmine close
  - Redmine API key — みや to add to `quest/redmine-sync.js` line 14
  - Protocol housekeeping session: 4 agreed changes still in todo.md Q2
  - QA #257569 UAT data script — confirm BA/data team executes on UAT server

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
