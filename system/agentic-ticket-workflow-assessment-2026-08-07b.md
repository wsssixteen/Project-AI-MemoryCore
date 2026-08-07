# Improvement Sweep — 2026-08-07 (session 2, #273455 cycle 2)

DE Step 7.5. Five fixed axes, every one swept. Each claim carries the instance that proves it.
Solo session — no fan-out — so A1 is judged on the delegation decision itself, not on fleet behaviour.

---

## A1 — Agentic system

**Assessment: the right call was to spawn nothing, and that is worth recording as a positive.**

This was a single-file, single-method fix with a DB-answerable scope question. A familiar fan-out
would have cost tokens and added a verification burden (every cheap-model claim is DATA, not truth)
for a job the controller could do directly with four PROD queries. The 2026-08-06 lesson — *"the
winning choice was to spend LESS on agents and more on my own eyes"* — held again.

**What did go wrong is not an agent problem**: the controller (me) ran a census on the wrong table
and then defended it. No amount of fan-out fixes that; a familiar given the same wrong table returns
the same wrong number with more confidence.

**Finding**: the Delegation Economy rule tells me how to pick models once I've decided to fan out.
There is no rule for the prior question — *should this fan out at all?* Tonight the answer was
obviously no, but it was answered by instinct, not by a stated test.

## A2 — Quest workflow

**Assessment: Phase 0 → Recon → Rubric → Apply worked; the failure was in the ANSWER phase that has
no name.**

The quest engine covers investigating a ticket. It has nothing covering *answering a question about a
ticket already investigated* — which is where all four of tonight's errors happened ("is it PT only?"
asked three times). `quest-phase-gate` fires on Edit, not on assertion.

**Instance**: three consecutive wrong/unproven answers, none of which touched a gate, because I was
talking rather than editing. Only the fourth exchange — an actual Edit — hit the gate stack.

**Second instance, positive**: the v2-branch decision. `mlk/master` did not contain `ae7bc3937e`, so
the standard rework recipe (branch off master) would have silently dropped cycle 1's fix. Caught by
running `git merge-base --is-ancestor` before branching instead of following the recipe. The recipe
assumes cycle 1 reached master; it often has not.

## A3 — Debugging efficiency + accuracy

**Assessment: the diagnosis cost みや zero build cycles — the best number this axis has seen — but
four conversational challenges, which is the same currency in a different denomination.**

- Root cause found in **2 queries** (pra row vs app row, then the timestamps). No loggers, no builds.
- Compile verified locally despite Maven being unusable → no "does it even compile" round-trip.
- But: 4 challenges to settle one scope question, because I asserted before counting.

**The evidence-class error, precisely**: I had *a* census and treated that as having censused. The
distinguishing question I failed to ask is not "did I count?" but **"did I count the thing the code
reads?"** The officer screen reads `umm_a_hkmlk`; I counted `umm_p_hkmlk` against urusan that write
to `umm_p_permohonan_tnh`.

## A4 — Etanah issue-solving

**Assessment: the knowledge base was consulted and was RIGHT, and I still had to re-derive most of
it — because §16 described the sempadan path only.**

`DATABASE.md §16` (written 2026-07-31) correctly gave the gate, the payment discriminator and the
spine. It did not say the gate loses *every* field, so when BA reported a second field I treated it as
a new investigation rather than the same defect with a wider blast. Now fixed as §16.8.

**Instance**: `bandar_dipohon_id` loses 0 of 47 while `luas` loses 36. Both are plain columns on the
same row copied by the same `BeanUtil.copyProperties`. I have not explained that asymmetry and did
not chase it — a genuine open question, recorded rather than papered over.

**Positive**: reading `mlkMaklumatTanahV3.xhtml`'s own `et:formField` list, rather than the columns I
happened to have queried, is what turned "is that everything?" into a real answer. Field list from
the screen, not from my working set.

## A5 — Sweep / file sweep

`A5 ⏭ — no multi-ticket sweep this session; single-ticket rework, and the BA evidence (2 screenshots)
was downloaded and read within one turn of the reopen.`

One carry-over worth noting: `redmine-sync` still skips new attachments when the task folder exists
(todo Q1, found 2026-08-04). I hand-downloaded both screenshots by attachment id again tonight —
second occurrence of the same friction, which by the 2026-07-24 rule makes it work rather than backlog.

---

## Proposals logged for the weekly audit

Each names its eval case. Logged via `core/slips.js --type proposal`.
