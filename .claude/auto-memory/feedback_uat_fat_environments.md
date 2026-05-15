---
name: Etanah environments — UAT is for local, FAT is for simulation only
description: Distinguish UAT (mlkuat, schema et_main_uat — local JBoss target) from FAT (mlkfat/etprdmlk, schema et_main — only used to view BA-shared ticket data). Flowable alter page lets test apps shift between tugasan steps.
type: feedback
originSessionId: 9a250643-8b07-48d4-8408-3e2fb4b02911
---
**Rule**: Etanah Melaka has multiple Postgres environments. They serve different purposes — never conflate.

| Env | Host | Database | Schema | When to use |
|---|---|---|---|---|
| **UAT** (`mlkuat`) | 172.30.59.185:5444 | `mlkuat` | `et_main_uat` | **Local testing default.** みや's local JBoss `etanahDS` points here (see standalone.xml). All Phase 1 verification + most SQL investigations happen here. |
| **FAT** (`mlkfat`) | 172.30.17.104:5444 | `etprdmlk` | `et_main` | **Simulation viewing only.** Use when BA/QA shares an `id_pengenalan` in a ticket and we need to see what they see. NOT for active dev testing. |
| `mlit` (`et_main_mlit`) | 172.16.100.197:5444 | `mkit` | `et_main_mlit` | **AWAM-UAT primary for LOCAL JBoss `etanahDS`** (confirmed 2026-05-11 second-pass). When deploying AWAM locally, `standalone.xml etanahDS` must point here. Distinct from DB-query path: for read-only SQL investigations, use `mlkuat` via MCP (data overlaps; mkit not wired to MCP). |

**AWAM-tested-on-UAT-only rule (hard, 2026-05-11, finalized after 2nd-pass みや confirmation)**: AWAM bugs are simulated on UAT regardless of where BA reported them. FAT-AWAM is NOT a runnable local env. Three things to change when switching to AWAM-UAT mode:
1. `etanahv3\config\environment.properties` → `cas.url=http\://172.30.59.150/etanah-cas` (UAT line uncommented, FAT line commented out)
2. `standalone.xml` → `etanahDS` `<connection-url>` swapped to `jdbc:postgresql://172.16.100.197:5444/mkit?currentSchema=et_main_mlit` (this is the ONLY DB target change — Audit/DMS/DS3 stay on mkit always, env-agnostic)
3. `etanah-awam` repo on branch `mlk/release/uat` (pelupusan repo can sit on `mlk/master` since not deployed)

**One WAR per JBoss instance** (2026-05-11 confirmation): JBoss runs ONE WAR at a time. To switch from awam ↔ pelupusan: stop JBoss → remove currently-deployed WAR → `mvn clean install` on target repo → copy fresh WAR to `standalone\deployments\` → clean `tmp\*` + `data\*` → start JBoss. Same-app env switch (e.g. pelupusan-UAT ↔ pelupusan-FAT, both running etanah-pelupusan.war) is config-only: stop → clean tmp+data → start, no rebuild.

**JNDI-rename mechanic for etanahDS** (2026-05-11 2nd-pass confirmation, supersedes any prior "swap connection-url" wording): All 3 candidate datasources stay permanently present in standalone.xml — switching is done by renaming the JNDI alias suffixes, NOT by editing connection-url values. The DS that should be active gets `jndi-name="java:jboss/datasources/etanahDS"` + `pool-name="etanahDS"` (NO suffix); the other two get `etanahDS2` and `etanahDS3` (assignment of 2 vs 3 is arbitrary). Switching is `Edit` on 2 attributes × 3 datasource blocks = 6 attribute edits total. Default = FAT-PLP (etprdmlk) because most tickets are FAT; UAT-PLP only if FAT lacks data OR BA explicitly states UAT; AWAM-UAT (mkit) for any AWAM ticket regardless of where BA reported.

For READ-ONLY DB queries during investigation: use `mcp__postgres-mlkuat__query` against `mlkuat`/`et_main_uat` for both pelupusan-UAT and AWAM-UAT data — the rizab/master data overlaps mkit enough. If a candidate value fails in the AWAM portal, it's a mkit-only gap; ask みや for direct SQL access (no mkit MCP wired).

**MCP wiring** (already configured 2026-04-29):
- `mcp__postgres-mlkuat__query` → UAT
- `mcp__postgres-mlkfat__query` → FAT
- Both use `et_reporting` + `etanah123`, wrapper enforces `transaction_read_only=on`

**Flowable alter page (in-house tool)**:
みや can shift any existing application back/forth between tugasan steps using the in-house flowable alter page. This means:
- Test data doesn't need to be currently AT the desired step
- Pick any application of the right urusan, alter it to the step we need
- This applies broadly — when test data is sparse (e.g. only 2 of 7 Lite urusan have active SMB), we can use any other application of the missing urusan and alter it forward

**How to apply**:
- Default to UAT (`et_main_uat` schema, `mcp__postgres-mlkuat__query`) for any Etanah investigation unless reason to use FAT
- When SQL shows insufficient test data at a step → mention flowable alter page as the workaround instead of asking BA/QA for new test data
- When citing schema in code/SQL: `et_main_uat` for local testing, `et_main` for FAT/simulation
- At Phase 0 of any Etanah quest: confirm which environment we're targeting before running SQL

**Origin**: 2026-04-29 — みや flagged this distinction during QA #258022 work after I conflated FAT and UAT in early SQL labelling.
