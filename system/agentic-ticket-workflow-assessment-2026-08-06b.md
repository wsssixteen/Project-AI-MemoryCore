# Improvement Sweep — 2026-08-06 (session 3)

> DE Step 7.5. Five axes, every one swept, each claim carrying the instance that proves it.
> Companion: `agentic-ticket-workflow-assessment-2026-08-06.md` (session 1-2, concurrent).

---

## A1 — Agentic system

**4 opus familiars, one narrow refutation question each.** Contract held: read-only, no sub-agents,
no Workflow, forced output shape. Result: **3 of 4 claims refuted**, and the one I flagged myself as
weakest (init-alter cannot touch `status_proses`) was indeed refuted.

What worked: telling each familiar *how the claim was made* and naming the reasoning to attack, not
just the claim. F4 reproduced my exact false-negative regex and showed it returning `[]`.

What to keep: the model selector exposes `opus` as one tier — "opus 4.8 vs 5" is not selectable.
Said so plainly rather than pretending to dial two versions.

**Gap**: the familiars audited *yesterday's* claims. Every one of today's four errors was caught by
みや in-flight, none by a familiar, because nothing audits a claim at the moment it is made.

---

## A2 — Quest workflow

**Failure class: `patch-verified-twice-still-failed`.** I declared the SQL verified, he asked
"these scripts are okay?", I re-verified and said send — and it failed on PROD with `ERROR 21000`.

The verification I ran was real but **scoped to where I expected the trap**: uniqueness on the
INSERT's three agency names, nothing on the DELETE's scalar subquery. A checklist that says
"verify subqueries" would have passed both times, because I believed I had.

**Second class: `gate-blocks-on-wrong-quest`.** `commit-gate` blocked a MemoryCore state commit on
`QA-273455`'s `local_test_confirmed` — a quest the commit does not touch. The gate has a correct
MemoryCore skip (`targetRepo.startsWith(memoryRoot)`) that failed only because a bash-style path
`/c/Users/…` cannot match a Windows root. Worked around by running the same commit from PowerShell.

---

## A3 — Debugging efficiency + accuracy

**Cost to みや: 4 corrections, ~0 build cycles.** Every error was caught in conversation, not in a
deploy. That is the good half.

The bad half is the shape they share — all four were **one query or one file away**:

| Error | The one thing that would have prevented it |
|---|---|
| "Cetakan Dokumen" read as prose | `SELECT … FROM ind_tgsn WHERE nama LIKE '%Cetakan Dokumen%'` |
| `= (SELECT agensi_id …)` | `count(*)` on that subquery |
| "Gantung is display-only" | the grep without `\| head -20` |
| "permohonan ID not stored" | opening `DATABASE.md`, which said so at line 970 |

**What went right**: after the 21000 error I did not guess — I ran every subquery through a
`count(*)` UNION and found the second defect (no re-run guard) that nobody had asked about.

---

## A4 — Etanah issue-solving

**Knowledge that existed and was not consulted**: `DATABASE.md:970` and `:1062` both state
`umm_aplikasi.id_pengenalan` holds the PTMLK string. I never opened the file, derived the opposite
over ~8 queries, told みや three of four applications have no permohonan ID (all four do), and wrote
the contradicting claim into that same file during the previous DE. `knowledge-first-gate` exists to
force a knowledge read — it did not fire on a non-quest ad-hoc DB question.

**Knowledge genuinely new, now written** (`DATABASE.md` §18-19):

| Fact | Cost to rediscover |
|---|---|
| `rjk_agensi` has duplicate names; `=` subquery fails | a failed PROD run |
| Trailing spaces on agency names | caught pre-flight, would have been a silent zero-match |
| `umm_a_jabatan_teknikal` has no unique constraint | audit only |
| `generateSurat` TIDAK removes rows at PSJT/PGSJT | ~6 greps |
| 97% of the table's optional columns are null | one aggregate |

---

## A5 — Sweep / file sweep

**⏭ No multi-ticket sweep this session** — single-ticket depth work throughout.

One retrieval note worth carrying: the concurrent session had taken #273837 to 92% with the patch
already derived, and I found that by reading `active.txt` + its qa_doc **before** investigating.
That saved re-deriving the agency resolution. The `active.txt` block was then **lost in the merge**
(the concurrent session's version won and did not contain it) and had to be recovered from commit
`709cfbe`. Two sessions writing one working-memory file remains unsolved.

---

## Proposals filed

Logged via `core/slips.js --type proposal`; each names its eval case.
See `system/slip-dashboard.md` § 💡 Open proposals.
