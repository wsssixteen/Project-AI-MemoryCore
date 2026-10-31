# {{NAME}} — AGENTS (the README for any agent working here)

> Any agent, any tool, any session: read this file first. It holds no state and no spec; it says where they are and how to work here. The state is in `START.md` only, the map of files in `PROJECT.md` only, the hand-over in `HANDOVER.md` only. Nothing is stored twice.
> Folder: `{{DIR}}` (main checkout, OneDrive; not in git).

## 1. Read, in this order

| # | File | What it gives you |
|---|---|---|
| 1 | `START.md` | the goal in his words, the spec rows (S1, S2 …), the hard rules, the state now, the next step, his open decisions |
| 2 | `HANDOVER.md` | what the last worker did, what is half done, what not to redo, what is unverified, the one next step |
| 3 | the file `PROJECT.md` section 2 names for your question | only that file; never the whole folder |

## 2. How to work here

| Rule | Do |
|---|---|
| Hard rules | `START.md` section 3, before any action. They are his words; never argued around |
| A decision is made | `node domain/project-load/project.js decide "{{NAME}}" --decision "…" --why "…" --who "みや" --serves S#` in the same turn; never re-decide a row |
| A deliverable | names the spec row it serves (S1, S2 …); no row = a new row in his words first |
| Before you stop | rewrite `HANDOVER.md` (six headings, newest state); Domain Expansion fails when it is older than the folder's newest change |
| A person's choice | a control on the app's own page; a file or an API is only for machines |
| Options for him | shown side by side (a table or one drawing) before he is asked |
| The Claude Code worker | `/project` skill: `load`, `decide`, `save`, `audit`; the rules live there, this file only points |

## 3. Voice intake

He brainstorms and gives requirements by voice chat; Claude Code is the worker. The prompt he starts the voice chat with is `VOICE.md`; the block it ends with is pasted to Claude Code (`node domain/project-load/project.js intake "{{NAME}}" --file <block.md>`) and lands in `history\voice-<date>.md`, word for word. Then `START.md`, `DECISIONS.md` and `HANDOVER.md` are filled from it.
