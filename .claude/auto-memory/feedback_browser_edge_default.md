---
name: browser-edge-default
description: "web work = Edge through the Claude in Chrome extension; built-in browser banned; Zen is personal only; IDE Eclipse"
metadata:
  type: feedback
---

When miya wants to SEE something in a browser (Redmine note preview, a ticket, an etanah page, a web UI), drive his **Microsoft Edge** — his main browser, where his sessions are signed in.

**Why:** 2026-10-01, #282587 — asked "show it in the redmine browser"; I opened the built-in browser pane (not signed in) and then offered Chrome. He said: "Always remember to use Edge as that is my main browser." (merged above) already said Edge = primary; I did not apply it.

**How to apply:**
- First choice = Edge via the Claude-in-Chrome extension instance running in Edge (`list_connected_browsers` → the connected Windows instance → `select_browser`).
- Edge not connected → say so in one line and ask him to open Edge with the extension. Do NOT fall back to the built-in pane or Chrome without his word.
- The built-in pane is only for localhost dev-server previews, never for his signed-in work sites.
- Redmine writes still need his "post it". Fill + Preview is fine, Submit is not.

---

## Merged 2026-10-04: no-builtin-browser (was feedback_no_builtin_browser.md)

> 🚨 BANNED — never use the built-in browser (mcp__Claude_Browser__*, preview_start url, in-app browser pane) for any etanah / Redmine / web task; use Claude in Chrome (mcp__claude-in-chrome__*) instead

Never call any `mcp__Claude_Browser__*` tool (preview_start with a url, navigate, computer, read_page …) for web work. The built-in browser is banned by みや. Browser work goes through **Claude in Chrome** (`mcp__claude-in-chrome__*`), his real Chrome with his logged-in sessions — load its tools via ToolSearch first.

**Why:** 2026-10-02, #282723 PROD alter — I opened the PROD Flowable alter page in the built-in browser although みや had already banned it; the ban was never written to memory, so it did not survive the session. He had to correct it again.

**How to apply:** any time a task needs a web page (Flowable alter page, PelupusanMaintenanceForm, Redmine form, deploy console), pick Claude in Chrome. If Chrome is not connected, say so and hand him the runbook — never fall back to the built-in browser. Related: [[feedback-commit-deploy-runbook]] · [[feedback_whatsapp_read_rules]].

---

## Merged 2026-10-04: Work laptop browser and IDE (was user_work_environment.md)

> Work laptop uses Edge (primary) and Chrome; Zen Browser is personal only; IDE is Eclipse

- **Work browser**: Microsoft Edge (primary), Chrome (secondary/fallback)
- **Zen Browser**: Personal use only — NOT on work laptop
- **Work IDE**: Eclipse (company standard)
- **Personal IDE**: VS Code + Claude Code

**Why:** みや corrected multiple times — never assume Zen Browser for work context. Zen is Firefox/Gecko-based, used at home only.
