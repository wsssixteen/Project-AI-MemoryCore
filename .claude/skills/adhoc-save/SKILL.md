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
- **ProTime line = `<ENV> - <title>`** (2026-10-06 per みや: "the format starts with PROD - ..."). Stored `title=` has no env prefix; `lib/adhoc-titles.js` adds it from `env=`. Every title shown to みや for ProTime is shown in that form: `PROD - Load documents from PROD to STAG`. For an ask (not a defect) the title is the plain action.
- Shape: `<URUSAN> <subject keywords> <issue word>` · max 8 words · max 60 chars · no ids, no permohonan, no punctuation.
- The issue word is mandatory (what is wrong: `missing` · `tiada` · `tak papar` · `ralat` · `salah` · `stuck`, or the ask: `alter` · `patch`). A subject-only title is wrong (2026-10-04: `MLPS ulasan SOK laporan tanah` → `MLPS ulasan SOK laporan tanah missing`).
- **His wording (2026-10-13, read from the 121 adhoc entries he keyed in ProTime, 2026-07-13 to 2026-10-12, set beside 23 of my titles; the night run of `domain/protime-plan` now WRITES this title into ProTime, so it must read as his):**
  - Say what the user sees, not the mechanism. Mine `PLP dashboard ralat Invalid path TestGis` → his `MLK internal server issue (infra migration)`. Mine `PRBB Ganti Hari bayaran royalti` → his `PRBB cannot proceed due to previous fees`.
  - The problem word is a plain English one: `issue` · `missing` · `error` · `cannot proceed` · `wrong`. Screen and form names stay as the screen shows them (`Borang 4Ae`, `surat keputusan`, `laporan tanah`). Mine `AWAM slip permohonan gagal jana` → his `AWAM - Slip permohonan page error`; mine `... tandatangan pecah` → his `... tandatangan issue`. His own Malay phrases are fine when the screen says them (`tak papar`, `tiada dalam senarai`).
  - An ask opens with the action: `Check ...` · `Patch ...` · `Verify ...` · `Retrieve ...`. An ask from a BA may be the whole line `Assist BA - <what>` (no env word in front).
  - Work on a ticket that is not his own opens with the number and has no env word: `246923 - Review & deploy` · `268173 - Assist debug` · `274266 - Review & delegate`.
  - **His line format (given 2026-10-14): `<ENV> (<STATE>) - <title>`**, state always written: `Internal (PNG) - Check SPOC service data save from Awam` · `PROD (MLK) - Missing Tujuan in Borang 4Ae`. ENV = PROD · Internal · Staging; STATE = MLK · TRG · PNG · PRK · SGR · KDH · WP. The script adds both (`protimeLine` in `domain/protime-plan/protime-plan.js`); a stored title that already opens with an env word, `Assist BA`, or a ticket number is kept as it is. Banned: `PROD - TRG - ...` (my earlier form, wrong) and a line with no state.
  - A question from a user on his own ticket: `<number> - Clarify to user` (2026-10-14, not "Answer user questions").
  - No tugasan kod alone, no class name, no exception name.
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
| 3 Brief first, save in the background | Investigate, then SHOW the brief in chat (finding, evidence, next steps). Only after the brief is shown, hand the save-set to a background agent (section "Brief first" below). NEVER write a save-set part before the brief (みや 2026-10-01: "focus on answering first then setup"; 2026-10-13: "you must brief me first before saving or anything else that should be done in the background"). |
| 4 Size gate | Stay in this session when the adhoc is answerable with DB queries + code reads. Hand off when it needs a code fix + build/deploy, a multi-env patch run, a long sweep, or a Workflow/agent fan-out: tell みや in one line, then `spawn_task` with a handover pointing at the qa_doc (the save-set IS the handover). |
| 5 Stay lean | Never re-read a big file already read today; the qa_doc carries each adhoc's state. Persist every round so a compaction loses nothing. |
| 6 End of day | Domain Expansion saves the day: list today's adhocs (`quest_start=<today>` + `ticket_type=adhoc` in active.txt), confirm each audit is green and each status/resume point is current, then the DE ritual. |

ID = `ADHOC-<URUSAN>-<YYYY>-<n>` — next n after grepping `active.txt` + `active-archive.txt`.

## Brief first — the order of every adhoc turn (2026-10-13 per みや, ADHOC-MLPS-2026-4)

