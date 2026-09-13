---
label: wayfinder:map
goal: a Claude Code session starts by itself the moment a work message lands in a watched WhatsApp room, with the photos/videos already downloaded and the described issue carried in, before miya reaches the laptop, so he answers fast and accurately without downloading or copy-pasting
retention: keep
created: 2026-09-11
driver: Ruri
---

# WhatsApp Watcher — Wayfinder Map

> Charted 2026-09-11 → 2026-09-13 with the wayfinder skill, every decision taken through popup. Local Markdown tracker (no issue tracker configured). Tickets are the `### WA-nn` sections below; a ticket is **claimed** by writing `claimed: <session>` in its header, **closed** by filling `Resolution:`. The **frontier** = open tickets whose `blocked by` list is all closed.

## Destination

The watcher running in **DRY RUN** over the cached last 7 days of the three work rooms, printing one row per message that **would have fired** (room · time · rule hit · judge verdict + reason · the session name it would have opened; no message text, no sender names), plus the **rules doc** (`RULES.md`) the judge reads and the **setup doc** (`SETUP.md`) that lets the whole thing be rebuilt on another laptop. Live auto-start is the next map.

## Notes

- **THE PURPOSE (never drop it)**: see `goal:` above. The persistent part lives OUTSIDE Claude Code sessions. miya does not open the app or type a command to make it work. Slip `purpose-drift` 2026-09-13 when a design required both.
- Domain: miya's work WhatsApp. Reader = `E:\Dev\scripts\WaRead` (read-only linked device, Baileys, allowlist wall in `lib/readonly.js`). Skill `.claude/skills/whatsapp/SKILL.md`. Memory `project_wa_read` + `feedback_whatsapp_read_rules`.
- Skills every ticket session loads: `whatsapp` · `system-rules` (Rule 1 no duplicate home, Rule 6 retention at birth) · `system-design`. A ticket that touches the quest path loads `quest` + `etanah-knowledge/melaka/ADHOC-TRIAGE.md`.
- Standing rules: READ ONLY forever (no send, no read-mark, no presence, no desktop app, no WhatsApp Web). No sender names or verbatim text in anything miya reads. Casual groups are never read. Questions to miya go through the popup tool.
- Message "shape" for work issues = `domain/adhoc-paste-detector/README.md` (labelled `Urusan:/Tugasan:/Id:/User:` or permohonan-id + issue words; office codes PDTJ/PDTAG/PDTMT mark a structured office report).

## Decisions so far

**Rooms and triggers**
- Release Melaka Pelupusan ⏰: every message goes to the judge; `Hi dev` and `PDTJ / PDTAG / PDTMT` are hints there, not gates.
- MLK Pelupusan Support (front line, BA ↔ users/TSO): fires only on a ticket number, "ticket created" / "dah create tiket", or a mention of miya.
- PERAK PLP: fires only on a mention of miya.
- Mention = real WhatsApp @mention of his number, or whole-word `Ahmad`, `Ridhwan`, `@Ridhwan`, `@AhmadRidhwanAnuar`, `@Ahmad`.
- Alex (manager): counts in the three work rooms AND in his direct chat. Ticket question → session with that context. Ticket handed over → session that retrieves the ticket, confirms Melaka or Perak, runs the quest to the brief (issue · solution · story diagram) and STOPS.
- Casual groups: never read.

