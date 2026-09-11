---
name: project_installed_skills
description: "🚨 Third-party skills miya asked to install (wayfinder by Matt Pocock, 2026-09-11) — where they live, how installed, and the DE rule: every install is recorded HERE the moment it happens"
metadata: 
  node_type: memory
  type: project
  originSessionId: 73387deb-cd38-48d9-99c3-6231a2e51b8d
  modified: 2026-09-11T02:34:53.301Z
---

**wayfinder** (Matt Pocock, `github.com/mattpocock/skills`) — installed 2026-09-11 with `npx --yes skills add https://github.com/mattpocock/skills --skill wayfinder -y` run in the MemoryCore root. Lives at `.agents/skills/wayfinder/` with a symlink `.claude/skills/wayfinder/` (both committed). Invoke with the Skill tool as `wayfinder`; it depends on the `grilling` and `domain-modeling` skills (already present) and, with no issue tracker configured, falls back to a local Markdown map. First use: charting the WhatsApp watcher rules map (see [[project_wa_read]]).

**Why:** miya says he had asked for wayfinder before and it was never saved; a session ended without the install landing in memory or in git, so the next session did not know it existed. He was furious ("how many times").
**How to apply:** the moment miya asks to install anything (skill, plugin, MCP, tool), (1) install it, (2) write it to THIS file in the same turn, (3) commit it. Domain Expansion cannot see an install that was never written down; the write happens at install time, not at DE. If he names a skill that is not in the Skill list, install it before saying anything else.
