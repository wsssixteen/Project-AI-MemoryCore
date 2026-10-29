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
| 1 | Task folder | `1. Tasks\<State>\<N+1>. AH - <URUSAN> - <desc>` with `0. Brief\` (brief.txt = BA verbatim + screenshots), `1. Simulate\`, `2. Fix\` | PowerShell `New-Item`; every file みや downloaded (the `@...\Desktop\...` / `Downloads` path in his message) is **MOVED** into `0. Brief\` with `Move-Item`, never copied — audit fails if a same-named file is still on Desktop/Downloads. A photo or video he pastes into chat (`[Image: source: <temp path>]`) is moved the same way (2026-10-19 per みや) |
| 2 | Test data | qa_doc `## Test data` — Task folder v13 (2026-09-30): notes txt + `1. Simulate\` RETIRED, new folders use `1. Brief\` (legacy `0. Brief\` accepted); read/write via `lib/task-folder.js` | `node quest/notes.js --qa <ADHOC-ID> --env <ENV> --urusan <X> --id "<permohonan or No Resit ...>" --user "<login>" --reset` (never hand-written) |
| 3 | active.txt block | `quest/active.txt` (main checkout) — keys `qa phase status ticket_type=adhoc env urusan quest_start local_test_confirmed adhoc_register_row qa_doc task_folder issue_one_liner branch title` (`branch=none-until-ticket` is fine) | `node quest/active-cli.js start <ADHOC-ID> ...` or append |
| 4 | Register row | `etanah-knowledge/<state>/ADHOC-REGISTER.md` next free `A#` — conclusion carries `file:line` / `table.column`; Status cell starts `OPEN` / `ANSWERED` / `OWNED-ELSEWHERE` / `LATENT` / `TICKETED` / `RESOLVED` | append |
| 5 | qa_doc | `projects/coding-projects/active/<ADHOC-ID>/<ADHOC-ID>.md` — opens with `## Issue Summary` (Title · Symptom · Screen · Verdict) + `## Match Keys` (permohonan · aplikasi · warta · lesen/resit/hakmilik), then `## 0. Resume Point` (mandatory while status is hold/blocked/delegated — expansion-protocol §Step 2b rows) · Status · Env · evidence SELECTs · mechanism · analog · `## Next-Steps Checklist` | Write to scratchpad → copy (projects/ is main-checkout only) |
| 6 | Bug awareness (when the adhoc finds a bug with NO ticket yet) | `etanah-knowledge/<state>/LATENT-BUGS.md` row `L<next>` + Sweep-log row (a live bug a ticket already owns goes in that ticket's qa_doc instead); if a BUG-BESTIARY pattern covers the family, add a pointer line there | append, then `node domain/bug-db/build-index.js --state <key>` |

## Adhoc title (ProTime) — the ONE rule (v2, 2026-10-14 per みや; read from the 121 adhoc entries he keyed in ProTime, 2026-07-13 to 2026-10-12)
Every adhoc gets a **title**: the short line みや would type in ProTime himself. The `protime` skill and the 23:00 run of `domain/protime-plan` WRITE it into his ProTime, so it must read as his.

**The line = `<STATE> (<ENV>) - <title>`** (his format, given 2026-10-29: "MLK (PROD/Internal) - <very short description/keyword>"; it replaces the env-first form of 2026-10-14). Stored `title=` has no env or state; `protimeLine` in `domain/protime-plan/protime-plan.js` adds both from the block's `env=` and `state=`, and rewrites an older env-first title state first. STATE = `MLK` · `TRG` · `PNG` · `PRK` · `SGR` · `KDH` · `WP`, always written first. ENV = `PROD`, or `Internal` for every environment that is not PROD (staging, MLIT / internal, training: his words "Internal is for all environments ... whatever that is not PROD").

Three line shapes. The first that fits wins:

| Case | Line | His examples |
|---|---|---|
| Work on a ticket that is not his own, or a user question on his ticket | `<number> - <action>` · no env, no state | `246923 - Review & deploy` · `268173 - Assist debug` · `282275 - Assist Hasil` · `281650 - Clarify to user` |
| A BA asked for data, a script or a check | `Assist BA - <what>` · no env, no state | `Assist BA - Retrieve Data PRBB Permit & Tugasan Semua Daerah` · `Assist BA - Query to patch Tarikh Tamat permit` |
| His own task, not about a screen or an environment (setup, training, documentation, Redmine updates, a release). Reading code to answer a question about a system is NOT this shape: it keeps env and state | plain action line · no env, no state | `Setup clone for Penang project` · `Set up GitLab` · `Update Redmine details (Root Cause, Solutions, etc) for tickets ...` · `Baseline Pelupusan 1.8.1` |
| Anything else | `<STATE> (<ENV>) - <title>` | `MLK (PROD) - Missing Tujuan in Borang 4Ae` · `PNG (Internal) - Check SPOC service data save from Awam` |

The title:
- Says what the user sees, not the mechanism. Mine `PLP dashboard ralat Invalid path TestGis` → his `MLK internal server issue (infra migration)`. Mine `PRBB Ganti Hari bayaran royalti` → his `PRBB cannot proceed due to previous fees`.
- Ends on, or carries, a plain English problem word: `issue` · `missing` · `error` · `page error` · `cannot proceed` · `wrong`. Mine `AWAM slip permohonan gagal jana` → his `AWAM - Slip permohonan page error`; mine `... tandatangan pecah` → his `... tandatangan issue`. A Malay phrase only when the screen itself says it: `tak papar`, `tiada dalam senarai`, `kosong`.
- An ask opens with the verb: `Check ...` · `Patch ...` · `Verify ...` · `Retrieve ...` · `Create ...`. A check he did opens or ends with `check`: `Keluasan issue check`, `Missing Jabatan Teknikal check`.
- Names the urusan first when there is one (`PRBB`, `MLPS`, `PPTPB`), then the screen or form as the screen names it (`Borang 4Ae`, `surat keputusan`, `laporan tanah`, `Kuantiti Disyorkan`).
- Very short: a description or keyword, 3 to 8 words, at most 60 characters (2026-10-29: "very short description/keyword"). No permohonan id, no tugasan kod alone, no class, method or exception name, no person name, no office name (`PDT Jasin`), no regulation number (`Peraturan 11(B)`). `&` is written as `&`.
- Keeps the words the screen or the BA used for the problem when they are short: `tak papar`, `kosong`, `cannot proceed`. Mine `MLPS Borang 4Ae cop PDT Jasin missing` → his `MLPS Borang 4Ae cop tak papar`; mine `PRBB Maklumat Siasatan No Lot & Luas missing` → his `PRBB lot luas laporan tanah kosong`.
- Sentence case as he types it: first word capital, urusan and form names as written on screen.
- A deploy for a ticket (staging, internal, common version change) is `<number> - Assist <what>`, never `Deploy ...`: the work is the merge checks plus the deploy (2026-10-28 per みや). `286315 - Assist staging deployment` · `286654 - Assist common testing on internal`.
- Same adhoc on a later day (a follow-up): the new line never repeats or near-repeats the earlier day's line. Paraphrase it by what was done that day (2026-10-22 per みや). Earlier `Assist BA - Retrieve ID Permohonan & No Permit Pelupusan` → follow-up `Assist BA - Prepare script to filter by eTanah 2.0`.

**Banned**: `PROD - TRG - ...` (my old form) · a line with no state · a Malay failure verb the screen does not show (`ralat buka`, `gagal jana`, `pecah`, `fail mati`) · the mechanism as the title (`NPE`, `NonUniqueResult`, `Invalid path TestGis`) · `Answer user questions` (his word is `Clarify to user`).

Lives in 3 places: block `title=` · qa_doc `- Title : ...` (first line of ## Issue Summary) · the reply (first line, `Title: ...`). Audit FAILs if it is missing or too long. The day's titles on ask ("adhoc titles", "protime titles", "tajuk protime") → the `adhoc-titles` skill (`node lib/adhoc-titles.js`). Tested: `domain/protime-plan/naming-cases.json` (his real lines) via `domain/protime-plan/naming.eval.md`.

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
| 1 | Investigate (knowledge, error store, DB, code). Read only. **Plan with the FIX LADDER from the start** (miya 2026-10-22): user side → data patch → code fix → permanent fix; each rung is CHECKED before it is offered (user side: the screen's conditions for this record · patch: the code's own read on the after-state + sweep · code: analog + Build-match · permanent: every caller), and each rung ruled out is shown with its reason. The adhoc paste detector injects the ladder; the Stop check is the backstop. **A ralat adhoc pulls EVERY error-store row for the user's login from the task's start to now, not only the ID Rujukan on the photo**, and names each distinct error in the brief before any cause is called. (ADHOC-MLMS-2026-1: the brief named the NPE from one ID Rujukan; a second error on Hantar 3 minutes later sat in the same table until miya asked "what if it fails".) **Before any code is read**: `git fetch` + branch + behind-count in the state's work clone, and one line `Build-match: PROD <Module Version>/<Branch Name> (screen footer or error-store Build Time) = local <pom version>/<branch> · behind <n>` (quest Git-state row, `.claude/skills/quest/SKILL.md` §Git-state). **Run the quest Phase-0 subset** that fits an adhoc: Git-state · ADHOC-REGISTER · every attachment · knowledge Always tier · LIVE task state · working analog · Predicate Diagram · Rubric (e) Falsifier and (f) Confidence. Skip only BPMN scope (unless flow-routed), Rubric candidates and Phase 1/2 closure. **An analog record counts only when it matches on every condition field the screen reads** (mode, status, jenis, flags such as `kwsnAsal`); show that compare before citing it. **A step the BA is told to click or fill** is traced UI → bean → DB for THIS record (`disabled=` / `rendered=` on the field, the flag it reads, the flag's value here and in the analog) and written as a `User-step:` line; a DISABLED step is never sent. **"How sure are you"** is answered with a `## Confidence table` (each unchecked row caps the %: screen conditions 50 · this record's flag values 50 · analog compared 60 · build-match 70 · falsifier 80 · live test needed for 90+). The Stop half of `domain/adhoc-brief-first/` blocks a brief without the `User-step:` lines and a bare % to "how sure". (ADHOC-MLMS-2026-1: "Tambah Kawasan, isi luas" was sent at 85%; the luas field is disabled for MLMS when `kwsnAsal=false`, `plpMaklumatPlotForm.xhtml:166`, and the analog had `kwsnAsal=true`; the workaround failed and the data needed a patch.) | main thread |
| 2 | **END THE TURN with the brief**: `Title:` line, the finding, the evidence with its SELECTs, then **ONE picture of the finding** (`explain-diagram` skill, rendered by `node lib/diagram-render.js`, Read and looked at, sent with `SendUserFile`; written in the BA's words so it can go with the reply; a round with nothing to draw writes `Diagram: none (<reason>)`), then **`## Reply to BA` with two versions, Short then Full** (Pena profile `whatsapp-dev` + module `plain`; a round with nothing for the BA writes `BA reply: none (<reason>)`), then Next steps. Every root cause found ends with both, unasked (2026-10-28 per みや, ADHOC-MCL-2026-1). The Stop half of `domain/adhoc-brief-first/` blocks a brief without them, also when the save agent was started in the same turn with no marker line. Close it with the line `Saving in the background next: <ADHOC-ID>`. Nothing is saved and no agent is started before this reply. A text written in the middle of a turn is not always shown or recorded; the closing reply is. | main thread |
| 3 | The stop check sees that line and asks for the save. Start ONE background agent (`Agent`, `model: sonnet`, `run_in_background: true`). Its prompt opens with the line `[skip-brief-first: background save agent]` and carries the ADHOC id, the title, the env, the Task folder name, every file to MOVE, the register row text and the full quest doc text, and tells it to run "Each round" below until the audit is green. Then end with ONE line: `save started in the background for <ADHOC-ID>`. | background |
| 4 | When the agent reports, check its audit line against disk (`node lib/adhoc-save-audit.js <ADHOC-ID>`) and give みや ONE line: `adhoc saved → <ADHOC-ID>: audit N/N PASS`. | main thread |

## Adhoc route — how every brief ends (2026-10-29 per みや, ADHOC-MCL-2026-2; logic audited by Fable 5.1)

Every brief carries ONE line just before `## Reply to BA`: `Adhoc route: <ROUTE> — <evidence>`. The route comes from the FIX LADDER rung that passed, never from the BA's words. The Reply to BA (Short and Full) ends with the matching ask.

| Route | Pick it when | Ask at the end of the Reply to BA |
|---|---|---|
| `ANSWER` | The BA asked a question; the data or the behaviour is explained and nothing is broken (also "the fix exists, it waits for deploy") | none |
| `USER-STEP` | Rung 1 passes: `User-step:` ENABLED, traced for this record | the steps |
| `PATCH` | Rung 2: the data is wrong, the code is right, `After-state:` checked | PROD: "Mohon TSO buka tiket patch data". Other envs: we patch it ourselves |
| `ALTER` | The permohonan sits on the wrong tugasan or its flow ended; ALTER-TICKET-PLAYBOOK row A4 says Alter Flow or Initiate→Alter | PROD: "Mohon TSO buka tiket alter ke tugasan <X>". Other envs: we alter it ourselves |
| `CODE-FIX` | Rungs 3/4: the code is wrong (our own regression included) and no patch shape exists | "Mohon TSO buka tiket untuk pembetulan kod", on every env |
| `OWNED-ELSEWHERE` | Another module, team or infra owns it. A module boundary needs the `Input check:` line clean; infra needs the error line | name the owner |
| `CR` | The BA reported it as a bug, but the screen does what the requirement says | "Mohon BA buka tiket CR" |

- **Suffix `+ CODE-FIX`** goes after `PATCH` or `ALTER` when the code keeps making new bad records. Show the sweep count. Example: `Adhoc route: PATCH + CODE-FIX — 1 permit patched, 98 PRBB permits share the empty unit`.
- **Mid-investigation round**: `Adhoc route: none (<reason>)`.
- **Ticket asked** (PATCH/ALTER on PROD, CODE-FIX, CR): set block `status=hold` and `issue_one_liner` to say "waiting TSO ticket". Promote it when the number arrives (section "Ticket arrives"). Archive hold only when miya asks for it (step 1c).
- **Same line in the qa_doc**: `- Route : <ROUTE> — <evidence>` under `## Issue Summary`. The audit checks it for adhocs opened from 2026-10-30 on.
- **Quest tickets** emit the same names at quest Phase 0 step 6f.
- **Gate**: the Stop half of `domain/adhoc-brief-first/` blocks a brief without the line.
- **Banned**: a route picked from the BA's wording · a ticket ask on a non-PROD patch or alter we can run ourselves · `CODE-FIX` without saying why no patch shape exists.

- Anything else that can wait runs the same way, AFTER the brief and in the background: moving his files, memory notes, register and knowledge edits, a slip row, a skill edit, a commit.
- No agent tool in the session: after the brief the save-set may be written on the main thread.
- **Gate**: `domain/adhoc-brief-first/`. Before the brief it BLOCKS a save-set write and the start of the save agent (PreToolUse). At the end of the turn it asks for the save agent when the brief carries the `Saving in the background next:` line (stop bundle). Evals: `node domain/adhoc-brief-first/adhoc-brief-first.eval.js` · `node domain/adhoc-brief-first/eval.js`. After-the-fact check of a session: `node lib/adhoc-brief-first.js --latest`.
- **Banned**: a save-set write (Task folder, `active-cli.js start` / `update`, register row, quest doc, `notes.js`, the audit) or the start of the save agent before the brief · a one-line "now saving" note counted as the brief · holding the brief until the audit is green · the `skip-brief-first` line anywhere except the save agent's prompt.

## Each round
1. Write or update every part the new finding touches. A status change (approved / ticketed / answered) updates BOTH the block `status=`/`issue_one_liner=` AND the register Status cell in the same round.
1b. **Closing round** (the block status leaves active / hold / blocked / delegated: answered, resolved, owned elsewhere, ticketed): run `node quest/archive-quest.js <ADHOC-ID>` in the same round. It moves the Task folder to `Archive\`, DELETES the videos in it, moves the block to `active-archive.txt` and the project folder to `archive/`. No ask first (みや 2026-10-06). An adhoc still waiting on someone stays open and is not archived. **A block with `archive_hold=` is never archived** (step 1c): archive-quest refuses it; leave it and say so.
1c. **Keep open (archive hold, 2026-10-15 per みや)**: when an adhoc may get its Redmine ticket later than usual, or みや says "don't archive this" / "keep it open" / "put an alert", set the hold in the same round: `node domain/archive-hold/archive-hold.js set <ADHOC-ID> --reason "<why>"`. Every archive path then refuses it (archive-quest, delegate-quest, active-cli archive, active-trim, adhoc-lifecycle archive and sweep, save-quest Phase 2). `adhoc-lifecycle promote` releases it when the ticket arrives; otherwise `archive-hold.js clear <ADHOC-ID>`. All holds: `archive-hold.js list`. Detail: `domain/archive-hold/README.md`.
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
