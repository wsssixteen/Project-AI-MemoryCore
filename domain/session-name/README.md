# session-name

symptom: 2026-09-23 miya: 'Can I make you check something ... to name that session so that I don't keep having to rename it?'; 2026-10-28 format ruled: '<date> - <title keyword/ticket number>'; 2026-10-28 'audit to ensure all kinds of startup to include this' (9c200d4c 'QA tickets review' and child alter-sim stayed undated)
goal: every session (new, resumed, child, machine-first) carries a name '<D/M/YYYY> - <ticket or keywords>' with no manual rename
goal_signal: the session's own title, read from its transcript (last `custom-title` record, or a dated `set_session_title` call on "self"), matches ^\d{1,2}/\d{1,2}/\d{4} - ; written as a `renamed` / `already-dated` row with goal_met true
retention: rotate monthly
footprint: per-prompt: in-process child of the upsm-mode bundle (first child); per-turn: child of the stop-reply-shape bundle, one transcript read until the session is done, then a seen-file lookup; per-tool: one node process only on start_session / hand_off_to_session. No new UserPromptSubmit or Stop registration.
self_audit: the Stop child reads the real title back every turn until it is dated (goal_met only from that read); `node domain/session-name/session-name.check.hook.js --audit` fails any session asked to rename (older than 15 min) with no goal_met row, exit 0 PASS / 1 FAIL
state-scoped: no, state-agnostic (names any session, etanah or not)
diagram: domain/session-name/diagram.png

**What fires when** (v2, 2026-10-28):

| Moment | Where | Does |
|---|---|---|
| his first prompt in this session process | `upsm-mode` bundle, FIRST child | title not dated → one rename line. New session: today + the ticket in his message. Resumed or child session: the date of its first typed prompt + the ticket in that prompt, and the current title to keep its topic. Title already dated → silent, `already-dated`. |
| end of every turn until done | `stop-reply-shape` bundle | title dated → `renamed` (goal_met true), done. Not dated → block ONCE with the same line (`stop-block`); the next Stop gives up (`gave-up`, goal_met false). |
| Ruri calls `start_session` / `hand_off_to_session` | `settings.json` PreToolUse matcher | a title with no date → refused, with the dated title to use. **This is the rule for the titles of sessions Ruri starts**; no other file governs them. |

**Contract**: rename with `mcp__ccd_session_mgmt__set_session_title` (`session_id: "self"`). Ticket number (6 digits, `#` dropped) → exact title `28/10/2026 - 286650`. No ticket → `28/10/2026 - <2-4 keywords>`, at most 30 characters. Date = local D/M/YYYY, no zero padding (his sidebar style, `21/9/2026`).

**Silent when**: the session is marked done · the first prompt is a machine notice (task notification, cross-session message, slash-command echo: waits for his first real message, not marked) · the transcript has no `"entrypoint":"claude-desktop"` (no rename tool; Stop marks it `no-app`) · `stop_hook_active` (never blocks twice).

**Delivery (why the bundle shape matters)**: the harness kills a registration at 30 s and drops ALL its output; `open-quest-surfacer` ran 22-26 s on 2026-10-28 and took the whole bundle down (`hook_cancelled`, `timedOut:true`, 76 times for upsm-mode). `upsm-mode.json` carries `budget_ms: 22000` (`lib/dispatch-hooks.js` emits the finished children at the budget). Output over ~10 KB is replaced by a 2 KB preview, so this line is first in the manifest.

**Layer choice (Rule 7)**: hook-only. The rename itself needs the model (keywords + tool call); the Stop child is the backstop that makes a lost line visible and recoverable.

**Files**: `.seen.json` (gitignored, session id → `{t, s: asked|done|gave-up|no-app, b}`, pruned after 3 days; v1 number entries still read) · `log.jsonl` (gitignored; `ts · sid · event · outcome · title · marked · goal_met · dur_ms`).

**Change it**: format → `dmy()` / `line()`; ticket shape → `TICKET_RX`; which prompts count → `MACHINE_RX` / `scan()`; budget → `domain/bundles/upsm-mode.json`. Eval: `node domain/session-name/session-name.eval.js` (56 fixtures, incl. every start kind and the slow-bundle replay).

v2 changed specs (named per system-design Rule 6): a resumed old session is no longer silent (it is dated by its first prompt); a transcript over 512 KB is no longer treated as old by size; goal_met is no longer written at fire time; the line now sits first in its bundle.
