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

**🚨 Context FIRST, popup second (2026-10-04, #244600).** Before any popup that needs context, the chat text ABOVE the tool call carries it: short one-fact bullets, or a table, or a small diagram (what the thing is, the options side by side, what each one changes for him). The popup then only picks. Never fire a popup as the first thing after a tool run. Never ask a question whose moment has not come (I asked for a commit subject while he had just chosen "local test first", so there was nothing to commit yet). His words: "you need to fix your fucking behaviour of asking straight away without any very short sentence bullet points or table or diagrams when asking this popup questions that requires context." Same family as 2026-09-28 #281650 ("a choice without its picture is not a choice").

**Why:** 2026-09-11 the wayfinder grilling round (8 questions as chat text) landed while he was on his phone and wanted to stay on PymTime; he said "I prefer popup questions or perhaps we should start this whatsapp build in another new session you pass all the info, I want to focus on PymTime here."
**How to apply:** grilling / wayfinder / any multi-question round → AskUserQuestion (≤4 questions per call, chain calls for more). Side-build detected → spawn_task with a self-contained prompt, then continue the main thread.
