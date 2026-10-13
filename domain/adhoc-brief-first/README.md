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

## Two halves, one file (`adhoc-brief-first.check.hook.js`)

| Half | Event | Registered in | Does |
|---|---|---|---|
| before the brief | PreToolUse, matcher `Write|Edit|PowerShell|Bash|Agent` | `.claude/settings.json` | blocks an adhoc save-set write and the start of the adhoc save agent while the turn shows no brief |
| after the brief | Stop | `domain/bundles/stop-claim-integrity.json` | the closing reply carries `Saving in the background next: ADHOC-<id>` and no save agent was started after it: blocks the stop once and asks for the ONE background save agent |

Evals: `adhoc-brief-first.eval.js` (before the brief, 37 cases) · `eval.js` (after the brief, 12 cases). Shared parser: `lib/adhoc-brief-first.js` (+ `lib/adhoc-brief-first.eval.js`, 8 cases).

## Adversarial scenarios (system-design Rule 12)

| # | Scenario | Verdict |
|---|---|---|
| 1 | the 2026-10-13 miss: investigation, a one-line note, then `active-cli start ADHOC` | fixture R1 |
| 2 | the second miss the same day: save agent started first, brief second | fixtures G1, S3 |
| 3 | a short "now saving" line passed off as the brief | fixture R1 (400-character floor) |
| 4 | the waiver line written in MY text | fixture A1 |
| 5 | the waiver line echoed back inside hook feedback | fixture A2 |
| 6 | the waiver line with no reason | fixture A5 |
| 7 | the waiver line in the agent prompt used by the PARENT to start early | fixture G4 |
| 8 | a brief shown in an EARLIER turn | fixtures A3, S7 |
| 9 | an Agent started for something else | fixtures A4, G3, S4 |
| 10 | hook feedback inside the turn splitting it in two | fixtures P4, G2, T1 |
| 11 | a status `update` of an ADHOC block (a save that is not `start`) | fixture B7 |
| 12 | a READ of an ADHOC quest doc | fixture N1 |
| 13 | a file whose CONTENT names an ADHOC doc and the save command (this eval) | fixture N2 |
| 14 | a search for the save command | fixture N3 |
| 15 | a ticket quest doc or a ticket block update | fixtures N4, N5 |
| 16 | an edit of the adhoc-save skill itself | fixture N6 |
| 17 | the eval of the audit mistaken for the audit | fixture N7 |
| 18 | malformed or empty stdin | fixtures F1, F2, S9 |
| 19 | transcript missing, absent or plain text | fixtures F3, F4, F5, S10, S11, S12 |
| 20 | a very long turn (4000 events) | fixture F6 |
| 21 | `tool_input` missing | fixture F7 |
| 22 | the marker line quoted inside hook feedback | fixture S8 |
| 23 | the call seen from inside the save agent (its own prompt opens the turn) | fixtures P2, G5 |
| 24 | a mid-turn text the session log did not record cannot count as a brief | accepted-risk: the block text sends me to "end the turn with the brief", which is the wanted route |
| 25 | hooks run from the MAIN checkout, so a worktree edit of this gate is not live until main is pulled | accepted-risk: stated in the reply at ship time; pull main after the push |
| 26 | two sessions saving adhocs at once | handled: each call reads only its own transcript |
| 27 | `lib/adhoc-brief-first.js` deleted or renamed | accepted-risk: the hook throws at require, the runtime logs it and does not block |
