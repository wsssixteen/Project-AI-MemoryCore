# Improvement Sweep — 2026-08-05 (session 3, day shift)

> DE Step 7.5. Five fixed axes, every one swept. Each claim carries the instance that proves it.
> Companion file: `agentic-ticket-workflow-assessment-2026-08-05.md` (session 1, the 20-familiar sweep).
> This session ran solo — no fan-out — so A1 is thin by construction and says so.

---

## A1 — Agentic system

**⏭ No fan-out this session.** Zero subagents, zero workflows; all work ran in the main loop.
Nothing to assess on delegation shape, tiering, or controller verification.

One adjacent observation worth keeping: the day's decisive facts came from **single cheap queries**
(one `saiz_fail_byte`, one `umm_p_aplikasi.created_by`), not from reasoning capacity. The previous
session spent 20 familiars on the same class of question. The lesson is not "use fewer agents" —
it is that **the cheapest index that already holds the answer should be consulted before any fan-out
is designed**, which is already the Delegation Economy's "scout inline first" rule, unexercised here.

---

## A2 — Quest workflow

**Failure class: `apply-blocked-by-own-gate`.** QA-273919 reached Apply cleanly, then the close
stalled twice on my own tooling:

| Gate | What it demanded | Cost |
|---|---|---|
| `quest-phase-gate` | Scout/Recon/Rubric emits **in this session** — the quest was completed the night before and fully reconciled in its qa_doc | one full re-emit of three phase blocks that already existed on disk |
| `pre-code-check` | 21 named checks, two rejections before the line was accepted (first missing 5 names, then malformed) | three round-trips before a one-line edit |
| `commit-gate` | a literal approval phrase; みや said *"proceed"*, then demanded the merge in capitals | commit sat blocked while he waited, ended in profanity |

The checks are individually right. The aggregate is that a **one-line, 90%-confidence, previously
reconciled fix** paid the same toll as a novel multi-file change. Nothing in the pipeline reads the
qa_doc and says "this quest already has its phases".

**Second class: `phase-emit-not-sourced-from-disk`.** `quest-phase-gate` counts emits in the
transcript. A quest resumed from a complete qa_doc has every phase written down and must retype
them. That is ceremony, not verification.

---

## A3 — Debugging efficiency + accuracy

**This axis went well and the reason is nameable.** 274046's mechanism was settled by measurement,
not argument:

```
question:  why does this document hang?
survived:  a sweep, a video, an invalid-OOXML theory
settled by: SELECT saiz_fail_byte  ->  51,047,043
            vs staging working arm  ->  757 KB – 3.7 MB
confirmed by: unzip the staging artifact -> 2 identical orphan PNGs, 89% of the file
```

Cost to みや: **zero build cycles.** Contrast the 2026-07-27 QA-265537 logger saga, where each
single-hypothesis instrumentation round bought another of his build cycles.

**What made it work**: the BA handed both arms of the experiment on turn one (PROD fails,
staging `/2026/14` passes) and this time I named the contrast instead of reading the working arm as
corroboration — the exact failure logged as `infer-instead-of-ask-the-reporter` on 2026-07-31.

**One accuracy miss**: I called the `Encrypted data has expired` line in 274046's `Error Log.txt`
"unrelated noise" without testing that, and the BA's journal then said infra sees an error in the
log. My dismissal is unverified and still stands unexamined.

---

## A4 — Etanah issue-solving

**Failure class: `test-data-rule-shaped-for-one-module`.** The login rule is officer-shaped —
derive from `umm_a_tgsn` → `pcp_pengguna`. AWAM has no tugasan, so on an AWAM ticket the rule
silently produces nothing and no substitute fires. みや: *"You failed to give me a username, please
fix this for AWAM you kept failing this."* The word **kept** is the finding: this is not the first
time, and the officer-shaped rule has been in CLAUDE.md throughout.

Fixed mechanically this session — `domain/test-scenario-login-gate/` keys on the **login**, not the
tugasan, and its block message names both derivation queries (6/6 eval).

**Knowledge genuinely missing until today** (all four now written):

| Fact | Landed in |
|---|---|
| No application→DMS foreign key exists — 4 candidate links all NULL/empty | `DATABASE.md` §16 |
| `aplikasi_id` is identical PROD↔stg1 (stg1 is a refresh); permohonan-ID is not stored anywhere joinable | `DATABASE.md` §17 |
| AWAM logins derive from `umm_p_aplikasi.created_by`; pick one covering every urusan the test needs | `TEST-PERMOHONAN-INDEX.md` |
| Two distinct mechanisms wear the "Sedang Kemaskini lama" symptom; the discriminator is file size, and orphaned unreferenced images are what inflates it | `BUG-BESTIARY.md` |

Every one of these cost real tool calls to rediscover today.

---

## A5 — Sweep / file sweep

**The `0. Brief/` evidence discipline held this time.** 274046's folder carried two videos; I opened
the one labelled *"Simulate - No issue"* — the arm I would previously have skipped — and it produced
the environment, the permohonan (`/2026/14`), and the fact that the surat opens fine. That is
proposal P1 from the 08-04 sweep (evidence-manifest gate) working by hand, unbuilt.

**Retrieval defect found**: `quest/redmine-sync.js` syncs the **whole assigned queue** and ignores a
ticket-number argument entirely. I invoked it five times with five different numbers and got five
identical outputs before noticing. It also needs `--create` to make folders, which is not obvious
from the retrieve-sync-gate's instruction (*"node quest/redmine-sync.js &lt;ticket-number&gt;"* — an
argument the script does not honour).

**Adoption gap**: tickets in `ADOPTED_AS_MINE` (273837, 273956) cannot be synced at all, because
`redmine-sync.js` queries `assigned_to_id=me` and Redmine still shows a colleague. They have no Task
folder and no `0. Brief/`.

---

## Proposals filed

All logged via `core/slips.js --type proposal`; each names its eval case. See
`system/slip-dashboard.md` § 💡 Open proposals.
