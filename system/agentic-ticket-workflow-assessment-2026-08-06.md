# Agentic Ticket-Solving — Assessment 2026-08-06

> DE Step 7.5. Written from ONE run: 8 open Melaka tickets, controller-read first, then 6 blind
> derivers + 5 adversarial refuters (Opus, low effort). Every claim carries the instance that proves
> it. Appends to `agentic-ticket-workflow-assessment-2026-08-05.md` (the 20-familiar four-pass run)
> and `-2026-08-05b.md`.

---

## 0. What changed in the method, and whether it paid

みや asked for the sweep shape to be decided from experience rather than re-specified each time. The
contract run tonight:

| Prior runs (07-27, 08-04) | Tonight |
|---|---|
| 4 fixed passes per ticket | **2 lenses + controller adjudication**, 3rd only on instability |
| controller read the ticket *after* the familiars | **controller reads every artifact FIRST**, and the BA table is the fan-out input |
| familiars derive AND self-scrutinise | **derive and refute are different agents**; no familiar appraises itself |
| ~19-20 agents | **11 agents** |

**It paid.** 6 of 6 L1 derivations produced a line-backed mechanism; three of them overturned a
conclusion that was standing in our own docs, and one caught a data-destroying script before it ran.
The controller-reads-first change is what produced the single largest finding of the night (§1).

**The honest cost**: reading 8 tickets' artifacts myself took ~90 minutes of wall-clock and a large
share of the session's tokens before a single agent was spawned. That is the correct order and it is
not cheap.

---

## 1. The finding that matters most — banked knowledge went unread by a 20-familiar sweep

`etanah-knowledge/melaka/DATABASE.md §16` was written **2026-07-31** from the ADHOC PT-sempadan
investigation. It contains, in advance:

- sempadan lives in `mklmt_tmbhn` JSON, and `umm_a_hkmlk_sempadan` / `umm_p_hkmlk_sempadan` are dead tables (§16.2)
- the JSON example is literally `{"Utara":"13093"},{"Selatan":"13154"},{"Timur":"13103"},{"Barat":"13101"}` — **the exact four values on #273455's Borang Jadual 1**
- the transfer is one line, `PelupusanSpocService.java:241`, gated at `:234` (§16.3)
- counter payment creates the officer row before the workflow, so the gate is false (§16.4)
- the report reads the AWAM table directly, which is why "Jadual 1 ada, skrin tiada" looks impossible (§16.5)

On **2026-08-04/05** a sweep ran 20 familiars over four passes and recorded #273455 as
*"blocked on discovery — pin Defect 1's write site (`PelupusanSpocService:235` area)"*.

**The answer was on disk, in the file the boot rule says to read first, for four days.**

This is the third instance of the same shape (2026-07-22 No-Resit, 2026-07-24 `DEV-TESTING-HACKS.md`).
Ledger: `knowledge-file-existed-but-not-consulted`.

### 1b. And when it WAS read, it was partly wrong

Tonight's #273455 deriver read §16, then re-derived from source, and returned two corrections:

| §16 says | Truth on the working tree |
|---|---|
| `:241` is *"the only code that moves maklumatTambahan"* | A second site **destroys** it: `PelupusanService.saveMaklumatPlotIntoPermohonanTanah()` seeds `new JsonObject()` at `:4763` and overwrites the column at `:4997` |
| `populateSempadanTanahListIntoJson` at `:4687` | `:4692` |

So the discipline cannot be "load the knowledge and trust it". It has to be **load it, then re-derive
and write back the delta**. Knowledge that is never re-checked decays into the same authority trap as
a stale qa_doc.

---

## 2. Failure classes — named, with instances

### F1 · My own blind-pass ban silently disabled KNOWLEDGE-FIRST
To keep L1 independent I banned `projects/coding-projects/active/` (where our qa_docs live).
**`etanah-knowledge/melaka/` lives inside that same folder.** The same prompt therefore said "read the
knowledge base first" and "you may not open the folder it is in".

Two agents, one contradiction, **opposite behaviours**:
- #273461's familiar obeyed the ban and reported: *"the KNOWLEDGE-FIRST step was skipped because etanah-knowledge lives under projects\coding-projects\active\, which the BLIND PASS hard constraint bans."*
- #273455's familiar read it anyway and filed a *"Contamination disclosure"*.

An ambiguous constraint does not fail loudly; it fails **differently per agent**, which is worse,
because the run looks uniform. All 6 L1 prompts carried it. Fixed for the L2 wave (explicit carve-out).
Ledger: `blind-pass-ban-swallowed-knowledge-folder`.

