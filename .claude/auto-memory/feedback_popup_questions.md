---
name: feedback_popup_questions
description: 🚨 miya prefers POPUP questions (AskUserQuestion tool) over chat-text question rounds; big side builds go to their OWN session via spawn_task with the full context handed over
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 73387deb-cd38-48d9-99c3-6231a2e51b8d
  modified: 2026-09-11T02:50:45.439Z
---

When I need decisions from みや, ask through the AskUserQuestion popup (batched, recommended option first), not as a numbered chat round. When a second build starts competing with the session's focus (2026-09-11: WhatsApp watcher vs PymTime), spawn it into its own session with `spawn_task`, passing every decision made so far and the open questions, and keep this session on the thing he named.

**Why:** 2026-09-11 the wayfinder grilling round (8 questions as chat text) landed while he was on his phone and wanted to stay on PymTime; he said "I prefer popup questions or perhaps we should start this whatsapp build in another new session you pass all the info, I want to focus on PymTime here."
**How to apply:** grilling / wayfinder / any multi-question round → AskUserQuestion (≤4 questions per call, chain calls for more). Side-build detected → spawn_task with a self-contained prompt, then continue the main thread.
