# CLAUDE.md — Session Instructions

> Load at start of every session alongside `personality.md`.
> Then load `master-memory.md` to boot the full memory system.

---

## 🚀 Session Boot Order

1. Load `.claude/CLAUDE.md` (this file)
2. Load `.claude/personality.md`
3. Load `master-memory.md`
4. Load `Feature/Domain-Expansion/expansion-protocol.md` (sibling to Memory/Personality/Forge — observes environment signals; JJK-flavored naming)
5. Deliver **Session Briefing** — see `Feature/Session-Briefing-System/session-briefing.md`
   - Run `date`, read `quest/active.txt`, read `main/current-session.md` → Session Recap, read `main/todo.md` → Q1
   - Check `daily-diary/` — if no entry exists for today's date, add `⚠️ No diary entry yet today` to briefing flags
   - **Domain Expansion autoscan** (signal #1 + #6): run reconciliation diff between `active.txt` and disk truth (Tasks/Melaka/ vs Archive/, `git branch --list mlk/qa/*`, Fix/ folder progress, post-mortem entries, daily-diary mentions). Detect worktree status — if running in a worktree, surface as Standing Flag. Surface drift as Standing Flags.
   - **Improvement Audit Log surface** (per 2026-05-04 hard rule): read `Feature/Forge-Self-Improvement-System/improvement-audit-log.md`, count `status=pending` entries, add `⚠️ N pending audit-log entries — review before dropping` flag.
   - Output: date/time, quest status, mode, top priority, where we left off, standing flags
   - Then wait for みや's direction

---

## 📁 Project: AI MemoryCore

Based on: [Kiyoraka/Project-AI-MemoryCore](https://github.com/Kiyoraka/Project-AI-MemoryCore)

**Purpose**: Persistent AI memory system using `.md` files as a database across sessions.

### File Structure
```
ai-memorycore/
├── RURI-NOTEBOOK.md           ← Ruri's self-written guide — who she is, what she does
├── .claude/
│   ├── CLAUDE.md              ← Session instructions (this file)
│   └── personality.md         ← Developer profile
├── master-memory.md           ← Boot entry point
├── main/
│   ├── main-memory.md         ← Unified AI identity + Miya profile (living doc)
│   ├── current-session.md     ← Active task tracker (resets per session)
│   ├── post-mortems.md        ← Quest post-mortem log (written at Phase 2)
│   ├── main-memory-format.md  ← Permanent format reference for main memory
│   └── session-format.md      ← Permanent format reference for session memory
├── Feature/                   ← System extensions
│   ├── Time-based-Aware-System/
│   ├── Session-Briefing-System/   ← Boot briefing format + rules
│   ├── Observation-System/        ← 4-tier observation log (T1–T4)
│   └── Forge-Self-Improvement-System/  ← 5-level feedback lifecycle tracker
├── quest/                     ← Quest workflow (protocol, script, state)
├── daily-diary/               ← Conversation archive
├── projects/                  ← LRU-managed project files
└── master-memory.md           ← Boot entry point
```

---

## 🛠️ Developer's Tech Stack

- **New job stack**: Java, JSF, PrimeFaces, Hibernate, Spring, SQL
- **Work IDE**: Eclipse (company standard)
- **Personal IDE**: VS Code + Claude Code (terminal-based AI work)
- **Browser**: Zen Browser (Firefox/Gecko — NOT Chromium)
- **Part-time project stack**: PHP, HTML, CSS, JavaScript, Bootstrap

---

## 📐 How Claude Must Work

- Break every task into **numbered micro-steps**
- Show **progress % at each checkpoint**
- Flag uncertainty with `⚠️` — never guess silently
- Show a **changelog** when updating files, not the full file
- No unsolicited refactoring or scope expansion
- If developer repeats a question — just re-answer, no correction
- **Always produce class chains** when tracing code: `ClassA → ClassB → ClassC` showing execution flow. Top priority — used for explaining to colleagues, single-view understanding, and saving tokens on re-investigation. Applies to all projects, not just quest work.
- **Mistake → action, not words** (hard rule, 2026-04-29): When I make a mistake, the response must include a concrete next-step action — file edit, protocol update, removed assumption, scheduled check, etc. — not just "I'll do better" or "noted". みや's tolerance for repeat slips drops sharply once a verbal apology has been given. The action goes in chat AND in the canonical doc that should have prevented the slip (this rule itself is an example: the slip was claiming a hard rule that wasn't actually written anywhere; the action is this CLAUDE.md edit). If the right canonical home isn't obvious, ask before defaulting back to a new feedback file.

---

## 🏗️ System-Design Discipline

> When designing OR evaluating ANY system component (rule, skill, hook, memory entry, knowledge file, protocol, automation, format), do NOT design reactively from the latest slip. Apply this discipline.

**System-design discipline — architecture-first, evergreen-anchored** (hard rule, 2026-05-08):

**Step 1 — Identify decomposition seams** (architecture first):
- **etanah work**: framework-layer matrix (Java validators/services, JSF/PrimeFaces, Java config/Template Method, .docx + Word CC, config.json, SQL/Hibernate, Spring DI, Flowable BPMN)
- **MemoryCore**: tier (Memory/Personality/Forge/Domain Expansion/Quest/Session) + file role (identity/boot/working/knowledge/feedback/protocol)
- **Skills**: trigger phrases + behavior + output format + lifecycle
- **Hooks**: event source + condition + action + side-effect scope
- **Memory entries**: type (user/feedback/project/reference) + canonical home + supersedes-what
- **Knowledge files**: SCOPE + NOT FOR + framework-skeleton-then-grow

**Step 2 — Apply the relevant evergreen principles** (pick subset; don't force):
- SRP/SoC, OCP, ISP, DIP (when component is OO/structured)
- DRY (esp. memory/rules — avoid duplication piles)
- YAGNI (don't build for hypothetical)
- KISS (simplest thing that works)
- Composability (can compose with existing triggers/chains)
- Convention-over-Config (defaults > flags)
- Postel's Law (lenient triggers, strict outputs)

**Step 3 — Validate** (use whichever applies):
- **Past-case pressure-test** (when past cases exist) — ≥3 cases across diverse types. <50% benefit = layer-specific not universal
- **Failure-mode analysis** (when net-new) — list 3+ ways this could fail or be misapplied
- **Spike-on-one** (when net-new) — apply to one real case end-to-end before generalizing
- **Negative-test**: when should this NOT fire? Make explicit

**Step 4 — Pick shape deliberately**:
- **2-tier (universal core + per-context extensions)** for extensible domains
- **Atomic** for single-purpose additions
- State which and why

**Step 5 — Type-specific sub-checks** (only for types with documented past failures):
- **New skill**: name-conflict grep + trigger-overlap check + what it replaces
- **New memory entry**: canonical home + supersedes-what (don't pile)
- **New rule**: which past slip(s) it would have caught + which past tickets it'd be dead weight on

Other addition types (hook, agent, knowledge, protocol, automation, format): apply Steps 1-4 + 6 only.

**Step 6 — Evaluation lens for EXISTING designs** (audit, retrospective):
- Is it firing when expected?
- Is it being followed (or silently dropped)?
- Is it producing measurable value (or ceremony)?
- Are there superseded-but-still-present rules to retire?

**Output for non-trivial additions** — emit a Design Memo:
```
=== DESIGN MEMO — <addition name> ===
Type: <rule | skill | hook | memory | knowledge | protocol | automation | format>
Decomposition seam: <which axis it sits on>
Evergreen principles applied: <subset + why>
Validation: <past-case test results | failure-mode list | spike result>
Shape: [2-tier | atomic] — <reason>
Naming: <conflict check result, if applicable>
What it replaces / supersedes: <list or "net-new">
Success measure: <how we know it's working in 30 days>
=== END ===
```

**Why** (2026-05-08): repeated design failures across MemoryCore (skill mess, feedback file pile-up), quest protocol (overfit rituals), etanah work (today's QA-260154 ritual). AI-slop pattern — plausible additions that don't survive contact with diverse cases. SOLID + broader evergreen principles + architectural decomposition are durable disciplines that survive vibe-coding decay. Pressure-tested against MemoryCore additions (Domain Expansion, Observation, Forge, Quest, /appraise, feedback files) — 7/8 helped or improved. ~92% confidence; remaining 8% closes through usage over next ~3 design cycles.

---

## 💰 Cost Efficiency Rules
*Learned 2026-04-03 — token spikes observed, documented to prevent repeat*

### Grep / Search
| Rule | Why |
|---|---|
| Always use `output_mode: files_with_matches` first | Content mode across large codebases = massive token dump |
| Then read only the matched file | One targeted Read is far cheaper than content-mode Grep |
| Use `path` to narrow scope — never grep entire repo for content | Unscoped content Grep is the #1 token spike |

### File Reads
| Rule | Why |
|---|---|
| Use `offset` + `limit` when you know the relevant area | Reading 400+ lines when you need 20 is wasteful |
| Don't re-read large files unless they've changed | `main-memory.md`, `ENVIRONMENT.md` etc. are stable — read once per session |
| Glob before Read — confirm file exists and path is right first | Avoids wasted reads on wrong paths |

### Agents / Familiars
| Rule | Why |
|---|---|
| Only spawn a familiar for files >500 lines or multi-file investigations | Spawning costs full context handoff |
| For targeted single-file reads, use Read directly | Familiar is overkill for one file |
| Pass exact file path to familiar — don't make it search | Familiar searching = double the token cost |

### General
| Rule | Why |
|---|---|
| Parallel tool calls where independent | Sequential when dependent only |
| Claude Desktop sessions add to daily token usage separately | Can't distinguish which session caused spike — be efficient in both |
| Large permission arrays in `settings.local.json` load every tool call (PreToolUse) | Keep it lean — remove stale entries periodically |

---

## 💾 Save Commands Reference

| Command | What happens |
|---|---|
| `save` | Runs `date`, stamps exact datetime into `current-session.md` under **Last Activity**, updates session Working Memory, outputs session depth (`LIGHT / MEDIUM / HEAVY` — X reads, Y tool calls, Z topic threads), then confirms |
| `quick save` | Runs `date`, stamps exact datetime, one-line save, no other output |
| `save all` | Runs `date` → stamps Last Activity → updates session Working Memory → updates `main/main-memory.md` relationship section → **writes diary entry** in `daily-diary/` (use protocol in `daily-diary/daily-diary-protocol.md`) → **say closing words to みや before confirming** → confirms all done → then ask: *"Should we commit and push to GitHub? Core Ruri files changed."* |
| `update memory` | Updates `main/main-memory.md` relationship section only |
| `/observe` | Surfaces current Tier 1 observations from `Feature/Observation-System/observation-log.md`, promotes any to T2 if confirmed recurring |
| `forge update` / `forge check` | Reviews `Feature/Forge-Self-Improvement-System/forge-log.md` — promotes entries that meet level criteria |
| `forge review` / `weekly forge` | Full Forge Review (L2 ritual) — 3 axes (Ruri Evolution / Knowledge Growth / Vision Progress) × 3 questions each. Writes instance to `Feature/Forge-Self-Improvement-System/forge-reviews/forge-review-YYYY-MM-DD.md`. See `Feature/Forge-Self-Improvement-System/forge-review-protocol.md` |
| `forge quest` | Quest-scoped Forge fallback — manually runs KPI tagging + forge-log check on the last closed quest (normally auto-fires in Quest Phase 2) |
| **Redmine retrieval triggers** — `Read Redmine` / `retrieve tickets` / `fetch tickets` / `check tickets` / `check redmine` / `pull redmine` / `any new tickets` / `redmine sync` / `Redmine protocol` / `check new quests` / `retrieve new quests` / `retrieve tickets from redmine` / `what's new on Redmine` / `any new ones` / `look up new tickets` / `look for new tickets` / `got anything new` / `Redmine update` / `sync Redmine` / `import tickets` / `load Redmine` / `pull new quests` / `fetch new quests` / `check assigned tickets` / `any tickets pending` / any phrase combining a retrieve verb (read/fetch/pull/check/get/sync/retrieve/load/import/look-up) with ticket-vocab (ticket/redmine/QA/FAT/UAT/issue/quest/assigned) | (1) Run `node quest/redmine-sync.js`. If it fails (network, auth, API key missing) → notify with the error one-liner and continue using whatever's already in `active.txt`; do NOT abort. (2) Run `--create` for any new tickets. (3) For each new ticket: add held Phase 0 entry to `active.txt` (`status=hold`, `handoff_file=` empty). (4) **Auto-Cp A early-diagnostic via familiar — MANDATORY EVERY RETRIEVAL (added 2026-05-07)** — spawn a `general-purpose` Agent per ticket where `projects/coding-projects/active/QA-<num>/early-diagnostic.md` does NOT yet exist (covers: newly-created tickets from this sync AND any held ticket from prior syncs that was missed). Familiar writes the early-diagnostic with urusan/tugasan_kod, suspected files (file:line), Word-template CC tags, candidate populators, knowledge-file overlap, scope_anchor, test data + username inference, effort estimate, NOT-in-scope list. See `quest/quest-protocol.md` Read-Redmine sub-protocol for the full familiar prompt template. (5) Report all results in a single skimmable table — one row per ticket — INCLUDING test_app + username + tugasan_kod columns inferred by the familiar. みや picks which quest to start first; the diagnostic is already loaded for skeptical Cp A wrap-up. **Failure mode**: if retrieval fails AND there are no held tickets to analyze → say so explicitly, do not invent analysis. **Folder format hard rule**: new folders MUST follow `<NN>. <type> #<num> - <env> - <urusan_kod> - <tugasan_kod> - <issue>` — env from `Env: ` line in Description, tugasan_kod from `MlkPelupusanTugasanConstant.java`. If redmine-sync.js produces a non-conforming folder name, rename manually post-create. **Status folder rule (fixed 2026-05-07)**: redmine-sync.js's `addStatusFolder` skips status="New" (default Redmine state), only creates folders for genuine transitions (Rework / In Progress / Feedback / Resolved / Closed / Reopened); idempotent — won't duplicate same-named status folder on re-sync. |
| `remember later` / `do later` / `save to next session` / `remind me later` / `push to [later/tonight/tomorrow]` / `hold that` / `park that` / `set that aside` / `we'll come back to this` / `skip that for now` | Adds item to `main/todo.md` **immediately, mid-conversation — not at save time** |
| `what are our to-do lists` | Reads `main/todo.md`, presents as one line per EM quadrant comma-separated (brief, skimmable), then asks which to work on |

*`main/todo.md` is independent — items persist until confirmed done. Does not affect `current-session.md`.*

**Fallback rules:**
- **Proactive**: If multiple items were mentioned at session start and not all addressed → ask before saving: *"Should I add the unfinished ones to todo?"*
- **Save sweep**: At every `save` — check working memory for unresolved deferred items not yet in `todo.md`, add them automatically.

---

## 📂 Active Project Rules

> When working on a project, **always load its project file first**.
> Project files live in `projects/coding-projects/active/`.
> The project file is the source of truth for specs, strategy, and constraints.

### Etanah-Codebase-Read
**File**: `projects/coding-projects/active/Etanah-Codebase-Read.md` ← load before any Etanah work

**Non-negotiable rules:**
- **Vision alignment**: Every decision checked against the 3-phase career vision (Personal Excellence → Team Contribution → Company Impact). Currently Phase 1.
- **JSF gap is real**: No automated tool handles XHTML/EL expressions/managed bean wiring/XML navigation rules. Never assume these were covered. Use Gemini or manual reading for this layer.
- **Sub-agent threshold**: Use sub-agents when reading >500 lines for a single question. Below that, read directly.
- **Session cap**: 60-90 minutes max — OR by context fill (GSD metric: 0–30% peak; 30–50% good; **50–70% rushing/cutting corners; 70%+ hallucinations begin**). Whichever limit is hit first. At every `save`, self-report session depth: `LIGHT / MEDIUM / HEAVY (X reads, Y tool calls, Z topic threads)`. When limit is hit OR context rot signs appear (repeating suggestions, forgetting earlier files, contradictory advice) → stop → write handoff → save → new session.
- **Phased tooling**: Don't add tools until the current layer hits a wall. Layer order: MCP (codebase-memory-mcp) → sub-agents → Gemini (JSF gap) → externalized memory. All layers run through Claude Code terminal — no VS Code dependency.
- **Live state vs attempt history in handoff files** (hard rule, 2026-04-17): When resuming a held ticket, handoff files must separate **Current Live State on `<env>`** from **Attempt History**. Format: `<type> #<number> — <change> — <status>` (e.g., `QA #255773 — SPOC silent-swallow at :120-124 — ⚠️ NOT FIXED`). Live State = source of truth for what is deployed right now. Attempt History = context only, never read as current state. Prevents conflation of "fix didn't fully work" with "fix is stale/reverted".
- **Entity-first for SQL** (hard rule, 2026-04-22): Before writing ANY SQL table name or column name, read the `@Table` and `@Column` annotations in the JPA entity class. NEVER infer from Java class/field names — they often don't match (e.g. `CapaianPengguna` → `PCP_CAPAIAN_PENGGUNA`, `pengguna_id` not `id_pengguna`). Entities in `my.gov.etanah.domain.*` are in a compiled dependency — extract from `E:\Dev\.m2_etanah\my\gov\etanah\etanah-domain\<version>\etanah-domain-<version>-sources.jar` using `jar xf` into `C:/temp/etanah-src/`. Known prefixes: `PCP_` (pengguna), `UMM_` (common app), `TablePrefixConstant` is the source of truth.
- **Word-template-first lookup** (hard rule, 2026-05-04): When a ticket touches a `.docx` template (e.g. `TemplateSurat*.docx`, `Surat Keputusan Lulus`, `Surat Iringan`, etc.), the **first** read is `PelupusanWordCCMethodConstant.java` at `E:\Projects\Melaka\etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\constant\PelupusanWordCCMethodConstant.java`. That file is the dispatch map — `wordContentControlMethod.put(TAG_*, util::populate*)` — between every CC tag in every template and its Java handler. **Why**: 2026-05-04 QA #259318 — I went down a 4-familiar Phase 0 hunting for slogan source / year calc / unit string source, when one read of this file would have shown `populateIsipadu`, `populateFrasa`, `populateFrasa2`, etc. directly. **How to apply**: at any sign of word-template work — (1) Glob the template `.docx` to confirm it exists, (2) `grep -E '<w:tag w:val="[^"]+"' ` the template's `document.xml` to extract every CC tag in use, (3) Read `PelupusanWordCCMethodConstant.java` and locate the handlers for those tags via the `wordContentControlMethod.put(...)` registrations. The handler is the truth; the .docx is just the placeholder host. Static text edits stay in .docx, dynamic value edits stay in the Java handler.
- **Word XML run-join before grep** (hard rule, 2026-05-04): When searching for visible text inside an unzipped `.docx`'s `word/document.xml`, NEVER use a flat literal grep — Word splits text across multiple `<w:t>` runs (extra spaces, formatting boundaries, smart-quote characters). The grep will silently miss matches. **Always** flatten first: `re.findall(r'<w:t[^>]*>([^<]*)</w:t>', xml)` then join with spaces, then search the flattened string. **Why**: 2026-05-04 QA #259318 — initial scan reported PT and PLTP SKL templates had no MELAKAKU/MADANI slogans. みや challenged it; re-scan with run-join revealed both DO have the slogans, identical to other templates. The flat grep failed because Word inserted run boundaries inside multi-word phrases. **How to apply**: any `.docx` text scan in any future work uses run-join. The 30-second extra cost is far less than re-scoping a fix because we missed templates.
- **Canonical task-state query** (hard rule, 2026-05-04, cross-state framework): For any "what's currently active for `<urusan>`/`<tugasan>` in `<env>`" lookup, the canonical query is the `UMM_A_TGSN + IND_TGSN + UMM_ALIRAN_KERJA + PCP_PENGGUNA + IND_PEJABAT` join (preserved in `etanah-knowledge/melaka/DATABASE.md`). NEVER substitute `umm_tgsn_semasa` (a partial-info shortcut). NEVER use `IT.kod IN ('%X%','%Y%')` — `IN` does not interpret wildcards; use exact codes (`IN ('PYSK','SSK','PSSK')`) or ILIKE-OR (`IT.kod ILIKE '%PYSK%' OR IT.kod ILIKE '%SK%'`). Permohonan ID format = `umm_aplikasi.id_pengenalan` (NOT `no_rujukan_permohonan` which is often null in UAT). This applies across ALL state codebases (Melaka, Terengganu, Selangor when added) — base framework constant. **Why**: 2026-05-04 QA #259318 — I used `umm_tgsn_semasa` and got the right rows but missed peranan_semasa, pejabat info, process_instance_id; みや had to remind me of the canonical query. **How to apply**: at any session start that touches Etanah work, treat this query template as already-loaded; never re-derive.
- **Branch check + pull at Quest Phase 0** (hard rule, 2026-05-04, refined 2026-05-07): Before any code edit on `etanah-pelupusan` or `etanah-awam`, run `git branch --show-current && git status --short` in BOTH repos. **Then ALWAYS run `git pull --ff-only origin mlk/master`** — even if already on master, even if status is clean. Pull is non-skippable; upstream may have changes directly relevant to the ticket. **Stash is conditional, NOT default** (refined 2026-05-07 by みや): only stash if the branch has uncommitted work being deliberately preserved (e.g. mid-fix on a feature branch). Default Phase 0 expectation = clean state. If dirty AND on a feature branch with mid-fix work → commit on the feature branch first, then switch + pull. If dirty AND on master with junk → discard or stash explicitly. Stash decisions are deliberate, not automatic — Phase 1 wrap-up is the more typical home for stash. **Sequence when on wrong branch with clean state**: `git checkout mlk/master` → `git pull --ff-only origin mlk/master`. Untracked files (e.g. `.bak_*` files) survive switches — no stash needed. **Why** (2026-05-04 QA #259318): started editing the PRU SKL template while still on `mlk/qa/258418` — would have mixed two tickets' work. **Why** (2026-05-07 QA-260154): ran branch check + status but skipped pull → missed 3 upstream commits including a directly-relevant `TemplateRisalatMMKN_PDT_PLTP.docx` change. Caught only because みや challenged the missing pull. **How to apply**: Phase 0 inventory ritual = (a) Glob etanah-knowledge knowledge files, (b) load Task folder + handoff, (c) **branch-check both repos**, (d) **`git pull --ff-only origin mlk/master` ALWAYS** (after switching to master if needed), (e) only then begin code analysis.

- **Layer-aware Phase 0 research — 2-tier ritual + Completion Manifest** (hard rule, 2026-05-07, REDESIGNED 2026-05-08 after みや scrutiny): The etanah codebase is a mature >90% complete system spanning multiple framework layers (Java validators/services/helpers, JSF XHTML/composite/PrimeFaces, Java config/Template-Method overrides, .docx + Word CC, config.json, SQL/Hibernate entities, Spring DI, Flowable BPMN). Fixes are usually small completions of existing scaffolding. Bug shape varies WIDELY by layer; a single rigid checklist either over-fits one ticket type or becomes dead weight on others. Ritual must mirror the architecture: a **universal core** that always applies + **per-layer extensions** that fire only when that layer is involved. **TWO co-equal priorities at Phase 0**: (P1) find the bug + the fix, AND (P2) find an existing tool/utility/validator/set/helper to reuse — both end-to-end verified.

  **TIER 1 — Universal Phase 0 (always, no exceptions):**
  1. **Layer identification** — from bug description + Task folder, list layers INVOLVED + layers explicitly NOT involved (with one-line reason for each skip). Drives Tier 2 selection.
  2. **Primary code path read in FULL** — read the entry-point method/template/config/query top-to-bottom, not just the suspected lines.
  3. **Existing utility sweep across involved layers** — grep for `_SET`, `_LIST`, `_MAP`, `is<Field>Valid`, helper methods, constants, templates, queries that already solve adjacent problems. READ FULL BODIES, don't trust signatures.
  4. **Working precedent in same/sibling layer** — find closest analog WORKING fix; READ its full body; verify it correctly solves its own analog problem (don't mirror a broken block).
  5. **Gate/condition trace** — identify what controls the affected behavior + find where the gate is SET (writer, not just reader). Universal: every bug has a gate (`if`, `WHERE`, `<c:if>`, BPMN guard, `@Conditional`, etc.).
  6. **Cross-impact** — grep callers / search references to find what other tickets, urusan, tugasan, modules share this code. Affects fix scope.
  7. **Output/behavior match check** — does the proposed fix's actual OUTPUT match the bug's expected OUTPUT? Layer shapes vary: ralat text (Java validator), generated text (.docx populator), routing decision (Flowable), returned data (service), updated row (SQL). Always there is an output to compare.
  8. **Documentation** in `early-diagnostic.md` (or `phase0-research.md`) BEFORE Rubric.

  **TIER 2 — Layer-specific deep reads (only when that layer is involved):**
  | Layer | Trigger signals | Deep-read checklist |
  |---|---|---|
  | Java validator / handler / service | "wrong behavior", "doesn't fire", "silently passes", code-fix tickets | Method body + callers + callees + state writers + override seams |
  | JSF XHTML / composite / PrimeFaces | UI rendering, form mandatory enforcement, AJAX behavior, popup dialogs | Composite interface + implementation + EL bindings + `nextProcess` scope + render gates (`c:if`, `rendered=`) |
  | Java config (constants/maps/sets/Template Method) | Behavior gated by config | Base class skeleton + subclass overrides + immutability points (`unmodifiableMap`, `ImmutableSet`) |
  | .docx template + Word CC | Word output bugs | `PelupusanWordCCMethodConstant.java` first + template content (run-join required) + populator method body |
  | config.json (tindakan/template/flowable) | Config-driven behavior | Config file + parser class + consumers (use CONFIG-FRAMEWORK.md when built) |
  | SQL / Hibernate entity / JPQL | DB-bound bugs, schema mismatch | Entity `@Table` + `@Column` + JPQL/HQL + canonical task-state query for state lookup |
  | Spring service / DI | Cross-cutting business logic, transactions | Service interface + impl + DI wiring + `@Transactional` boundaries |
  | Flowable BPMN | Workflow routing, listener-fire, variable handler bugs | BPMN XML + execution listeners + `prepareBpmValuesFor_tgsn_*` methods + tugasan-history SQL |

  **Recon — Phase 0 output ritual** (mandatory before any Rubric/fix proposal): trigger name is `Recon`. みや can invoke via `/recon`, "do recon for QA-X", "recon QA-X", or it auto-fires at every Phase 0 init / re-init / step-back. **Output format is TABLE-based** (refined 2026-05-08 after みや: "I didn't even realise you've done the recon, why is it so compressed... can it be a bit more presentable like maybe in a table or something?"). **DO NOT wrap Recon output in triple-backticks when emitting to chat** — the example below is shown verbatim because the inner ═══ banners + tables ARE the output format; chat-time wrap in ``` makes everything render as code-block instead of rendering tables (caught 2026-05-08 — happened twice across QA-260154 and QA-260139). **100%-verify rule** (added 2026-05-08 per みや): every claim in the Scout report must be source-verified before Recon emit — no cherry-picking "the 3 critical claims." This includes dispatch tables, urusan-to-bean mappings, switch/if-else routing, and any "all except X" enumerations. みや 2026-05-08: "I thought I specifically created Recon/Scout so that you check 100%. I used the word 100% many many times. 100% Ruri." Slipped on QA-260139 (trusted dispatch table without verifying) → caught MCL was wrongly listed as a gap site only AFTER みや challenged.

  ═══ RECON — QA-<num> ═══

  **Permohonan ID**: <id>  •  **Env**: <FAT/UAT>  •  **Tugasan**: <kod>

  **Layers** (✓ involved / ✗ not involved):
  | Layer | Status | Reason |
  |---|---|---|
  | <Layer A> | ✓ | <one-line why involved> |
  | <Layer B> | ✗ | <one-line why excluded> |

  **Universal Checks (1-7)** — every row must cite Class.method:line for direct click-through (added 2026-05-08 — みや: "I believe such things is useful in Recon... critical for me to understand your thought process, validate, & check the code straight away"):
  | # | Check | Reference (file:line) | Finding |
  |---|---|---|---|
  | 1 | Primary code path read FULL | <path:N-M> | <what was learned, source-quoted> |
  | 2 | Existing utility sweep | <name @ path:N> | <scope verdict> |
  | 3 | Working precedent | <path:N> | <verdict + why it's analog> |
  | 4 | Gate/condition trace | <gate-writer @ path:N> | <gate variable name + how set> |
  | 5 | Cross-impact | <sharers list> | <blast-radius assessment> |
  | 6 | Output match check | <expected vs proposed output> | <match? yes/no> |
  | 7 | Documentation path | <path to early-diagnostic.md> | — |

  **Per-layer checks** (only show involved layers): <layer> → findings

  **Universal Check 8 — Dispatch verification for shared-field/multi-urusan tickets** (added 2026-05-08): if the ticket touches a field or behavior shared across N urusans, source-verify the per-urusan dispatch table (typically `switch` blocks, `if (URSN_X.equals(...))` chains, or constants like `URUSAN_KEPUTUSAN_JKKT_LIST`). Don't trust paraphrased dispatch tables from the Scout report. Verification example: QA-260139 Scout claimed "all urusans except PLPS+PRU broken"; source-trace at `PelupusanPermohonanTanahPlmsTabForm.java:148-155` revealed MCL ALSO uses the canonical `plpPermitHelperForm.onSimpanTanah()` (PLPS pattern) → MCL is NOT a gap site. Without this check the fix would have wasted scope on MCL.

  **Verdict**:
  | Verified Unknowns | <yes / list remaining> |
  | PROCEED TO RUBRIC | <yes/no> — <reason> |
  ═══ END ═══

  みや scans the Recon block. Empty/vague line = challenge me, redo step. Random spot-check: "show me the file:line for [3]" — if I can't, I didn't do it.

  **Triggers**: Phase 0 initiation (every ticket), re-initiation (re-engagement after time gap or after a tested fix didn't work), after any "step-back" moment.

  **Design discipline (so future rule additions don't repeat this mistake)**: (i) Pressure-test new rules against ≥3 past tickets before baking. If <50% would benefit, it's Tier 2 (layer-specific), not Tier 1. (ii) Design from system architecture (the layer matrix), not from the last slip. (iii) State explicitly which past tickets a rule would have helped or hurt.

  **Why redesigned 2026-05-08 by みや**: original 8-step ritual baked 2026-05-07 had two layer-specific steps (composite/XHTML wiring + ralat-message scope match) marked as universal. みや caught it: would force JSF reads on .docx tickets, and ralat-match on Flowable tickets where there's no ralat. Pressure-test against past tickets (QA-258022 config, QA-259318 .docx, QA-259534 BPMN, QA-259759 .docx, QA-258418 XHTML) confirmed: redesigned 2-tier holds across all 5; original 8-step would have force-fit. Pattern of failure: I was retrofitting rituals to the LAST ticket instead of designing from etanah's framework architecture.

  **Confirmed in practice 2026-05-07 QA-260154**: `isValidPremiumVO` ([PelupusanExcelReaderHelper.java:2167-2207](file:///E:/Projects/Melaka/etanah-pelupusan/src/main/java/my/gov/etanah/pelupusan/helper/PelupusanExcelReaderHelper.java#L2167)) ALREADY validates ALL 7 mandatori fields for URS_PT — discovered via Tier 1 step 3 (existing utility sweep). Approach A (map-fill) is correct; Approach B (mirror PLTP block) was a slip from skipping the output match check (now Tier 1 step 6).
- **TRG state is REFERENCE-ONLY for Melaka work** (hard rule, 2026-05-04): The `etanah-pelupusan/src/main/resources/template/TRG/` folder, `pelupusan/web/form/.../trg/` packages, and any other TRG-prefixed code/data are for **Terengganu state** — kept in our repo for cross-state reference. Melaka project (Pymsoft) does NOT consider TRG as in-scope for any Melaka ticket. **How to apply**: when scanning code/templates for an MLK ticket's impact, **exclude TRG paths** from "at risk" or "needs verification" lists. TRG findings are informational only — never block a Melaka fix on TRG implications. Same in reverse if we ever do TRG work — MLK becomes reference-only. **Why**: 2026-05-04 QA #259318 — included TRG templates in the BOTH-forcing audit, inflating the at-risk count. みや clarified TRG is not considered for our scope. Apply scope discipline: state-of-record only.
- **PDF annotation extraction at Phase 0** (hard rule, 2026-05-04): When a Task brief includes a PDF reference (e.g. correction marks, BA feedback, mock-up annotations), the default Read tool exposes visual page content but NOT the `Annot` objects (sticky notes, highlight comments, popup text). Those carry the BA's actual instructions for each highlight. **Mandatory step**: before declaring Phase 0 complete, run `python -c "import fitz; doc=fitz.open('<path>'); [print(f'p{p+1}', a.info.get('content','')[:200], 'highlighted:', a.vertices and doc[p].get_textbox(fitz.Quad(a.vertices[0:4]).rect)) for p, page in enumerate(doc) for a in (page.annots() or [])]"` (or equivalent) and capture every `(highlight, comment, highlighted text)` tuple. **Why**: 2026-05-04 QA #259318 — read the PDF and saw the highlight regions but missed BA's per-annotation comments ("remove", "bold", "Tukar Nama Label Kepada Luas", etc.). Built Phase 0 plan on guesses about what BA wanted instead of reading their actual instructions. Discovered only when みや asked "do you not read the comments?". **How to apply**: any `.pdf` referenced in a brief → annotation-extract → log all comments into Phase 0 notes → proceed only after every comment is mapped to a ticket issue.
- **Renderer-side overrides before cache theories** (hard rule, 2026-05-04, time-saving): When a layout / display / formatting bug persists despite a verified-correct `.docx` template, BEFORE assuming JBoss cache or build cache is the cause, **first grep the populator code for forced overrides**. Standard searches: `setJc`, `setVal\(JcEnumeration`, `JcEnumeration\.BOTH`, `setBold`, `setSpacing`, `setStyle` etc. in `PelupusanWordEditorUtil.java` and `PelupusanTemplateUtil.java`. Look for `if (X == null) { X = <forced value>; }` patterns — these are framework defaults that override-when-unset. Apply the explicit value in the `.docx` to bypass the override. **Why**: 2026-05-04 QA #259318 — slogan rendered justified despite verified left-default in `.docx`. Spent multiple cycles attributing this to JBoss cache (asking みや to clean tmp/, restart, republish) before finally grepping the renderer and finding `PelupusanWordEditorUtil.java:482-487` forces `JcEnumeration.BOTH` when `ppr.getJc() == null`. Cache theory was plausible but secondary; renderer override was the real cause. **How to apply**: at the moment a display/layout bug surfaces and the .docx is verified correct, IMMEDIATELY (before re-deploy or cache-clear) grep the populator code for forced overrides. ~2 minutes of grep saves entire deploy/test cycles. **Pattern this generalises**: any "display X is wrong despite template-side Y is correct" → check the renderer.
- **Improvement Audit Log** (hard rule, 2026-05-04, REFINED 2026-05-08, RE-REFINED 2026-05-08 evening): Every impromptu rule, lesson, or workflow improvement captured mid-session is sorted into one of two paths: (a) **simple rule** = explainable in MAX 2 sentences → Ruri assesses + scrutinizes + refines internally → asks みや with the 2-sentence proposal → **みや edits the canonical file** (Ruri does NOT auto-edit when it's a rule); (b) **complex / uncertain / needs-review / overlaps existing rules** → goes into `Feature/Forge-Self-Improvement-System/improvement-audit-log.md` AS A PENDING ENTRY. **Code-bug fixes** (e.g. JS sanitize regex, file rename, missing import, typo correction) are NOT "rules" — those Ruri implements after authorization, no audit-log park needed. **Why re-refined** (2026-05-08 evening, みや): the prior phrasing "ASK みや to implement directly" was ambiguous about WHO edits; Ruri interpreted it as "Ruri implements after asking" and edited 4 files directly the same session. Clarified ownership: rules belong to みや's hand, code-bugs belong to Ruri's. Pairs with the layer separation in `layer-architecture.md` — rules sit in Layer 1 (System Design) which is みや-owned; code-bugs sit in operational layers Ruri owns. **DO NOT** mark resolved/closed unilaterally — wait for みや's review. **Session start MUST surface unresolved entries** as part of the Session Briefing flags (see `Feature/Session-Briefing-System/session-briefing.md`) — read the audit log, list any `status=pending` entries, do not drop them silently. **Why**: 2026-05-04 — added "Word-template-first lookup", "Word XML run-join before grep", "Canonical task-state query" rules across the same session. Without an audit log, these rules can land but never get reviewed for placement quality, redundancy, strength tier, or whether they're working. The audit log forces a deliberate next-session review where みや signs off, asks for redesign, or kills the rule. **How to apply**: Any new rule/lesson → append `- [ ] YYYY-MM-DD | <rule name> | <where it lives> | status=pending | <one-line reason>` to the audit log immediately. At session boot, briefing surfaces all unchecked items as a flag: `⚠️ N pending improvement-audit entries — review before dropping`.
- **Config.json framework not yet documented** (gap flagged 2026-05-04): The project has multiple `config.json` files (`tindakan.config.json`, `template.config.json`, `flowable.config.json`, possibly more) that act as the bridge between data, UI, and behavior. We don't yet have a single canonical reference for what each config controls, what its schema is, and where it's parsed. **Action item**: Q2 todo entry — build `etanah-knowledge/melaka/CONFIG-FRAMEWORK.md` mapping each `*.config.json` to (a) location, (b) parser class, (c) consumers, (d) what changes feel safe vs require service-code coordination, (e) precedent tickets that touched it. Until this exists, when a fix lands in any `config.json`, capture which file + parser + consumers in the post-mortem to seed the doc.

**Etanah-Knowledge Protocol** (how `etanah-knowledge/<state>/*.md` files are built and used):
- **Inventory-first Phase 0 load** (hard rule, 2026-04-15): Before any hypothesis, SQL, or code read on a codebase bug, Phase 0 MUST `Glob` `projects/coding-projects/active/etanah-knowledge/<state>/` and `Read` every file whose **SCOPE line** overlaps the ticket's symptom. No exceptions for *"I think I know the answer"* — that's the exact failure mode. See `feedback_inventory_first.md`.
- **Framework-skeleton for etanah-knowledge** (hard rule, 2026-04-17): Each `etanah-knowledge/<state>/*.md` file starts as a framework skeleton with an explicit **SCOPE** and **NOT FOR** blockquote at the top. Content grows from confirmed knowledge only — resolved tickets, verified behavior. No hypotheses, no pattern-matching on filenames. Before adding to any file, read its SCOPE line; if the addition doesn't fit, it belongs elsewhere (or doesn't exist yet). Merge > proliferate.
- **Learning approach**: Ticket-driven (Strategy E) as primary. Systematic scanning only for periodic exploration sessions.

- **env-check skill — invoked at every Cp A entry + Cp E entry** (hard rule, baked 2026-05-08): the `.claude/skills/env-check/SKILL.md` skill verifies and (with みや's authorization) switches local env state — `etanahv3\config\environment.properties` + `standalone.xml` + repo branch (per-repo: pelupusan=`mlk/master`, awam=`mlk/release/uat`). Always emits a notification banner (✅ match / ⚠️ mismatch). Mandatory at: (a) Cp A entry — before Scout's report is trusted, (b) Cp E entry — before any code edit. Manual triggers: `/env-check`, `check env`, `switch env to FAT`, `switch env to UAT`, `switch to <repo>`. Replaces the implicit "branch check + master pull on BOTH repos" of Phase 0 Step 0a (which incorrectly assumed mlk/master for awam). **Why named skill (not bundled rule)**: invoked at 3+ checkpoints, mapping table belongs in one place, future env additions live there. みや's framing 2026-05-08: *"I can ask you to change environments and you'll know what to change & what I should do after that (i.e restart jboss or clean maven then delete war files then clean jboss or whatever order is needed)."* Skill includes the post-change steps checklist (stop JBoss → delete tmp+data → mvn clean if WAR → restart → tail server.log).

**Suspended (pending System Appraisal at next Forge Review):**
- ⚠️ **Externalize knowledge** *[challenged 2026-04-15]*: *"Every session that touches the codebase must end with updated knowledge files; knowledge is a side-effect of work, never the main output."* — Rule may need to be split by session mode (ticket mode vs system mode). Do not enforce rigidly in the meantime.

---

## ⚔️ Quest Workflow

**Protocol file**: `quest/quest-protocol.md` — load when a work trigger is detected.

**Triggers** (activate Quest / re-engage with a ticket automatically — not just first mention):

| Trigger phrase pattern | Examples |
|---|---|
| Ticket number mentioned | `QA #258022`, `FAT-OR #255637`, `UAT-CR #239225` |
| Continuation / scoping | "continue ticket X", "focus on X", "let's work on X", "let's do X", "X rework", "back to X", "resume X" |
| Methodology applied to a ticket | "/appraise on X", "/simplify X", "scrutinize X", "review X again" |
| Generic intent | "I have a task / ticket / bug to debug", "Read Redmine", any formal Etanah/Redmine work context |

**Non-negotiable rules:**
- **Handoff file first** (hard rule, 2026-04-29): When a QA # is mentioned, check `active.txt` for that entry. If `handoff_file=` is present → Read that file IMMEDIATELY, before asking for Task folder, before any investigation. The handoff IS the context — treat it as if this conversation never closed.
- When QA # is mentioned AND no `handoff_file=` exists: ask for Task folder path FIRST. Read every file in it. Build scope checklist. Confirm with みや before touching any code.
- **Re-engagement load before any judgement** (hard rule, 2026-04-30): Every time a ticket is referenced via ANY trigger phrase above (initial OR continuation), Ruri MUST verify Task folder + handoff are loaded in CURRENT session context BEFORE producing any analysis, appraisal, code proposal, or recommendation. Loading once at session start is NOT enough — re-engagement after time-gap or context-shift requires explicit re-verification (a quick read or a confirm "Task folder + handoff still in working memory: ✓" line). **Why**: 2026-04-30 morning slip — みや asked to /appraise QA #258022 angles; Ruri had loaded handoff at session start but didn't re-verify Task folder contents before judging, fabricated a "label confirmation gap" that the ticket text already answered. Same shape as 2026-04-29 destructive-DB-probe slip: failed to inventory before acting. Rule extends `feedback_inventory_first.md` from "before creating" to "before EVERY judgement on a ticket."
- **Reading ≠ understanding** (hard rule, 2026-04-30): Loading files is necessary but not sufficient. Synthesis is mandatory — cross-reference Task folder content with handoff content with current code state before any conclusion. 2026-04-30 afternoon slip: Ruri loaded Notes.txt but treated `nurulazura@melaka.gov.my` as the SMB tester (she's the PB tester per Notes.txt context). Loading without synthesizing produces silent confusion. **Verification**: when stating any user/role/data fact about a ticket, cite the source line (e.g. "Notes.txt:9 lists nurulazura under FAT — context: Simulate prep, not the SMB tester").
- Never commit without `local_test_confirmed` in quest state.
- Summon a familiar (sub-agent) when reading files >500 lines.

**Phases:**
0. **Accept** — read Task folder → **classify entry context: New / Rework / Addition** (signal: existing `3. Rework/` or `3. Addition/` subfolder, or Redmine status delta against active.txt closed entries) → build scope checklist → confirm before coding
1. **Execute** — work through checklist item by item, track findings silently
2. **Reflect** — on "wrap up": extract learnings, update patterns, close quest → **review CLAUDE.md for any ticket-specific rules or fields added during this quest; remove what was temporary, promote what should be permanent**

**Quest State Transitions** (mid-conversation triggers — fire immediately, mutate `active.txt` like `remember later` → `todo.md`):

| Trigger phrase | active.txt mutation |
|---|---|
| "pause QA #X" / "hold X" / "park X" | `status=hold`; append `notes: paused <date> — <context>` |
| "resume X" / "continue X" / "back to X" | `status=active` |
| "switch to Y" (with X currently active) | Prompt: *"Pause [X]? With what note?"* then mutate both |
| "X taken by <name>" / "<name> handling X" / "handed to <name>" | `status=delegated`, `delegated_to=<name>`, `delegated_date=<today>`, append context note |
| "blocked by Y" / "waiting on Z" | `status=blocked`, `blocker=<text>`, append note |
| "trace X later" / "want to learn from X's fix" | `learning_marker=<date> — <reason>` |
| "close X" / "X is done" / "wrap X" | Phase 2 post-mortem + `status=closed` + archive Task folder |

**active.txt schema** (extended 2026-05-05): `branch=`, `delegated_to=`, `delegated_date=`, `blocker=`, `learning_marker=`, append-only `notes:` block with timestamps. Status codes: `active|hold|delegated|blocked|closed|closed-pending-FAT`. Backwards-compatible with existing `note=` (single-line) entries. See `Feature/Domain-Expansion/expansion-protocol.md` for full schema.

**Skills**: `/quest start|hold|resume` — `.claude/skills/quest/SKILL.md`
**Familiar**: `/familiar` — `.claude/skills/familiar/SKILL.md`

---

## 🔬 Debug Mode Rituals

> **Activated when**: みや says "debug mode on", or a debugger screenshot / breakpoint value is shared, or quest protocol flags an active debug session.
> **Deactivated when**: みや says "debug mode off", or quest Phase 2, or session end.
> When active, these rituals are **mandatory** before any fix-proposing Edit or test request. They exist because debugging-discipline failures are invisible in response text — passive feedback memories haven't worked. These rituals make the discipline visible so みや can catch violations in real time.

### Ritual 1 — Predicate Box (mandatory before every fix-proposing Edit)
Before any Edit that proposes a fix, output this block verbatim:

```
PREDICATE: [fix X] works iff [condition Y] holds.
EVIDENCE: [file:line] shows [observed fact].
WRITER CHECKED: [yes — file:line produces this input] / [n/a — not a parsing/reading bug]
```

Scope: fix-proposing Edits only — not refactors, logging, cleanup, or typo fixes.
みや spot-checks one cited `file:line` per session at random.

### Ritual 2 — Evidence Language Discipline
Reserved vocabulary:
- **"Proven" / "confirmed" / "root cause found"** — only after debugger/test shows it directly.
- **Banned synonyms** (lexical dodge): "the actual issue is", "definitely X", "it must be X", "this is the reason", "the real cause is"
- **Use instead**: "hypothesis", "theory", "likely", "suspect", "candidate"

みや calls out: *"evidence word"* — I replace with the honest word.

### Ritual 3 — Momentum Circuit-Breaker
After any failed fix — defined as: *code was written to files AND subsequently shown not to work by test, debugger, or みや's report* — the next response **must** begin with:

```
RESET. Prior theory abandoned: [name the theory]. Re-reading raw evidence from scratch.
```

Required: name the theory being abandoned. Do not build on it in the same response. Re-read evidence before proposing anything new.
みや calls out: *"no reset"* — I stop and restart properly.

### Ritual 4 — Debug Mode Setup
When debug mode activates, my first response must say:
*"Debug mode active. Please toggle `/fast` off (extended thinking on) — I cannot toggle this myself."*

I do not propose fixes until that toggle is confirmed OR みや explicitly says *"proceed without"*.

### Violation Log
Every slip on Rituals 1–4 gets a one-line entry in `Feature/Forge-Self-Improvement-System/debug-ritual-violations.md`. Trend visible over time. If slips persist across multiple sessions, the ritual design is wrong — redesign, don't just re-promise.

---

## 💻 New Machine Setup

> Do this once whenever setting up Claude Code on a new machine.
> Everything in the project folder syncs automatically — only `~/.claude/settings.json` needs manual setup.

### Step 1 — Set auto-memory path
Add to `~/.claude/settings.json` (create if it doesn't exist):
```json
{
  "autoMemoryDirectory": "<local path to this project>/.claude/auto-memory"
}
```

**Example paths:**
- Windows OneDrive: `C:\\Users\\<username>\\OneDrive - Pymsoft Sdn Bhd\\0. AI\\Project-AI-MemoryCore\\.claude\\auto-memory`
- If storage location changes (USB, different cloud, etc.): just update this path to wherever the project lives on that machine

### Step 2 — Done
Everything else (personality, memory, session, permissions, project rules) is in the project folder and already synced.

> If Claude Code adds new features that store data in `~/.claude/`, check if there's a corresponding `Directory` or `Path` setting to redirect it here. Pattern is always the same: local path → this project folder.

---

**Available Skills:**
- `/quest start|hold|resume` — quest workflow
- `/familiar` — sub-agent for large files
- `/appraise [subject]` — Socratic plan stress-test (9-question interrogation across Assumption / Scope / Evidence axes)

*Version: 1.6 | Last updated: 2026-04-20*
