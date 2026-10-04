---
name: delta-correction-on-stop-block
description: "Stop block = delta only; bypass tokens hidden in HTML comments; canonical formats, never invented ones"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b7adab82-50d9-4567-bef6-aa285ea8b892
  modified: 2026-08-16T06:59:57.517Z
---

🚨 When a Stop hook blocks a reply that was already shown to みや: the correction turn is a DELTA — the bypass token and/or the one missing element only. Re-emitting the table/diagram/summary a second time is BANNED. Likewise: hook advisories that change nothing get zero narration in the reply.

**Why:** 2026-08-16, みや (via /i-have-adhd): "this part where you repeat yourself… the hook's result sometimes doesn't make much difference, it is also wasting tokens, you output double unnecessary into conversation." Same complaint as 2026-07-28 ("This is so fucking stupid — isn't it supposed to be an instruction BEFORE you reply?"). He reads the same content 2-3× per session; the gates built to stop verbosity are manufacturing it.

**How to apply:** (1) On any Stop-block: assume みや already read the reply; output `[token] + one-line fix` and end. (2) Never restate a blocked reply's content "with the fix applied". (3) Architectural cure = todo.md Q1 row 42+44 / Scope D1 design pass ([[feedback_reply_separation_of_concerns]] is the sibling rule for first-emit length).

---

## Merged 2026-10-04: feedback-bypass-token-visibility (was feedback_bypass_token_visibility.md)

> Hide enum-whitelist bypass tokens (pure-ack / question-only / etc.) inside HTML comments so みや never sees the enforcement-gibberish; keep judgment-call bypasses (free-text reasons + [genuine-fork]) visible so he can audit them

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

---

## Merged 2026-10-04: feedback_use_canonical_formats_never_invent (was feedback_use_canonical_formats_never_invent.md)

> Never invent my own reply/patch/handoff format or section headers; load and match the canonical quest / script-check / infra-handoff structures verbatim

🚨 BANNED — inventing my own section headers, block shapes, or hand-off wrappers. The canonical structures are authoritative and used VERBATIM:
- PROD data-patch hand-off message → [[feedback_prod_patch_infra_handoff]] EXACT format (greeting line · `#ticket: one-line urusan+outcome` adjacent, NO blank · blank · fenced DML + `-- N rows …` ONLY — no header, no BEFORE-SELECT, no Verify, no permohonan id inside the fence).
- Patch pre-flight → the `script-check` SCRIPT-CHECK emit line (rules 1–8), incl. the 5-step Stage-Match Block (rule 2).
- Quest engine → Scout → Recon → Rubric → Apply.
- Reply shape → `.claude/reply-shape-spec.md`.

**Why**: 2026-09-21 eSOKONGAN+patch sweep — I free-formed "Live state / Target value / ✅ Final infra message (pinned by PK)" wrappers AND produced an infra message that violated the canonical format three ways: a blank line after the greeting, a Verify SELECT inside the fence, and the permohonan id in the trailing comment. みや: *"Can you ban yourself from creating your own stupid format."*

**How to apply**: before emitting any patch / hand-off / quest artifact, LOAD the canonical file and match it byte-shape. If no canonical exists for the thing, ASK — never invent a shape and present it as standard. Pairs with [[feedback_no_on_the_fly_artifacts]] (files/folders) — this is its reply/format sibling.
