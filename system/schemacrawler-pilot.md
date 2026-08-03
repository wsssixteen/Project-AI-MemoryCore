# SchemaCrawler pilot (audit R3 / G4) — env-blocked on this machine, ready-to-run doc

**Goal**: deterministic entity↔schema validation — kills the highest-frequency fabrication class
(guessed table/column names) by making the honest path one command.

| Probe (2026-07-13, this machine) | Result |
|---|---|
| Java | ✓ OpenJDK 17.0.18 (Temurin) |
| SchemaCrawler on PATH | ✗ not installed |
| `E:\Dev` (work-machine layout) | ✗ absent — this is the personal laptop; etanah + JBoss live on the WORK machine |
| DB reachability | UAT/FAT MCP routes exist in sessions; SchemaCrawler needs direct JDBC (postgres driver) |

**Run recipe (work machine, ~30 min)**:
1. Download SchemaCrawler (zip distribution, needs みや's download approval) → `E:\Dev\schemacrawler\`
2. `schemacrawler --server=postgresql --host=<uat-host> --database=<db> --schemas=et_main_uat --user=et_read --command=schema --output-format=json --output-file=system/schema-snapshot-uat.json`
3. Cross-check script (to be forged post-download): parse `@Table`/`@Column` from etanah-domain JARs (javap, proven in QA-269437) vs the snapshot → mismatch table.
4. Wire into the quest skill's DB rows as "tool ran + output attached" (replaces prose-trust).

**Status**: ⬜ blocked-on-env — needs みや (work machine + download nod). Everything else in this file is ready.
