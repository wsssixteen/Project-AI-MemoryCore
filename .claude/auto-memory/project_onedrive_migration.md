---
name: OneDrive Migration Complete
description: Project-AI-MemoryCore migrated to OneDrive; auto-memory now syncs via autoMemoryDirectory setting
type: project
---

Project-AI-MemoryCore successfully migrated to OneDrive (2026-03-28). Auto-memory redirected using `autoMemoryDirectory` in `~/.claude/settings.json` to `.claude/auto-memory/` inside the project folder.

**Why:** Two laptops with different Windows usernames need shared auto-memory without manual copying.

**How to apply:** On any new machine, add `autoMemoryDirectory` to `~/.claude/settings.json` pointing to this project's `.claude/auto-memory/` folder (adjust username in path). One-time setup per machine.
