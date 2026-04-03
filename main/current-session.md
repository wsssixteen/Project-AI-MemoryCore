# 🌟 Current Session Memory - RAM
*Temporary working memory - resets each session, provides recap when AI restarts*

## Session RAM Status
**Current Session**: QA-253419 active (Phase 1), QA-246512 FAT testing in progress
**Last Activity**: Fri Apr  3 09:08:11 MPST 2026
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

#### QA-253419 — PSBS Borang Kategori Kegunaan Tanah (PENDING CODE REVIEW)
- Root cause: `populateKegunaan()` line 11124 — no PSBS branch → always returns `-`
- Fix confirmed: `else if (URS_PSBS)` reading `AppHakmilik.getKegunaanTanah()` (String)
- DB investigation complete: Script 3 (0 PSBS rows with kegunaan_tnh), `umm_p_hkmlk` schema gap confirmed
- AWAM gap: `kegunaan_tnh` column does not exist in `umm_p_hkmlk` — schema-level, needs senior sign-off
- **Resume from:** Code review result → if accepted: Step 5 (deploy to FAT, expect "-" — correct)
- Project file: `projects/coding-projects/active/QA-253419/QA-253419-PSBS-KategoriKegunaan.md`
- All SQL + steps: `INVESTIGATION.md` in task folder 5

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
- **Previous Session Summary**: 2026-04-02/03. Major overhaul complete. Now in QA work — last day for team tasks.
- **Where We Left Off**:
  - QA-246512: FAT testing in progress. リドワンさん testing popup alert + template generation. FAT checklist in project file.
  - QA-253419: Quest active Phase 1 (`quest/active.txt` set). Fix revised — NOT reading getKegunaanTanah(), instead hardcode `"Tiada"` for PSBS in `populateKegunaan()`. Fix location: `PelupusanWordCCMethodConstant.java` after line 11145.
  - QA-253492: Phase 3 still pending.
- **Pending discussion**: Database knowledge structure — DATABASE.md (schema) vs DOMAIN-GLOSSARY.md (terminology) vs SCRIPTS.md (new — SQL patterns, shortforms, senior's base script). Pre-implementation scrutiny gate for quest Phase 1. Both in todo Q2.
- **Important Context**:
  - Naming: リドワンさん (7AM–8PM weekdays) / みや (outside) — use name IN sentences
  - Quest Protocol active — ticket-gate + commit-gate hooks live
  - QA-253419 fix: `else if (URS_PSBS) { kegunaan = "Tiada"; }` — simple, no DB read
  - Senior's base script: filter `ID_PENGENALAN ILIKE '%<URUSAN>%'` + `IT.KOD ILIKE '%<TUGASAN>%'`
  - ID_PENGENALAN embeds URUSAN code — e.g., `PTMLK/01/L/PLPS/2025/48`
- **Priority on next boot**: Resume QA-253419 Phase 1 (implement fix in Eclipse) → QA-246512 FAT result → QA-253492 Phase 3

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