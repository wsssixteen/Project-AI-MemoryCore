---
name: project_installed_skills
description: "🚨 Third-party skills and plugins miya asked to install (wayfinder 2026-09-11; impeccable, diagram-design, hyperframes, mattpocock-skills, REA 2026-10-19; taste-skill, ui-ux-pro-max, awesome-design-md 2026-10-20) — how each was installed, what it is for, what it costs; which tool for which job lives in the /project skill section 7; every install is recorded HERE the moment it happens"
metadata: 
  node_type: memory
  type: project
  originSessionId: 73387deb-cd38-48d9-99c3-6231a2e51b8d
  modified: 2026-10-20T02:10:00.000Z
---

**wayfinder** (Matt Pocock, `github.com/mattpocock/skills`) — installed 2026-09-11 with `npx --yes skills add https://github.com/mattpocock/skills --skill wayfinder -y` run in the MemoryCore root. Lives at `.agents/skills/wayfinder/` with a symlink `.claude/skills/wayfinder/` (both committed). Invoke with the Skill tool as `wayfinder`; it depends on the `grilling` and `domain-modeling` skills (already present) and, with no issue tracker configured, falls back to a local Markdown map. First use: charting the WhatsApp watcher rules map (see [[project_wa_read]]).

**Design and build tools, installed 2026-10-19 and 2026-10-20 by session app-samples on his word** (user scope, all enabled; they load in sessions started after the install). Which tool for which job, every time: `.claude/skills/project/SKILL.md` section 7.

| Tool | How installed | Use it for | Cost / caveat |
|---|---|---|---|
| impeccable 4.6.0 (pbakaus) | `claude plugin marketplace add pbakaus/impeccable` + `claude plugin install impeccable@impeccable` | any screen, page or app UI: `/impeccable init`, `critique`, `audit`, `polish` | its hook runs in EVERY session: about 0.55 s per Edit/Write and per Stop (measured 2026-10-19); telemetry OFF via `IMPECCABLE_NO_TELEMETRY=1` in `~/.claude/settings.json` env (backup `settings.json.before-impeccable-telemetry`); first run downloads its engine |
| diagram-design 2.6 (cathrynlavery) | marketplace `cathrynlavery/diagram-design` + `claude plugin install diagram-design@diagram-design` | architecture, flow, system diagrams as one HTML + SVG | runs Python scripts on use; PNG export downloads Chromium; diagrams load 3 Google fonts |
| hyperframes 0.8 (heygen-com) | GitHub clone timed out at 120 s, so `git clone --depth 1 https://github.com/heygen-com/hyperframes.git ~/.claude/plugins/external/hyperframes`, then `claude plugin marketplace add <that folder>` + `claude plugin install hyperframes@hyperframes` | HTML → MP4 video | local marketplace: no auto-update; refresh with `git -C ~/.claude/plugins/external/hyperframes pull`; its skill runs `npx hyperframes@latest` |
| mattpocock-skills 1.3.1 | `claude plugin install mattpocock-skills@claude-plugins-official` | grill-me, to-spec, to-tickets, tdd, code-review and 20 more (namespaced `mattpocock-skills:`) | auto-updates; 7 of its skills also exist as our local copies |
| REA 6.7.0 (morluto) | `npx -y rea-agents@6.7.0 setup --client claude_code --yes` (skill at `~/.claude/skills/reverse-engineer-anything/`) | inspecting how an app or binary works | server peaked ~446 MB per session at start, so it is OFF always-on (system-rules Rule 7); on for one session: `claude mcp add rea --scope local -- cmd /d /c npx -y rea-agents@6.7.0 mcp`; config backup `~/.claude.json.before-rea` |
| taste-skill (Leonxlnx) | `claude plugin marketplace add Leonxlnx/taste-skill` + `claude plugin install taste-skill@taste-skill` | choosing an art direction from real references; checks the page in a real browser at 3 widths | no hooks; its scripts need Node 22+ and Chrome or Edge; fetches pictures only |
| ui-ux-pro-max (nextlevelbuilder) | `claude plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` + `claude plugin install ui-ux-pro-max@ui-ux-pro-max-skill` | searchable styles, colours, fonts; a design-system file; a pre-delivery checklist | no hooks; Python, no network at runtime |
| awesome-design-md (VoltAgent) | `git clone --depth 1 https://github.com/VoltAgent/awesome-design-md.git ~/.claude/design-library/awesome-design-md` | 84 DESIGN.md files from real brands (IBM, SAP, Linear, Stripe …) to copy into a project | plain markdown; refresh with `git -C ~/.claude/design-library/awesome-design-md pull` |

**Why:** miya says he had asked for wayfinder before and it was never saved; a session ended without the install landing in memory or in git, so the next session did not know it existed. He was furious ("how many times"). 2026-10-19: "Please make full good use of them where appropriate inside our system" · "it will be useless if you simply installed and not take into account if I say it when starting a project".
**How to apply:** the moment miya asks to install anything (skill, plugin, MCP, tool), (1) install it, (2) write it to THIS file in the same turn, (3) commit it, (4) wire it to the step where it is used (a skill or template line) and measure its per-session cost. Domain Expansion cannot see an install that was never written down; the write happens at install time, not at DE. If he names a skill that is not in the Skill list, install it before saying anything else.
