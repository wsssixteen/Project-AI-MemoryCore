# adhoc-brief-first

symptom: 2026-10-13 miya: please fix this step, you must brief me first before saving or anything else that should be done in the background
goal: miya reads the adhoc finding before any save-set part is written on the main thread; the save runs in a background agent
goal_signal: an adhoc turn ends with the brief and has no main-thread save-set write before it
retention: rotate monthly
footprint: per-tool: 1 node process per Write, Edit, PowerShell or Bash call, about 40 MB for under 100 ms

**What fires when**: PreToolUse — the main thread is about to write an adhoc save-set part (Task folder, active-cli start ADHOC, register row, ADHOC quest doc, notes.js, the audit) in a turn where no brief was shown and no background save agent was started

**Contract**: BLOCK the write and tell me to start one background save agent and end the turn with the brief

**Layer choice (Rule 7)**: hook + skill. The `adhoc-save` skill (section "Brief first") carries the procedure; this hook stops the one action the procedure bans. The skill text alone was not enough: its "Answer first" row existed on 2026-10-13 and was not followed.

**Trigger moment (Rule 8)**: PreToolUse on Write, Edit, PowerShell and Bash, and it only reads the transcript when the call is a save-set write (path or command match). A Stop check would see the wrong order only after the writes were done.

**Observability**: every fire appends to `domain/adhoc-brief-first/log.jsonl` — one row per save-set write seen: time, fired, blocked, duration (written by `lib/hook-runtime.js`).

**state-scoped**: no, state-agnostic (matches `ADHOC-<URUSAN>-<year>-<n>`, `ADHOC-REGISTER.md` and the `<n>. AH - ` Task folder name of every state).
