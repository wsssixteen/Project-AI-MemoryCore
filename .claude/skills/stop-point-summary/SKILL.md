---
name: stop-point-summary
description: Use when stopping at ANY point — task done, phase boundary, blocker, or "where are we / what's next" — to emit a complete stage summary so みや is never left hanging. Title varies by stage ("Test Scenario" at testing hand-back, "Recon Summary", "Blocked — Awaiting X", etc.). Triggers — "Kowalski", "Kowalski analysis", "Kowalski options", "Kowalski next steps", "Test Scenario", "where are we", "where are we at", "what's next", "summary", "are we done", "status", any task-completion or hand-back. NOT "Test Data" (= the bare test-data-echo skill). ("Kowalski" = みや's named alias for the next-steps emit — Madagascar "Kowalski, analysis". FORMAT = TABLES, never arrow-flow: Layer-1 overview table (`Step | Action | What`) + Layer-2 specific-step table (`Field | Value`). Use 2 layers on a first-time/complex step; 1 table otherwise. See "Kowalski format" below.)
---

# stop-point-summary — never leave みや hanging at a stop

## What this is

At ANY point work pauses, emit a **Stop-Point Summary**: a stage-titled block that says **where we are + what to do next**, table-first with notes below. It is the summary of our current stage. みや's go-to trigger is **"Test Scenario"** (the testing hand-back variant).

## The format (always this shape)

    ## ▶ <Stage Title>

    <one line, plain language: where we are right now>

    | <key> | <value> |        ← complete table of the stage's load-bearing facts (one concern per cell)
    | ... | ... |

    **Notes:** caveats · what to expect · what NOT to confuse · known gotchas
    **Next:** ✓ done <what> / ⬜ pending <specific action> — <who does it>

The **Notes** and **Next** lines are mandatory — they are what make it a *summary*, not a data dump. The title NAMES the stage.

## Kowalski format (the next-steps emit)

"Kowalski" / "Kowalski analysis" → emit the next steps as **TABLES, never arrow-flow** (みや 2026-06-23). Two layers on a first-time or complex step; one table otherwise.

**Layer 1 — overview** (the whole flow, so みや sees the shape):

| Step | Action | What |
|---|---|---|
| 1 | `<verb>` | `<plain what>` |

**Layer 2 — the specific next step** (what to do right now):

| Field | Value |
|---|---|
| What we change | ... |
| Where (SQL/file) | ... |
| Open / expect | ... |
| Undo / risk | ... |

**Banned:** arrow-flow (`A → B → C`) for a Kowalski emit — tables only. One concern per cell.

## Title by stage

| Stage / checkpoint | Title |
|---|---|
| Discovery | `Discovery Summary` |
| Recon | `Recon Summary` |
| Simulate | `Simulate Summary` |
| Rubric | `Rubric Summary` |
| Apply | `Apply Summary` |
| Verify / testing hand-back | **`Test Scenario`** ← みや's go-to |
| Commit / Push / Phase 1 close | `Close-out Summary` |
| Blocked | `Blocked — Awaiting <X>` |
| Non-quest / general | `Where We Are` |

## "Test Scenario" variant (testing hand-back) — required rows

Reuse `test-data-echo` for the data rows, then add the rest:

| Row | Content |
|---|---|
| Permohonan ID | `<id>` (+ aplikasi_id) |
| Login | `<pengguna semasa email>` — ALWAYS paired with the ID (pengguna rule) |
| Tugasan | `<kod>` — `<nama>` |
| Role / pejabat | `<peranan>` / `<pejabat>` |
| What to check | per-item, what to look at |
| Discriminator | why THIS app — what makes it the right/only one |

+ **Notes:** what is NOT covered by this fix · errors to expect that are NOT the fix (e.g. a pre-existing NPE)
+ **Next:** who tests · what closes next

## "Test Data" is DIFFERENT

`Test Data` alone → the bare 3-field `test-data-echo` (ID / login / tugasan). `Test Scenario` → this full stage summary. Do not conflate the two.

## Red Flags — STOP if you catch yourself:

- Ending a task with prose and no table → you left みや hanging. Emit the summary.
- Emitting findings/results without a **Next** line → incomplete.
- Inventing ad-hoc titles ("Test recipe") → use the stage title from the table above.
- Dumping the table with no **Notes** → the notes are the summary.

## Excuse | Reality

| Excuse | Reality |
|---|---|
| "The task is obviously done, no summary needed" | A stop without where-we-are + what-next IS the "left hanging" failure みや named |
| "I gave the data, that's enough" | Data ≠ summary. Notes + Next + stage-title are what he asked for |
| "I'll summarize if he asks" | He shouldn't have to ask — emit at every stop |

## Hook candidate (v1.1)

`operational-follow-through.js` (Stop hook) could mandate this shape deterministically. Deferred to v1.1; today this is the skill + the always-on `personality.md` rule.

## History

Created 2026-05-30 by みや. He liked the QA-259702 "Test recipe" (complete table + notes) but wanted (a) a better name — **Test Scenario** for the testing hand-back, (b) it generalized to EVERY stop point with a stage-varying title, (c) it as the standing format so he is never left hanging. Distinct from the bare `test-data-echo` ("Test Data").
