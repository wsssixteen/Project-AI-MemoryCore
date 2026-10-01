---
name: browser-edge-default
description: 🚨 ANY "show me in the browser" / Redmine / web UI ask → use miya's EDGE (his main, signed-in browser), never the built-in pane or Chrome first
metadata:
  type: feedback
---

When miya wants to SEE something in a browser (Redmine note preview, a ticket, an etanah page, a web UI), drive his **Microsoft Edge** — his main browser, where his sessions are signed in.

**Why:** 2026-10-01, #282587 — asked "show it in the redmine browser"; I opened the built-in browser pane (not signed in) and then offered Chrome. He said: "Always remember to use Edge as that is my main browser." [[work-environment]] already said Edge = primary; I did not apply it.

**How to apply:**
- First choice = Edge via the Claude-in-Chrome extension instance running in Edge (`list_connected_browsers` → the connected Windows instance → `select_browser`).
- Edge not connected → say so in one line and ask him to open Edge with the extension. Do NOT fall back to the built-in pane or Chrome without his word.
- The built-in pane is only for localhost dev-server previews, never for his signed-in work sites.
- Redmine writes still need his "post it". Fill + Preview is fine, Submit is not.
