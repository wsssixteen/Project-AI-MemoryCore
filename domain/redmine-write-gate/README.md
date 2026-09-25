goal_status: draft (derived from registry on 2026-09-06; promote with node lib/goal-backfill.js promote redmine-write-gate)
symptom: #275847 2026-09-04: note posted + reassigned to Ammar on the strength of 'Start with the standard Salam Amar' (a wording instruction, not a post approval); miya wanted to review first and the journal cannot be edited via API (404)
goal: BLOCK unless the LAST user message is an explicit post approval (post it / post now / Yes, post / [redmine-post-ok]) — the note text must have been shown and nodded first
goal_signal: the PreToolUse fire produced: BLOCK unless the LAST user message is an explicit post approval (post it / post 
retention: rotate monthly
# redmine-write-gate (hook-only Feature, v1.1 — born 2026-09-04 via core/forge.js)

**What fires when**: `PreToolUse` on `Bash|PowerShell` — the command (or any `.js` it executes) references the Redmine host / API key AND carries a mutation (`method:'PUT'|'POST'|'DELETE'`, `-X PUT`, `notes`, `assigned_to_id`, `status_id`, `done_ratio`, `journal`, `uploads`).

**Read-only exemption**: `redmine-sync|board|reconcile|status-check.js` (+ their `.eval.js`) and `quest/ticket-load-verify.js`, matched on the basename. An exempt script's body is skipped only when it is invoked as an EXECUTED script AND the command text itself carries no mutation; every other executed script's body (a chained writer included) and the command text are always scanned.

**Contract (BLOCKS)**: the write runs only when the **last user message** in the transcript is an explicit post approval — `post it` · `post now` · `Yes, post …` (the AskUserQuestion answer shape) · `postkan` · `[redmine-post-ok]`. An approval in an older turn does not count; "post it" written by the assistant does not count; no transcript = block. Bypass (user message only): `[skip-redmine-write-gate: <reason>]`.

**Nod**: みや 2026-09-04 (#275847) — *"Create a stophook now for me to review your comments first next time."*

**Replay it kills**: the note on #275847 was posted + reassigned on the strength of *"Start with the standard Salam Amar…"* (a wording instruction). Redmine journals cannot be edited via the API here (`PUT /journals/<id>.json` → 404), so the wrong wording is permanent. Memory `feedback_redmine_write_needs_nod` was prose and did not fire.

| Piece | File | Role |
|---|---|---|
| Hook | `redmine-write-gate.check.hook.js` | PreToolUse block/allow |
| Eval | `redmine-write-gate.eval.js` | 31 fixtures, sandboxed transcripts (F2 = the #275847 replay · F18 = the 2026-09-25 replay) |
| Log | `log.jsonl` | `{ts, outcome: blocked\|allowed, approval\|last_user}` |

**Layer choice (Rule 7)**: hook-only — the decision is mechanical (is the last user turn an approval?). **Trigger moment (Rule 8)**: PreToolUse on the shell tools that can reach the API; not Stop (too late — the write has happened). **state-scoped**: no — one Redmine host for every state.

**Verify**: `node lib/eval-runner.js --only redmine-write-gate` → **31/31 green** (2026-09-25). Run it through the runner: invoking the eval file directly is blocked by this gate, because its body carries the replay strings.

**v1.1 (2026-09-25)**: `node quest/ticket-load-verify.js <num>` (the `/quest resume` step 1a-ii reader, local files only) was BLOCKED as a write because its body names `redmine-sync.js` and holds a `/^\s*notes:\s*$/` parser regex. Added to the exemption, basename-anchored (F25). Every `node <script>` in the command is now read, not only the first, so a writer chained after an exempt script is still scanned (F23 — a naive name-append let it through). Script capture now reads quoted paths with spaces (row 17 was marked handled but was not — F26). Reconciles the uncommitted `(\.eval)?` exemption (F27). Spec preservation: "exempt only when it is the script being EXECUTED, never when passed as an argument" and "the command itself carries no mutation" both kept (F24, F31); no spec dropped.

## Adversarial scenarios (Rule 12 — 20)

| # | Scenario | Verdict |
|---|---|---|
| 1 | "post it" appears only in an assistant line (self-approval) | handled (F12) |
| 2 | approval given 3 turns ago, latest message is a review request | handled (F4) |
| 3 | last transcript line is a tool_result, real user text earlier | handled (F6 — tool_result-only turns are skipped) |
| 4 | AskUserQuestion answer "Yes, post + reassign" | handled (F5) |
| 5 | writer script borrows the key by passing `redmine-sync.js` as an ARGUMENT | handled — read-only exemption applies only to the executed script (F2/F3 shape) |
| 6 | read-only sync/board/reconcile scripts | handled (F8) |
| 7 | PUT to a non-Redmine host with a `notes` field | handled (F9) |
| 8 | curl inline write | handled (F7) |
| 9 | no transcript path (headless) | handled — block (F11) |
| 10 | malformed stdin | handled (F14) |
| 11 | bypass token in the user message | handled (F10) |
| 12 | bypass token echoed by the assistant | handled — only the last USER text is scanned |
| 13 | the hook's own block text quoted later (contains "post it") | handled — assistant lines never count |
| 14 | approval phrase inside a longer sentence ("don't post it yet") | accepted-risk — regex matches "post it"; mitigation: みや's usual phrasing is bare; refine to negative-lookbehind on `don't|jangan|not` if it misfires once |
| 15 | write via python / PowerShell Invoke-RestMethod instead of node | handled by REDMINE_REF + MUTATION (host/key + verb) — tool-agnostic |
| 16 | write via a browser form (Claude in Chrome) | accepted-risk — outside Bash/PowerShell; the `redmine-phase1-prefill` skill fills the form and waits for miya to click Submit |
| 17 | script path with spaces | handled since v1.1 — quoted-path capture (F26); before v1.1 the body was silently NOT read |
| 18 | huge transcript | handled — 400 KB tail |
| 19 | worktree vs main root | handled — no repo path dependency |
| 20 | user instruction reversal ("no, I will post it myself" · "don't post it yet") | handled — negative lookbehinds (`don't/do not/jangan/not/never`, `I will/I'll`) (F16, F17); eval 17/17 |
| 21 | read-only local script whose body names `redmine-sync.js` + a `notes:` regex (`ticket-load-verify.js`) | handled — exempt (F18, F20, F21); F19 proves the same body under another name still blocks |
| 22 | exempt script + a writer chained in one command | handled — the writer's body and the command text are still scanned (F22 inline curl, F23 writer script) |
| 23 | look-alike or argument-borrowed name (`xticket-load-verify.js`, name passed as an argument) | handled — basename anchor + executed-script rule (F24, F25) |
| 24 | a writer saved under an exempt NAME elsewhere | accepted-risk — exemption is name-based like the redmine-* helpers; that is deliberate evasion, the gate targets honest slips |
| 25 | `ticket-load-verify.js` later gains HTTP / child_process | handled — F29 goes RED, forcing a re-review of the exemption |
| 26 | exempt script only MENTIONED in a quoted argument (a slip note, a commit message) | handled — its body is skipped, so a clean command stays silent (F30; live false positive hit while building v1.1) |
| 27 | exempt script + mutation-shaped text in the command | handled — exemption void, its body is scanned → BLOCK (F31) |
