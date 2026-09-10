---
name: project_wa_read
description: "WaRead — read-only WhatsApp group reader (linked device, Baileys 6.7.24) at E:\\Dev\\scripts\\WaRead; /whatsapp skill; link state; why the desktop-app path is banned"
metadata: 
  node_type: memory
  type: project
  originSessionId: 73387deb-cd38-48d9-99c3-6231a2e51b8d
  modified: 2026-09-10T08:03:34.700Z
---

**WaRead** (built 2026-09-10) = the ONLY path for reading みや's WhatsApp. Repo `E:\Dev\scripts\WaRead` (local git, no remote yet). `node E:\Dev\scripts\WaRead\wa-read.js read "<group>" --limit 20` · `groups` · `sync` · `status` · `link --phone 60…` · `unlink` · `_selftest.js` (32 checks). Skill = [[whatsapp]] (`.claude/skills/whatsapp/SKILL.md`, eval `domain/whatsapp/eval.js`, 20 checks).

How it is read-only: `lib/readonly.js` hands the program an ALLOWLIST view of the Baileys socket (ev · groupFetchAllParticipating · groupMetadata · fetchMessageHistory · requestPairingCode · end) and poisons every other method on the real socket (sendMessage, readMessages, sendPresenceUpdate, chatModify, logout, group*, …) so they throw. `markOnlineOnConnect:false`. Library still sends delivery acks + an "unavailable" presence by itself (invisible as activity). Baileys = unofficial client → small account-flag risk, keep to reading.

Link state: NOT LINKED as of 2026-09-10 evening — needs his phone number (country code, digits) for the pairing-code flow (`link --phone` prints XXXX-XXXX; he types it under Linked devices → Link with phone number instead; device shows as "Chrome (Ubuntu)"). Auth lives in `%USERPROFILE%\.wa-read\auth` (never in a repo); message cache `%USERPROFILE%\.wa-read\messages.jsonl`. History: the phone pushes recent history on link; `read` calls `fetchMessageHistory` for older rows when the store is thinner than `--limit`.

**Why:** 2026-09-10 the computer-use path on the WhatsApp desktop app needed a grant each session, marked a group read when opened, and the app stopped taking clicks/keys mid-task (DBeaver kept jumping to front); the Tech Team group was never read that day. Desktop app / WhatsApp Web / Chrome are BANNED as reading paths now (see [[feedback_whatsapp_read_rules]]).
**How to apply:** any "read/check WhatsApp" ask → invoke the whatsapp skill → run wa-read.js; if not linked, ask for the number first. Minimize the desktop app if it was ever brought forward.
