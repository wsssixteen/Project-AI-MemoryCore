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
| System | **Re-assess skill/protocol conditions** | `/appraise` one-question-at-a-time rule (SKILL.md: "group by axis, wait for みや to engage") made it slow and counter-productive (2026-04-29). Review ALL skill/protocol conditions that create slow Q&A instead of dense useful output. Rethink for みや's direct style. This Friday. |
| Growth | **Phase 1 vision progress review** | Honest assessment — what's been learned this week (flowables, XHTML→bean tracing, domain glossary, guard conditions). How far along Phase 1 (Personal Excellence)? **Affects medium & long term targets (team → company). みや wants Ruri's honest assessment.** |
| Growth | **Week post-mortem** | Review week's tickets, findings, patterns. Extract improvements for MemoryCore + quest workflow. **Include token efficiency improvements.** |
| Growth | **MemoryCore improvements + Claude skills research** | Based on week's findings, post-mortems, etc. Threads links need laptop. Token-conscious — park until after work tickets done. |
| Growth | **MemoryCore improvements** | Based on week's findings — what can be improved in the system itself |
| Learning | **Claude skills/features research** | Threads links to share + discuss on laptop. Skills, new features, anything useful for workflow |
| Learning | **Friday recap: QA #258022 debugging walkthrough** | Re-read `projects/coding-projects/active/QA-258022/DEBUGGING-WALKTHROUGH.md` and `STORYLINE-FOR-CODE-REVIEW.md` together. Cover: composite component picking heuristic, XHTML→config bridge, option_type comparison, field shadowing trap. みや wants to internalize this so he can trace + debug JSF himself next time. |
| Learning | **Build JSF debugging playbook** | Generalize from #258022: standard sequence (DevTools inspect → grep label → composite first → form XHTML → managed bean → config layer). Layer-order checklist. "Field-to-source" cheat sheet template for high-traffic composites like `mlkSemakanMaklumatPanel.xhtml`. |
| Learning | **Research GitHub repo "hermes"** | みや mentioned 2026-04-29 — interested in introducing to MemoryCore as a potential memory framework. Need link from him. Multiple "Hermes" repos exist; need to know the specific one (could be memory system, could be LLM, etc.) before evaluating fit against current MemoryCore architecture. |
| System | **DB-level read-only — Option A/B/C deferred** | みや 2026-04-29: not currently viable (no DBA access / risk of affecting other tools). Stay with wrapper + harness 2-layer protection. Revisit if a misclick or harness slip causes a write incident. Options if needed later: (A) `ALTER ROLE et_reporting SET default_transaction_read_only = on;` (B) REVOKE writes from et_reporting (C) Create dedicated `mcp_readonly` role. |
| System | **Etanah-knowledge: ENVIRONMENTS.md or DATABASE.md update** | みや 2026-04-29: deferred. Add UAT/FAT/mlit semantics + flowable alter page note to either DATABASE.md (extension) or new ENVIRONMENTS.md. Decide which placement first. The feedback memory `feedback_uat_fat_environments.md` covers it for now via auto-load, but domain reference belongs in etanah-knowledge too. |
| System | **CLAUDE.md trigger broadening for Etanah work** | みや 2026-04-29: deferred small enhancement. Currently inventory-first knowledgebase load is Quest Phase 0 only. Could broaden to ANY Etanah/Melaka context (mention of urusan codes, file paths under E:\Projects\Melaka, DB queries to et_main schemas, etc.). Trade-off: might over-trigger. Validate worth before adding. |
| System | **Feedback architecture refactor — hook model (multi-week)** | みや 2026-04-29 architectural critique — validated and confirmed. **The problem**: `auto-memory/feedback_*.md` accumulated as a kitchen sink (30+ files). Each new behavioral slip got its own file. No structural anchor — rules float free instead of living where they're enforced. Auto-loaded all-or-nothing every session = context bloat. Likely contributed to today's destructive-DB-probe slip (the "verify before claim" rule existed but wasn't woven into how I approached MCP-DB usage; if it had been embedded in a DB-usage protocol or skill, the wrong probe wouldn't have happened). **The goal**: feedback rules migrate to canonical docs where they're enforced — `.claude/personality.md` (communication/style/tone/gestures), `quest/quest-protocol.md` (workflow discipline / Phase 0/1/2 rules), `.claude/CLAUDE.md` (debug rituals, boot rules, hard rules), `projects/coding-projects/active/etanah-knowledge/melaka/*.md` (domain knowledge), each skill's `SKILL.md` (skill behavior). **Why it works**: those canonical docs already auto-load via session boot — auto-loading is not lost. **What's gained**: rules live with the systems they constrain; forge L4/L5 promotion path becomes "absorb into canonical doc"; new rules require placement decision upfront (forcing clarity about what kind of rule it is). **New rule going forward (effective immediately)**: don't create new files in `auto-memory/feedback_*.md`. When a new behavioral rule emerges, find its canonical home. **Refactor scope (multi-week — schedule when queue clears)**: (1) Audit all 30+ existing feedback files; (2) Categorize each by canonical home; (3) Migrate content into canonical docs (merge with existing sections or add new sections); (4) Update MEMORY.md (likely shrink dramatically or eliminate); (5) Update CLAUDE.md to reflect the new architecture; (6) Verify auto-load behavior unchanged after migration. **Risk**: losing context-anchored rules during migration — mitigate via per-file checklist and verification against forge-log + observation-log entries. **Do NOT**: rush migrate, lose rules, or skip verification. **Trigger to start**: explicit みや scheduling, after current Etanah ticket queue clears. |
| System | **User-side learning home — decide location** | みや flagged 2026-04-29: PERANAN-LEARNING.md sits in `projects/coding-projects/active/QA-258022/` but is semantically user-side reference, not project work. Logically should live outside `Project-AI-MemoryCore` — but that needs a remembering system. **Decision trigger: after 3 closed tickets OR Friday 2026-05-09, whichever comes first.** Decide between: (a) new `learning/` folder in MemoryCore, (b) external folder + index pointer, (c) keep in coding-projects but rename folder to reflect mixed content. Don't drift past trigger. |
| System | **Continuous-improvement section in MD knowledge files** | みや asked 2026-04-29 — added to PERANAN-MAP.md + PERANAN-LEARNING.md as "Continuous Improvement" section (revisit triggers + update conditions). Roll out same pattern to other `etanah-knowledge/melaka/*.md` files (DATABASE.md, FLOWABLE-WORKFLOWS.md, BUG-BESTIARY.md, DOMAIN-GLOSSARY.md, MODULE-ARCHITECTURE.md). One file per Friday until done. |
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
| ~~System~~ | ~~**DB read-only MCP**~~ | ~~DONE 2026-04-29 — both `mcp__postgres-mlkuat__query` and `mcp__postgres-mlkfat__query` wired via `claude mcp add`; et_reporting + etanah123 used; wrapper enforces `transaction_read_only=on` (verified)~~ |
| System | **Dev environment automation — IDE/JBoss/browser verification** | みや 2026-04-29 idea: extend the DB-MCP momentum to other dev tools. **Components + feasibility**: (a) **Standalone.xml DB-target check + Quest header field** for awam-vs-pelupusan + DB env: HIGH feasibility, just a protocol update — add `awam_or_pelupusan=` and `db_target=` fields to `quest/active.txt` header at Phase 0; (b) **JBoss start/stop automation**: MEDIUM — could run `standalone.bat` via PowerShell/Bash, but Bash hangs on Windows for long-running commands per `feedback_bash_tool.md`; needs careful spawn-and-detach pattern; (c) **Browser-based fix verification**: HIGH — `mcp__Claude_in_Chrome__*` tools already available (saw in deferred tool list); could open the affected page after a fix and verify visually; (d) **Eclipse integration**: LOW — no good MCP for Eclipse currently; would rely on file-system + git only. **Suggested order**: start with (a) Quest header field (lowest cost, highest workflow value), then (c) browser verify (high value once we use it for FAT retests), defer (b) and (d). Run /appraise on the strategy in a future session before committing. |
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
