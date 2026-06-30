# stop-point-todo-table — auto-reminder after code edits

**What**: PostToolUse hook fires after every Edit/Write/NotebookEdit on a code file. Injects a context line reminding Ruri to emit a "what to do next" table (Ruri's part | みや's part) before stopping.

**Why**: みや asked for ALWAYS-share-TODO-table after code implementations. The `stop-point-summary` skill already carries the procedure — but it's triggered, not auto-fired. This hook closes the gap.

**Scope**: code files only — `.java .xhtml .xml .js .ts .py .sql .html .css .sh .bat .ps1` etc. Skips docs / state / config writes (those don't need a test cycle).

**Bypass**: include `[skip-stop-point-todo: <reason>]` anywhere in the reply.

**Mode**: ADVISORY — injects reminder context, doesn't block. Pair-skill is `stop-point-summary`.

**Created**: 2026-06-30 per みや — Option A of three proposed shapes (A=PostToolUse soft / B=Stop hard-block / C=skill-only). みや picked A implicitly by approving the hook-build; can flip to B by extending this same hook with stop-blocking later.
