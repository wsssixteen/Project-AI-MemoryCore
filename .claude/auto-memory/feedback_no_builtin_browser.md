---
name: no-builtin-browser
description: 🚨 BANNED — never use the built-in browser (mcp__Claude_Browser__*, preview_start url, in-app browser pane) for any etanah / Redmine / web task; use Claude in Chrome (mcp__claude-in-chrome__*) instead
metadata:
  type: feedback
---

Never call any `mcp__Claude_Browser__*` tool (preview_start with a url, navigate, computer, read_page …) for web work. The built-in browser is banned by みや. Browser work goes through **Claude in Chrome** (`mcp__claude-in-chrome__*`), his real Chrome with his logged-in sessions — load its tools via ToolSearch first.

**Why:** 2026-10-02, #282723 PROD alter — I opened the PROD Flowable alter page in the built-in browser although みや had already banned it; the ban was never written to memory, so it did not survive the session. He had to correct it again.

**How to apply:** any time a task needs a web page (Flowable alter page, PelupusanMaintenanceForm, Redmine form, deploy console), pick Claude in Chrome. If Chrome is not connected, say so and hand him the runbook — never fall back to the built-in browser. Related: [[reference_etanah_deploy_console]] · [[feedback_whatsapp_read_rules]].
