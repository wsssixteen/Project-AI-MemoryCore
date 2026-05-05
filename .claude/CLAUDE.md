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
| `Read Redmine` / `retrieve tickets` / `fetch tickets` / `check tickets` / `check redmine` / `pull redmine` / `any new tickets` / `redmine sync` / any phrase combining a retrieve verb (read/fetch/pull/check/get/sync/retrieve) with ticket-vocab (ticket/redmine/QA/FAT/UAT/issue) | (1) Run `node quest/redmine-sync.js`. If it fails (network, auth, API key missing) → notify with the error one-liner and continue using whatever's already in `active.txt`; do NOT abort. (2) Run `--create` for any new tickets. (3) For each new ticket: add held Phase 0 entry to `active.txt` (`status=hold`, `handoff_file=` empty). (4) **Auto-Phase 0 inventory (default, regardless of retrieval success)** — for each new/held ticket without `handoff_file`: glob the Task folder, read every file, glob `projects/coding-projects/active/etanah-knowledge/<state>/` for SCOPE-overlap files, then produce: ticket # / scope (urusan + tugasan + symptom one-liner) / suspected layer (config / Java / .docx / SQL / XHTML / flowable) / handoff exists? / blockers if any. (5) Report all results in a single skimmable table — one row per ticket. みや picks which quest to start first. **Failure mode**: if retrieval fails AND there are no held tickets to analyze → say so explicitly, do not invent analysis. |
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
- **Branch check at Quest Phase 0** (hard rule, 2026-05-04): Before any code edit on `etanah-pelupusan` or `etanah-awam`, run `git branch --show-current && git status --short` in BOTH repos. If current branch ≠ `mlk/master`, the standard sequence is: `git stash push -m "<context>"` → `git checkout mlk/master` → `git pull --ff-only origin mlk/master` → `git stash pop`. Untracked files (e.g. `.bak_*` files) survive the switch — no need to stash them. **Why**: 2026-05-04 QA #259318 — started editing the PRU SKL template while still on `mlk/qa/258418` (the previous ticket's branch). Caught only when みや asked at edit-time. If left, the new ticket's commit would have included #258418 work or vice versa. **How to apply**: this is part of the Phase 0 inventory ritual, not a separate step — the checklist now reads (a) Glob etanah-knowledge knowledge files, (b) load Task folder + handoff, (c) **branch-check both repos and switch to master if needed**, (d) only then begin code analysis. Belongs in `quest/quest-protocol.md` Phase 0 explicitly.
- **TRG state is REFERENCE-ONLY for Melaka work** (hard rule, 2026-05-04): The `etanah-pelupusan/src/main/resources/template/TRG/` folder, `pelupusan/web/form/.../trg/` packages, and any other TRG-prefixed code/data are for **Terengganu state** — kept in our repo for cross-state reference. Melaka project (Pymsoft) does NOT consider TRG as in-scope for any Melaka ticket. **How to apply**: when scanning code/templates for an MLK ticket's impact, **exclude TRG paths** from "at risk" or "needs verification" lists. TRG findings are informational only — never block a Melaka fix on TRG implications. Same in reverse if we ever do TRG work — MLK becomes reference-only. **Why**: 2026-05-04 QA #259318 — included TRG templates in the BOTH-forcing audit, inflating the at-risk count. みや clarified TRG is not considered for our scope. Apply scope discipline: state-of-record only.
- **PDF annotation extraction at Phase 0** (hard rule, 2026-05-04): When a Task brief includes a PDF reference (e.g. correction marks, BA feedback, mock-up annotations), the default Read tool exposes visual page content but NOT the `Annot` objects (sticky notes, highlight comments, popup text). Those carry the BA's actual instructions for each highlight. **Mandatory step**: before declaring Phase 0 complete, run `python -c "import fitz; doc=fitz.open('<path>'); [print(f'p{p+1}', a.info.get('content','')[:200], 'highlighted:', a.vertices and doc[p].get_textbox(fitz.Quad(a.vertices[0:4]).rect)) for p, page in enumerate(doc) for a in (page.annots() or [])]"` (or equivalent) and capture every `(highlight, comment, highlighted text)` tuple. **Why**: 2026-05-04 QA #259318 — read the PDF and saw the highlight regions but missed BA's per-annotation comments ("remove", "bold", "Tukar Nama Label Kepada Luas", etc.). Built Phase 0 plan on guesses about what BA wanted instead of reading their actual instructions. Discovered only when みや asked "do you not read the comments?". **How to apply**: any `.pdf` referenced in a brief → annotation-extract → log all comments into Phase 0 notes → proceed only after every comment is mapped to a ticket issue.
- **Renderer-side overrides before cache theories** (hard rule, 2026-05-04, time-saving): When a layout / display / formatting bug persists despite a verified-correct `.docx` template, BEFORE assuming JBoss cache or build cache is the cause, **first grep the populator code for forced overrides**. Standard searches: `setJc`, `setVal\(JcEnumeration`, `JcEnumeration\.BOTH`, `setBold`, `setSpacing`, `setStyle` etc. in `PelupusanWordEditorUtil.java` and `PelupusanTemplateUtil.java`. Look for `if (X == null) { X = <forced value>; }` patterns — these are framework defaults that override-when-unset. Apply the explicit value in the `.docx` to bypass the override. **Why**: 2026-05-04 QA #259318 — slogan rendered justified despite verified left-default in `.docx`. Spent multiple cycles attributing this to JBoss cache (asking みや to clean tmp/, restart, republish) before finally grepping the renderer and finding `PelupusanWordEditorUtil.java:482-487` forces `JcEnumeration.BOTH` when `ppr.getJc() == null`. Cache theory was plausible but secondary; renderer override was the real cause. **How to apply**: at the moment a display/layout bug surfaces and the .docx is verified correct, IMMEDIATELY (before re-deploy or cache-clear) grep the populator code for forced overrides. ~2 minutes of grep saves entire deploy/test cycles. **Pattern this generalises**: any "display X is wrong despite template-side Y is correct" → check the renderer.
- **Improvement Audit Log** (hard rule, 2026-05-04): Every impromptu rule, lesson, or workflow improvement captured mid-session goes into `Feature/Forge-Self-Improvement-System/improvement-audit-log.md` AS A PENDING ENTRY at the moment it is added. **DO NOT** mark resolved/closed unilaterally — wait for みや's review. **Session start MUST surface unresolved entries** as part of the Session Briefing flags (see `Feature/Session-Briefing-System/session-briefing.md`) — read the audit log, list any `status=pending` entries, do not drop them silently. **Why**: 2026-05-04 — added "Word-template-first lookup", "Word XML run-join before grep", "Canonical task-state query" rules across the same session. Without an audit log, these rules can land but never get reviewed for placement quality, redundancy, strength tier, or whether they're working. The audit log forces a deliberate next-session review where みや signs off, asks for redesign, or kills the rule. **How to apply**: Any new rule/lesson → append `- [ ] YYYY-MM-DD | <rule name> | <where it lives> | status=pending | <one-line reason>` to the audit log immediately. At session boot, briefing surfaces all unchecked items as a flag: `⚠️ N pending improvement-audit entries — review before dropping`.
- **Config.json framework not yet documented** (gap flagged 2026-05-04): The project has multiple `config.json` files (`tindakan.config.json`, `template.config.json`, `flowable.config.json`, possibly more) that act as the bridge between data, UI, and behavior. We don't yet have a single canonical reference for what each config controls, what its schema is, and where it's parsed. **Action item**: Q2 todo entry — build `etanah-knowledge/melaka/CONFIG-FRAMEWORK.md` mapping each `*.config.json` to (a) location, (b) parser class, (c) consumers, (d) what changes feel safe vs require service-code coordination, (e) precedent tickets that touched it. Until this exists, when a fix lands in any `config.json`, capture which file + parser + consumers in the post-mortem to seed the doc.

**Etanah-Knowledge Protocol** (how `etanah-knowledge/<state>/*.md` files are built and used):
- **Inventory-first Phase 0 load** (hard rule, 2026-04-15): Before any hypothesis, SQL, or code read on a codebase bug, Phase 0 MUST `Glob` `projects/coding-projects/active/etanah-knowledge/<state>/` and `Read` every file whose **SCOPE line** overlaps the ticket's symptom. No exceptions for *"I think I know the answer"* — that's the exact failure mode. See `feedback_inventory_first.md`.
- **Framework-skeleton for etanah-knowledge** (hard rule, 2026-04-17): Each `etanah-knowledge/<state>/*.md` file starts as a framework skeleton with an explicit **SCOPE** and **NOT FOR** blockquote at the top. Content grows from confirmed knowledge only — resolved tickets, verified behavior. No hypotheses, no pattern-matching on filenames. Before adding to any file, read its SCOPE line; if the addition doesn't fit, it belongs elsewhere (or doesn't exist yet). Merge > proliferate.
- **Learning approach**: Ticket-driven (Strategy E) as primary. Systematic scanning only for periodic exploration sessions.

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
