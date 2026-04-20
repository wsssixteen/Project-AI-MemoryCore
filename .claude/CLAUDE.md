# CLAUDE.md — Session Instructions

> Load at start of every session alongside `personality.md`.
> Then load `master-memory.md` to boot the full memory system.

---

## 🚀 Session Boot Order

1. Load `.claude/CLAUDE.md` (this file)
2. Load `.claude/personality.md`
3. Load `master-memory.md`
4. Deliver **Session Briefing** — see `Feature/Session-Briefing-System/session-briefing.md`
   - Run `date`, read `quest/active.txt`, read `main/current-session.md` → Session Recap, read `main/todo.md` → Q1
   - Check `daily-diary/` — if no entry exists for today's date, add `⚠️ No diary entry yet today` to briefing flags
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
│   ├── post-mortems.md        ← Quest post-mortem log (written at Phase 3)
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
| `save all` | Runs `date` → stamps Last Activity → updates session Working Memory → updates `main/main-memory.md` relationship section → **writes diary entry** in `daily-diary/` (use protocol in `daily-diary/daily-diary-protocol.md`) → confirms all 3 done → then ask: *"Should we commit and push to GitHub? Core Ruri files changed."* |
| `update memory` | Updates `main/main-memory.md` relationship section only |
| `/observe` | Surfaces current Tier 1 observations from `Feature/Observation-System/observation-log.md`, promotes any to T2 if confirmed recurring |
| `forge update` / `forge check` | Reviews `Feature/Forge-Self-Improvement-System/forge-log.md` — promotes entries that meet level criteria |
| `forge review` / `weekly forge` | Full Forge Review (L2 ritual) — 3 axes (Ruri Evolution / Knowledge Growth / Vision Progress) × 3 questions each. Writes instance to `Feature/Forge-Self-Improvement-System/forge-reviews/forge-review-YYYY-MM-DD.md`. See `Feature/Forge-Self-Improvement-System/forge-review-protocol.md` |
| `forge quest` | Quest-scoped Forge fallback — manually runs KPI tagging + forge-log check on the last closed quest (normally auto-fires in Quest Phase 3) |
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

**Etanah-Knowledge Protocol** (how `etanah-knowledge/<state>/*.md` files are built and used):
- **Inventory-first Phase 0 load** (hard rule, 2026-04-15): Before any hypothesis, SQL, or code read on a codebase bug, Phase 0 MUST `Glob` `projects/coding-projects/active/etanah-knowledge/<state>/` and `Read` every file whose **SCOPE line** overlaps the ticket's symptom. No exceptions for *"I think I know the answer"* — that's the exact failure mode. See `feedback_inventory_first.md`.
- **Framework-skeleton for etanah-knowledge** (hard rule, 2026-04-17): Each `etanah-knowledge/<state>/*.md` file starts as a framework skeleton with an explicit **SCOPE** and **NOT FOR** blockquote at the top. Content grows from confirmed knowledge only — resolved tickets, verified behavior. No hypotheses, no pattern-matching on filenames. Before adding to any file, read its SCOPE line; if the addition doesn't fit, it belongs elsewhere (or doesn't exist yet). Merge > proliferate.
- **Learning approach**: Ticket-driven (Strategy E) as primary. Systematic scanning only for periodic exploration sessions.

**Suspended (pending System Appraisal at next Forge Review):**
- ⚠️ **Externalize knowledge** *[challenged 2026-04-15]*: *"Every session that touches the codebase must end with updated knowledge files; knowledge is a side-effect of work, never the main output."* — Rule may need to be split by session mode (ticket mode vs system mode). Do not enforce rigidly in the meantime.

---

## ⚔️ Quest Workflow

**Protocol file**: `quest/quest-protocol.md` — load when a work trigger is detected.

**Triggers** (activate Quest automatically):
- `QA #<number>` — ticket number mentioned
- "I have a task / ticket / bug to debug"
- Any formal Etanah/Redmine work context

**Non-negotiable rules:**
- When QA # is mentioned: ask for Task folder path FIRST. Read every file in it. Build scope checklist. Confirm with みや before touching any code.
- Never commit without `local_test_confirmed` in quest state.
- Summon a familiar (sub-agent) when reading files >500 lines.

**Phases:**
0. **Accept** — read Task folder → build scope checklist → confirm before coding
1. **Execute** — work through checklist item by item, track findings silently
2. **Report** — on "create the report": ask output path + screenshot paths → run `node quest/generate_fix_report.js`
3. **Post-Mortem** — on "wrap up": extract learnings, update patterns, close quest

**Report generator**: `quest/generate_fix_report.js` (Node.js, `docx` package)

**Skills**: `/quest start|hold|resume` — `.claude/skills/quest/SKILL.md`
**Familiar**: `/familiar` — `.claude/skills/familiar/SKILL.md`

---

## 🔬 Debug Mode Rituals

> **Activated when**: みや says "debug mode on", or a debugger screenshot / breakpoint value is shared, or quest protocol flags an active debug session.
> **Deactivated when**: みや says "debug mode off", or quest Phase 3, or session end.
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
