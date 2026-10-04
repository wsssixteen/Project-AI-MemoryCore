---
name: adhoc-save
description: Save an adhoc's findings as the full 4-part save-set (Task folder · active.txt block · ADHOC-REGISTER row · qa_doc), then AUDIT the round with lib/adhoc-save-audit.js and fix every FAIL before replying. ALWAYS invoke — on adhoc intake, whenever an adhoc finding appears or changes (diagnosis, DB proof, BA reply, approval, ticket raised), and on "save adhoc" / "save this adhoc" / "save the adhoc findings" / "update the adhoc". Not for Redmine tickets (quest-knowledge-save owns those).
---

# adhoc-save — every adhoc round saved, audited, fixed

## When
- Adhoc intake (adhoc-paste-detector fired, or a BA relay with a permohonan-id / hakmilik / No Resit and no owning Redmine #).
- Any turn where an adhoc finding appears or changes: root cause, DB proof, BA reply, boss approval, workaround, ticket number arrives.
- "save adhoc", "save the adhoc findings", "update the adhoc".

## The save-set (all 4, every round)

| # | Part | Home | Written by |
|---|---|---|---|
| 1 | Task folder | `1. Tasks\<State>\<N+1>. AH - <ENV> - <URUSAN> - <desc>` with `0. Brief\` (brief.txt = BA verbatim + screenshots), `1. Simulate\`, `2. Fix\` | PowerShell `New-Item`; every file みや downloaded (the `@...\Desktop\...` / `Downloads` path in his message) is **MOVED** into `0. Brief\` with `Move-Item`, never copied — audit fails if a same-named file is still on Desktop/Downloads |
| 2 | Test data | qa_doc `## Test data` — Task folder v13 (2026-09-30): notes txt + `1. Simulate\` RETIRED, new folders use `1. Brief\` (legacy `0. Brief\` accepted); read/write via `lib/task-folder.js` | `node quest/notes.js --qa <ADHOC-ID> --env <ENV> --urusan <X> --id "<permohonan or No Resit ...>" --user "<login>" --reset` (never hand-written) |
| 3 | active.txt block | `quest/active.txt` (main checkout) — keys `qa phase status ticket_type=adhoc env urusan quest_start local_test_confirmed adhoc_register_row qa_doc task_folder issue_one_liner branch title` (`branch=none-until-ticket` is fine) | `node quest/active-cli.js start <ADHOC-ID> ...` or append |
| 4 | Register row | `etanah-knowledge/<state>/ADHOC-REGISTER.md` next free `A#` — conclusion carries `file:line` / `table.column`; Status cell starts `OPEN` / `ANSWERED` / `OWNED-ELSEWHERE` / `LATENT` / `TICKETED` / `RESOLVED` | append |
| 5 | qa_doc | `projects/coding-projects/active/<ADHOC-ID>/<ADHOC-ID>.md` — opens with `## Issue Summary` (Title · Symptom · Screen · Verdict) + `## Match Keys` (permohonan · aplikasi · warta · lesen/resit/hakmilik), then `## 0. Resume Point` (mandatory while status is hold/blocked/delegated — expansion-protocol §Step 2b rows) · Status · Env · evidence SELECTs · mechanism · analog · `## Next-Steps Checklist` | Write to scratchpad → copy (projects/ is main-checkout only) |
| 6 | Bug awareness (when the adhoc finds a bug with NO ticket yet) | `etanah-knowledge/<state>/LATENT-BUGS.md` row `L<next>` + Sweep-log row (a live bug a ticket already owns goes in that ticket's qa_doc instead); if a BUG-BESTIARY pattern covers the family, add a pointer line there | append, then `node domain/bug-db/build-index.js --state <key>` |

## Adhoc title (ProTime) — 2026-10-01 per みや
Every adhoc gets a **title**: a very short, almost-keyword label みや pastes into ProTime.
- Shape: `<URUSAN> <subject keywords> <issue word>` · max 6 words · max 40 chars · no ids, no permohonan, no env, no punctuation.
- The issue word is mandatory (what is wrong: `missing` · `tiada` · `tak papar` · `ralat` · `salah` · `stuck`, or the ask: `alter` · `patch`). A subject-only title is wrong (2026-10-04: `MLPS ulasan SOK laporan tanah` → `MLPS ulasan SOK laporan tanah missing`).
- Name the thing in a plain word too (`tugasan`, `dokumen`, `ulasan`, `bayaran`); a kod alone does not say what it is. Test: from the title only, "what is wrong with what?" must be answerable (2026-10-04: `PLPS SKM tiada dalam senarai` → `PLPS tugasan SKM tiada dalam inbox`).
- Examples: `PLPS tugasan SKM tiada dalam inbox` · `MLPS ulasan SOK laporan tanah missing`.
- Lives in 3 places: block `title=` · qa_doc `- Title : ...` (first line of ## Issue Summary) · the reply (first line, `Title: ...`).
- Audit FAILs if it is missing or too long.
- みや asks for the day's titles ("adhoc titles", "protime titles", "tajuk protime") → the `adhoc-titles` skill (`node lib/adhoc-titles.js`).

## Daily adhoc session — 2026-10-01 per みや
みや keeps ONE session open all day for adhocs. Many adhocs pass through the same chat, so every message is routed first.

| Step | Rule |
|---|---|
| 1 Route | New message → match it to an adhoc this session already opened (same permohonan / No Permit / BA / screenshot thread). Match → update THAT adhoc. No match → new ADHOC id. Never fold two adhocs into one block. |
| 2 Name it | Open the reply with `Title: <title>` so みや sees which adhoc the answer belongs to (ProTime title doubles as the thread label). |
| 3 Answer first | Answer the ask, THEN write the save-set in the same turn (みや 2026-10-01: "focus on answering first then setup"). |
| 4 Size gate | Stay in this session when the adhoc is answerable with DB queries + code reads. Hand off when it needs a code fix + build/deploy, a multi-env patch run, a long sweep, or a Workflow/agent fan-out: tell みや in one line, then `spawn_task` with a handover pointing at the qa_doc (the save-set IS the handover). |
| 5 Stay lean | Never re-read a big file already read today; the qa_doc carries each adhoc's state. Persist every round so a compaction loses nothing. |
| 6 End of day | Domain Expansion saves the day: list today's adhocs (`quest_start=<today>` + `ticket_type=adhoc` in active.txt), confirm each audit is green and each status/resume point is current, then the DE ritual. |

ID = `ADHOC-<URUSAN>-<YYYY>-<n>` — next n after grepping `active.txt` + `active-archive.txt`.

## Each round
1. Write or update every part the new finding touches. A status change (approved / ticketed / answered) updates BOTH the block `status=`/`issue_one_liner=` AND the register Status cell in the same round.
2. Audit: `node lib/adhoc-save-audit.js <ADHOC-ID>` (run from the worktree or main; resolves the main checkout itself).
3. Every FAIL → fix it now → re-run. Loop until `save-set green`. A FAIL caused by a tool (e.g. notes.js naming) → fix the tool too, not just the file.
4. Reply with one line: `adhoc saved → <ADHOC-ID>: audit N/N PASS`, and show the ProTime `Title: ...` line.

## Ticket arrives for the adhoc
`node domain/adhoc-lifecycle/adhoc-lifecycle.js promote --row <A#> --ticket QA-<n>` → start the quest from the qa_doc (no re-Scout) → re-run the audit on the ADHOC id until the block sits in active-archive.txt and the register says `TICKETED`.

## Banned
- Replying on an adhoc finding with the save-set unwritten or the audit not run this round.
- Hand-writing the notes file · reusing an `A#` another block holds · an open block whose register row says RESOLVED (or the reverse).
- Names / dates / monologue inside Task-folder deliverables (brief.txt is BA verbatim, exempt).
- Copying an object name from a colleague's source (view / table / file / method) without a spelling check — correct an obvious typo in OUR deliverable and name the correction in the reply (2026-09-30, ADHOC-VIEW-2026-1: KL `TKLPREMITTABLEVIEW` carried into Melaka and run on internal).
- Mixing up which env/ticket a hand-off is for — "infra sendoff" on an adhoc means THIS adhoc's scripts for PROD, never another open ticket's patch (same adhoc).

symptom: 2026-09-25 miya: 'Create a skill that you will always invoke to properly save every adhoc findings properly, make sure to always audit each round of save and apply the fixes straight-away'
goal: every adhoc save round ends with all 4 save-set parts present, consistent, and audit-green
goal_signal: adhoc-save-audit exits 0 for the saved ADHOC id in the same turn
goal_signal_regex: adhoc saved → ADHOC-[A-Z0-9-]+: audit (\d+)/\1 PASS
retention: keep
