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
- **IDE**: VS Code
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

*Version: 1.0 | Last updated: [DATE]*
