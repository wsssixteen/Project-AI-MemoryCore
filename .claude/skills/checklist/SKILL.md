---
name: checklist
description: Universal task checklist — enumerate every issue / requirement / sub-task into a tracked numbered list at the start of any multi-step task. Mandatory at quest accept + every phase boundary. Triggers — "/checklist", "make a checklist", "list every issue", "enumerate the items", "Phase 0 issue checklist", "track every sub-task", "go through every", "enumerate before pursuing", before any multi-item work.
allowed-tools: Read, Write, Edit
---

# checklist — Universal Task Checklist

## Purpose

At the start of ANY multi-step task, enumerate every issue / requirement / sub-task into a tracked checklist. It is both (a) the reference followed through execution and (b) the verification checklist at the end. It exists because items get silently dropped — deferred into a footnote, or marked "done" when only half-done. A numbered row with a visible status cannot hide.

## Home

The checklist lives in the task's project folder under `projects/coding-projects/active/<name>/`. Every task is a "project" with a `type` (quest / system-design / learning / planning / etc.) — that folder was historically code-only; it is now the universal home for any task's working docs.

- **Quest** → inside `QA-NNNN.md`, section "Issue Checklist".
- **Other task** → inside that task's working doc, or a `checklist.md` in its project folder.

## Triggers

| Context | When it fires |
|---|---|
| Quest | AUTO — created at **quest creation** (right after Redmine retrieval), **BEFORE Scout's diagnostic is considered**, into `QA-NNNN.md`. Items enumerated from PRIMARY SOURCES (BA Description + History + every attached PDF/docx/photo) per "Item source". Scout's diagnostic is DIFFED against this checklist, never copied from. The list **GROWS** through Recon/Apply/Test (see "Out-of-scope findings") |
| Generic task | AUTO — fires once planning is done, as execution begins |
| Manual | `/checklist`, "make a checklist", "list the items first" |

Negative test — skip trivial single-step tasks. Don't checklist a one-liner.

## Format

`| # | Item | <phase columns> | Status |` — emitted as a raw markdown table.

Phase columns adapt to task type — quest: Scout / Recon / Rubric / Apply / Tested. Generic task: Planned / Done / Verified.

## Item source — independent enumeration (non-negotiable)

The checklist's items are **NOT** copied from Scout's early-diagnostic. Scout's findings are a CROSS-CHECK, never the scope boundary.

1. **Enumerate from primary sources, exhaustively.** Ruri lists every item of the affected surface directly from the source — for a `.docx` template ticket that is EVERY content-control tag in the template (expected value + actual rendered value per tag); for a Java/JSF ticket, every field / branch / screen the change touches.
2. **Then diff Scout against the checklist** — mark each row Scout-caught or Scout-missed. Scout-missed rows are real scope, not noise.
3. **General complaints = full surface.** When the ticket says "maklumat tidak ditarik" / "template tidak sama" / "banyak salah" / any non-specific defect statement, the scope is the FULL affected surface — never the BA-highlighted or Scout-listed subset.

**Why** (QA-262039, 2026-05-19): Phase 1 was built from Scout's 12-item discrepancy table; the generated surat had 2 unlisted "maklumat tidak ditarik" defects (`kadarCukai` blank, `syaratKepentingan` placeholder). Every prior Scout-trust rule guarded false positives (Scout said something wrong); this guards false negatives (Scout never listed something). `early-diagnostic.md` looks authoritative because it is structured — it is a starting point, not the scope.

## Enumeration completeness (non-negotiable)

"Independent" is half the rule; "complete" is the other half. Phase 0 has historically picked up the FIRST instance of a concern and treated it as the whole. Enumerate **ALL**, never "the":

| Axis | What "all" means |
|---|---|
| **BA items** | EVERY BA-numbered item (Description, PDF annotations, journal comments, attached requirements) gets its OWN row with its own status. Never collapsed into prose footnotes — "Deferred (#4-#8)" is **banned** |
| **Gate-variable writers** | ALL writers of the gate — `init*` / `populate*` / event-handler (`onChange*`) / service-method / page-load paths — categorized. Not "the gate"; every writer |
| **Validator paths / OR-bypass conditions** | ALL short-circuit returns, ALL empty-stub overrides, ALL `if (X) return;` early-exits in the validator chain. Not "the gate"; every gate. The double-gate trap (outer flag + inner gate) needs both rows |
| **Data axis** | The input values that flip the conditional branch (IC color codes, warna codes, urusan kod, etc.). Test data must cover each branch — not just the BA-reported one |
| **Method bodies** | Verbatim-body-read of EVERY method cited by Scout / early-diagnostic. Paraphrased field-lists are banned at recommendation time (extends Tier 1 Check 1 transitive references to also cover cited Java methods) |
| **Requirement parents** | If Description references `Requirement #NNNNN`, the Requirement IS part of Check 1's primary path. The background cross-ref agent fetches it before recommendations land — see `quest/cross-ref-agent.md` |

**Why** (pressure-test 2026-05-19 across QA-262027 + QA-260965 + QA-260154): all three were *enumeration-completeness* failures of the same shape. QA-262027's #5/#6 lived in a prose footnote. QA-260965's `initWarna()` page-load writer was missed because Phase 0 traced "the" handler. QA-260154's double-gate trap (outer `perluKemaskini` + inner `isValidPremiumVO`) was missed because Check 4 asked for "the gate". Phase 0's Universal Checks need fan-out: ALL writers, ALL OR-bypasses, ALL BA-numbered items, ALL data-axis branches.