**Architecture**
- Always-on **WaRead daemon** starts at Windows logon, read only, reconnects on drop, keeps the cache fresh; nothing is missed while Claude Code is closed.
- Two filters: a deliberately loose **script filter** in the daemon, then a **judge** with the day's context before anything starts.
- The judge is **one headless session per day** (Sonnet), which the daemon keeps **resuming** with each new candidate, so it remembers the morning's issues and who asked what. Verdicts: new issue → spawn · follow-up → send into the existing child · baseline → spawn/feed the Baseline child · skip.
- Children are **headless named sessions** started by the daemon: `<MLK|PRK><ticket> - <Urusan if any> - <very short keyword>`, Opus 4.8, xhigh effort. A child runs the ADHOC scaffold / quest to the brief and STOPS. miya opens the named session when he arrives.
- Media: the child's Task folder `0. Brief/` receives the issue's photos and videos before it starts. Grouping is **per issue** (replies, captions, sender, topic) decided by the judge, never by a time window; the dry run shows how it grouped.
- Already-tracked ticket: never a second session; the message is appended to that quest's doc as a dated paraphrased note.
- Catch-up: a late start processes everything since the last run, oldest first.
- Run window: always on while the laptop is on.
- Notifications: **none**. No pop-ups. The started session is the signal.
- Permissions for unattended children: `dontAsk` + an audited allowlist (reads, Redmine sync, DB read tools, Task-folder and quest-doc writes; never git push, never a PROD write). Must be audited end-to-end so nothing stalls on a prompt and the quest md + scaffold are actually written.
- Phone: research whether Claude Remote Control lets miya open a daemon-spawned child from his phone before reaching the laptop.

**Outputs**
- Dry-run row: room · time · rule hit · judge verdict + one-line reason · session name it would open. No text, no names.
- Adhoc list for Protime: `1. Tasks\Melaka\adhoc-week.txt`, overwritten once per week, days divided by `====<date>===`, rows `1) PRK - Prod/Internal - <very short issue>`. **Regenerated** from `quest/active.txt` ADHOC blocks by a script (retention class `regenerate`); never hand-edited, so nothing can be orphaned.
- Env label (Prod / Internal) judged from context: forwarded-from-TSO shape, PDT* structured message, pasted URL host, words like prod / staging / mlit; `?` when unsure.
- Rules home `domain/whatsapp/RULES.md` (judge-readable routing table). Map home this file. Setup home `domain/whatsapp/SETUP.md`.

**Live test 2026-09-13 (manual run of the whole chain)**
- Read Alex's direct chat → found the Friday 21:16 ask (Redmine #278699 rework, weekend, SLA) → judge: FIRE → session spawned as `MLK278699 - PT - surat tolak rework` with a self-contained brief-only handover. The chain works by hand; what the map must still remove is the manual steps (reader closing early = fixed; identity by name = WA-04; spawn without a tap = WA-02/WA-12; media = WA-03/04).
- Pairing lesson: windows live ~3.5 min; random codes die with them; use the fixed code + `link --windows 0` (no deadline) + push the code to the phone + Monitor the log. Never connect a second process to the account.

**Facts checked**
- Cache holds the last 7 days for all three rooms (73 / 139 / 343 rows on 2026-09-11). `watch add/remove` exists in the CLI. The store keeps DMs but `read` matches groups only. Rows carry no quoted-message id, no mention ids, no media bytes (`[image] caption` only). `updateMediaMessage` and `refreshMediaConn` sit on the DENY list.
- `claude` CLI: `-p` headless · `--name` · `--session-id <uuid>` · `--resume <id>` · `--model` · `--effort` · `--permission-mode dontAsk` · `--allowedTools` · `--output-format json` · `remote-control` server (phone → laptop sessions).
- Session-to-session messaging inside the desktop app exists but only from an OPEN session, so it cannot be the always-on path.

## Built 2026-09-14 (goal: working tomorrow)

- Daemon `E:\Dev\scripts\WaRead\wa-watch.js` (run · dry-run · status · check-login · spawn-test · sessions · adhoc-week) + `lib/watcher/{config,filter,registry,judge,handover,spawn,actions}.js` + `watcher.config.json` + `judge/` (cwd for judge calls, allowlist) + `install-logon-task.ps1` (Task Scheduler `WaRead Watcher`, at logon, restart every minute).
- Child mode DEFAULT = headless (proven). Remote Control console child started but sat on a terminal prompt with no transcript (2026-09-14 00:11); debug with the screen visible → new ticket WA-13.
- Two more reader bugs found and fixed while building: credential file truncated by exit-during-write (`lib/auth.js`), and the spawn command line mangled by Node''s quoting (`windowsVerbatimArguments`).

