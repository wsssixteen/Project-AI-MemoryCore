---
name: feedback_bash_tool
description: Bash tool consistently fails/hangs in this environment — avoid it for simple operations
type: feedback
originSessionId: 54f683f0-c1b0-4f81-9e88-e194154e15d4
---
Avoid using the Bash tool for simple operations like `date`, `time /t`, or any shell command that doesn't require the Bash tool specifically.

**Why:** Bash tool consistently gets stuck/hangs in みや's Windows environment. Multiple sessions affected.

**How to apply:**
- Use `system-reminder` currentDate for today's date — it's injected automatically
- Use Glob instead of `find`/`ls` for file existence checks
- Use Read/Grep instead of `cat`/`grep`
- Reserve Bash only when no dedicated tool can do the job, and warn みや if it might hang
