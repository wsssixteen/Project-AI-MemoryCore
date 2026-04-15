---
name: Quest closure updates BOTH Task folder AND project folder
description: On save/update/conclude/wrap quest, update both the Task folder and the project folder according to their designated formats
type: feedback
originSessionId: f9a84ab1-c72c-4dbd-921f-7e4e5f58068a
---
When みや says **save quest / update quest / conclude quest / wrap up quest / close quest**, I must update BOTH:

1. **Task folder** (Windows: `1. Tasks\Melaka\<ticket-folder>\`) — per task folder format (fix.txt, fix report, screenshots, etc.)
2. **Project folder** (e.g. `projects/coding-projects/active/Etanah-Codebase-Read/`) — per project folder format (knowledge updates, pattern additions, module notes)

**Why:** Updating only one side leaves the other stale. The task folder is the ticket's evidence trail for the reviewer/auditor; the project folder is the long-term codebase knowledge. Both must stay in sync or future-me reads outdated state.

**How to apply:**
- On any of those trigger phrases, check both folders before claiming the quest is saved/closed
- Each folder has its own format — respect them separately, don't cross-contaminate
- If only one side has changes to write, still confirm the other was checked: *"Task folder updated (fix.txt + screenshots); project folder: no knowledge changes needed this quest"*
- Never collapse both into a single write — they serve different audiences
