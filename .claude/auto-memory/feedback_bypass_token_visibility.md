---
name: feedback-bypass-token-visibility
description: "Hide enum-whitelist bypass tokens (pure-ack / question-only / etc.) inside HTML comments so みや never sees the enforcement-gibberish; keep judgment-call bypasses (free-text reasons + [genuine-fork]) visible so he can audit them"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0cf4d6b9-e745-4e4d-b480-14f6737d58ad
---

Bypass tokens like `[skip-stop-point-summary: pure-ack]` are commands sent to enforcement hooks — not human-facing content. みや 2026-07-07 asked to hide the routine ones because they read as gibberish to him. Hooks still evaluate them via regex on the raw message text, so wrapping them in an HTML comment renders them invisible to みや while enforcement keeps working.

**Hide inside `<!-- ... -->`** — whenever the bypass reason is a pre-approved enum from the hook's whitelist:
- `[skip-stop-point-summary: pure-ack|question-only|error-only|de-mode|closing-voice]`
- `[skip-show-gate: <trivial-content-only reason>]`
- `[skip-ba-table: <retroactive / non-quest reason>]`
- Any other bypass where the reason is a whitelist enum literal

**Keep visible (no HTML comment)** — when the reason is a judgment call みや should be able to challenge:
- `[genuine-fork: <reason>]` — flags a real decision only みや can make; he should see it
- Any bypass with a FREE-TEXT reason (not a whitelist enum) — free-text = my judgment, deserves visibility
- Any hook whose whitelist doesn't cover the situation and I'm making a case for a soft-skip

**Why:** hidden bypasses reduce noise on みや's screen without weakening the hooks (they still evaluate the token from raw text). The visibility rule is inverted — routine bypasses are invisible; judgment bypasses stay visible so he can audit the call. Trade-off: slightly reduced at-glance audit of routine skips, but ceremony gone from every ack turn.

**How to apply:** at emit time, before writing the bypass token, ask: "is the reason a whitelist enum or free-text?" — enum → HTML-comment it; free-text or `[genuine-fork:...]` → leave visible.

Cross-ref: [[feedback_investigation_style]] (show-first) — this rule is compatible; the hidden token is not content, it's a switch.
