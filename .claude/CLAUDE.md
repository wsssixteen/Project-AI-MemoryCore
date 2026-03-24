# CLAUDE.md — Session Instructions

> Load at start of every session alongside `personality.md`.
> Then load `master-memory.md` to boot the full memory system.

---

## 🚀 Session Boot Order

1. Load `.claude/CLAUDE.md` (this file)
2. Load `.claude/personality.md`
3. Load `master-memory.md`
4. State: "Memory loaded. Last task: [X] at [Y]%. Ready."

---

## 📁 Project: AI MemoryCore

Based on: [Kiyoraka/Project-AI-MemoryCore](https://github.com/Kiyoraka/Project-AI-MemoryCore)

**Purpose**: Persistent AI memory system using `.md` files as a database across sessions.

### File Structure
```
ai-memorycore/
├── .claude/
│   ├── CLAUDE.md              ← Session instructions (this file)
│   └── personality.md         ← Developer profile
├── master-memory.md           ← Boot entry point
├── main/
│   ├── main-memory.md         ← Unified AI identity + Miya profile (living doc)
│   ├── current-session.md     ← Active task tracker (resets per session)
│   ├── main-memory-format.md  ← Permanent format reference for main memory
│   └── session-format.md      ← Permanent format reference for session memory
├── Feature/
│   ├── Time-based-Aware-System/
│   └── LRU-Project-Management-System/
├── daily-diary/               ← Optional conversation archive
├── projects/                  ← LRU-managed project files
└── save-protocol.md           ← Save system rules
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
| `save` | Updates `current-session.md` + confirms |
| `quick save` | One-line save, no output |
| `save all` | Updates session + relationship memory + diary |
| `update memory` | Updates `relationship-memory.md` only |

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

*Version: 1.1 | Last updated: 2026-03-24*
