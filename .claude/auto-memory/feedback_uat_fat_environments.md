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
| `mlit` (`et_main_mlit`) | 172.16.100.197:5444 | `mkit` | `et_main_mlit` | JBoss standalone awam-module testing. Niche — skip unless explicitly testing awam. |

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
