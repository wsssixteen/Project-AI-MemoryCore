---
name: stop-point-summary
description: Use when stopping at ANY point — task done, phase boundary, blocker, or "where are we / what's next" — to emit a complete stage summary so みや is never left hanging. Title varies by stage ("Test Scenario" at testing hand-back, "Recon Summary", "Blocked — Awaiting X", etc.). Triggers — "Test Scenario", "where are we", "where are we at", "what's next", "summary", "are we done", "status", any task-completion or hand-back. NOT "Test Data" (= the bare test-data-echo skill).
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
| **🚨 PRECONDITION — the state the record must be in** | the EXACT state that makes this test meaningful (which tugasan must be ACTIVE, which status, which row must exist and when it was created). **MANDATORY** |
| **🚨 NOT-A-RESULT — what does NOT disprove the fix** | name the states where the fix is *not exercised*, and say plainly that seeing the old/other value there proves nothing. **MANDATORY** |

+ **Notes:** what is NOT covered by this fix · errors to expect that are NOT the fix (e.g. a pre-existing NPE)
+ **Next:** who tests · what closes next

### Why the last two rows are MANDATORY (2026-08-04, QA-270900 cycle-2 — みや)

A config fix on a reference row (`ind_tgsn.peranan`) is read **only at task creation**. みや applied it,
opened Pergerakan Fail, saw the *Penyediaan* tugasan showing one role, and reasonably concluded the fix
had done nothing — because my Test Scenario never said **which tugasan had to be active for the check to
mean anything**, nor that a different tugasan showing its own correct role is **not** a failure signal.
The flow had been sent back to Penyediaan by a Pembetulan between his test and mine.

The fix was in fact correct: the next SSMW task (`umm_a_tgsn` 2730603) stamped `-KPT-KPPD-PPD-` with the
officer assigned. The whole exchange was a *test-design* failure on my side, not a diagnosis failure.

**The rule**: whenever a fix only manifests under a specific record state — a newly created row, a
particular tugasan, a status transition, a fresh session — the hand-back MUST state the precondition and
the not-a-result explicitly. Banned: a Test Scenario that lists what to look at without saying what state
the record must be in, when the fix is state-gated. Same family as the "deploy to where the reviewer
actually looks" lesson — here it is *test at the state the fix actually fires*.

## Micro-Summary variant (for mid-work stops that are NOT full phase boundaries)

Not every stop is a full phase close. When work is mid-flight (single Edit inside a larger fix, small research finding, one file read that answered the question) but the reply IS substantive (tool_use ≥ 1 OR ≥ 300 chars), a **Micro-Summary** satisfies the rule without the ceremony of a full stage-titled block.

**Shape** — literally three lines:

    Micro-Summary: <one line what changed> · <one line how to act> · <one line what next>

**When to pick Full vs Micro**:

| Stop shape | Use |
|---|---|
| Task done · phase boundary · hand-back · blocker · "where are we" · testing | **Full form** (`## ▶ <Stage Title>` block) |
| Mid-implementation Edit · single research answer · quick file look-up | **Micro-Summary** (3-line inline) |

Micro is NOT a ceremony bypass — it is still a summary, still names what changed and what's next. The bypass token below is for cases where NEITHER form fits.

## Bypass — WHITELIST ENUM (enforced by hook)

If the reply genuinely has no substance, use ONE of these five reasons — **no free-text**:

```
[skip-stop-point-summary: pure-ack|question-only|error-only|de-mode|closing-voice]
```

| Reason | When |
|---|---|
| `pure-ack` | one-word acknowledgment ("noted", "ok") |
| `question-only` | reply is a single clarifying question, no substance |
| `error-only` | reply reports a hard error / tool failure only |
| `de-mode` | Domain Expansion / closing ritual |
| `closing-voice` | personal / relational / reflective reply |

**Banned bypass reasons** (these are the abuse patterns the hook is designed to reject):

- ❌ `mid-implementation` — a mid-implementation stop STILL needs a Micro-Summary
- ❌ `3 more steps pending` — the stop that just happened deserves the summary, not the deferred one
- ❌ `will summarize later` — defer is the exact "left hanging" failure

If a reply has any of the failure-mode reasons in mind, the correct action is to emit a **Micro-Summary**, not to bypass.

## "Test Data" is DIFFERENT

`Test Data` alone → the bare 3-field `test-data-echo` (ID / login / tugasan). `Test Scenario` → this full stage summary. Do not conflate the two.

## Red Flags — STOP if you catch yourself:

- Ending a task with prose and no table → you left みや hanging. Emit the summary.
- Emitting findings/results without a **Next** line → incomplete.
- Inventing ad-hoc titles ("Test recipe") → use the stage title from the table above.
- Dumping the table with no **Notes** → the notes are the summary.
- Reaching for `[skip-stop-point-summary: mid-implementation]` → that's the abuse. Emit Micro-Summary instead.

## Excuse | Reality

| Excuse | Reality |
|---|---|
| "The task is obviously done, no summary needed" | A stop without where-we-are + what-next IS the "left hanging" failure みや named |
| "I gave the data, that's enough" | Data ≠ summary. Notes + Next + stage-title are what he asked for |
| "I'll summarize if he asks" | He shouldn't have to ask — emit at every stop |
| "I'm mid-implementation, will summarize at the end" | The current stop deserves a Micro-Summary now. Emit it. |

## Enforcement

Enforced by `domain/stop-point-summary/stop-point-summary.discipline.hook.js` (Stop hook, HARD BLOCK). See `domain/stop-point-summary/README.md` for the full contract, detection signals, and retirement notice for the old `stop-point-todo-table` advisory hook (subsumed 2026-07-06).

## History

- **2026-05-30** — Created by みや after QA-259702 "Test recipe" (Full form).
- **2026-06-30** — Companion `stop-point-todo-table` PostToolUse advisory hook added (fired only after code Edit).
- **2026-07-06** — Old hook RETIRED (free-text bypass abuse). New `stop-point-summary` Stop hook HARD-BLOCKS every substantive turn without a summary. Whitelist enum bypass. Micro-Summary variant added for mid-work stops.