| # | Step | Where it runs |
|---|---|---|
| 1 | Investigate (knowledge, error store, DB, code). Read only. | main thread |
| 2 | **END THE TURN with the brief**: `Title:` line, the finding, the evidence with its SELECTs, Next steps. Close it with the line `Saving in the background next: <ADHOC-ID>`. Nothing is saved and no agent is started before this reply. A text written in the middle of a turn is not always shown or recorded; the closing reply is. | main thread |
| 3 | The stop check sees that line and asks for the save. Start ONE background agent (`Agent`, `model: sonnet`, `run_in_background: true`). Its prompt opens with the line `[skip-brief-first: background save agent]` and carries the ADHOC id, the title, the env, the Task folder name, every file to MOVE, the register row text and the full quest doc text, and tells it to run "Each round" below until the audit is green. Then end with ONE line: `save started in the background for <ADHOC-ID>`. | background |
| 4 | When the agent reports, check its audit line against disk (`node lib/adhoc-save-audit.js <ADHOC-ID>`) and give みや ONE line: `adhoc saved → <ADHOC-ID>: audit N/N PASS`. | main thread |

- Anything else that can wait runs the same way, AFTER the brief and in the background: moving his files, memory notes, register and knowledge edits, a slip row, a skill edit, a commit.
- No agent tool in the session: after the brief the save-set may be written on the main thread.
- **Gate**: `domain/adhoc-brief-first/`. Before the brief it BLOCKS a save-set write and the start of the save agent (PreToolUse). At the end of the turn it asks for the save agent when the brief carries the `Saving in the background next:` line (stop bundle). Evals: `node domain/adhoc-brief-first/adhoc-brief-first.eval.js` · `node domain/adhoc-brief-first/eval.js`. After-the-fact check of a session: `node lib/adhoc-brief-first.js --latest`.
- **Banned**: a save-set write (Task folder, `active-cli.js start` / `update`, register row, quest doc, `notes.js`, the audit) or the start of the save agent before the brief · a one-line "now saving" note counted as the brief · holding the brief until the audit is green · the `skip-brief-first` line anywhere except the save agent's prompt.

## Each round
1. Write or update every part the new finding touches. A status change (approved / ticketed / answered) updates BOTH the block `status=`/`issue_one_liner=` AND the register Status cell in the same round.
1b. **Closing round** (the block status leaves active / hold / blocked / delegated: answered, resolved, owned elsewhere, ticketed): run `node quest/archive-quest.js <ADHOC-ID>` in the same round. It moves the Task folder to `Archive\`, DELETES the videos in it, moves the block to `active-archive.txt` and the project folder to `archive/`. No ask first (みや 2026-10-06). An adhoc still waiting on someone stays open and is not archived.
2. Audit: `node lib/adhoc-save-audit.js <ADHOC-ID>` (run from the worktree or main; resolves the main checkout itself).
3. Every FAIL → fix it now → re-run. Loop until `save-set green`. A FAIL caused by a tool (e.g. notes.js naming) → fix the tool too, not just the file.
4. Reply with one line: `adhoc saved → <ADHOC-ID>: audit N/N PASS`, and show the ProTime `Title: ...` line.

## Ticket arrives for the adhoc
`node domain/adhoc-lifecycle/adhoc-lifecycle.js promote --row <A#> --ticket QA-<n>` → start the quest from the qa_doc (no re-Scout) → re-run the audit on the ADHOC id until the block sits in active-archive.txt and the register says `TICKETED`.

## Banned
- Ending an adhoc round with the save-set unwritten or the audit not run. The save comes AFTER the brief (section "Brief first"), never in front of it.
- Hand-writing the notes file · reusing an `A#` another block holds · an open block whose register row says RESOLVED (or the reverse).
- Names / dates / monologue inside Task-folder deliverables (brief.txt is BA verbatim, exempt).
- Copying an object name from a colleague's source (view / table / file / method) without a spelling check — correct an obvious typo in OUR deliverable and name the correction in the reply (2026-09-30, ADHOC-VIEW-2026-1: KL `TKLPREMITTABLEVIEW` carried into Melaka and run on internal).
- Mixing up which env/ticket a hand-off is for — "infra sendoff" on an adhoc means THIS adhoc's scripts for PROD, never another open ticket's patch (same adhoc).

symptom: 2026-09-25 miya: 'Create a skill that you will always invoke to properly save every adhoc findings properly, make sure to always audit each round of save and apply the fixes straight-away'
goal: every adhoc save round ends with all 4 save-set parts present, consistent, and audit-green
goal_signal: adhoc-save-audit exits 0 for the saved ADHOC id in the same turn
goal_signal_regex: adhoc saved → ADHOC-[A-Z0-9-]+: audit (\d+)/\1 PASS
retention: keep

## Memory rules for this workflow (read when this skill fires — added 2026-10-04, additive)

- `.claude/auto-memory/feedback_adhoc_scaffold_delegate.md` — scaffold as a quest, full workflow, ENV from URL host first, ADHOC-TRIAGE, reread once it has a Redmine number
