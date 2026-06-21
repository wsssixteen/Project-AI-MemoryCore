# Power: scan — static bug-pattern detection for etanah

**Capability we lacked.** codegraph / SootUp / etanah-codemap map *structure* (symbols, call-graph, flows). None find *defects*. `/scan` adds that layer: PMD (curated bug-only ruleset on source) + SpotBugs (`-high` bytecode dataflow on `target/classes`), merged into a bug-focused table.

## Pieces

| File | Role |
|---|---|
| `../../.claude/skills/scan/SKILL.md` | the invocable `/scan` skill (procedure) |
| `scan.js` | the runner — resolves target, runs both tools, merges, prints, `--record`s, `--selftest`s |
| `bug-ruleset.xml` | curated PMD ruleset — error-prone bug-classes only, no style noise |
| `known-bug-surfacer.hook.js` | PreToolUse Read\|Edit\|Write — surfaces recorded known-bugs for a file the moment you touch it |
| `known-bugs.jsonl` | the store — `/scan --record` appends; surfacer reads; mark `status:"fixed"` when resolved |
| `log.jsonl` | instrumentation (every run + every surfacer fire) |

Tools live at `%LOCALAPPDATA%\etanah-static-analysis` (PMD 7.25 + SpotBugs 4.10), out of the repo (no OneDrive bloat). `node scan.js --setup` checks them.

## What fires when

- **`/scan <file|package>`** — manual, on the blast-radius during Recon, or after editing a class. Skill-triggered.
- **known-bug-surfacer** — deterministic, on every Read/Edit/Write of a `.java` file that has a recorded known-bug. Advisory, fail-open.

## Evidence it works (2026-06-22 spike)

- Selftest: PASS (3/3 seeded bug-patterns detected).
- Live on `PelupusanLiteService.java`: **both tools independently flagged line 789** (PMD `BrokenNullCheck` "will throw NullPointerException" + SpotBugs `NS` non-short-circuit logic) — a real latent-NPE; plus empty catch blocks, NPE-order, dead store, locale-casing.
- Noise verdict: PMD default quickstart = ~90% style noise (377/16 files) → the curated `bug-ruleset.xml` is why this Power is defect-shaped, not noise.

## Decay / audit

Per `/system-rules` Rule 3: if `log.jsonl` shows /scan unused for 60 days, reconsider. Per Rule 5: every run + surfacer fire is logged. The tools auto-stay current only by manual re-download (pin: PMD 7.25, SpotBugs 4.10).
