goal_status: draft (derived from hook-header on 2026-09-06; promote with node lib/goal-backfill.js promote scan)
symptom: not recorded at birth (pre-Rule-13 feature)
goal: /scan finds real defects in etanah Java (PMD + SpotBugs) and records confirmed ones in `domain/scan/known-bugs.jsonl`.
goal_signal: a fire on: its trigger
retention: rotate monthly
# Power: scan — static bug-pattern detection for etanah

**Capability we lacked.** codegraph / SootUp / etanah-codemap map *structure* (symbols, call-graph, flows). None find *defects*. `/scan` adds that layer: PMD (curated bug-only ruleset on source) + SpotBugs (`-high` bytecode dataflow on `target/classes`), merged into a bug-focused table.

## Pieces

| File | Role |
|---|---|
| `../../.claude/skills/scan/SKILL.md` | the invocable `/scan` skill (procedure) |
| `scan.js` | the runner — resolves target, runs both tools, merges, prints, `--record`s, `--selftest`s |
| `bug-ruleset.xml` | curated PMD ruleset — error-prone bug-classes only, no style noise |
| `known-bugs.jsonl` | the store — `/scan --record` appends; mark `status:"fixed"` when resolved |
| `log.jsonl` | instrumentation (every run) |

Tools live at `%LOCALAPPDATA%\etanah-static-analysis` (PMD 7.25 + SpotBugs 4.10), out of the repo (no OneDrive bloat). `node scan.js --setup` checks them.

## What fires when

- **`/scan <file|package>`** — manual, on the blast-radius during Recon, or after editing a class. Skill-triggered.
- The `known-bug-surfacer` PreToolUse hook was retired 2026-11-10: 53,772 runs, 0 surfaced since telemetry began 2026-07-12 (3 rows, all 2026-07-08).

## Evidence it works (2026-06-22 spike)

- Selftest: PASS (3/3 seeded bug-patterns detected).
- Live on `PelupusanLiteService.java`: **both tools independently flagged line 789** (PMD `BrokenNullCheck` "will throw NullPointerException" + SpotBugs `NS` non-short-circuit logic) — a real latent-NPE; plus empty catch blocks, NPE-order, dead store, locale-casing.
- Noise verdict: PMD default quickstart = ~90% style noise (377/16 files) → the curated `bug-ruleset.xml` is why this Power is defect-shaped, not noise.

## Decay / audit

Per `/system-rules` Rule 3: if `log.jsonl` shows /scan unused for 60 days, reconsider. Per Rule 5: every run is logged. The tools auto-stay current only by manual re-download (pin: PMD 7.25, SpotBugs 4.10).