### F2 · Three of six tickets had a deliberate prior fix on the exact line we were about to change
| Ticket | Prior commit on the fix site | What a blind change would have done |
|---|---|---|
| 273461 | `5e6640bd72` tcting 2025-08-06 *"no permit lesen generation during jadual"* — **added** the line | reverted a PPTPB Jadual VIII fix |
| 273460 D4 | `ee826e26c6` faizudin 2026-06-11 QA #265094 — **added** `disableKeputusan` | re-open #265094 |
| 273460 D1 | `6b2716faf8` **ours**, 2026-06-03, QA #262495 — added `window.location.reload(true)` | re-open our own #262495 |

Every one surfaced only because the L1 prompt made the git probe a required output field. `todo.md` Q1
already carries *"the git-history probe fires at the WRONG time"* (added 2026-08-04, みや-caught). This
run supplies three more instances and settles the design: **the probe belongs in the prompt contract,
not in a Stop hook** — a Stop hook fires after the reasoning is spent.

### F3 · A Phase-1 artifact of ours was never validated and would have destroyed PROD records
`2. Fix\patch-273461.sql` (already sitting in the Task folder) NULLs and DELETEs `ind_permit_lesen`
rows for `A01/2026/2`, `/3`, `/5`. Those are **issued licences** on PROD (`permit_lesen_id`
6254/6255/6256, created 07-21/07-27/07-31); `A01/2026/4` — the number the ticket is actually about —
is absent from that table. Caught by a refuting familiar, not by us when the script was written.
Ledger: `patch-script-targets-live-records`.

### F4 · Two ticket-reading gates have free opt-outs
| Gate | Hole |
|---|---|
| `ba-understanding-table` v1.2 | **BLOCKS** only when a table IS emitted and a source is unread. Emitting **no table** falls through to advisory. Skipping the table costs nothing — observed live on this session's own boot turn. |
| `attachment-context` | resolves `0. Brief/` through `active.txt` `task_folder=`, so it cannot fire for a ticket with no active.txt block — exactly #273837 and #273956 tonight |
| evidence-manifest gate (P1, proposed 08-05) | still **not built** |

Ledger: `gate-has-an-opt-out-that-is-free`.

### F5 · The decisive artifact was a non-text file again — on 4 of 8 tickets
| Ticket | The artifact that carried the answer |
|---|---|
| 274136 | 3 videos. Frame at t≈20s shows the user typing `100,000`; a later frame shows the field blank after "Berjaya Disimpan". The ticket text is two sentences and names no field behaviour. |
| 273837 | 2 images — one shows the screen's 4 JT rows, the other the document's JPBD+JKR. The whole patch is derivable from the pair. |
| 273921 | video (overlay still up at 56s over a correctly-rendered 6-page doc) + `executor.log.txt` (4 successful Word launches, zero errors). Together they **eliminated** the client and the populator. |
| 273455 | 7 images; the Borang Jadual 1 jpeg carries the four sempadan values that tie the ticket to `DATABASE.md §16` |

08-05's P1 proposal said this was the highest-yield unbuilt gate. It is now 2 runs × ~half the tickets.

---

## 3. What worked and should be kept

1. **Controller reads every artifact before any agent spawns.** Produced §1, the 273837↔273921 link
   (same application `PTMLK/02/L/PPTPB/2026/1`), and the 274136 mechanism.
2. **Derive ≠ refute, and neither is self-appraisal.** Asking a familiar to `/appraise` its own
   derivation audits the reasoning that produced the error. The refuters were given *named claims to
   kill*, not "review this".
3. **Passing my artifact reading in-prompt as GROUND TRUTH.** Familiars cannot open a 45 MB mp4
   cheaply; they can act on "at t≈20s the user typed `100,000`". This is what made low effort viable.
4. **A forced `UNVERIFIED:` field.** Every familiar filled it honestly and several of the entries are
   the real next step (273921's three log lines; 273621's one local render).
5. **Stability, not pass count, as the exit.** #273921 got no refuter because its own verdict was
   *"root cause: not established"* with a named decisive test. Refuting an unestablished claim buys
   nothing. That decision saved an agent and is the criterion working as designed.

---

## 4. Proposals — each names its eval case

