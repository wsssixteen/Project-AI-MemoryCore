---
name: whatsapp
description: Read みや's WhatsApp groups READ ONLY through the linked-device reader at E:\Dev\scripts\WaRead (wa-read.js) and paraphrase what a group says in third person, no sender names unless asked. Triggers — "/whatsapp", "read whatsapp", "check whatsapp", "what did the group say", "what are the messages in <group>", "unread in <group>", "check the Tech Team group", "DEV Pelupusan group", "paraphrase the group". ANY of these = invoke this skill BEFORE replying. Never open the WhatsApp desktop app or WhatsApp Web for this — the reader is the only path.
---

# /whatsapp — read a group, say what it says, touch nothing

> born via core/forge.js 2026-09-10 · eval: `domain/whatsapp/eval.js` · tool: `E:\Dev\scripts\WaRead` (selftest: `node E:\Dev\scripts\WaRead\_selftest.js`)
> symptom: reading WhatsApp for miya needed a desktop grant each session, marked groups as read, hung on focus flaps, and the paraphrase leaked names and verbatim text
> goal: miya hears what a group says in Ruri's own third-person words, from a read-only path that never touches send or read receipts
> goal_signal: wa-read.js read output quoted into the reply + no sender names in the reply unless asked + WaRead selftest green
> retention: keep

## 0. Hard rules (his words, 2026-09-10)

- **READ ONLY.** The reader has no send, no mark-read, no presence, no group action. Never work around it with the desktop app, WhatsApp Web, computer-use, or Chrome. If the reader is down, say so and stop.
- **Third person, my own words.** "This group says…" / "The other group is asking…". Never quote verbatim, never paste a message.
- **No sender names** unless he asks "who said". Say "someone", "the group", "the person who set it up".
- **Soften, do not spin.** Say what is asked of him plainly, then what it is not (not a scolding, not aimed at him alone). Never invent intent.
- **Links and names of things** (a sheet, a form, a file) are facts, not people: give them when he asks "what form / link".
- One link per reply at most, and never open it.

## 1. Commands (run from anywhere)

List groups:
```bash
node E:\Dev\scripts\WaRead\wa-read.js groups
```
Read the latest of one group (case-insensitive contains match on the group name):
```bash
node E:\Dev\scripts\WaRead\wa-read.js read "Pymsoft - Tech Team" --limit 20
```
Read since a date:
```bash
node E:\Dev\scripts\WaRead\wa-read.js read "DEV Pelupusan" --since 2026-09-10
```
Status (linked? how much is stored):
```bash
node E:\Dev\scripts\WaRead\wa-read.js status
```
Not linked yet → ask him for the phone number with country code, then:
```bash
node E:\Dev\scripts\WaRead\wa-read.js link --phone 60XXXXXXXXX
```
It prints an 8-character pairing code. He types it on the phone: WhatsApp → Linked devices → Link a device → Link with phone number instead. The device shows as "Chrome (Ubuntu)".

## 2. Reply shape

1. One line per group: **`<Group> says`** + two or three short sentences in my words.
2. Then one line on what it means for him (what to do, how urgent, whether it is aimed at him).
3. Times: say the time of the last message ("at 2:01 pm today") when he asked about a time.
4. If a group came back empty: "nothing stored yet for that group, the phone only pushes recent history — try again later" and stop. Never fall back to the desktop app.

## 3. What can go wrong

| Symptom | Meaning | Do |
|---|---|---|
| `not linked` | no `%USERPROFILE%\.wa-read\auth` | ask for the number, run `link` |
| `the phone unlinked this device` | he removed it on the phone | `unlink`, then `link` again after his nod |
| `no group matches` | name typo or not in a group of that name | show the printed list, ask which |
| `nothing stored yet` | history not pushed for that chat | say so, try `sync` later |
| connection closes before open | phone offline / no internet | say so, retry later |
