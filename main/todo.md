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
| System | **Review Fix.md format** | みや to review the markdown layout in `Archive\13. QA #256113...\Fix.md` (4 sections, bold labels, HR dividers, code blocks) and confirm or adjust before applying to future tickets. |
| ~~Work~~ | ~~**FAT-OR #255637** — test original template~~ | ~~CLOSED 2026-04-11~~ |
| System | **Token usage optimization** | Lost 2 days contact 2026-03-31 week — audit what's eating tokens, reduce boot cost, lean up settings.local.json, review memory load strategy |
| ~~Work~~ | ~~**QA-253492** Phase 3~~ | ~~CLOSED 2026-04-17 — post-mortem was already in main/post-mortems.md (2026-04-07); Redmine + GSheet closed 2026-04-17~~ |
| ~~Work~~ | ~~**UAT-CR #239225** — pelupusan side~~ | ~~Closed 2026-04-27 — no rework requested; change request implementation confirmed successful~~ |
| ~~Work~~ | ~~**FAT-OR #255106** — reopen~~ | ~~CLOSED 2026-04-17 — ID Permohonan added to page 2 header of TemplateSuratIringanKepadaPewartaan.docx~~ |
| ~~Work~~ | ~~**QA #256875** — FAT - PRBB - Bayaran Pelbagai - Tidak papar apa-apa maklumat bayaran~~ | ~~CLOSED 2026-04-21 — Passed to Spoc team. No code change on our side.~~ |

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
| ~~System~~ | ~~**redmine-sync: new ticket folder fixes**~~ | ~~DONE 2026-04-27 — (1) no status subfolder on new create, (2) 1. Notes.txt in task root, (3) attachments downloaded to 0. Brief~~ |
| System | **Quest invoke cleanup** | On `/quest start`: auto-move completed quests → Archive, keep active/suspended in main. If ticket matches archived quest, move it back to main before starting. |
| System | **Quest: auto test-record SQL** | Phase 0 step added to protocol. Next: make it smarter (hook or template). DATABASE.md must always be loaded before SQL work. |
| System | **SCRIPTS.md** (new etanah-knowledge file) | Working SQL patterns: senior's base script + annotations, shortform table name mapping (tgsn=tugasan etc.), ID_PENGENALAN format documented |
| System | **Move `Database/Melaka/` + `Flowables/Melaka/` into project** | Currently at `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\Database\Melaka` and `Flowables\Melaka`. I keep forgetting they exist because they're outside the project folder. Relocate into `projects/coding-projects/active/etanah-knowledge/melaka/` as subfolders (or similar). Added 2026-04-15 after second forget. |
| System | **`inscribe` skill — end-of-day ticket handover** | Writes compact `Handover.txt` into the Task folder (parallel to `Fix.txt`) when a ticket goes on hold or day ends mid-investigation. **Priority: show don't tell** — lead with file:line / table / column / SQL / stack; prose is minimal framing. Shape: Symptom → Code path (read + write) → SQL evidence → Hypotheses + candidates → Next actions → Do-not list. みや picks up the paper trail from the Task folder physically, no need to open MemoryCore. First instance created 2026-04-15 for #255773 — use as template. Also write the longer narrative to `quest/handoff-<qa>.md`. Later: pair with a `resume ticket <QA#>` read-back. Added 2026-04-15. |
| System | **Quest: Pre-implementation scrutiny gate** | Add 5-question pre-flight checklist to Phase 1 of quest-protocol.md before any code change |
| System | **Protocol housekeeping session** (from 2026-04-21 wrap-up) | Four changes agreed, pending one dedicated session to apply: (1) Phase 0 Step 1 — mandatory live `ls` before creating Task folder, never rely on context memory for numbering. (2) Phase 3 — explicit step: move Task folder to `Archive/` immediately on wrap-up. (3) Post-mortem format — add `→ forge-log: [one line]` annotation rule inside Process Notes when a Ruri execution failure is described (no new section needed). (4) Keep per-ticket subfolders in `projects/coding-projects/active/` — these hold full investigation context for Ruri; Task folder stays compact for human re-access. Delete stale `QA-255758/` and `UAT-CR-239225/` if already closed and no longer useful. |
| System | **Context folder** (`etanah-knowledge/melaka/context/`) | Steps 1–4 of architecture plan: run `mvn dep:tree` → `deps.txt`, Repomix → `repo-map.md`, `pg_dump -s` → `schema.sql`, tbls → `db-schema.md`. Auto-loaded in Quest Phase 0. **deps.txt blocked** — CLI Maven can't reach Nexus (172.16.90.152:8081). Fix confirmed 2026-04-21: settings.xml = `E:\Dev\apache-maven-3.9.9\conf\settings.xml`, local repo = `E:\Dev\.m2_etanah`. Run: `mvn -s "E:\Dev\apache-maven-3.9.9\conf\settings.xml" dependency:tree -f pom.xml > deps.txt` from etanah-pelupusan root. Also still missing: ERD map (FK relationships visual). |
| System | **codebase-memory-mcp** on etanah-pelupusan | 1-line install; SQLite call graph; 99% token reduction (vendor claim). Evaluate after context folder done. |
| System | **DB read-only MCP** (`et_reporting` + `search_path=et_main`) | Install `@modelcontextprotocol/server-postgres`; connection string confirmed; et_reporting credentials needed from みや |
| System | **`/appraise` skill** | Socratic Socratic interrogation for stress-testing plans — creates `.claude/skills/appraise/SKILL.md` |
| System | **`etanah-knowledge/melaka/index.md`** | Navigation entry file + cross-links between all 7 knowledge files |
| System | **Research Sourcegraph vs OpenGrok** | Self-hosted code search for etanah — pick one to evaluate |
| System | **Design MCP bridge to Gemini** | JSF gap filler — spec tool interface; Gemini 1M context for EL/XHTML |
| System | **Run JArchitect trial** on etanah repo | Export call graph + dependency matrix — one-time run |
| System | **Install Flowable Modeler** | Load etanah BPMN XML files for visual workflow debugging |
| System | **Evaluate Semgrep** | Pattern-based codebase search — directly aids debugging (e.g. find all null-check gaps on class X) |
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
| System | **BUG-BESTIARY: copy-paste bug at `PelupusanSpocService.java:522`** | `apt.getUnitLuasDipohon().getKod()` inside `UnitLuasDilulus` block — should be `getUnitLuasDilulus().getKod()`. Latent, pre-existing, not #255773. Guarded behind `if (apt.getUnitLuasDilulus() != null)` which is false pre-approval so never triggers currently. Add as BUG-BESTIARY entry next time we touch that class. Found 2026-04-15 evening during #255773 narrowing. |