### WA-13 · task · open
type: task (HITL) · blocked by: none
**Question**: Make the Remote Control child work: a minimized console running `claude --remote-control` starts but never runs its first turn (debug log ends after the terminal-capability probe). Reproduce with miya watching the window; likely a trust/consent prompt or a TTY probe. Until then children are headless (`child.mode`).
**Resolution**: _pending_

## Not yet specified

- How the judge session's transcript is bounded over a day (reset at midnight? summarise-and-fork? cost per resume as the day grows).
- How the Baseline child tracks ticket add/remove during a Mon/Wed release day, and how the judge tells "baseline chatter" from a new issue in the Release room.
- The judge prompt wording itself (built from RULES.md) and how a verdict is returned to the daemon (JSON shape).
- What the child does when the message carries no ticket number and no permohonan id (pure "Hi dev, <screen> error") — scaffold an ADHOC with what urusan name?
- Whether the media download can reach history-synced messages (keys may be stale) or only live ones.
- Perak office codes for the PERAK PLP room, if mentions alone prove too narrow.

## Out of scope

- Live auto-start as a hardened Windows service, error alerting, restart policy → next map, after the dry run is reviewed.
- Any write to WhatsApp (send, react, read-mark, presence). Permanent.
- Reading casual groups. Permanent.
- Perak office-code triggers (decided: mentions only in PERAK PLP).
- Pop-up / toast notifications (decided: none).
- Feeding the adhoc list into PymTime (decided: a text file).

## Tickets

### WA-01 · research · CLOSED 2026-09-13
type: research (AFK) · blocked by: none
**Question**: Can `claude remote-control` let miya open, from his phone, a session that the daemon started headless on the laptop (same session id / name)? If not, what is the nearest path?
**Resolution**: **No.** A `-p` (headless) session has no attach path for Remote Control; the three start methods are server mode `claude remote-control`, interactive `claude --remote-control [name]`, or `/remote-control` inside a session (docs: code.claude.com/docs/en/remote-control). **Nearest path**: the daemon spawns each child as `claude --remote-control "<name>" --session-id <uuid> --model … --effort xhigh "<prompt>"` — an interactive process that registers with claude.ai at once and is reachable from the phone. Alternative: a logon-started `claude remote-control --spawn=worktree` server (default capacity 32 concurrent). Limits: needs a full claude.ai login (Pro/Max/Team), not an API key; server mode exits after ~10 min of network outage, interactive mode retries forever; a stopped server's sessions stay resumable ~4 h. Consequence for the design: children are interactive `--remote-control` processes, not `-p`; the judge stays `-p`.

### WA-02 · research · CLOSED 2026-09-13 (login re-verified 2026-09-14: `check-login` → OK, judge calls run at ~$0.03 per resume)
type: research (AFK) · blocked by: none
**Question**: Headless session mechanics for the daemon (create, name, resume many times, JSON verdict, caching, dontAsk + allowlist).
**Resolution**: `--session-id <uuid>` pins the id at creation; `claude -p --resume <uuid> "<text>"` restores the full history and continues it (docs: /sessions, /headless). `-p` sessions are **excluded from the `--resume` picker and from `--continue`**, resumable only by id; the desktop app keeps its own session list. `--output-format json` returns `result`, `session_id`, `total_cost_usd`, `usage`, `permission_denials` (observed live). `dontAsk` **refuses** a non-allowlisted call, never hangs; allowlist syntax `--allowedTools "Read,Glob,Grep,Bash(node *),mcp__postgres-mlit-pg__*"` (MCP wildcard only after a literal `mcp__<server>__` prefix; a bare `*` is silently ignored). Resume re-sends the whole transcript and reads the cache; 1-hour TTL applies on a subscription. **Two blockers found**: (1) `--bare` needs an API key, so the daemon runs WITHOUT `--bare`; (2) the standalone `claude` CLI's login on this laptop is **expired (401)** — miya must run `claude login` once (→ WA-12). A `--session-id` is reserved on disk even when the call fails: always mint a fresh uuid per attempt.

