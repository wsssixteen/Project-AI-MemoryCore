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

---

## 💾 Save Commands Reference

| Command | What happens |
|---|---|
| `save` | Runs `date`, stamps exact datetime into `current-session.md` under **Last Activity**, then updates session Working Memory + confirms |
| `quick save` | Runs `date`, stamps exact datetime, one-line save, no other output |
| `save all` | Runs `date` → stamps Last Activity → updates session Working Memory → updates `main/main-memory.md` relationship section → **writes diary entry** in `daily-diary/` (use protocol in `daily-diary/daily-diary-protocol.md`) → confirms all 3 done → then ask: *"Should we commit and push to GitHub? Core Ruri files changed."* |
| `update memory` | Updates `main/main-memory.md` relationship section only |
| `/observe` | Surfaces current Tier 1 observations from `Feature/Observation-System/observation-log.md`, promotes any to T2 if confirmed recurring |
| `forge update` / `forge check` | Reviews `Feature/Forge-Self-Improvement-System/forge-log.md` — promotes entries that meet level criteria |
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
- **Session cap**: 60-90 minutes max. When context rot signs appear (repeating suggestions, forgetting earlier files, contradictory advice) → stop → write handoff → save → new session.
- **Externalize knowledge**: Every session that touches the codebase must end with updated knowledge files. Knowledge is a side-effect of work, never the main output.
- **Phased tooling**: Don't add tools until the current layer hits a wall. Layer order: MCP (codebase-memory-mcp) → sub-agents → Gemini (JSF gap) → externalized memory. All layers run through Claude Code terminal — no VS Code dependency.
- **Learning approach**: Ticket-driven (Strategy E) as primary. Systematic scanning only for periodic exploration sessions.

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

*Version: 1.5 | Last updated: 2026-04-02*