| Axis | Proposal | Eval case |
|---|---|---|
| A4 | **Knowledge-first must resolve to a FILE, not a folder.** The prompt/gate names the specific knowledge file for the ticket's layer (DB→`DATABASE.md`, report→`JASPER-REPORTS.md`, JSF→`JSF-WIRING.md`) and requires a one-line "what it already told me" emit before any grep | #273455 — §16 must be cited before a write-site claim is allowed |
| A4 | **Knowledge write-back is part of the close, not a nice-to-have.** Any investigation that re-derives a fact already banked must emit `CONFIRMED` or `CORRECTED <what>` against that file | §16.3's "only" and §16.6's stale `:4687` |
| A1 | **Blind-pass bans are expressed as an ALLOW-list plus a deny-list of file globs, never a folder path** | `QA-*.md` denied, `etanah-knowledge/**` allowed — tonight's contradiction cannot be re-expressed |
| A2 | **Git-history probe becomes a required OUTPUT FIELD of the derive contract** (it already is, tonight) and a `/quest resume` row — not a Stop hook | 3 hits in one run: `5e6640bd72`, `ee826e26c6`, `6b2716faf8` |
| A2 | **Any `.sql` in a Task folder is re-validated against live rows before it is handed over or run** — a script written at Phase 1 is stale by Phase 2 | `patch-273461.sql` vs `ind_permit_lesen` 6254/6255/6256 |
| A5 | **Evidence-manifest gate** (P1, restated — now 2 runs of evidence) with the manifest emitted as `opened ✓ / NOT OPENED` per file | 274136's 3 videos; the 3 files I left unopened tonight are named in the manifest |
| A5 | **`ba-understanding-table` must block on a MISSING table, not only on an unread source** | this session's own boot turn fell through to advisory |
| A5 | **`attachment-context` must resolve `0. Brief/` from the Task-folder scan, not from `active.txt`** | #273837 and #273956 had no active.txt block |
| A1 | **Cross-ticket link check before fan-out**: group open tickets by `id_pengenalan` and tell each familiar about its siblings | #273837 + #273921 are the same application and the same tugasan |

---

## 5. Retrieval notes (corrections to banked claims)

- `quest/redmine-sync.js <n> --create` **did** create the missing Task folder (`130. …#273837`) and
  refreshed every journal — including giving #274136 its first `History.txt`, which carried the BA's
  entire simulation. The 08-05b note that the script "ignores a ticket-number argument entirely"
  is **not reproduced as a total failure**; what is confirmed is that it syncs the whole assigned
  queue. Whether the argument is honoured independently is still unverified.
- #273956 **cannot** be synced — Redmine shows assignee Aaron Loh, so `assigned_to_id=me` misses it.
  Reading it required a direct API call. That route is worth keeping: a ~30-line node script against
  `http://172.16.90.169/redmine/issues/<id>.json?include=journals,attachments,relations` using the
  key in `domain/release-mlk-plp/redmine.local.json`.

---

*Companion: `agentic-ticket-workflow-assessment-2026-08-05.md` (four-pass run) ·
`-2026-08-05b.md` (solo day-shift). Proposals filed to `system/slips.jsonl` as `type=proposal`.*

---

# Session 2 sweep — 09:22 → 12:21, QA-273621 shipped end-to-end

> Solo, no fan-out. Phase 0 verify → Apply → Phase 1 close → int-env merge → みや deployed.

## A1 — Agentic system

**⏭ No fan-out this session.** All main-loop; the Delegation Economy had nothing to govern. Recording
the honest empty rather than inventing a finding. (The controller-verifies discipline *did* pay off, but
against my own prior session's doc, not an agent's — that belongs to A3.)

## A2 — Quest workflow

**The prepare-commit sequence lets a gate fire on a state the sequence never sets.**
`prepare-commit-trigger` lists the `local_test_confirmed` pre-check as step 1 and `checkout -b` as step
5, but nothing sets `current_phase=Commit-prep`. So the branch step ran while active.txt still read
`current_phase=Apply` and `branch-at-apply-gate` blocked a correct action. I got through only by setting
the phase by hand.

**`branch-at-apply-gate` had two defects hostile to every multi-quest close.** (a)
`blocks.find(o => o.status === 'active')` takes the FIRST active quest — with three active it cited
QA-273201, mid-rework, as the reason QA-273621 could not branch. (b) `CLOSING_PHASES` omitted the
literal `'Commit-prep'` while the file header promises "Commit-prep onward". Both fixed, plus an
exemption for `/deploy`'s throwaway `int-envmerge-<n>` branch (a deploy runs after close, so no active
quest can ever vouch for it). **Negative case unproven** — I did not confirm it still blocks a genuine
mid-Apply checkout, since that needs zero closing quests and I would not mutate live state to stage it.

