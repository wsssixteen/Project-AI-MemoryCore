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
