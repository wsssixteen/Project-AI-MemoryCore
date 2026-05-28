---
name: Etanah environments — env selection is ticket-driven (match where BA tested); AWAM always on mkit/UAT
description: Pick the local env per the ticket (BA's Env line + permohonan ID env) — UAT (mlkuat/et_main_uat) and FAT (mlkfat/etprdmlk/et_main) are BOTH valid local implement+test targets as of 2026-05-28 (FAT restored). EXCEPT AWAM tickets always run on mkit/et_main_mlit, and EXCEPT when みや says "hold" at ticket start (don't switch — parallel-session safety). Flowable alter page lets test apps shift between tugasan steps.
type: feedback
originSessionId: 9a250643-8b07-48d4-8408-3e2fb4b02911
---
**Rule**: Etanah Melaka has multiple Postgres environments. They serve different purposes — never conflate.

**Selection rule (updated 2026-05-28 — FAT restored)**: env is **ticket-driven** — switch the local target to where the BA tested, inferred from the Description `Env:` line + the permohonan ID's environment. UAT and FAT are BOTH valid local implement+test targets now (FAT is no longer simulation-only). **Two overrides**: (1) **AWAM tickets always run on `mkit`/UAT** regardless of where BA reported (FAT-AWAM is not a runnable local env); (2) if **みや says "hold"** when starting a ticket, do NOT switch env — he may be running parallel sessions and a switch would disturb another ticket's testing.

| Env | Host | Database | Schema | When to use |
|---|---|---|---|---|
| **UAT** (`mlkuat`) | 172.30.59.185:5444 | `mlkuat` | `et_main_uat` | **Local implement+test target when the ticket's Env is UAT** (BA tested on UAT, or permohonan ID is a UAT app). Also the read-only SQL-investigation default (data overlaps mkit). |
| **FAT** (`mlkfat`) | 172.30.17.104:5444 | `etprdmlk` | `et_main` | **Local implement+test target when the ticket's Env is FAT** (BA tested on FAT — the common case). Restored 2026-05-28 as a full dev/test target; the earlier "simulation-viewing-only" restriction (2026-05-18 Mock Cutover 1) is LIFTED. |
| `mlit` (`et_main_mlit`) | 172.16.100.197:5444 | `mkit` | `et_main_mlit` | **AWAM local target — ALWAYS.** Any AWAM ticket runs here regardless of where BA reported (FAT-AWAM is not runnable locally). When deploying AWAM locally, `standalone.xml etanahDS` points here. For read-only SQL, use `mlkuat` via MCP (data overlaps; mkit not wired to MCP). |

**AWAM-tested-on-UAT-only rule (hard, 2026-05-11, finalized after 2nd-pass みや confirmation)**: AWAM bugs are simulated on UAT regardless of where BA reported them. FAT-AWAM is NOT a runnable local env. Three things to change when switching to AWAM-UAT mode:
1. `etanahv3\config\environment.properties` → `cas.url=http\://172.30.59.150/etanah-cas` (UAT line uncommented, FAT line commented out)
2. `standalone.xml` → `etanahDS` `<connection-url>` swapped to `jdbc:postgresql://172.16.100.197:5444/mkit?currentSchema=et_main_mlit` (this is the ONLY DB target change — Audit/DMS/DS3 stay on mkit always, env-agnostic)
3. `etanah-awam` repo on branch `mlk/release/fat` (pelupusan repo can sit on `mlk/master` since not deployed)

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
- **Match the ticket's env** (BA's `Env:` line + permohonan ID env) for local implement+test — run `/env-check`, which switches `standalone.xml etanahDS` + `cas.url` + branch to that env. AWAM → always `mkit`/UAT. If みや said "hold" at ticket start → do NOT switch.
- For read-only DB investigation: `mcp__postgres-mlkuat__query` (UAT) or `mcp__postgres-mlkfat__query` (FAT) — query the env that matches the ticket's data.
- When SQL shows insufficient test data at a step → mention flowable alter page as the workaround instead of asking BA/QA for new test data
- When citing schema in code/SQL: `et_main_uat` for UAT, `et_main` for FAT, `et_main_mlit` for AWAM/mkit
- At Phase 0 of any Etanah quest: confirm which environment we're targeting before running SQL

**Origin**: 2026-04-29 — みや flagged this distinction during QA #258022 work after I conflated FAT and UAT in early SQL labelling.

**Update 2026-05-28**: FAT restored as a full local implement+test target (the 2026-05-18 "Mock Cutover 1" UAT-only restriction is lifted). Env selection reverted to **ticket-driven** (match BA's tested env + permohonan ID env). Added the **"hold" parallel-session override** (みや may run multiple sessions; "hold" at ticket start = don't switch env). AWAM→`mkit`/UAT special case unchanged (みや confirmed 2026-05-28). Paired skill updated same day: `.claude/skills/env-check/SKILL.md` (Priority 0 `hold` override + temp-override removal).
