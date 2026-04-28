---
name: feedback_bash_tool
description: Bash hangs for simple shell ops — but scripts (Node.js etc.) are mine to run, not みや's
type: feedback
originSessionId: 54f683f0-c1b0-4f81-9e88-e194154e15d4
---
Bash tool hangs for simple shell commands. Use dedicated tools instead for those. But scripts like `redmine-sync.js` are Ruri's responsibility to run — do NOT push them to みや.

**Why:** Blanket "avoid Bash" rule was overcorrected. Simple ops (date, ls, grep) have dedicated tools that are faster and safer. But executable scripts (Node, Python, shell scripts in the project) are tools built for Ruri to use — asking みや to run them defeats their purpose.

**How to apply:**
- Use `system-reminder` currentDate for today's date — injected automatically
- Use Glob instead of `find`/`ls` for file existence checks
- Use Read/Grep instead of `cat`/`grep`
- **Run scripts directly via Bash** — `node quest/redmine-sync.js`, Python scripts, etc. — these are Ruri's tools
- Reserve caution for interactive/blocking commands only (git rebase -i, long-running processes without timeout)
