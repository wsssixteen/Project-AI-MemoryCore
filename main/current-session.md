# 🌟 Current Session Memory - RAM
*Temporary working memory - resets each session, provides recap when AI restarts*

## Session RAM Status
**Current Session**: 2026-04-17 evening — UAT-CR #239225 rework + JBoss optimizations
**Last Activity**: Fri Apr 17 ~18:30 MPST 2026
**Session Start**: 2026-04-17 morning
**Session Focus**: UAT-CR #239225 awam-side fix reworked (`.kod` not `.nama`). JBoss local dev optimized (SQL logging, JTA timeout, pool size, validate-on-match). Quest protocol v2.5. QA #256875 pending.
**Time Mode**: Evening (Weekday)
**Energy Level**: Weekly quota reset to 0% — full capacity. Model: Sonnet 4.6.

## 💭 Working Memory (RAM)

### Active Context

#### Session 2026-04-17 evening — UAT-CR #239225 rework + JBoss optimization

- Quest protocol updated to v2.5: base task folder `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\Melaka` hardcoded — no longer asks みや for path. Glob active + Archive for numbering.
- UAT-CR #239225 resumed from Archive. Awam side fix was wrong (`.nama eq 'keseluruhan'` — case-unknown). Reworked to `.kod eq 'PLP_BHG_TLBT_KSRH'` consistent with `onChangeKeluasanTanah()` Java check. Null check removed for codebase consistency. Fix.txt created in archive task folder.
- JSF-WIRING.md updated: XHTML→Java tracing chain added (cc.attrs.X.field → grep → class; listener → grep → class; Java constant → literal string in EL).
- FAT-OR #255106 added to Q1 todo — doc file: `Archive/8. FAT-OR #255106.../2. Fixes/TemplateSuratIringanKepadaPewartaan.docx`
- JBoss login timeout diagnosed: JTA Transaction Reaper killed `PraDaftarOrganisasi` query — laptop CPU/RAM bottleneck, not code issue.
- JBoss optimizations applied (restart required):
  - `standalone.conf.bat`: Xms 1G→512M, MaxMetaspaceSize 256m→512m
  - `standalone.xml`: SQL logging WARN, JTA default-timeout 600s, all datasources pool 100→15 + prefill false + validate-on-match false + background-validation 60s
  - `SETUP-NOTES.txt` created at `E:\Dev\jboss-7.4-plk-melaka\`
- QA #256875 mentioned at session start — not yet accepted. Added to todo.

#### Session 2026-04-17 morning — Admin completed
- QA-253492 Q1 #4 fully closed: post-mortem existed (2026-04-07), GSheet + Redmine closed 2026-04-17, archived project file all checkboxes flipped, todo struck
- QA #255773 Q1 infra unblocks (#2 and #3) shelved — knowledge gap too large, colleague owns ticket; re-activate if SPOC+flowable ticket returns to plate
- Memory saved: `project_qa_255773_spoc.md` — triggers on SPOC integration / flowable / pihak_bkptg / PLTP mirror-copy / QA-255773 resumed
- Architecture: all 7 `etanah-knowledge/melaka/*.md` files now have SCOPE + NOT FOR blockquotes

#### CLAUDE.md changes this session (2026-04-17)
- New rule: **Framework-skeleton for etanah-knowledge** (hard rule, 2026-04-17)
- New rule: **Live state vs attempt history in handoff files** (hard rule, 2026-04-17) — format: `<type> #<number> — <change> — <status>`
- Externalize knowledge: moved to Suspended section (pending Forge Review System Appraisal)
- Knowledge rules clustered under "Etanah-Knowledge Protocol" sub-heading

#### QA #256391 — Closed 2026-04-17 afternoon
- Isu 1b: Tanggungan row showing for PRBB — `viewTanggungan` missing from Melaka override block
- Fix: 1 line added — `PelupusanMaklumatPemohonHelper.java:827` `viewTanggungan = Boolean.FALSE`
- みや found fix directly; Ruri initially pointed at wrong layer (XHTML vs Java helper)
- Tested locally, committed (39429a1353), pushed. Branch: mlk/qa/256391
- Post-mortem written. Task folder: `14. QA #256391 .../`

#### Incoming
- #255773 still HELD — colleague owns it; load `quest/handoff-255773.md` if it resurfaces
- Other pending tickets from 2026-04-16 evening still not yet accepted

### 📋 Learning Notes (this session)
- **File contracts must be explicit**: SCOPE + NOT FOR at top prevents pattern-matching on filenames (lesson: FLOWABLE-WORKFLOWS wrong layer, BUG-BESTIARY hypothesis proposal)
- **Confirmed vs hypothesized**: BUG-BESTIARY is for proven patterns only; hypotheses belong in handoff files
- **Live state vs attempt history**: `<type> #<num>` prefix matters; "fix didn't fully work" never means "fix is stale/reverted"
- **Hold floating threads**: during critical architectural discussions, actively capture mid-conversation thoughts before they evaporate

### Session Recap (For AI Restart)

- **Previous Session** (2026-04-16 PM): QA #255773 held — @Transactional analysis invalidated H1, ticket passed to colleague.
- **This Session** (2026-04-17 full day): Admin close + architectural overhaul (morning). QA #256391 closed (afternoon). UAT-CR #239225 rework + JBoss optimizations (evening).
- **On Resume**:
  - UAT-CR #239225 fix applied, awaiting local test — JBoss restart needed first (standalone.xml changes)
  - QA #256875 — not yet accepted, next ticket
  - FAT-OR #255106 — reopen `2. Fixes/TemplateSuratIringanKepadaPewartaan.docx` (Q1 todo)
  - #255773 HELD — colleague owns it; load `quest/handoff-255773.md` if resurfaces

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