### WA-03 · research · CLOSED 2026-09-13
type: research (AFK) · blocked by: none
**Question**: Read-only media download in Baileys 7.0.0-rc.
**Resolution**: **Yes, pure read.** `downloadMediaMessage` / `downloadContentFromMessage` are module exports (not socket methods), do a plain HTTPS GET to the CDN plus local AES decrypt, and touch the socket ONLY if the caller passes `ctx.reuploadRequest` on a 404/410 — so never pass it; `updateMediaMessage` and `refreshMediaConn` stay DENIED (`node_modules\@whiskeysockets\baileys\lib\Utils\messages.js:829-848`, `messages-media.js:416-463`). ViewOnce unwraps automatically. **Constraint**: `lib/store.js` drops `mediaKey`/`url`/`directPath` when it reduces a message to text, so media must be downloaded **at receipt time** inside `messages.upsert`, not later; CDN links expire (404/410). History-synced media may already be stale: catch and skip, never re-upload.

### WA-11 · research · CLOSED 2026-09-13
type: research (AFK) · blocked by: none
**Question**: 🚨 Offline delivery gap: `sync` received 0 new messages and the store held nothing after the link moment (2026-09-10 18:59). Does WhatsApp replay messages sent while the companion was offline?
**Resolution**: **Yes, it replays — the reader was closing too early.** Live probe 2026-09-13: the server starts replaying the offline backlog ~30 s after the socket opens, in batches of 100, and raises `receivedPendingNotifications` when done (Baileys `socket.js:805-841`); 1,186 messages covering 2.5 days arrived within ~85 s. WaRead's `settle()` treated 4 s of silence as "done" and closed at ~6 s, so every `sync`/`read` since the link saw nothing. **Fixed** in `E:\Dev\scripts\WaRead\wa-read.js` (`settle` now waits for the backlog flag, up to 240 s, before the quiet rule applies; selftest green; committed). **Three facts that shape the daemon**: (1) each offline message is replayed **once** — the receiving process acks it, so whichever reader connects first consumes it; my text-free diagnostic probe consumed the 2-day backlog before the fix, and the Friday 21:16 message miya asked about was lost to the store (slip `unsafe-diagnostic`) → rule: **exactly one connecting process, and every process that connects must persist what it receives**; (2) ~5% of replayed messages (57/1,186) were undecryptable (`stub=2`, pre-key/session errors) and are gone for this device → the watcher must tolerate gaps, never assume completeness; (3) on-demand history (`fetchMessageHistory`) only returns messages OLDER than a message the phone can find, so a synthetic anchor returns nothing — lost recent messages are recoverable only by re-linking (the phone re-pushes recent history of every chat). Catch-up from the cache is therefore real for downtime, as long as the daemon is the only reader.

### WA-12 · task · CLOSED 2026-09-14 — `node wa-watch.js check-login` → `login OK`; the 2026-09-13 401 came from a probe run with `--bare`
type: task (HITL) · blocked by: none
**Question**: miya runs `claude login` once in a terminal so the standalone CLI (which the daemon will drive) has a valid claude.ai login; verify with `claude -p "Reply OK" --model sonnet --output-format json` returning `is_error:false`. Record the expiry behaviour in SETUP.md.
**Resolution**: _pending_