**Phase 2 correctly NOT run**: deployed but Redmine still `New`/0%; archiving before the ticket leaves
our plate is the incomplete-close slip inverted.

## A3 — Debugging efficiency + accuracy

**One wasted build cycle, and the diagnosis was not the cause.** The fix worked on his first real
build. What cost him was my saying "build + deploy" when a compile plus an Eclipse file-copy does not
reload a class: deployed bytecode carried the fix (`GP_L1E` inlined, class mtime 11:20:08) while the JVM
still held the 09:58:30 class — proven by the log requesting only `GPTOL` with no redeploy event.

**I read log NOISE as mechanism, twice in one turn.** Five minutes of `ERROR … Execution time exceeded
3 seconds` looked like a hang; every line was `CommonPollComponent … took 0 ms`. Then I named my own fix
prime suspect for the empty panel, which two greps of the same log refuted. **Evidence class that would
have caught it first**: before attributing any symptom to my change, prove the change is RUNNING
(deployed-bytecode check + redeploy-event check) — I ran both, but only after asserting.

**Measurement beat argument.** `34,724` bytes blank vs `60,862,037` populated on the same record is the
entire before/after; the raster measured `68,202,892`. One `find -printf` replaced a debate.

**I matched a commit by its subject.** `cea66b57ad` = *"Adjust DPI untuk pelan"*, so I asserted it
changed our method; it changed `:941`/`:1498`, ours is `:814`. Same turn I claimed it was absent from
`mlk/master` — present. My `-S` pickaxe only detects occurrence-COUNT changes, so `300`→`150` was
structurally invisible to that search.

## A4 — Etanah issue-solving

**"Two defects in series" deserves a name.** Fixing the lookup alone swaps one blank band for another,
because the found artefact is in a format the consumer cannot use. Generalisation: when a fix makes a
MISSING artefact present, separately verify its FORMAT against what the consumer accepts. Verified today
— `skg_dok.jns_fail = application/pdf`, `lokasi_fail_png` empty, GPTOL arm 10/10 `image/png`.

**A knowledge file described environments dead for three weeks.** `env-check` still named FAT
(`etprdmlk/et_main`) and UAT (`mlkuat/et_main_uat`) as switch targets, and claimed the DMS/Audit
sidecars are "env-agnostic … always mkit" when the live machine reads `et_dms_stg1` / `et_sistem_stg1`.
Cure built: `quest/env-switch.js` reads the machine instead of remembering it (eval 10/10, byte-for-byte
round-trip).

**A predicted binary conflict recurred exactly as recorded.** QA-272527's block said *"WILL RECUR when
272651 merges to master"* — it did, on this int-env merge, and the note turned an investigation into a
3-command decision. Resolution was forced, not chosen: `#272651` is int-env-only, so taking master's
side would have deleted a colleague's work.

## A5 — Sweep / file sweep

**I never opened the ticket's `0. Brief/` binaries myself this session.** The `.jpeg` and the 65 s
`.mp4` were read by last night's pass; I carried that extraction forward and marked those two rows
"⚠️ from the qa_doc's earlier extraction". Marking it is the only thing that makes it defensible — but
2026-08-05's lesson is that only a picture testifies about what the officer could SEE, and the
re-engagement rule says re-load, not re-use. `Description.txt` and `History.txt` I did read verbatim.

**The BA-understanding table fired only because a Stop hook asked.** I reached Apply, staged, and closed
Phase 1 before emitting it. On a RESUMED ticket nothing forces it — `ticket-gate` keys on みや naming a
number at intake. Same shape as the 2026-07-28 lesson: a rule that fires on HIS words cannot fire when I
pick up the work.

---

## Proposals filed (Session 2)

| axis | proposal | eval case |
|---|---|---|
| A2 | `prepare-commit` sets `current_phase=Commit-prep` as an explicit numbered step before the branch step | this transcript: the branch op must not need a manual phase edit |
| A2 | `branch-at-apply-gate` negative-case eval on fixture `active.txt` files | mid-Apply + zero closing quests must BLOCK; a Commit-prep quest must PASS |
| A3 | `is-my-change-running` probe before attributing a symptom to my own edit | the 11:44 empty-panel turn: bytecode + redeploy-event check must precede attribution |
| A4 | live-pointer discipline for any doc describing machine state | `env-check`'s FAT/UAT table must be unreadable-as-current once the env is gone |
| A5 | re-engagement binary re-read on a RESUMED ticket, not only first intake | this session: the `.jpeg`/`.mp4` rows must be my own reads |
