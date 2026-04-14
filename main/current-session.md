# 🌟 Current Session Memory - RAM
*Temporary working memory - resets each session, provides recap when AI restarts*

## Session RAM Status
**Current Session**: QA #256113 closed + Debug Mode Rituals meta-work
**Last Activity**: Tue Apr 14 18:52:40 MPST 2026
**Session Start**: Tue Apr 14 ~08:00 MPST 2026
**Session Focus**: Narrow fix shipped → two wrong proper-fix attempts → meta-analysis → rituals committed
**Time Mode**: Evening (Weekday)
**Energy Level**: Winding down — long hard day, ticket closed

## 💭 Working Memory (RAM)

### Active Context

#### QA #256113 — CLOSED ✅ (narrow fix shipped, double commit: fix + comment)
- **Ticket**: PLPS - Penyediaan Surat Keputusan Lulus — Syarat-syarat section missing on Selesai regen
- **Shipped fix** (narrow): 3 files in `etanah-pelupusan`
  1. `TemplatePropertyJson.java` — transient `reloadFromClasspath` flag + getter/setter
  2. `PelupusanTemplateUtil.java:273` — `|| template.isReloadFromClasspath()` OR-branch with explanatory comment
  3. `PelupusanPenyediaanDokumenVO.java:~160` — sets flag for `TGS_SURAT_KEPUTUSAN_LULUS_LIST` only
- **Comment at PelupusanTemplateUtil.java:273** explains temporary nature, what gets loaded (JAR classpath), what gets bypassed (cached flattened docx in `C:\etanahv3\files\temp`), and when to remove (when root-cause refactor lands).
- **Commit state**: Miya accidentally pushed first commit, chose double-commit approach — narrow fix commit already on remote, comment commit pending.
- **Root cause at docx4j schema level**: UNRESOLVED. All three of my theories today were wrong. Goes into knowledgebase as open question, not claim.

#### Two wrong proper-fix attempts today (the hard lesson)
- **Failure 1**: Clear+repopulate theory at `insertContentControlTableInDocument` line 583. Wrong — function bailed at line 544 before reaching 583.
- **Failure 2**: "Missing branches" refactor in `findTableByContentControlTag`. Wrong — loop body never executed on pass 2, `getContent()` was empty.
- **Failure 3** (attempted): CTSdtRow unwrap at line 628-631 writer. Applied, tested, failed. Reverted.
- All three built on unverified assumptions. Rituals below exist to prevent this pattern.

#### Debug Mode Rituals — COMMITTED to CLAUDE.md 🆕
Four active rituals added to `.claude/CLAUDE.md` under "🔬 Debug Mode Rituals":
1. **Predicate Box** — mandatory before every fix-proposing Edit in debug mode (PREDICATE/EVIDENCE/WRITER CHECKED block)
2. **Evidence Language Discipline** — banned "confirmed/root cause/actual issue/definitely" without debugger proof
3. **Momentum Circuit-Breaker** — mandatory "RESET. Prior theory abandoned: [name]. Re-reading from scratch." line after any failed fix
4. **Debug Mode Setup** — I must ask みや to toggle `/fast` off when debug mode activates; I cannot do it myself
- **Activation**: Miya says "debug mode on" OR debugger screenshot/breakpoint shared
- **Deactivation**: "debug mode off" OR quest Phase 3 OR session end
- **Violation log**: `Feature/Forge-Self-Improvement-System/debug-ritual-violations.md` — one-line per slip, trend visible
- **Miya's call-out phrases**: "no predicate", "evidence word", "no reset"

#### New auto-memory feedback entries
- `feedback_predicate_before_fix.md` — predicate-before-fix rule with cite-evidence requirement
- `feedback_writer_before_reader.md` — when a reader fails, audit the writer before touching the reader
- Both indexed in `MEMORY.md`

#### Post-mortem written
- `main/post-mortems.md` — QA-256113 entry with root cause, process notes, four carry-forward rules
- Meta-analysis synthesized from reading ALL prior post-mortems: every recurring failure is process-class, not capability

### 📋 Learning Notes (this session)
- **Writer-before-reader**: when a parser/reader sees wrong/missing state, audit the writer first. I violated this twice today in the same ticket.
- **Predicate discipline**: every fix must have a stated predicate and cited evidence. "Could explain the symptom" ≠ "is the explanation".
- **Feedback memories are passive**: they fail on debugging discipline because violations are invisible in response text. Visible rituals with real-time enforcement are the fix.
- **docx4j SDT hierarchy**: `SdtBlock`, `SdtRun`, `CTSdtRow`, `CTSdtCell` — all implement `SdtElement` but their content types differ. Row-level `CTSdtContentRow` schema only allows `Tr`. docx4j's Java lists are NOT schema-validated on marshal, so you can write invalid XML and discover it only on reload.
- **The narrow fix works** (forcing classpath reload bypasses the flattened-file reload entirely), but **why** the flattened file is broken at the schema level is still unknown. Three theories tested, three theories wrong.

### Session Recap (For AI Restart)
- **Previous Session**: QA #256113 narrow fix applied Mon night, awaiting local test.
- **Today's arc**: Test passed initially → Miya asked about proper fix → I proposed and built wrong proper fixes twice → Miya accepted narrow fix → meta-analysis triggered → four active debug rituals committed to CLAUDE.md → ticket closed, ready to push comment commit.
- **Where We Left Off**: Comment commit ready to push. Miya handles push manually per daily-commit rule.
- **On resume**:
  - Check if comment commit was pushed. If not, confirm before push.
  - Debug Mode Rituals are under test starting next debug session. If I slip, Miya calls out + I log violation.
  - Post-mortem done; knowledgebase update for SDT hierarchy + marshal-vs-validate hazard still pending (not blocking).
- **Important Context**:
  - QA #256113 is functionally closed but root cause is still open in knowledgebase as open question.
  - New rituals exist but haven't been stress-tested yet. Tomorrow's first debug session is the real test.
  - Miya shipped this ticket despite my failures — "passionate & impatient" is what carried the day.

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
