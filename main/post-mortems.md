# main/post-mortems.md — MIGRATED 2026-06-01

> ⚠ This file's content has been migrated into per-quest archive docs.
> Each `### <ticket> — <name> — <date>` entry moved to `projects/coding-projects/archive/<ticket-key>/<ticket-key>.md` as a `## Post-Mortem (migrated ...)` section.
> 
> Migration script: `quest/migrate-post-mortems.js` (idempotent — safe to re-run).
> Migration date: 2026-06-01.
> Entries migrated: 37.

## Lookup

Per-quest doc lives at `projects/coding-projects/archive/<KEY>/<KEY>.md`. Key normalization:

- `QA-NNNNNN` → `QA-NNNNNN`
- `PPJK #NNN` / `PRZ #NNN` → `PPJK-NNN` / `PRZ-NNN`
- `FAT-OR-NNN` / `UAT-CR-NNN` → preserved as-is
- `QA-NNN cycle K` → `QA-NNN` (cycle preserved in section heading)

## Why migrated

Per CLAUDE.md v1.40, per-quest detail belongs in the single canonical `QA-NNN.md` doc, not in a flat 1115-line append-only file. This migration retires the flat file and consolidates record-of-truth at the per-ticket level.

## Original heading

Pre-migration this file was the post-mortem registry maintained by Domain Expansion Step 3.5 (now retired per みや 2026-06-01).

## QA-281712 — 2026-09-28 — Portal Awam PLTP syer check (mixed denominators)
- META in `projects/coding-projects/archive/QA-281712/QA-281712.md` (Post-mortem META + Fastest Path).
- Contributing: two AWAM syer checks add numerators, not fractions · "seterusnya" in the ticket meant the dialog button, not the page button.
- Process: adhoc saved before the ticket → no re-Scout · int-env cherry-pick conflict with an env-only variant · local test waived, server test passed first deploy.
- Carry forward: apps `validateSyer()` Double rounding false warning (LATENT L14).

## QA-288533 — PRBB PROD: 3 resit on the wrong permohonan id (closed 2026-11-10)
- Cause: counter receipts recorded under the wrong ID Permohonan, so the fee stayed unpaid and the flow sat before Borang 4Ce.
- Fix: PROD data patch (3 UPDATE) by infra + one Flowable alter; no code.
- Lesson: the adhoc→ticket promote step never created the ticket's own quest doc; I proposed loosening a gate instead of adding the missing step. Fixed at the cause step 2026-11-10 (adhoc-lifecycle promote, eval F4b F4c); CLAUDE.md rule 11 born from it.
