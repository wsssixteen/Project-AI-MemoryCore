---
goal: the judge reads THIS file inline on every candidate and turns a WhatsApp message into one verdict (fire / follow-up / baseline / hold / skip) that starts the right Claude Code session, or nothing
retention: keep
version: 1.1 (2026-11-10: section 1b, office reports: the <pejabat><daerah> prefix, forwarded = office wording, the BA's own lines outrank it, daerah table, IT / STG words; nothing removed)
---

# WhatsApp watcher — RULES (judge-readable)

Edit this file to change behaviour. The daemon (`E:\Dev\scripts\WaRead\wa-watch.js`) inlines it into the judge's first prompt each day. Decisions come from `MAP.md`.

## 1. Rooms and gates

| Room | State | Script gate (filter 1) | Judge hints |
|---|---|---|---|
| Release Melaka Pelupusan | MLK | every message reaches the judge | `Hi dev`, `PDTJ`, `PDTAG`, `PDTMT` raise confidence that it is an office-reported issue; baseline words (`Planned Release`, `baseline`, `mlk/release/x.y.z`) mean a Baseline day |
| MLK Pelupusan Support | MLK | only a ticket number (6 digits or a Redmine link), "ticket created" / "dah create tiket", or a mention of miya | front line: BA talks to users/TSO here; most messages are NOT for miya |
| PERAK PLP | PRK | only a mention of miya | Perak work; state is PRK |
| Alex (manager) direct chat | ? | every message reaches the judge | a ticket number or link = work handed over; a question about a ticket = a session with that context; anything else = skip |

Mention of miya = a real WhatsApp @mention of his number, or the whole words `Ahmad`, `Ridhwan`, `@Ridhwan`, `@AhmadRidhwanAnuar`, `@Ahmad`.

## 1b. Office reports: the shape, who is speaking, which office (2026-11-10 per miya)

The CANDIDATE block carries two lines for this: `OFFICE:` (office prefix or permohonan id) and `FORWARDED: yes|no`. Earlier messages are marked `[forwarded]`.

| Part of the thread | How it looks | Who is speaking | Weight |
|---|---|---|---|
| The first message | starts with `<pejabat><daerah>`: `PDTMT`, `PDTJ`, `PDTAG`, `PTG…`; usually FORWARDED: yes | the office user or the TSO, relayed into the room | background: the first wording of the problem |
| The next several messages | FORWARDED: no, minutes after the first | the BA | the real ask. The BA has already checked the issue and is more specific. It OUTRANKS the first message |
| A straight question | short, aimed at the developers; may name the environment | the BA | a question the developers can answer is work |
| Anything else | no question, no id, no ask | anyone | judge it: work only when it asks the developers for something |

| Office prefix | Office | Daerah | 2nd part of a `PTMLK` id |
|---|---|---|---|
| `PTG…` | PTG Melaka (state office) | Melaka | `00` |
| `PDTMT` | PDT Melaka Tengah | Melaka Tengah | `01` |
| `PDTJ` | PDT Jasin | Jasin | `02` |
| `PDTAG` | PDT Alor Gajah | Alor Gajah | `03` |

Codes checked against `ind_pejabat` and `ind_daerah` on Melaka staging, 2026-11-10. Perak: the state comes from the room or a `PTPK/…` id; the 2nd part of the id is the daerah number, its name is not recorded here.

How the judge uses it:
- A forwarded office report and the BA's own lines after it are ONE issue. Fire once. When a session already started for it, each BA line is `follow-up` with the SAME `issueKey`.
- Build `paraphrase`, `urusan`, `keyword` and `env` from the BA's lines when they exist. Where a BA line narrows or corrects the forwarded text, the BA line wins.
- A BA line with no office prefix and no id still belongs to the office report just above it in the room (same topic, minutes apart): take the office, the daerah and the permohonan id from that report.
- `state` and daerah: the `OFFICE:` line first, then the permohonan id, then the room.
- `env` words in a BA line: `IT`, `MLIT`, `internal` = Internal · `STG`, `stg1`, `staging` = Staging · `prod`, `live` = Prod. An office report with no environment word is usually Prod.
- A message that is not a question to the developers: `fire` or `follow-up` only when it hands the developers something to do or to answer (an error with an id, "boleh semak", "kenapa", a request to patch). BA talking to the office, a status line, a thanks, "noted", "ok dah settle" = `skip`. Work-shaped but nothing to act on = `hold`.

## 2. Verdicts

| Verdict | Meaning | What the daemon does |
|---|---|---|
| `fire` | a new work item that deserves its own session now | writes a handover, starts a child session named per section 4 |
| `follow-up` | a message about an issue that already has a session today OR an open quest block | appends a dated paraphrase under `## WhatsApp follow-ups` in that quest doc + the day registry; never a second session |
| `baseline` | the Release room is starting or changing a Baseline (Planned Release, ticket list add/remove) | one `Baseline <date>` child per day; later baseline messages feed it as follow-ups |
| `hold` | looks like work but nothing to act on yet (no ticket, no permohonan id, or unclear) | day registry only; re-judged if a ticket number appears later in the same room |
| `skip` | not work for miya | counted, nothing else |

Rules of thumb for the judge:
- A ticket number from Alex, or in Support with "ticket created", is `fire` unless it is in the OPEN TRACKED TICKETS list (then `follow-up`). Only that list decides "already tracked": a ticket that was worked before but is NOT in the list (closed, then sent back as rework) is a NEW work item = `fire`. Within one day, a ticket that already fired today is a `follow-up` (the registry says so).
- A permohonan id (`PTMLK/…` = Melaka, `PTPK/…` = Perak) plus issue words in Release = `fire` as an ADHOC.
- A message that only thanks, confirms, or chats = `skip`. A question aimed at someone else = `skip`.
- When unsure between `fire` and `hold`, choose `hold`. A missed fire costs minutes; a wrong fire costs a whole session.
- `state`: MLK for Melaka rooms, PRK for PERAK PLP; in Alex's chat derive it from the ticket project, the permohonan prefix, or words like Perak/Melaka; `?` when unknown.
- `env` (Prod / Internal / Staging): from a pasted URL host, words like prod/live/mlit/staging/internal, or a forwarded-from-TSO shape (office report = usually Prod). `?` when unknown.

## 3. Grouping when conversations overlap

Group by ISSUE, never by clock: a reply carries the id of the message it answers; a photo with a caption is ONE message; the same person continuing the same topic within minutes is the same issue; a different ticket number or permohonan id is a different issue. Media that belongs to an issue goes with that issue only.

## 4. Session name

`<MLK|PRK><ticket> - <Urusan if any> - <very short keyword>` — examples `MLK278699 - PT - surat tolak rework`, `PRK278218 - PLMS - hantar ralat`. No ticket: `MLK ADHOC - <urusan or WA> - <keyword>`. Baseline: `Baseline <date>`.

## 5. What a child session does

Boots as Ruri in MemoryCore, retrieves the ticket with `node quest/redmine-sync.js <num>` (or scaffolds an ADHOC), confirms Melaka vs Perak, runs the quest to the BRIEF (issue · solution · story diagram · test scenario) and STOPS. Model Opus 4.8, effort xhigh, permission mode dontAsk with the audited allowlist (`E:\Dev\scripts\WaRead\judge\allowlist.txt`). Media is already downloaded; the handover lists the paths.

## 6. Hard limits

READ ONLY on WhatsApp, always. No sender names or chat wording in any deliverable. Casual groups are never read. One process holds the WhatsApp connection (the daemon); nothing else may connect to the account while it runs.
