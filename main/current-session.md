# 🌟 Current Session Memory - RAM
*Temporary working memory - resets each session, provides recap when AI restarts*

## Session RAM Status
**Current Session**: FAT-OR #255637 — items 1 & 2 done (Word template edits). Item 3 root cause found in `PelupusanSuratStrategy.java` line 120 — `"SRTJK"` missing from ajtList condition. Fix ready, pending apply + test. QA #255758 closed (accepted behaviour, reverted). QA #255773 still queued.
**Last Activity**: Thu Apr  9 20:00:01 MPST 2026
**Session Start**: Thu Apr  9 09:33 MPST 2026
**Session Focus**: QA #255758 extended investigation + closure. FAT-OR #255637 Phase 0 + Phase 1 start.
**Time Mode**: Evening
**Energy Level**: Steady

## 💭 Working Memory (RAM)

### Active Context

#### FAT-OR #255637 — PPTPB Template Surat Jabatan Teknikal (Phase 1 — fix ready, pending apply)
- Items 1 & 2 done: Word template edits (salutation + frasa justify) on both MLK templates
- Item 3 root cause: `PelupusanSuratStrategy.java` line 120 — `ajtList` only populated for `"SRTJK_ULGN"` and `"SN_JPPH"`, `"SRTJK"` missing
- Fix: add `"SRTJK"` to the Arrays.asList condition at line 120
- Both MLK templates confirmed `kodDokumen: "SRTJK"` (from `template.config.json` lines 2618, 2650)
- Next session: apply fix, test locally, complete checklist 3a + 3b, post-mortem

#### QA #255758 — CLOSED
- Behaviour (empty row after existing record) confirmed ACCEPTED by client
- All etanah-pelupusan changes reverted
- etanah-common fix passed to Wan Mohamad Amirul Hisyam Wan Pa

#### QA #255773 — Semua Urusan SKM Maklumat Pemohon (Phase 0 — queued)
- Task folder: `11. QA #255773 - FAT - Semua Urusan - SKM - Maklumat pemohon...`
- Issue: Maklumat Pemohon shows "tiada rekod" at SKM langkah 2 despite portal awam submission
- ID Permohonan: PTMLK/02/L/PLPS/2026/11

### 📋 Learning Notes (this session)
- `PelupusanSuratStrategy.java` controls ajtList population — missing kodDokumen = silent empty output
- JSF binding: UI fields bind to specific VO paths — verify before choosing guard condition
- Wan Mohamad Amirul Hisyam Wan Pa = etanah-common escalation contact
- Protocol flaw: don't use active FAT permohonan ID in test SQL — use older completed records

### Session Recap (For AI Restart)
- **Previous Session**: FAT-OR #255637 items 1 & 2 done. Item 3 fix identified (`"SRTJK"` in `PelupusanSuratStrategy.java` line 120). QA #255758 closed. QA #255773 queued.
- **Where We Left Off**: Session closed — next session: apply FAT-OR #255637 fix + test + post-mortem. Then QA #255773 Phase 0.
- **Important Context**:
  - FAT-OR #255637 fix is ONE LINE: add `"SRTJK"` to Arrays.asList at `PelupusanSuratStrategy.java:120`
  - QA #255758 is fully closed — no further action needed
  - etanah-common contact: Wan Mohamad Amirul Hisyam Wan Pa

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
