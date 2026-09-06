goal_status: draft (derived from registry on 2026-09-06; promote with node lib/goal-backfill.js promote claude-md-watch)
symptom: 2026-08-16 miya: when we change something we do not only run tests, we set up a thing to OBSERVE the specific things we touched, so next run you self-alert and we amend or revert
goal: reads system/claude-md-watchlist.jsonl (written by lib/watch.js add at change-time); emits each ACTIVE watch: what was changed, what to observe, sessions remaining, and the exact one-line git rollback command anchored to the pre-change SHA
goal_signal: the SessionStart fire produced: reads system/claude-md-watchlist.jsonl (written by lib/watch.js add at change-ti
retention: rotate monthly
# claude-md-watch — THE CLAUDE.md UPDATE SYSTEM (complete pipeline, assembled 2026-08-16)

Any change to `.claude/CLAUDE.md` (and any boot-loaded protocol file) follows this pipeline. Built piecewise during the 2026-08-16 weekend audit; this README is the single assembled reference.

## The pipeline

| Stage | Step | Tool (all exist, all eval-green at assembly) |
|---|---|---|
| **BEFORE** | 1. Derive the checklist for the exact target | `node lib/change-checklist.js .claude/CLAUDE.md` → referencers · evals · gates · rollback line |
| | 2. Structural moves/trims ONLY IF trim-guard green | todo Q1 Trim-guard row: rule-reachability harness + 5-ticket behavioral replay + rollback rehearsal — NO trim without it |
| | 3. Deletions/merges: adversarial pass MANDATORY | blind refuter familiar (checklist step [5]) — 2026-08-16 proof: refuted 6/9 verdicts three self-audits passed |
| **DURING** | 4. Move-don't-rewrite, byte-parity at the new home | one concern per commit (single-revert safety) |
| | 5. Version stamp + changelog entry same edit | CLAUDE.md §Version-bump discipline (unchanged) |
| **AFTER** | 6. Gates re-run | `node .claude/hooks/boot-required-read-gate.js` + `node .claude/hooks/system-audit.js` + `node lib/eval-battery.js` — green-or-classified only |
| | 7. **Register the watch** | `node lib/watch.js add --target .claude/CLAUDE.md --observe "<the SPECIFIC behavior that must still happen>" --sessions 3` — SHA-anchored rollback pre-printed |
| **NEXT BOOTS** | 8. Self-alert until resolved | this Feature's SessionStart hook emits every active watch + its one-line revert; `resolve <id> ok|anomaly` closes it |

## Rollback (the SOLID part)
Every watch row carries the pre-change SHA at add-time. Reverting any change is always exactly:
`git checkout <sha10> -- .claude/CLAUDE.md` — printed in every boot alert, never hunted for.

## Observability (the ROBUST part)
- watch ledger `system/claude-md-watchlist.jsonl` — append-only, resolutions are rows not edits
- battery telemetry `system/telemetry/eval-battery.jsonl` — one row per full run
- quarantine `system/eval-quarantine.jsonl` — non-green evals classified, never silently skipped
- boot alert repeats until a human-attested `resolve` lands — an unobserved change cannot go quiet

## What still gates the big trim
CLAUDE.md §8 bodies (18KB) + version-history bulk (9KB) move ONLY after the trim-guard harness
(todo Q1) runs green. This pipeline is the ceremony; the harness is the proof. Neither substitutes the other.
