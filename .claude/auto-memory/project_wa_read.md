---
name: project_wa_read
description: "WaRead — read-only WhatsApp group reader (linked device, Baileys 6.7.24) at E:\\Dev\\scripts\\WaRead; /whatsapp skill; link state; why the desktop-app path is banned"
metadata: 
  node_type: memory
  type: project
  originSessionId: 73387deb-cd38-48d9-99c3-6231a2e51b8d
  modified: 2026-09-10T11:28:09.864Z
---

**WaRead** (built 2026-09-10) = the ONLY path for reading みや's WhatsApp. Repo `E:\Dev\scripts\WaRead` (local git, no remote yet). `node E:\Dev\scripts\WaRead\wa-read.js read "<group>" --limit 20` · `groups` · `sync` · `status` · `link --phone 60…` · `unlink` · `_selftest.js` (32 checks). Skill = [[whatsapp]] (`.claude/skills/whatsapp/SKILL.md`, eval `domain/whatsapp/eval.js`, 20 checks).

How it is read-only: `lib/readonly.js` hands the program an ALLOWLIST view of the Baileys socket (ev · groupFetchAllParticipating · groupMetadata · fetchMessageHistory · requestPairingCode · end) and poisons every other method on the real socket (sendMessage, readMessages, sendPresenceUpdate, chatModify, logout, group*, …) so they throw. `markOnlineOnConnect:false`. Library still sends delivery acks + an "unavailable" presence by itself (invisible as activity). Baileys = unofficial client → small account-flag risk, keep to reading.

**LINKED 2026-09-10 18:56** as `60186669566:42@s.whatsapp.net` (fixed pairing code `WAREAD26` via `--code`; windows rotate every ~3.5 min because WhatsApp drops an unpaired socket, 428 then 401 on a reused identity → fresh identity per window). Baileys **7.0.0-rc14** (6.7.24 pairing failed). 143 groups known; pinned flag did NOT arrive in the first history sync; chat order = `conversationTimestamp`.

**Watcher design (miya 2026-09-10 evening, NOT BUILT yet)**: goal = detect work messages and auto-start a Claude Code session that runs an ADHOC /quest to the brief and STOPS (Opus 4.8, xhigh effort). Two filters: (1) script, deliberately loose; (2) Ruri judges before any session starts. Groups: **#1 Release Melaka Pelupusan ⏰** · **MLK Pelupusan Support** (front line, BA↔users/TSO) only when a ticket number / "ticket created" / "dah create tiket" / his name or tag appears · **PERAK PLP** only when his name is mentioned/tagged · **Alex** (manager) in any group or DM: questions about tickets → session with that context; tickets passed → session that retrieves the ticket, confirms Melaka or Perak, runs the quest to brief (issue · solution · story diagram) and stops. Message "shape" = the adhoc-paste-detector shape (Urusan:/Tugasan:/Id:/User: labels, or permohonan-id + issue words). Session name format: `<MLK|PRK><ticket> - <Urusan if any> - <very short keyword>`. Casual groups are never read (token discipline). Read-only guarantee holds for sends/read-marks (allowlist wall); library still emits delivery acks + "unavailable" presence.

Link state (history): NOT LINKED as of 2026-09-10 afternoon — needs his phone number (country code, digits) for the pairing-code flow (`link --phone` prints XXXX-XXXX; he types it under Linked devices → Link with phone number instead; device shows as "Chrome (Ubuntu)"). Auth lives in `%USERPROFILE%\.wa-read\auth` (never in a repo); message cache `%USERPROFILE%\.wa-read\messages.jsonl`. History: the phone pushes recent history on link; `read` calls `fetchMessageHistory` for older rows when the store is thinner than `--limit`.

**Why:** 2026-09-10 the computer-use path on the WhatsApp desktop app needed a grant each session, marked a group read when opened, and the app stopped taking clicks/keys mid-task (DBeaver kept jumping to front); the Tech Team group was never read that day. Desktop app / WhatsApp Web / Chrome are BANNED as reading paths now (see [[feedback_whatsapp_read_rules]]).
**How to apply:** any "read/check WhatsApp" ask → invoke the whatsapp skill → run wa-read.js; if not linked, ask for the number first. Minimize the desktop app if it was ever brought forward.
