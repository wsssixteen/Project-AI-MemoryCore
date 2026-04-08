# 🌟 Current Session Memory - RAM
*Temporary working memory - resets each session, provides recap when AI restarts*

## Session RAM Status
**Current Session**: QA #255758 JPPH duplicate fixed — two bugs in `UtilitiKemaskiniUlasanJPPHForm.java` (etanah-common): empty row guard + missing ID writeback. Fix passed to other department. FAT-OR #255637 restarted — missed "apply to all urusan" scope. QA #255773 queued for next session.
**Last Activity**: Wed Apr  8 21:44:34 MPST 2026
**Session Start**: Wed Apr  8 16:08 MPST 2026
**Session Focus**: QA #255758 JPPH duplicate investigation + fix. Codebase tracing (etanah-common). New ticket intake for QA #255773.
**Time Mode**: Evening
**Energy Level**: Steady

## 💭 Working Memory (RAM)

### Active Context

#### QA #255758 — PSBS Semakan JTLTPM — JPPH Duplicate (Phase 1 — fix applied, pending UAT verify)
- Root cause: two bugs in `UtilitiKemaskiniUlasanJPPHForm.java` (etanah-common), `saveUlasan()`
  1. No guard on empty new rows → empty Tambah row saved to DB
  2. `save(ajt)` return value not captured → ID not written back → every save creates new record
- Fix 1 (line 674): `if (vo.getJabatanTeknikal().getId() == null && StringUtils.isBlank(...getNoRujukan())) continue;`
- Fix 2 (line 739-740): `ajt = save(ajt); vo.setJabatanTeknikal(ajt);`
- Preventive fix also applied to `MlkUlasanJPPHForm.java` (etanah-pelupusan) line 290 — guard only (ID writeback was already correct there)
- ⚠️ etanah-common fix must be passed to other department — リドワンさん cannot apply it directly
- Pending: UAT verify, checklist items 5+6

#### FAT-OR #255637 — PPTPB Template Surat Jabatan Teknikal (RESTARTED — Phase 0)
- Previously thought complete — missed "kindly apply to all urusan" in description
- Task folder: `9. FAT-OR #255637 - PPTPB - Issue pada template surat Jabatan Teknikal`
- Next session: re-read full description, rebuild scope checklist for all urusan

#### QA #255773 — Semua Urusan SKM Maklumat Pemohon (Phase 0 — next session)
- Task folder: `11. QA #255773 - FAT - Semua Urusan - SKM - Maklumat pemohon...`
- Brief.txt saved
- Issue: Maklumat Pemohon shows "tiada rekod" at SKM langkah 2 despite portal awam submission
- ID Permohonan: PTMLK/02/L/PLPS/2026/11

### 📋 Learning Notes (this session)
- `UtilitiKemaskiniUlasanJPPHForm.xhtml` is in etanah-common — not etanah-pelupusan
- Bean naming: `#{utilitiKemaskiniUlasanJPPHForm}` → class `UtilitiKemaskiniUlasanJPPHForm.java`
- Save button: `action="#{mb.onSave}"` → `onSave()` → `saveUlasan()`
- `new AppJabatanTeknikal()` is NOT null — object exists, fields inside are null
- Tracing rule: class name first, always. Reasoning at END as tracing summary.
- `id == null` distinguishes new (Tambah) rows from existing DB rows in VO lists

### Session Recap (For AI Restart)
- **Previous Session**: QA #255758 Phase 0 complete + fix applied (etanah-common JPPH form). id_hkmlk format + BandarPekanMukim + JenisHakMilik saved to DOMAIN-GLOSSARY.md. Three feedback memories saved. FAT-OR #255637 restarted. QA #255773 queued.
- **Where We Left Off**: Session closed — new session to start with FAT-OR #255637 (re-read description, all urusan scope) and QA #255773 Phase 0.
- **Important Context**:
  - QA #255758 fix is in etanah-common — must be passed to other dept for apply
  - FAT-OR #255637 task folder is #9 — already exists, just restarted
  - QA #255773 task folder is #11 — Brief.txt saved
  - Tracing: XHTML → `#{mb}` param → bean class → method → service → repository
  - etanah-common hosts shared utility forms including `UtilitiKemaskiniUlasanJPPHForm`

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
