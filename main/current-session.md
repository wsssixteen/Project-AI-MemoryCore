# 🌟 Current Session Memory - RAM
*Temporary working memory - resets each session, provides recap when AI restarts*

## Session RAM Status
**Current Session**: QA-253419 CLOSED (handed to reports team), QA-246512 FAT testing in progress
**Last Activity**: Fri Apr  3 22:55:04 MPST 2026
**Session Start**: Wed Apr  1 09:06:37 MPST 2026
**Session Focus**: QA work — last day for team tasks. QA-246512 FAT test ongoing. QA-253419 quest active Phase 1.
**Time Mode**: Morning (office hours)
**Energy Level**: Active

## 💭 Working Memory (RAM)
*Temporary storage - cleared when session ends*

### Active Context

#### QA-246512 — PPJK Risalat MMKN (COMPLETE — pending commit + FAT verify)
- All Word docs finalized: TemplateRisalatMMKN_PDT_PPJK, _Tolak, TemplateRingkasanRisalatPPJK, _JKKL
- `template.config.json`: 4 PPJK blocks correct (Lulus/Tolak/Ringkasan/JKKL)
- `PelupusanExtraParamMethodConstant.java`: `keputusanJKKL` registered + method implemented
- `MlkKertasTemplateForm.java`: PPJK added to `initKeputusanSyor()` + `initViewFlags()`; Semakan/Perakuan disabled via `showJanaButton`
- `MlkKertasTemplateForm.xhtml`: `mode="#{mb.showJanaButton ? 1:2}"` on selectOneRadio
- `PelupusanService.java`: `tujuanAsalRizab` fixed — `DynamicFieldUtil` pattern
- ⚠️ Verify in FAT: popup validation (in etanah-common, not visible in this repo)
- **Git**: stash → merge origin/master → stash pop → commit to mlk/qa/246512
- Project file: `projects/coding-projects/active/QA-246512/QA-246512-PPJK-Risalat-MMKN.md`

#### QA-253419 — PSBS Borang Kategori Kegunaan Tanah (READY TO IMPLEMENT)
- Root cause: `populateKegunaan()` line 11127 — PSBS grouped with PRU in Set, but PSBS has no data → always returns `-`
- Fix: remove `URS_PSBS` from the Set (line 11134), add `else if (URS_PSBS) { kegunaan = "Tiada"; }` after PRU block
- Fix confirmed: PSBS does not use kegunaan tanah by design — hardcode "Tiada", no DB read
- **Resume from:** リドワンさん applying fix in Eclipse → deploy to FAT → verify borang shows "Tiada"
- Project file: `projects/coding-projects/active/QA-253419/QA-253419-PSBS-KategoriKegunaan.md`
- Java file: `E:\Projects\Melaka\etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\constant\PelupusanWordCCMethodConstant.java:11127`

### 🧠 Miya's 3-Aspect Task Workflow (TO FORMALIZE TOMORROW)
**Vision layers**: Phase 1 (Personal) → Phase 2 (Team) → Phase 3 (Company)
**Task execution mirrors this in 3 aspects:**
1. **Learn & Build Knowledge** — implement, learn, analyse for codebase-knowledge files
2. **Execute the Task** — focus on the ticket itself, produce debugging-playbook entry from template
3. **Post-Mortem** — wrap-up analysis: what we learnt, what could be better, PMP-style retrospective catered to our use case

This is the ALWAYS approach for every task. Discuss & refine tomorrow.

### 📋 Consolidated Task List
**Active / Next Steps:**
1. Phase 3 — First Gemini scan of JSF/XHTML layer (1-2 hours)
2. Phase 4 — Build custom EL extractor script (after Phase 3)
3. Phase 5 — Start ticket-driven learning with sub-agent flow tracing
4. Ask colleagues about PRK state code (pending since 2026-03-25)
5. Prayer reminder rework — one-shot crons at exact times instead of polling
6. Hooks discussion — list ideas first, assess each (hook vs CLAUDE.md rule vs other)

**Deferred:**
7. Career planning dump
8. Good practices from Claude's creator (REMIND)
9. Fallback planning
10. Aunt's slides project (Claude + Marp)
11. Pendrive cold-backup idea

### 🔭 Repo / Tool Watchlist
**In Use:**
- codebase-memory-mcp v0.5.6 — codebase knowledge graph (installed)
- Gemini CLI — JSF/XHTML gap scanning

**Evaluated & Dismissed:**
- zarazhangrui/codebase-to-course — maybe Phase 2 for team onboarding
- Google Code Wiki — waitlist, no private repo
- Serena MCP — pre-release, Java issues
- AntV-MemoryAI/OpenDeepWiki — needs cloud LLM
- AsyncFuncAI/deepwiki-open — research only

**Future Watch:**
- Magic.dev LTM-2-Mini — 100M token context
- GraphRAG — RAG + knowledge graph hybrid
- Continue.dev (via Ollama) — Phase 6 RAG evaluation
- Understand-Anything — potential Layer 1 replacement

**Work Codebases:**
- etanah-pelupusan (Melaka) — indexed, active
- etanah-common — shared, not yet synced
- Terengganu — production reference, not yet synced
- etanah-awam — second module, not yet synced

**Not Yet Reviewed (need deep review against our strategy):**
- gsd-build/get-shit-done — surface-noted in PLANNING.md but not deep reviewed
- mattpocock/skills (grill-me SKILL.md) — never reviewed
- tirth8205/code-review-graph — surface-noted as watchlist, not deep reviewed

### Session Recap (For AI Restart)
*Quick summary when AI loads after close/reopen*
- **Previous Session Summary**: 2026-04-03 full day. QA-253419 CLOSED (reports team, Jasper Reports). QA-246512 null-check hotfix applied. etanah-awam bean mapping learned (UAT-CR #239225). JBoss Eclipse debug mode issue diagnosed + documented.
- **Where We Left Off**:
  - QA-246512: FAT checklist updated (8 items). Popup tests removed — radio always populated. PTG documents added. リドワンさん starts testing tomorrow from item #1.
  - QA-253419: CLOSED — handed to reports team (etanah-awam / Jasper). Post-mortem written.
  - QA-253492: Phase 3 still pending.
  - UAT-CR #239225: Fix confirmed (`mb.isMelaka()` wired correctly in `plpMaklumatTanahRizab.xhtml`). Not yet formally quested.
- **Important Context**:
  - Naming: リドワンさん (7AM–8PM weekdays) / みや (outside) — use name IN sentences
  - quest/active.txt = `none` — no active quest
  - Hotfix today: `MlkKertasTemplateForm.java:215` — null-check for `JsonNull` before `getAsBoolean()`
  - JBoss debug mode hang: Eclipse freezes JVM on internal exceptions → looks like DB hang → fix: clear breakpoints, uncheck "Suspend on uncaught exceptions", check Debug view for Suspended threads
  - etanah-awam bean pattern: `mb` in tab = `tabFormMap.get(index)` from `PelupusanEMohonForm`, tab bean = `PelupusanTanahRizabTabForm`
- **Priority on next boot**: QA-246512 FAT — 8 items, start from #1 (PDT Syor field visible)

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