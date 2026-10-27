# session-name

symptom: 2026-09-23 miya: 'Can I make you check something ... to name that session so that I don't keep having to rename it?'; 2026-10-28 format ruled: '<date> - <title keyword/ticket number>'
goal: every new session carries a name '<D/M/YYYY> - <ticket or keywords>' from his first message, with no manual rename
goal_signal: the first prompt of a session emits the rename line and the reply renames the session to a title matching ^\d{1,2}/\d{1,2}/\d{4} - 
retention: rotate monthly
footprint: per-prompt: in-process child of the upsm-mode bundle, no new process; one tail read of the transcript (~5 ms), silent after the first prompt
self_audit: every fire reads its seen-marker back (logged as `marked`, `goal_met`); `node domain/session-name/session-name.check.hook.js --audit` checks the last 20 fires against the title format, exit 0 PASS / 1 FAIL
state-scoped: no, state-agnostic (names any session, etanah or not)

**What fires when**: UserPromptSubmit, his first typed message of a new session only (ruled 2026-10-28, popup "First message only").

**Contract**: one advisory line: rename this session with `mcp__ccd_session_mgmt__set_session_title` (`session_id: "self"`).
- Ticket number (6 digits, `#` dropped) in the message → exact title `28/10/2026 - 286650`.
- No ticket → `28/10/2026 - <2-4 keywords>`; Ruri fills the keywords from his message, at most 30 characters.
- Date = local D/M/YYYY, no zero padding (his sidebar style, `21/9/2026`).

**Silent when**: the session was seen already · the transcript holds an earlier typed prompt (a resumed old session) · the transcript is over 512 KB · the message is a machine notice (task notification, cross-session message, slash-command echo: waits for his first real message, not marked).

**Layer choice (Rule 7)**: hook-only. The moment must fire without being remembered; the rename itself needs the model (keywords + tool call), so the hook only tells it to.

**Trigger moment (Rule 8)**: first prompt of a session; a seen-marker makes every later prompt a one-read exit. Runs inside the `upsm-mode` bundle (no new registration, system-rules Rule 7).

**Files**: `.seen.json` (gitignored, session id → time, pruned after 3 days) · `log.jsonl` (gitignored; one row per decision other than "seen": `ts · sid · outcome · title · marked · goal_met · dur_ms`).

**Change it**: format → `today()` / `line()`; ticket shape → `TICKET_RX`; which prompts count → `MACHINE_RX` / `typedPrompts()`. Eval: `node domain/session-name/session-name.eval.js` (26 fixtures).
