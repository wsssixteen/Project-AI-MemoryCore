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
