---
name: pre-action-check
description: Use when about to edit quest-related files (1. Tasks/Melaka/, projects/coding-projects/active/QA-*, quest/active.txt, etanah-pelupusan/src, etanah-awam/src) — run the 4 pre-checks before proceeding. Triggers — "pre-action check", "before editing quest file", "did you check before editing", pre-action-check-gate.js firing.
---

# Pre-Action Check

Procedure for what `pre-action-check-gate.js` (PreToolUse Edit|Write hook) reminds about. The hook is advisory-only (injects context, never blocks) — this skill is the actual procedure to run when it fires.

## The 4 pre-checks

| # | Check | Verify by |
|---|---|---|
| 1 | Notes file current | Read `<Task folder>/1. <NNN NNN>.txt` (or legacy `1. Notes.txt`) — confirm test data/login entries match what this edit needs |
| 2 | env verified | `/env-check` confirmed target (mlkuat / mlkfat / mkit) matches ticket's Env field |
| 3 | PDF annotations extracted | `annotations` skill run on every `.pdf` in `0. Brief/` — 1-line emit per file, "no annotations" is a valid explicit state |
| 4 | server-log path known | `E:/Dev/jboss-7.4-plp-melaka/standalone/log/server.log` — confirmed if this edit is for debugging |

If any is "NO" — fire that check BEFORE proceeding with the edit. Not all 4 apply to every edit (e.g. check 4 only for debugging edits) — but each must be explicitly considered, not silently skipped.

## Notes-file canonical write rule

| Rule | Detail |
|---|---|
| Two valid filenames | `1. <NNN NNN>.txt` (current convention, e.g. `1. QA-262762.txt`) OR legacy `1. Notes.txt` (pre-2026-05-31 folders — do not rename in place) |
| Write path | `node quest/notes.js --folder "<Task folder>" --env <UAT|FAT> --urusan <X> --id <permohonan> --user <login> [--reset]` — NEVER hand-write via Edit/Write |
| Why tool-only | Locked 3-line format; hand-editing drifts it (no env/prose/annotations allowed in the file body) |
| Gate enforcement | `pre-action-check-gate.js` DENIES direct Write/Edit on the Notes-file path pattern; only `notes.js` (via Bash/Node fs) can write it |

## Single-canonical-doc note (same hook, separate check)

New quests (post-2026-05-28): all findings go into `QA-<NNN>.md`, not sibling files (`early-diagnostic.md`, `scout-report.md`, `handoff-*.md`, `class-chain-traces.md`, `Fix.txt`). Legacy pre-2026-05-28 quests keep their multi-file pattern — bypass with `[skip-canonical-doc: pre-existing legacy quest]` if the gate fires on one.
