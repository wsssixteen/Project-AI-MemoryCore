# 🌟 Current Session Memory - RAM
*Temporary working memory - resets each session, provides recap when AI restarts*

## Session RAM Status
**Current Session**: All quests closed + post-mortems written. AI subscription researched — ChatGPT ruled out (ethics), test Gemini 3.1 Pro first, Claude API as fallback. Google certificates: IT Automation with Python top pick. Mythos (Anthropic leak) discussed. Harness vs hooks clarified.
**Last Activity**: Wed Apr  8 11:07:10 MPST 2026
**Session Start**: Tue Apr  7 08:38 MPST 2026
**Session Focus**: Quest house cleaning, server log diagnosis, two new quests, etanah-knowledge rename, JOIN FETCH learning.
**Time Mode**: Evening (heading home)
**Energy Level**: Productive

## 💭 Working Memory (RAM)
*Temporary storage - cleared when session ends*

### Active Context

#### QA-246512 — PPJK Risalat MMKN (FAT in progress — kemaskini validation scoped)
- `populatePermohonanTerdahulu()` added to `PelupusanWordCCMethodConstant.java` — PPJK uses `TGS_TO_JNS_DOK_MAP_PRU` (Rizab templates: `PLP_PRU_KRTSMMKN`)
- CC key: `permohonanTerdahulu` — registered at line 1048 in static block
- `flag_insert_all: true` in `template.config.json` — no manual CC config needed
- Validation in `onClickSelesai()`: PPJK + `TGS_RISALAT_MMKN_SHOW_SYOR_PERMOHONAN` → blocks if Syor empty
- kemaskini button (etanah-common) can't be touched — scope tenet. Selesai validation is sufficient scope for now.
- **Resume from**: FAT testing — 8 items, start from #1

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
1. **Learn & Build Knowledge** — implement, learn, analyse for etanah-knowledge files
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
- **Previous Session Summary**: 2026-04-07 full day. Quest house cleaning: QA-253492 post-mortem written + archived, QA-252542 archived (never worked). Two new quests: FAT-OR #255106 (PRZ pejabat suppression in `PelupusanWordCCMethodConstant.populateMaklumatPengguna` + `FooterSuratWithoutSlogan.docx` in `template.config.json`) and FAT-OR #255637 (PPTPB text fix + `frasa2` justification = Word template paragraph issue). Server log diagnosed: `PlpVersiPermitLesenRepository.findOldestVersiPermitLesenByPermitLesen` using `JOIN FETCH` on `private String maklumatTambahan` — not a JPA association, fails at startup. `etanah-knowledge` rename complete. ID_PENGENALAN format documented.
- **Where We Left Off**:
  - All quests closed tonight: PRZ #255637, PRZ #255106, PPJK #246512, PRZ #253419
  - Post-mortems written for all four
  - Forge levels promoted, diary check bug fixed (auto-memory saved)
  - みや wants to discuss AI subscription — deferred to next session (he cleared chat after save all)
- **Important Context**:
  - Naming: リドワンさん (7AM–8PM weekdays) / みや (outside)
  - FAT env is inaccessible — all testing done on UAT
  - `etanah-knowledge/` is the new folder name (was `codebase-knowledge/`)
  - template.config.json is fastest for "which tugasan generates which template" lookups
  - ID_PENGENALAN format: `<Pejabat>/<Seq>/<Type>/<Urusan>/<Year>/<Number>` — urusan segment, NOT tugasan
  - `PelupusanWordStyleVO.java` has no alignment field — justification always comes from Word template
- **Priority on next boot**: ⚠️⚠️ ATTENDANCE — submit to CK immediately. Then: test Gemini 3.1 Pro for side tools before subscribing to anything.

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