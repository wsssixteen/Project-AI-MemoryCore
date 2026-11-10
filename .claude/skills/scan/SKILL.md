---
name: scan
description: Static bug-pattern scan of etanah Java — runs PMD (curated bug-only ruleset) + SpotBugs (-high dataflow) on a file or package, surfaces real defects (resource leaks, NPE-order, null derefs, non-short-circuit logic, dead stores, locale-casing) that codegraph/SootUp can't see. Triggers — "/scan", "scan this", "scan <file/package>", "static analysis", "bug scan", "any bugs in X", "check for bugs", "lint the etanah code", during Recon blast-radius on the classes a fix touches.
---

# /scan — static bug-pattern scan

Runs two complementary Java analyzers on an etanah target and merges the findings:

| Tool | Sees | Catches |
|---|---|---|
| **PMD** (curated `bug-ruleset.xml`) | source patterns | resource leaks · NPE-order (`str.equals("x")`) · locale-casing · empty catch · broken/misplaced null-check · assignment-in-operand |
| **SpotBugs** (`-high`, bytecode dataflow) | compiled `target/classes` | null derefs · dead stores · non-short-circuit logic · redundant null-checks |

The default PMD quickstart was ~90% style noise on etanah; this Power uses a **bug-only ruleset** so what comes back is defect-shaped. SpotBugs adds dataflow defects PMD's pattern-matching can't reach. Neither overlaps codegraph/SootUp (those map *structure*, this finds *defects*).

## How to run

```
node domain/scan/scan.js <target> [--record] [--pmd-only|--spotbugs-only] [--base <repo>]
```
- `<target>` = a path under `src/main/java` (file or dir), or a dotted package (e.g. `my.gov.etanah.pelupusan.service.impl`).
- `--record` = append the bug-shaped findings to `domain/scan/known-bugs.jsonl` (status `unverified`).
- SpotBugs needs compiled classes (`target/classes`); if absent it's skipped with a note (run `mvn compile` first, or use `--pmd-only`).
- Tools live at `%LOCALAPPDATA%\etanah-static-analysis` (PMD 7 + SpotBugs 4); `node scan.js --setup` checks them.

## When to use it (where it runs in the workflow)

| Moment | Use |
|---|---|
| **Recon — blast-radius** | `/scan <the package/class the fix touches>` before Apply. Two tools agreeing on a line (like the live PelupusanLiteService:789 NPE) = a real defect near your change. |
| **After cloning/editing a file** | scan the edited class to catch a defect you introduced or a latent one you're now responsible for. |
| **Recording a confirmed bug** | `--record` it → it is stored in `domain/scan/known-bugs.jsonl`. |

Not an always-on gate — it's an on-demand scan (whole-repo runs OOM; per-package fits the blast-radius model). Style/perf rows are de-emphasized (`·` prefix / boxing patterns); **judge harm yourself** — the tool is accurate but not every accurate finding is worth fixing (a benign dead store ≠ a live NPE).

## The known-bug store

`--record` writes findings to `domain/scan/known-bugs.jsonl`. Read it during Recon of a `.java` file. Mark an entry `status:"fixed"` (or delete the row) once resolved. (The auto-surfacing PreToolUse hook was retired 2026-11-10: 0 surfaced in 53,772 runs.)

## Output

A `file:line · tool · rule · message` table, sorted, bug-relevant only. Logs each run to `domain/scan/log.jsonl`. Self-test: `node scan.js --selftest` (PASS = ≥2 of 3 seeded bug-patterns detected).