## The verification rule (non-negotiable)

A row is NEVER "done" / "confirmed" on mechanism alone. Two distinct checks:

| Check | Means |
|---|---|
| Mechanism done | the change is applied / the bug is real |
| Intent matched | the change produces what the requestor (BA / みや) actually wants |

A row is "done" ONLY when BOTH hold. If mechanism is done but intent is unverified → status = `mechanism done — INTENT UNVERIFIED (BA-Q)`, never "done".

**Why** (QA-262027 #1, 2026-05-19): a CC-tag casing fix was marked "verified 100%" when only the casing MECHANISM was verified — whether the resolved tag produced the value the BA actually wanted was never checked. "Verified" must mean intent-verified, not mechanism-verified.

## Deferred items

A deferred row STAYS in the list, carrying: a reason + a `surfaced to <person> <date>` marker. Deferring an item silently into prose is banned — that is the failure this skill exists to prevent.

## Out-of-scope findings (grow-the-list discipline)

The checklist **GROWS** through Recon / Apply / Test. Any finding outside the BA's stated scope still gets a row — never silently ignored. Disposition options (the row's Status column):

- `OOS — surfaced to みや YYYY-MM-DD` — decision pending (do here / split off)
- `OOS — separate ticket: QA-NNNN` / `todo.md Q#` / `out_of_scope_held`
- `OOS — dead-end: <reason>`

**Banned**: dropping an out-of-scope finding because "it's not in the ticket." Every finding has a visible row; only the disposition differs. みや 2026-05-19: *"Just like it is compulsory for you to highlight any findings & even asking me to go fix other things outside of scope. It is something that can grow along the way."*

## Findings Register (non-negotiable)

The **Issue Checklist** tracks BA-listed defects. The **Findings Register** is a second standing section in `QA-NNNN.md` for everything else worth not-missing. Two tracked sub-tables — both resolve at every phase boundary, exactly like Issue Checklist rows:

### 4a. BA Questions

`| # | Question | Self-checked? | Status |` — every question for the BA gets its own row.

- **Self-checked? is mandatory** — a question earns a row only after Ruri has done her best to answer it from code / DB / docs first (per the "self-check before asking BA" discipline). The column records what was checked.
- **Status**: `open` / `answered` / `mooted`.
- **Why this exists**: BA-questions used to live as prose in `early-diagnostic.md` — they escaped the phase-boundary loop and could be silently dropped. As tracked rows they cannot. (QA-261986, 2026-05-21.)

### 4b. Radius Findings

`| # | Finding | Disposition |` — the standing home for the "Out-of-scope findings" discipline above. Every finding noticed within ticket radius but outside BA's stated scope gets a row + disposition (do-here / separate-ticket / `out_of_scope_held` / dead-end). The discipline was already non-negotiable; this just gives it a fixed section instead of floating.

Negative test — skip an empty sub-table; never invent rows to fill it.

## Phase-boundary loop (non-negotiable)

At each Quest phase boundary — Phase 0 → Phase 1 entry, Apply-done → みや tests, Phase 1 close → Phase 2 — **every checklist row must resolve** to one of:

- ✅ **done** — mechanism applied AND intent verified (BA / みや's actual want)
- ⚠️ **deferred** — explicit reason + `surfaced to <person> <date>` marker
- ❌ **out-of-scope** — disposition recorded (separate ticket / OOS-held / dead-end)

Rows in `mechanism done — INTENT UNVERIFIED` state **block** advancement. **Loop** — re-trace, re-read primary sources, re-verify the intent. If the loop reveals NEW items (a sister-defect, a missed BA constraint, an un-enumerated writer), they enter as new rows. Phase advancement happens only when the close-column has zero unresolved rows.

When みや says *"start a quest until [phase X] / until I am ready to test"*, the loop must complete THROUGH that named phase — Scout, Recon, Rubric, AND every checklist row resolved — before handing to みや. If anything is ambiguous, loop one more pass before declaring ready.

**Why** (みや 2026-05-19): *"the checklist itself we have to make sure to have gone through rigorous checkings & looping (if necessary) itself to make sure we DO NOT miss anything."*

## Pairs with

- `verify` skill — verify re-checks the checklist's rows at a workflow checkpoint.
- Quest Scout / Recon / Rubric — the checklist is the reference each phase updates.

## Lifecycle

v1 — manual `/checklist` + auto at Quest drafting + auto at generic-task post-planning. みや explicitly authorized auto-fire for this skill (2026-05-19); the auto-fire draws from an ALREADY-CONFIRMED plan, so it is not unconfirmed action. Refinement / further automation reviewed after ≥3 cycles.

---
*Created 2026-05-19 | Tier 3 skill | Proposed by みや, designed by Ruri*
*Refined 2026-05-19 — added "Item source — independent enumeration": checklist items derived from primary sources, not copied from Scout (QA-262039 false-negative slip).*
*Refined 2026-05-21 — added "Findings Register": BA Questions + Radius Findings as tracked sub-tables in QA-NNNN.md, both subject to the phase-boundary loop. BA-questions were prose in early-diagnostic.md and escaped the loop (QA-261986).*
