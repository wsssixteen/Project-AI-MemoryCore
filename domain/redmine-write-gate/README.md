# redmine-write-gate (hook-only Feature, v1.0 — born 2026-09-04 via core/forge.js)

**What fires when**: `PreToolUse` on `Bash|PowerShell` — the command (or the `.js` it executes) references the Redmine host / API key AND carries a mutation (`method:'PUT'|'POST'|'DELETE'`, `-X PUT`, `notes`, `assigned_to_id`, `status_id`, `done_ratio`, `journal`, `uploads`).

**Contract (BLOCKS)**: the write runs only when the **last user message** in the transcript is an explicit post approval — `post it` · `post now` · `Yes, post …` (the AskUserQuestion answer shape) · `postkan` · `[redmine-post-ok]`. An approval in an older turn does not count; "post it" written by the assistant does not count; no transcript = block. Bypass (user message only): `[skip-redmine-write-gate: <reason>]`.

**Nod**: みや 2026-09-04 (#275847) — *"Create a stophook now for me to review your comments first next time."*

**Replay it kills**: the note on #275847 was posted + reassigned on the strength of *"Start with the standard Salam Amar…"* (a wording instruction). Redmine journals cannot be edited via the API here (`PUT /journals/<id>.json` → 404), so the wrong wording is permanent. Memory `feedback_redmine_write_needs_nod` was prose and did not fire.

| Piece | File | Role |
|---|---|---|
| Hook | `redmine-write-gate.check.hook.js` | PreToolUse block/allow |
| Eval | `redmine-write-gate.eval.js` | 15 fixtures, sandboxed transcripts (F2 = the replay) |
| Log | `log.jsonl` | `{ts, outcome: blocked\|allowed, approval\|last_user}` |

**Layer choice (Rule 7)**: hook-only — the decision is mechanical (is the last user turn an approval?). **Trigger moment (Rule 8)**: PreToolUse on the shell tools that can reach the API; not Stop (too late — the write has happened). **state-scoped**: no — one Redmine host for every state.

**Verify**: `node domain/redmine-write-gate/redmine-write-gate.eval.js` → **15/15 green** at ship (2026-09-04).

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
| 17 | script path with spaces | handled — quoted path capture |
| 18 | huge transcript | handled — 400 KB tail |
| 19 | worktree vs main root | handled — no repo path dependency |
| 20 | user instruction reversal ("no, I will post it myself" · "don't post it yet") | handled — negative lookbehinds (`don't/do not/jangan/not/never`, `I will/I'll`) (F16, F17); eval 17/17 |
