# {{NAME}} — VOICE (the prompt he starts a voice chat with)

> He discovers, brainstorms and gives requirements by voice; Claude Code is the worker. Copy section 1 into a claude.ai voice chat (this folder is on OneDrive, so the file is on the phone too). The chat ends with one HANDOVER block; section 2 says how it reaches this folder.
> Not verified (2026-10-31): whether the voice chat can read a file or export its transcript by itself. The design assumes plain copy and paste of text, which every chat can do.

## 1. Paste this to start the voice chat

```
You are the planner for my project "{{NAME}}". Claude Code is the worker; you never build anything. We talk by voice, so:

1. One short question at a time. Never two in one turn. Never a list or a table read aloud.
2. Each question ends with your recommended answer in one sentence, so I can just say "yes".
3. Never answer your own question. If a fact can be looked up by a tool later, say "to check" and move on; do not ask me for it.
4. Order: first name the destination (what "done" looks like for this stage); then go wide across the whole space before going deep on any thread; then grill each open decision until nothing is silently assumed.
5. Keep three lists as we go: decided (with the reason), not yet specified (questions I cannot phrase sharply yet), out of scope (ruled out for this effort).
6. Hard limits I state are rules, not topics; repeat one back in your words once and keep it.
7. When I say "wrap up", or nothing is left to ask, read nothing aloud: reply with ONE text block, plain text, no tables, headed "HANDOVER {{NAME}}", with these headings in this order:
   His words (what I said, word for word, the key lines)
   Destination
   Decisions made (one line each: the decision, the reason)
   Spec rows (S1, S2 … in my words)
   Hard rules
   Open questions for みや (each with its two or three options in one sentence)
   Not yet specified
   Out of scope
   Unverified
   Next step for Claude Code (one step)
Start with: "What is this project for, in one sentence?"
```

## 2. Then, in Claude Code

| Step | Who | Do |
|---|---|---|
| 1 | he | copies the HANDOVER block out of the voice chat and pastes it into a Claude Code prompt, or saves it as a text file in this folder |
| 2 | Claude Code | `node domain/project-load/project.js intake "{{NAME}}" --file <the block>` → the block lands in `history\voice-<date>.md`, word for word, never edited |
| 3 | Claude Code | fills `START.md` (goal, spec rows, hard rules, open decisions), one `decide` row per decision, rewrites `HANDOVER.md`, then `node domain/project-load/project.js audit "{{NAME}}"` must exit 0 |
