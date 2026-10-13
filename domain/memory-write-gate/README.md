# memory-write-gate

symptom: 2026-10-05 miya: 'feedback_ is not enough ... a gate to stop you BEFORE or WHEN you wanted to add feedback_' (commit-subject language slip on #244600 answered with a memory line only)
goal: no feedback memory is written before the rule has a named enforcing home in its workflow
goal_signal: the blocked write is followed by a RULE-PLACEMENT line and an edit to the named enforcing file in the same turn
retention: rotate monthly
footprint: per-tool: 1 short node process per Edit/Write/MultiEdit (<50 MB, <50 ms); transcript read only for auto-memory paths

**What fires when**: PreToolUse on Edit, Write or MultiEdit (matcher `Edit|Write|MultiEdit`) whose target matches `[\\/]\.claude[\\/]auto-memory[\\/][^\\/]+\.md$`, case-insensitive, in the worktree or the main repo. Any other path returns at once, before the transcript is read, and writes no log row.

**Contract**: a feedback memory write is BLOCKED (exit 2, message on stderr) unless the assistant text of the CURRENT turn (everything after the last real user message) holds a line of this shape FOR THAT FILE. One line per memory file: two feedback writes in one turn need two lines.

`RULE-PLACEMENT: file=<name.md> · workflow=<name|none> · step=<where in that workflow> · enforced-by=<existing file path | new: <name> | none: <why a gate cannot check this>> · memory-because=<why a memory is still needed>`

| Check | Rule |
|---|---|
| 0 file | `file=` is required and must equal the basename of the file being written (case-insensitive, `.md` optional); a line for another file does not cover this one, and the block message names both files |
| 1 keys | all five present and non-empty; `TODO`, `tbd`, `n/a`, `?`, `-` alone refused; an unfilled `<placeholder>` refused; `none` is allowed for workflow and step only; `memory-because` needs 8+ characters |
| 2 path exists | an `enforced-by` path must exist on disk, tried under the project dir, the main repo root (derived from `.claude/worktrees/<n>`) and the root of the memory file itself; `:line`, `#anchor` and `(note)` suffixes are stripped |
| 3 path edited | the named file (or any file under a named folder) must have a successful Edit/Write/MultiEdit/NotebookEdit tool call in the current turn, or the line carries `already-enforced: <sentence>`; errored tool calls do not count |
| 4 MEMORY.md | exempt when every line the edit ADDS is a heading or an index bullet `- [title](file.md) — hook` (lines already in the file, or in `old_string`, are ignored), or when a feedback memory passed this gate in the same turn (same transcript, same turn key, from `log.jsonl`) |
| 5 type | a file named `feedback_*.md` is ALWAYS gated, whatever its frontmatter `type:` says (no relabelling). For other names, frontmatter `type: user`, `project` or `reference` (top-level or nested under `metadata:`) passes without a line; `type: feedback` is gated; no type (`notes.md`) passes. Edit reads the type from the existing file, or from the `type:` line in `new_string` if the edit changes it |
| 6 enforcer | a path inside an `auto-memory` folder is refused: a memory is not an enforcer |

Only assistant `text` blocks count. Tool results, hook output, user messages and the tool inputs themselves never satisfy the line or the bypass. A user message that is only a `<system-reminder>`, `<task-notification>` or `Stop hook feedback` is not a turn boundary.

Bypass: `[skip-memory-write: <reason>]` in assistant text of the current turn. The reason needs 8+ characters and may not be a `<placeholder>`, so the gate's own block text (which prints `<reason>`) can never satisfy it. Logged as `bypass`.

Fail open (exit 0, logged `fail-open`): empty or non-JSON stdin, missing, unreadable or non-JSONL transcript. A hook crash fails open through `lib/hook-runtime.js`.

**Block message** (stderr): names the file, then asks (a) which workflow are we in, (b) which step of it should carry this rule, (c) which gate, hook or skill enforces it (none yet: run the system-design skill and build it first), shows the RULE-PLACEMENT shape (`file=<name.md> · workflow=<...> · step=<...> · enforced-by=<...> · memory-because=<...>`, one line per memory file, placeholders only), and points to `.claude/skills/system-design/SKILL.md` and `system/INDEX.md`. When a line exists but fails, the first line of the message names what was wrong.

**Layer choice (Rule 7)**: hook-only. Every check is a string, path or transcript test. The judgment (is this the right home) stays with the assistant and is forced into the open by the line; the gate only proves the answer was written down and, for a named file, that it was really changed.

**Trigger moment (Rule 8)**: PreToolUse on the memory write, the exact moment the shortcut is taken. A Stop gate would fire after the write; a UserPromptSubmit gate would fire on every prompt. The path test runs first, so the transcript is read only for memory writes.

**Placement (Rule 14)**: `domain/memory-write-gate/` (hook, eval, README, NUKE-MARKER, log). Allowed by the `domain` row of `system/FOLDER-STRUCTURE.md`. Registered in `.claude/settings.json` PreToolUse under its own `Edit|Write|MultiEdit` block (the existing `Edit|Write` blocks do not cover MultiEdit).

**Observability**: every memory-path decision appends to `domain/memory-write-gate/log.jsonl` (gitignored, rotate monthly): `ts`, `decision` (`pass` | `block` | `bypass` | `fail-open`), `file`, `turn` (transcript name + user-message count + hash, used for the sibling check), `reason`. `lib/hook-runtime.js` also writes its normal row to `system/telemetry/hook-fires.jsonl`.

**state-scoped**: no, state-agnostic (the auto-memory folder and the placement line do not depend on the state).

**Known limits** (see table): a Bash or PowerShell write into `auto-memory` is not seen; a non-`feedback_` name with `type: user|project|reference` is trusted; the gate proves the named file was edited, not that it is the right home or that the rule text landed in it.

**Eval**: `node domain/memory-write-gate/memory-write-gate.eval.js` (102 fixtures: the 15 spec fixtures plus the adversarial table below).

## Adversarial scenarios (system-design Rule 12)

| # | Scenario | Verdict |
|---|---|---|
| 1 | feedback memory, no line | handled, BLOCK (F1) |
| 2 | valid line, existing path, path edited this turn | handled, PASS (F2) |
| 3 | path named does not exist | handled, BLOCK "not found on disk" (F3) |
| 4 | path exists, not edited, no `already-enforced` | handled, BLOCK with the exact sentence (F4) |
| 5 | `already-enforced: n/a` to dodge check 3 | handled, BLOCK (F4c) |
| 6 | `new: x` and `none: <why>` | handled, PASS; empty `new:`, one-word `none: x`, bare `none` BLOCK (F5, F6) |
| 7 | `type: user` / `project` / `reference` in `user_*` / `project_*` / `reference_*` files, top-level or nested under `metadata:` | handled, PASS without a line (F7) |
| 8 | feedback_ file with no frontmatter; `type: feedback` in a non-feedback_ name (needs its own `file=` line) | handled, BLOCK without a line (F7d, F7f), PASS with it (F20h) |
| 9 | non-memory path, subfolder of auto-memory, `auto-memory.md`, `.txt` | handled, PASS with no log row (F8) |
| 10 | gate's own block text quoted in assistant text and in a tool_result | handled, still BLOCK, placeholders and `<reason>` are refused (F9) |
| 11 | shape line copied verbatim from the block message | handled, BLOCK "placeholder" (F9b) |
| 12 | valid line only in an older turn | handled, BLOCK (F10) |
| 13 | MEMORY.md: index lines only / rule text after a passed sibling / rule text with no sibling | handled, PASS / PASS / BLOCK (F11) |
| 14 | MEMORY.md sibling passed in another session or an earlier turn | handled, does not count, BLOCK (F11f, F11g) |
| 15 | full-file Write of MEMORY.md adding one index line vs adding a rule sentence | handled, PASS / BLOCK (F11d, F11e) |
| 16 | empty stdin, malformed JSON, `{}` | handled, exit 0; empty and malformed are logged `fail-open`, `{}` is silent (F12) |
| 17 | missing transcript file, no transcript_path, plain-text transcript | handled, exit 0 fail-open, logged (F12c-e) |
| 18 | forward slashes and flipped drive-letter case | handled, normalised then compared lower-case (F13) |
| 19 | memory path in the main repo while the project dir is a worktree | handled, gated the same; enforcing file found under the main root (F14) |
| 20 | bypass in assistant text / only in a tool_result / placeholder reason / old turn / one-char reason / typed by the user | handled, PASS / BLOCK x5 (F15) |
| 21 | TODO, tbd, n/a, missing key, `none` as the reason | handled, BLOCK (F16) |
| 22 | line decorated with a bullet, backticks or a code fence | handled, PASS (F16g, F16h) |
| 23 | bare gate name as `enforced-by` | handled, BLOCK with a hint to name the file (F16i) |
| 24 | `enforced-by` points at a memory file | handled, BLOCK "a memory is not an enforcer" (F17) |
| 25 | the edit to the enforcing file errored or was a Bash command or a different file | handled, does not count, BLOCK (F17b, F17f, F17g) |
| 26 | same relative path under an unrelated folder edited | handled, BLOCK (F17h) |
| 27 | `:line` suffix, `#anchor`, folder as enforcer | handled, PASS (F17c-e) |
| 28 | valid line inside a tool_result, or inside the user's own message | handled, BLOCK (F18, F18b) |
| 29 | `<system-reminder>` user text mid-turn | handled, not a turn boundary (F18c) |
| 30 | CRLF transcript, string-form message content, transcript with no user message | handled (F18d-f) |
| 31 | MultiEdit, path traversal into auto-memory, upper-case name, relative file_path | handled, BLOCK (F19) |
| 32 | 6 MB transcript | handled, PASS in under 8 s (F21) |
| 33 | two feedback memories in one turn, one line | handled (tightened by owner ruling): the line covers only its `file=`; the second file BLOCKs, two matching lines PASS both (F20, F20b) |
| 34 | memory written through Bash or PowerShell (`Set-Content`, `echo >`) | accepted-risk: the trigger is Edit/Write by design; the matcher is the Edit tools only |
| 35 | a feedback_ file given `type: user/project/reference` to evade the gate (relabelling) | handled (tightened by owner ruling): `feedback_*` is always gated, whatever the type (F7r, F20i) |
| 35a | line without `file=`, `file=<name.md>` placeholder, line for another file, wrong case or no `.md` | BLOCK, BLOCK, BLOCK, PASS, PASS (F20c-g) |
| 36 | enforcing file edited, but the rule text never added to it | accepted-risk: judgment, the gate proves a change, not its content |
| 37 | two concurrent sessions in one repo | handled, the sibling check keys on the transcript name plus the user-message count and hash |
| 38 | an enforcing file renamed or deleted later | handled, check 2 reads the disk at write time; a dead gate is the census job, not this gate's |
| 39 | this gate silently dying | accepted-risk: covered by `lib/feature-census.js` and `system/telemetry/hook-fires.jsonl` liveness |
| 40 | hooks run from the main repo copy while the Feature sits on a worktree branch | handled, ROOT comes from `CLAUDE_PROJECT_DIR` with the main root derived from `.claude/worktrees/<n>`; the gate is live in main only after the merge |
| 41 | user instruction reversal: miya says "just save it" | handled, bypass with a real reason, logged, never silent |
