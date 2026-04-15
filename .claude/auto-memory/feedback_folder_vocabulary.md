---
name: Folder vocabulary — Quest vs Task folder vs Project folder
description: Disambiguate Quest (protocol), Task folder (ticket's Windows folder), Project folder (ongoing project's folder in projects/)
type: feedback
originSessionId: f9a84ab1-c72c-4dbd-921f-7e4e5f58068a
---
These three terms get conflated and cause confusion. Lock the vocabulary:

| Term | Means | Lives at |
|---|---|---|
| **Quest** | The protocol/skill/workflow — phases, post-mortem, active.txt state | `.claude/skills/quest/` + `quest/` |
| **Quest state file** | Active ticket's current phase/status | `quest/active.txt` |
| **Task folder** | Physical Windows folder containing the ticket's files (QA notes, screenshots, fix.txt, fix report) | **Always** `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\<state>\<ticket-folder>\` — never anywhere else |
| **Project folder** | Physical folder for an ongoing coding project (Etanah-Codebase-Read, etc.) | `projects/coding-projects/active/<project-name>/` |

**Why:** みや was losing time re-clarifying which folder I meant when she said things like *"save to the project folder"*. Quest-the-protocol vs the physical folder containing ticket files are different concepts.

**How to apply:**
- When みや says **"task folder"** → she means the Windows ticket folder under `1. Tasks\Melaka\`
- When みや says **"project folder"** → she means an ongoing project folder in `projects/coding-projects/active/`
- **Quest** stays reserved for the protocol/skill — never use "quest folder" to mean the ticket's Windows folder
- When I'm uncertain, ask specifically: *"task folder (Windows ticket folder) or project folder (ongoing project)?"* rather than guessing
- **Task folder location is fixed** — always under `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\`. Never ask みや for the full path again — just confirm the ticket-specific subfolder name if ambiguous. Engraved 2026-04-15.
- **Phase 0 scope discipline**: reading the Brief folder is enough. The project folder (e.g. `projects/coding-projects/active/Etanah-Codebase-Read/`) already provides broader context. Don't drown Phase 0 in full Task folder reads.
