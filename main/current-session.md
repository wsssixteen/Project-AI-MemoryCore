# 🌟 Current Session Memory - RAM
*Temporary working memory - resets each session, provides recap when AI restarts*

## Session RAM Status
**Current Session**: QA #255773 completed (13/13 flowables). QA #255940 completed. All quests archived except FAT-OR #255637 (on hold).
**Last Activity**: Fri Apr 10 20:17:41 MPST 2026
**Session Start**: Fri Apr 10 ~17:53 MPST 2026
**Session Focus**: QA #255773 flowable execution + QA #255940 quick fix + housekeeping
**Time Mode**: Evening
**Energy Level**: Steady

## 💭 Working Memory (RAM)

### Active Context

#### QA #255773 — Semua Urusan SKM Maklumat Pemohon (COMPLETE)
- Fix: 35s delay added to all 13 urusan flowables
- All BPMN + PNG saved in task folder `1. Fixes/`
- FLOWABLE-WORKFLOWS.md updated in etanah-knowledge

#### QA #255940 — PSBS SBTL Unit Role (COMPLETE)
- Flowable unit role showing Pelupusan instead of Pendaftaran for SBTL endorsement
- Quick fix, no testing
- Task folder created + archived

#### FAT-OR #255637 — PPTPB Template Surat Jabatan Teknikal (ON HOLD)
- Strategy investigation was dead end — SRTJK goes through MlkSuratTemplateForm
- Need to test original template with zero code changes
- All Java changes reverted

#### PDF Viewer Broken — Root Cause Found
- etanah-common 0.0.524-MLK.beta.patch → PDF.js 2024 import.meta crash
- Fix: downgrade to 0.0.514-MLK

### 📋 Learning Notes (this session)
- Flowable naming: MLK_PLP_<URUSAN>.bpmn20.xml
- 13 portal urusan confirmed + organized alphabetically in DOMAIN-GLOSSARY.md §6.1
- Borang lookup added as §6.1b with borang:<CODE> grep pattern
- Task folder structure: 0. Brief, 1. Fixes, 2. Testing (context-dependent)
- Quest archival: completed quests go to quest/archived.txt

### Session Recap (For AI Restart)
- **Previous Session**: FAT-OR #255637 deep investigation (dead end). QA #255773 accepted.
- **Where We Left Off**: QA #255773 + QA #255940 both completed and archived. FLOWABLE-WORKFLOWS.md populated. Save all done.
- **Important Context**:
  - FAT-OR #255637: test original template with zero code changes to determine actual bug
  - PDF fix: downgrade etanah-common from 524-beta to 514 in pom.xml
  - Only 1 active quest remaining (255637, on hold)

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
