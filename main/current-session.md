# 🌟 Current Session Memory - RAM
*Temporary working memory - resets each session, provides recap when AI restarts*

## Session RAM Status
**Current Session**: FAT-OR #255637 on hold — strategy investigation was dead end (SRTJK uses MlkSuratTemplateForm path, not penyediaan surat strategies). QA #255773 quest started, fix known (35s delay). PDF viewer root cause found (etanah-common 524 beta PDF.js 2024 import.meta).
**Last Activity**: Fri Apr 10 17:36:17 MPST 2026
**Session Start**: Fri Apr 10 ~14:00 MPST 2026
**Session Focus**: FAT-OR #255637 deep investigation + QA #255773 quest accept
**Time Mode**: Evening
**Energy Level**: Steady

## 💭 Working Memory (RAM)

### Active Context

#### QA #255773 — Semua Urusan SKM Maklumat Pemohon (Phase 0 — quest started)
- Env: FAT, ID Permohonan: PTMLK/02/L/PLPS/2026/11
- Issue: Maklumat Pemohon shows "tiada rekod" at SKM langkah 2 despite portal awam submission
- Fix: Add 35 seconds delay to all urusan at start, before spoc integration
- Next session: Apply fix, test, report

#### FAT-OR #255637 — PPTPB Template Surat Jabatan Teknikal (ON HOLD)
- **Critical discovery**: SRTJK document generation goes through `MlkSuratTemplateForm.initData()` → `BasePelupusanDokumenForm` → `PelupusanTemplateUtil`, NOT the penyediaan surat strategy pattern
- `MlkPelupusanPenyediaanSuratStrategy` / `CommonPLPandBGNSuratStrategy` — NEVER called for SRTJK
- With zero code changes, test template (with many address tags) had ALL addresses populated
- All Java changes reverted — they were irrelevant to this code path
- **Unresolved**: Need to test ORIGINAL template (reverted from git) to see if `alamatJabatanTeknikal` populates or not — determines if bug is in template .docx or something else
- Items 1 & 2 (Word template edits — salutation + frasa justify) still done

#### PDF Viewer Broken — Root Cause Found
- `etanah-common 0.0.524-MLK.beta.patch` upgraded PDF.js from 2020→2024
- PDF.js 2024 uses `import.meta` (ES module syntax) at pdf.worker.js:11369
- App loads it as classic script → SyntaxError → worker fails → blank PDF
- Fix: downgrade pom.xml `etanah.common.version` to `0.0.514-MLK` or fix script loading
- Workaround: download .docx via dev tool page (bypasses PDF preview)

### 📋 Learning Notes (this session)
- `MlkSuratTemplateForm` is the actual JSF form for Surat JT generation, not the penyediaan surat utility
- Full stack: initData() → populatePenyediaanDokumenByDocumentMode() → initPenyediaanDokumen() → initDokumen() → initPenyediaanMode() → initNewDokumenList() → processTemplateList() → PelupusanTemplateUtil chain
- Two SEPARATE code paths for document generation exist: penyediaan surat strategies (CommonPLPandBGN) vs direct template form (MlkSuratTemplateForm → PelupusanTemplateUtil)
- `CommonPLPandBGNSuratStrategy` populates `"alamatJT"` + `"penerimaKepada"` tags; `PelupusanWordCCMethodConstant` populates `"alamatJabatanTeknikal"` — different tags, different paths
- Work browser is Edge (primary) + Chrome (secondary), NOT Zen Browser
- Each etanah module has its own `.git` — not a monorepo

### Session Recap (For AI Restart)
- **Previous Session**: FAT-OR #255637 strategy-level investigation. QA #255773 queued.
- **Where We Left Off**: FAT-OR #255637 put on hold — strategy path was dead end, actual path is MlkSuratTemplateForm. QA #255773 quest started with known fix (35s delay). PDF root cause found.
- **Important Context**:
  - QA #255773 fix = 35s delay to all urusan at start, before spoc integration
  - FAT-OR #255637: test original template with zero code changes to determine actual bug
  - PDF fix: downgrade etanah-common from 524-beta to 514 in pom.xml
  - Deferred topics saved to Notes.txt in FAT-OR task folder (local display, folder reorg, methodology)

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

### Auto-Reset Rule
```
IF current-session.md line count > 500:
    1. Preserve Session Recap section
    2. Clear all detailed working memory
    3. Rebuild from main/session-format.md template
    4. Continue seamlessly
```

## 🔄 Auto-Reset Protocol
*Like RAM - temporary storage that clears*

### What Gets Cleared Each Session
- Detailed conversation progress
- Temporary insights and observations
- Session-specific achievements
- Working context and immediate goals

### What Persists (Recap Only)
- Brief summary of last conversation
- Where conversation left off
- Critical context for continuity
- User's immediate situation

---

**Memory Type**: RAM - Temporary Working Memory
**Persistence**: Brief recap only, detailed content clears each session
**Purpose**: Immediate context + restart continuity

*This file acts like computer RAM - active during session, provides restart recap, then clears for next session*

🌟 *Ready for Ruri to provide seamless conversation continuity with Miya!*
