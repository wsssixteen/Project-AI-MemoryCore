---
name: feedback_session_revive_handover
description: "Reviving or redirecting a session = send it a full handover: every misrouted message word for word, what was and was not done with it, the state it needs; never just the one command he named"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 73387deb-cd38-48d9-99c3-6231a2e51b8d
  modified: 2026-10-27T10:34:27.404Z
---

When みや asks to revive, redirect or hand work to another session, the message I send it is a **handover**, not the one command he named.

**The handover holds:**
- why it gets this (his words, the date)
- every message that was misrouted into my session, **word for word**, each with: who sent it, when, what I did with it (usually nothing)
- the state the target needs before acting: project record paths, origin/main commit, the standing rules that gate the ask (for PymTime: no build without his go)
- one line: "nothing else is pending"

**Why:** 2026-10-27 — he asked to revive the session-naming session and "send a /remote-control as well". I sent only "/remote-control". Two messages that had landed in my session by mistake (a `/remote-control` from the 286650 session and the weekly-plan relay from the "Protime weekly plan" session) were never forwarded. His correction: "You didn't even try to send a proper handover to that session based on what was wrongly sent to this session."

**How to apply:** before `send_message` to a revived or redirected session, grep my own transcript for every `cross-session-message` of the day, paste each verbatim, add state and rules, then send. The command he named goes in the same message. Related: [[feedback_cross_module_handoff_artifact]] (same shape for etanah), [[feedback_do_dont_ask_answer_literal]].
