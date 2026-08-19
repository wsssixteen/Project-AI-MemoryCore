---
name: feedback_commands_never_fenced
description: "Commands miya must RUN go as ONE ```bash fenced block PER command (each renders its own Run + copy-icon button) — never one fence wrapping several, never bare inline-backtick bullets"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d6846f88-8934-4164-a6b6-3afccb489b73
  modified: 2026-08-19T07:29:46.419Z
---

🚨 **REVERSED 2026-08-12 (baseline 1.3.3 hand-off).** miya: *"I want to change from using `` to using
the quotes where I can choose to run or just a single click copy since it has that copy icon."* Each
command miya runs goes in its **own ```bash fenced block** — the app renders a **Run button + copy
icon** per block, so it's single-click to run or copy. This is what CLAUDE.md Rule 0 always said
(*"one ```bash block PER command… NEVER one fence wrapping the whole card"*); the prior version of
THIS memory contradicted Rule 0 and is now retired.

**How to apply**:
- Correct: one ` ```bash ` block per command, one command inside each — the block carries the button.
- Banned: **one fence wrapping MULTIPLE commands** (only one button → can't run/copy individually —
  this was the real 2026-07/08 complaint, misread as "no fences") · **bare inline-backtick bullets**
  (`- \`ssh …\`` — no button, must hand-select — superseded 2026-08-12) · numbering glued to the
  command · a leading `./` (auto-linkifies — use `bash <script>`).
- **🚨 Prompt-input VALUES count too** (2026-08-14, 2nd ask): a value miya types/pastes AT a script
  prompt — a branch name (`mlk/int-env`), an env choice (`stag`) — goes in its OWN fenced block, NEVER
  inline backticks. Same test as a command: he pastes it into the shell, so it needs the copy button.
  Banned: "at the branch prompt choose `mlk/int-env`" (inline). Correct: a plain fenced block holding
  just `mlk/int-env` under a one-line "paste at the prompt:".
- **Not covered**: code shown for *reading* — a Java diff, JSF snippet, an SQL script he saves to a
  file. The test stays **"will he type/paste/RUN this in a shell?"** → own fenced block.

**Why the flip**: the earlier "one at a time" pain was a SINGLE fence around many commands (one
button). Per-command fences fix both at once — each is separately runnable/copyable AND single-click.

Canonical spec: `.claude/reply-shape-spec.md` §3b + `.claude/skills/deploy/SKILL.md` §5 +
`domain/deploy/eval.js` checks 21-24 + `.claude/skills/release-mlk-plp/SKILL.md` card section.
🚨 **2026-08-19: the release-mlk-plp card section IS NOW FLIPPED** (it had carried the OLD no-fence
rule and this memory's 2026-08-12 note flagged it for a follow-up sweep that NEVER ran — so baseline
1.3.5's hand-off card shipped inline-backtick commands and miya raged, ~10th ask). STILL TO SWEEP
(verify next time each is touched): `reply-shape-spec.md` §3b · `deploy/SKILL.md` §5 · `deploy/eval.js`
checks 21-24 — confirm each says one-```bash-block-per-command, not the old inline/no-fence rule.

Related: [[feedback_two_sentence_default]] · [[feedback_ba_facing_reply_plain]] ·
[[feedback_show_diagram_for_issues]]
