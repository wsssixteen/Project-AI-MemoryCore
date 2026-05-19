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
| Quest | AUTO — created during Quest drafting, right after Redmine retrieval / Scout, into `QA-NNNN.md` |
| Generic task | AUTO — fires once planning is done, as execution begins |
| Manual | `/checklist`, "make a checklist", "list the items first" |

Negative test — skip trivial single-step tasks. Don't checklist a one-liner.

## Format

`| # | Item | <phase columns> | Status |` — emitted as a raw markdown table.

Phase columns adapt to task type — quest: Scout / Recon / Rubric / Apply / Tested. Generic task: Planned / Done / Verified.

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

## Pairs with

- `verify` skill — verify re-checks the checklist's rows at a workflow checkpoint.
- Quest Scout / Recon / Rubric — the checklist is the reference each phase updates.

## Lifecycle

v1 — manual `/checklist` + auto at Quest drafting + auto at generic-task post-planning. みや explicitly authorized auto-fire for this skill (2026-05-19); the auto-fire draws from an ALREADY-CONFIRMED plan, so it is not unconfirmed action. Refinement / further automation reviewed after ≥3 cycles.

---
*Created 2026-05-19 | Tier 3 skill | Proposed by みや, designed by Ruri*
