# 🌟 Current Session Memory - RAM
*Temporary working memory - resets each session, provides recap when AI restarts*

## Session RAM Status
**Current Session**: 2026-04-28 — QA #258022 implementation + scrutiny discussion
**Last Activity**: Tue Apr 28 15:57 MPST 2026
**Session Start**: 2026-04-28 (weekday, afternoon)
**Session Focus**: QA #258022 — 3 root-cause fixes implemented (tindakan.config.json SB4CE entry, MlkMaklumatUrusanPermitForm getter + initRenderPanel, PelupusanTugasanConstant TGSN_*_ALL constants). BasePelupusanLiteForm simplified (Codex's OR chains → ImmutableSet.contains). MlkPenyediaanBorang4CeP1eForm reverted to pre-Codex TRG reference pattern (out of scope). Deep scrutiny discussion with みや on every Codex change. Codebase categorization item added to todo.md Q2. Pending: FAT test.
**Time Mode**: Weekday afternoon
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

#### Session 2026-04-28 — QA #258022 Implementation

**QA #258022 — IMPLEMENTATION COMPLETE, PENDING FAT TEST**
- **Fix 1**: `src/main/resources/config/MLK/tindakan.config.json` — added `tugasanSB4CE_UTILITI` entry after `tugasanSMB_ALL`. `option_type: smb_all` → loads Pembetulan radio + Tindakan Seterusnya for all 6 Utiliti urusan.
- **Fix 2a**: `MlkMaklumatUrusanPermitForm.java:172` — getter: `URS_PRBB.equals(kodUrusan)` → `URUSAN_LITE_LIST.contains(kodUrusan)`
- **Fix 2b**: `MlkMaklumatUrusanPermitForm.java` `initRenderPanel()` — added URUSAN_LITE_LIST else-if block: sets `adaPegawaiAgih = true` when tugasan = TGS_SEMAKAN_BRG_4CE
- **Constants**: `PelupusanTugasanConstant.java` — added `TGSN_PENGESAHAN_BORANG_ALL`, `TGSN_PENYEDIAAN_BORANG_ALL`, `TGSN_SEMAKAN_BORANG_ALL` (ImmutableSet, each pairing base code + 4Ce code)
- **Simplify**: `BasePelupusanLiteForm.java` `onChangeTindakanKeputusan()` — Codex's 3 inline OR booleans replaced with `TGSN_*_ALL.contains(tugasanCode)`
- **Kept**: `MlkPelupusanPegawaiAgihService.java` SB4CE routing block (Codex, correct)
- **Kept pending test**: `PelupusanPegawaiAgihService.hasTugasanSemakanBorang` SB4CE fallback (likely dead code — clean up after FAT confirms)
- **Reverted**: `MlkPenyediaanBorang4CeP1eForm.java` — both Codex's `initEditModeBorang` (lines 117–127) and `initBukuDoketHelper` (line 142) reverted to TRG-reference pattern; out of scope (Penyediaan ≠ Semakan)

**Class chain confirmed:**
`MlkMaklumatUrusanPermitForm.xhtml → MlkMaklumatUrusanPermitForm.java → mlkSemakanMaklumatPanel.xhtml → tindakanTugasanVO [FIX 1] + adaPegawaiAgih [FIX 2a+2b]`

### 📋 Learning Notes (this session)
- **Appraise vs Simplify**: Appraise = scrutinise correctness of logic (especially external/Codex code). Simplify = assumes code is correct, looks for reuse/quality/efficiency improvements. Use appraise first when the source is unverified.
- **"Harmless" requires evidence**: Line 142 simplify in `MlkPenyediaanBorang4CeP1eForm` was called "harmless" — but `TGSN_PENGESAHAN_BORANG_ALL` included `PB4CE` (Codex's addition), original was `TGS_PENGESAHAN_BORANG` only. Untested path change is never harmless.
- **Codex correct-bean discipline**: Codex modified `MlkPenyediaanBorang4CeP1eForm` (Penyediaan) instead of `MlkMaklumatUrusanPermitForm` (Semakan). Always verify the bean serves the right XHTML before accepting changes.

### Session Recap (For AI Restart)

- **Previous Sessions** (2026-04-27): QA #256113 closed. QA #258022 Phase 0 held. QA #258418 Phase 0 investigated (awaiting clarification).
- **This Session** (2026-04-28): QA #258022 full implementation complete. 3 root-cause fixes + 2 simplify changes + 1 revert. Pending FAT test.
- **On Resume**:
  - QA #258022 — **PENDING FAT TEST**: Open `PTMLK/01/L/OPRBB/2026/1` on Semakan Borang step → verify Pembetulan radio (Ya/Tidak) + Agihan Kepada dropdown. Also test OMLPS.
  - Post-test cleanup: if FAT passes → remove SB4CE fallback in `PelupusanPegawaiAgihService.hasTugasanSemakanBorang`
  - QA #258418 — still awaiting BA/senior clarification
  - Protocol housekeeping session: 4 agreed changes pending (todo.md Q2)

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
