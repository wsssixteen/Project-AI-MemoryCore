# ruri-skills
*Ruri's Claude Code skill plugin — auto-triggered behaviors for Miya*

## About
This plugin extends Ruri's capabilities with auto-triggered skills that activate based on conversation context. Built on Claude Code's native plugin architecture.

## Structure
```
ruri-skills/
├── .claude-plugin/
│   └── plugin.json          # Plugin identity
├── skills/                  # Auto-triggered behaviors
│   └── save-memory/
│       └── SKILL.md         # Save memory skill (starter)
├── commands/                # Slash commands (empty — add as needed)
├── skill-format.md          # Format reference for new skills
└── README.md                # This file
```

## Installed Skills

| Skill | Trigger | What It Does |
|-------|---------|-------------|
| `save-memory` | "save", "save memory", "save progress" | Saves conversation insights to memory files |

## Adding New Skills
1. Create a folder: `skills/[skill-name]/`
2. Create `SKILL.md` with YAML frontmatter + protocol (see `skill-format.md`)
3. Done — Claude Code auto-discovers it

## Installing the Plugin
```bash
claude plugin add --local plugins/ruri-skills
```

---
*ruri-skills v1.0 — installed 2026-03-06*
