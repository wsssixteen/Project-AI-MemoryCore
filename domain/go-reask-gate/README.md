# go-reask-gate

symptom: 2026-10-30 miya (287186), angry: after "approve A1E3-7EAD, submit it" I ran the alter and then asked him to approve the Redmine note again, twice; "I literally copied and pasted the submit"
goal: a send he already ordered is never asked about again; the reply after his go reports the step done
goal_signal: log.jsonl rows outcome=blocked-reask fall to zero over two weeks while redmine-write-gate shows no gate/repeat-block
retention: rotate monthly
footprint: per-turn: runs inside the stop-reply-shape bundle, no extra process, ~0 MB added
self_audit: every run reads his messages back through lib/his-words (decide) and my words since his last message from the transcript, then logs blocked-reask or passed-new-code to log.jsonl
diagram: domain/go-reask-gate/diagram.png
state-scoped: no, state-agnostic

**What fires when**: Stop, inside the `stop-reply-shape` bundle. His own messages (the shared reader `lib/his-words.js`, 8 back, a later hold or a no on the action voids it) already ordered a send / submit / post / alter / proceed, AND my words since his last message (text blocks + the `wrap_up` ask) hand that send back to him: a question naming approve / submit / post / send / proceed / alter, "reply go", "shall I post", "waiting for your go", "needs your approval".

**Contract**: BLOCK the stop. The block quotes his order and my ask, and says: do the step now; a tool or gate refused it → say which, try the next path, never hand the same go back. A NEW approval code he has never typed passes (the PROD alter gate needs his own code). Bypass: `[genuine-fork: <reason>]` in my reply (a new recipient, a new code). His words only: a go inside my own line, a skill text or a reminder never counts (his-words rules).

**Layer choice (system-design Rule 7)**: hook-only. The decision is mechanical: his go (shared reader) + a question shape in my final words. Three prose rules already said this (system-rules Rule 8, CLAUDE.md disposition 7, personality "no asking-back") and the re-ask still happened on 2026-10-30.

**Trigger moment (Rule 8)**: Stop is the leanest moment that sees my final ask; PreToolUse cannot see a reply. It joins the existing Stop bundle (system-rules Rule 7), no new registration.

**Observability**: `log.jsonl` rows `{ts, outcome: blocked-reask | passed-new-code, his, mine | codes}`; every run also lands in `system/telemetry/hook-fires.jsonl` through `lib/hook-runtime.js`.

**Eval**: `node domain/go-reask-gate/go-reask-gate.eval.js` → 24/24 (2026-10-30): the forge stub, the 287186 replay and 10 rounds of 2 fixtures each (the 10-round eval he ordered).

**Paired the same day** (one route): this worktree was 26 commits behind main, so `redmine-write-gate` v1.7 ran instead of v1.8; merged main (his 10 replay rounds F119 to F128 added to the gate eval, all green on v1.8) and born `domain/stale-hooks-warn` so a session folder behind main on gates says so at the next prompt.

## Adversarial scenarios (Rule 12 — 20)

| # | Scenario | Verdict |
|---|---|---|
| 1 | today: wrap_up ask "Post the … note … now?" after "submit it" | fixture-added (F2) |
| 2 | today: "Reply go and it posts" | fixture-added (R1a) |
| 3 | today: "Approve the … alter and Redmine note?" | fixture-added (R1b) |
| 4 | his "You're going to ask again?" between the go and my ask | fixture-added (R2a) |
| 5 | an unrelated ask of his after the go | fixture-added (R2b) |
| 6 | he holds later ("wait, don't submit yet") | fixture-added (R3a) |
| 7 | he asks to view first | fixture-added (R3b) |
| 8 | first approval code of a PROD alter, no go yet | fixture-added (R4a) |
| 9 | old code approved, a NEW code asked | fixture-added (R4b) |
| 10 | my reply reports done, no question | fixture-added (R5a) |
| 11 | my reply names a refusal and the path taken | fixture-added (R5b) |
| 12 | bypass in my reply | fixture-added (R6a) |
| 13 | bypass token inside an injected skill line | fixture-added (R6b) |
| 14 | "submit it" only in my own line (self-approval) | fixture-added (R7a) |
| 15 | a go inside a loaded skill text | fixture-added (R7b) |
| 16 | his question alone ("why did you post it?") | fixture-added (R8a) |
| 17 | his refusal ("do not ever post") | fixture-added (R8b) |
| 18 | go 10 of his messages back | fixture-added (R9a) |
| 19 | /goal after the go | fixture-added (R9b) |
| 20 | stop_hook_active / malformed stdin | fixture-added (R10a, R10b) |
| 21 | a question to him about something else entirely ("Which state?") while a go stands | accepted-risk: blocks only when the question names approve/submit/post/send/proceed/alter; a different fork carries [genuine-fork] |
| 22 | the gate's own block text quoted in a later reply | handled: it reads my words since HIS last message, and the block text says "do the step now", which carries no question mark after a send verb |
