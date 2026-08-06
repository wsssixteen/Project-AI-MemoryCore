# Improvement Sweep — 2026-08-06 evening (QA-273461 close)

Session shape: one ticket end-to-end, solo (no fan-out), plus three system edits.

## A1 — Agentic system

**No fan-out this session** — one ticket, main loop only. That was the right call and worth recording as
a counter-example to the reflex: the session's biggest finding (a shipped commit our own doc denied)
came from a 5-line `git` probe, not from an agent.

**Real defect found**: the two-copy problem. Every `projects/` doc exists in the main repo AND the
worktree; hooks read the worktree, durable content lives in main. Hit **three times today** — the
skills edit this morning, the deploy skill, the qa_doc (where the deferrals gate correctly reported a
section missing that I had written to the other copy). Proposal logged (A1).

## A2 — Quest workflow

**The resume contract worked on its first run.** みや dictated it; I built `ticket-load-verify.js` and the
existing-fix probe immediately surfaced `8bd34da47c` — #273461's fix, pushed 08-04, while the qa_doc read
*"Phase 0 only. No code changed."*

**Gap closed tonight**: DE Step 2b. Proposed 2026-07-20, never built, which is exactly why みや had to
write *"save everything about this ticket"* as an explicit instruction. Now in `expansion-protocol.md` +
the DE skill, verified by 12.6. Proposal logged (A2) with its eval case.

**Stale row found**: the todo Q1 entry claiming `deliverable-lands-on-main` compares the local `main` ref
is **out of date** — the hook was fixed to `origin/main` on 2026-08-03 (v1.1). Nearly "fixed" it twice.

## A3 — Debugging efficiency + accuracy

**Zero build/test cycles spent on wrong theories.** The fix was right first time and みや's test passed
first time. What produced that: PROD queries before claims, at every branch —

| Claim I could have made | Query that settled it | Cost |
|---|---|---|
| "guard the whole screen for PLPS" | `ind_langkah` skrin-338 census → 21 PLPS tugasan, PYB4AE absent | 1 query |
| "patch the applications that never reached 4Ae" | `group by created_by` → 746 migrated / 3 real | 1 query |
| "created_by SYSTEM identifies them" | the OPLPS rows carry officer logins | same query |

**The one wrong turn**: I read *"double check I updated"* as the database when he meant the script.
Cheap to correct because I checked PROD before answering.

## A4 — Etanah issue-solving

**Knowledge written**: `DATABASE.md §20` — the migrated-vs-generated split, the 4-table reference graph
with zero declared FKs, the shared 4-urusan counter, per-urusan allocation sites, and the fact that
`PYB4AE` has never occurred in PROD. That last one is the kind of fact no code trace yields.

**Standing hazard**: delivery channels git cannot see. #273461 ships code via a branch and data via a
Redmine attachment — the same blindness that cost us #269802 in July. Proposal logged (A4).

## A5 — Sweep / file sweep

**`0. Brief/` discipline defect found in my own tool.** `ticket-load-verify.js` checked journal-named
attachments against `0. Brief/` only, so our own uploads (`patch-273461.sql`, the test video, both in
`2. Fix/`) failed as ghost attachments. Fixed to search the whole task folder; green path exits 0, a
genuinely missing file still exits 2. Slip `ticket-source-skipped`.

**Emit-shape**: two corrections in one turn on the deploy card — dead local git steps, then an
over-built evidence block. Both fixed in the skill, not just in the reply. Slip
`emit-shape-not-copyable`. This is the 07-20 hand-off-card lesson recurring; the pattern is that I
build the artefact for myself rather than for the person running it.
