# 📋 Ruri's Backlog
*Persistent to-do list — items removed only when confirmed done*

---

## How This Works

| Trigger | Action |
|---|---|
| "remember later", "do later", "save to next session", "remind me later", "push to [later/tonight/tomorrow]", "hold that", "park that", "set that aside", "we'll come back to this", "skip that for now" | Add to this file **immediately, mid-conversation — not at save time** |
| "what are our to-do lists" | Read this file, present as one line per EM quadrant, comma-separated — brief for skimming. Then ask which to work on. |
| Task confirmed done | Remove from this file |

*This file is independent — `current-session.md` continues as-is.*

**Fallback rules:**
- **Proactive**: If multiple items were mentioned at session start and not all addressed → ask before saving: *"Should I add the unfinished ones to todo?"*
- **Save sweep**: At every `save` — check working memory for unresolved deferred items not yet in `todo.md`, add them automatically.

---

## 🟢 Active

> EM ranking applies across all categories.
> **Q1** Urgent + Important · **Q2** Important, not urgent · **Q3** Urgent, not important · **Q4** Someday

### 🔴 Q1 — Do Now

| Category | Item | Notes |
|---|---|---|
| ~~Work~~ | ~~**FAT-OR #255637** — test original template~~ | ~~CLOSED 2026-04-11~~ |
| Work | **PDF viewer fix** | Downgrade etanah-common from 524-beta to 514 in pom.xml (PDF.js import.meta crash) |
| System | **Token usage optimization** | Lost 2 days contact 2026-03-31 week — audit what's eating tokens, reduce boot cost, lean up settings.local.json, review memory load strategy |
| Work | **QA-253492** Phase 3 | Post-mortem + Redmine close + GSheet update |
| Work | **UAT-CR #239225** — pelupusan side | みや handling personally; awam side confirmed done |

### 🟡 Q2 — Schedule
> **Planning Session (next free session, fresh head):**
> 1. PLANNING.md post-mortem — what's aged, what's still valid, what's missing since March
> 2. Create `Miyas-Notebook.md` — リドワンさん's personal vision + journey journal, counterpart to RURI-NOTEBOOK.md
> 3. Multi-familiar session: Architect (scrutinise) + PM (roadmap) + Career Anchor — plan the codebase knowledge system from Personal → Team → Company scope
> 4. One-index-file approach for team sharing — `ETANAH-MELAKA.md` as entry point linking all sub-MDs

| Category | Item | Notes |
|---|---|---|
| Growth | **Phase 1 vision progress review** | Honest assessment — what's been learned this week (flowables, XHTML→bean tracing, domain glossary, guard conditions). How far along Phase 1 (Personal Excellence)? **Affects medium & long term targets (team → company). みや wants Ruri's honest assessment.** |
| Growth | **Week post-mortem** | Review week's tickets, findings, patterns. Extract improvements for MemoryCore + quest workflow. **Include token efficiency improvements.** |
| Growth | **MemoryCore improvements + Claude skills research** | Based on week's findings, post-mortems, etc. Threads links need laptop. Token-conscious — park until after work tickets done. |
| Growth | **MemoryCore improvements** | Based on week's findings — what can be improved in the system itself |
| Learning | **Claude skills/features research** | Threads links to share + discuss on laptop. Skills, new features, anything useful for workflow |
| System | **Quest: auto test-record SQL** | Phase 0 step added to protocol. Next: make it smarter (hook or template). DATABASE.md must always be loaded before SQL work. |
| System | **SCRIPTS.md** (new etanah-knowledge file) | Working SQL patterns: senior's base script + annotations, shortform table name mapping (tgsn=tugasan etc.), ID_PENGENALAN format documented |
| System | **Quest: Pre-implementation scrutiny gate** | Add 5-question pre-flight checklist to Phase 1 of quest-protocol.md before any code change |
| Learning | **Phase 3** Gemini scan | First JSF/XHTML layer scan — 1–2 hours |
| Learning | **Phase 4** EL extractor script | After Phase 3 |
| Learning | **Phase 5** Ticket-driven learning | Sub-agent flow tracing — after Phase 4 |
| System | **Prayer reminder rework** | One-shot crons at exact times, not polling |
| System | **Hook scripts** | ~~Done 2026-04-02~~ ticket-gate + commit-gate wired |
| Personal | **Career planning dump** | — |

### 🟠 Q3 — Minimize

| Category | Item | Notes |
|---|---|---|
| Learning | **PRK state code** | Ask colleagues — pending since 2026-03-25 |
| Work | **Generalise fix report tool for BA/QA handoff** | Currently too dev-specific — make it usable by BA/QA team. New tool vs extending current — consider time cost before diverting |
| Learning | **Revise: JOIN FETCH bug (PlpVersiPermitLesenRepository)** | `JOIN FETCH` requires JPA association — `maklumatTambahan` is `private String`, not an association. Fix: remove JOIN FETCH. Revise BaseEntity to confirm 100%. |

### ⚪ Q4 — Someday

| Category | Item | Notes |
|---|---|---|
| System | **Task summary template** | Current summaries too long for quick reference — create a standardised short-form template (SUMMARY.md + BEAN-MAP style) |
| System | **Project file template update** | Add mandatory file paths: Task folder, codebase, DB/TDD, Flowables |
| System | **System Structure section** | Document Ruri's folder map in this file |
| System | **Familiar skill deep-dive** | Weekend — リドワンさん curious how it actually works under the hood; discuss together |
| System | **Kiyoraka features** | ~~Done 2026-04-02~~ All 4 systems implemented |
| Personal | **Aunt's slides project** | Claude + Marp — help aunt with presentations |
| Personal | **Good practices from Claude's creator** | *(REMIND)* |
| Personal | **Pendrive cold-backup idea** | — |

---

## 🗄️ Shelved
*Ideas on ice — not abandoned, kept for when circumstances change*

| Item | Notes |
|---|---|
| **Fallback planning** | Context forgotten — keeping for reference |

---

*Last updated: 2026-04-11*