### WA-04 · task · CLOSED 2026-09-14 — built: rows keep `quotedId` / `mentions` / `media` (`lib/text.js meta()`, `lib/store.js`), `resolveChat()` by phone / LID / group, `lib/connect.js` always-on connection with reconnect + media download at receipt (`lib/media.js`, pure read, no reupload), `lib/auth.js` credential guard
type: task (AFK) · blocked by: WA-03
**Question**: Extend WaRead: (a) `read` and the stream can target a DM by contact (Alex), (b) rows keep `quotedId` + `mentionedJids` + media refs, (c) `watch --stream` prints one JSON line per new message in watched chats, (d) `daemon` mode with reconnect + logon start, (e) read-only media download into a target folder. Selftest extended; allowlist wall unchanged except what WA-03 proves is a pure read.
**Resolution**: _pending_

### WA-05 · task · CLOSED 2026-09-13 — `domain/whatsapp/RULES.md` v1.0 written; inlined into the judge's first prompt each day
type: task (AFK) · blocked by: none
**Question**: Write `domain/whatsapp/RULES.md` v1: the judge-readable routing table from Decisions so far (room → gate → hints → meaning → skill to load: ADHOC scaffold / `quest resume` / `release-mlk-plp` / `list-redmine` → action: spawn / send-into / skip; session naming; env-label heuristics; name spellings; Alex rules). One table per room, one for Alex, one for Baseline days.
**Resolution**: _pending_

### WA-06 · prototype · CLOSED 2026-09-14 — `node wa-watch.js dry-run --since 7d --judge stub` (542 msgs → 78 candidates → 11 fire / 11 follow-up / 7 baseline / 2 hold / 47 skip) and `--since 3d --judge claude` (8 candidates, sane reasons, Alex's Friday ask judged; rule sharpened so a closed-then-rework ticket fires). Review with miya = WA-09
type: prototype (HITL) · blocked by: WA-02, WA-04, WA-05
**Question**: The dry run itself: daemon `--dry-run --since <7 days>` replays the cache through the loose filter and the single resumable judge session, prints the "would have fired" rows, and writes nothing else. miya reviews misses and false alarms.
**Resolution**: _pending_

### WA-07 · task · PARTIAL 2026-09-14 — allowlist written (`judge/allowlist.txt`), a headless child boots MemoryCore under dontAsk; full quest-to-brief audit on a real ticket still to run (first live fire will show refusals in the child log)
type: task (AFK) · blocked by: WA-02
**Question**: Allowlist audit for unattended children: run the ADHOC scaffold + quest Phase 0 to brief headless in `dontAsk` on one past Melaka ticket and one Perak ticket, capture every refused tool call, build the allowlist until a clean run writes the Task folder, the `active.txt` block, the ADHOC-REGISTER row and the quest md with zero prompts. Document the list in SETUP.md.
**Resolution**: _pending_

### WA-08 · task · CLOSED 2026-09-14 — `regenerateAdhocWeek()` in `lib/watcher/actions.js`, `node wa-watch.js adhoc-week`, regenerated after every fire/follow-up and every 30 min
type: task (AFK) · blocked by: none
**Question**: `adhoc-week.txt` regenerator: reads `quest/active.txt` (+ archive) ADHOC blocks born via the watcher, writes `1. Tasks\Melaka\adhoc-week.txt` in miya's format, overwrites weekly, retention `regenerate`, declared in the feature README.
**Resolution**: _pending_

### WA-09 · grilling · open
type: grilling (HITL) · blocked by: WA-06
**Question**: Review the dry-run rows with miya: which fires were wrong, which real issues were missed, how the per-issue grouping held up on overlapping conversations; tune RULES.md; decide whether the map's destination is reached.
**Resolution**: _pending_

### WA-10 · task · CLOSED 2026-09-14 — `domain/whatsapp/SETUP.md` (prerequisites · install · link · proof table · logon task · file map · failure modes)
type: task (AFK) · blocked by: WA-06, WA-07
**Question**: `domain/whatsapp/SETUP.md`: complete portable install for another laptop (Node version, WaRead clone + link flow, logon task for the daemon, allowlist file, paths, claude CLI flags used, how to verify read-only, how to unlink).
**Resolution**: _pending_