### ⚪ Q4 — Someday

| Category | Item | Notes |
|---|---|---|
| System | **Task summary template** | Current summaries too long for quick reference — create a standardised short-form template (SUMMARY.md + BEAN-MAP style) |
| System | **Project file template update** | Add mandatory file paths: Task folder, codebase, DB/TDD, Flowables |
| System | **System Structure section** | Document Ruri's folder map in this file |
| System | **Familiar skill deep-dive** | Weekend — リドワンさん curious how it actually works under the hood; discuss together |
| System | **Kiyoraka features** | ~~Done 2026-04-02~~ All 4 systems implemented |
| System | **Structurizr C4 diagrams** for etanah | Architecture visualization for Phase 2 team sharing |
| Personal | **Aunt's slides project** | Claude + Marp — help aunt with presentations |
| Personal | **Good practices from Claude's creator** | *(REMIND)* |
| Personal | **Pendrive cold-backup idea** | — |

---

## 🗄️ Shelved
*Ideas on ice — not abandoned, kept for when circumstances change*

| Item | Notes |
|---|---|
| **Fallback planning** | Context forgotten — keeping for reference |
| **#255773 infra unblocks** | Local PLTP submission bypass + FAT local DB access — both were set up when I was driving #255773. Ticket handed to colleague 2026-04-16. Re-activate if SPOC+flowable work returns to my plate. Shelved 2026-04-17. |

---

*Last updated: 2026-04-15*
