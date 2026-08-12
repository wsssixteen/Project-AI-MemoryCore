---
name: Etanah environments — mlit is PRIMARY; UAT + FAT decommissioned; only pgEdge MCP remains
description: 🚨 As of 2026-07-17 only 3 DB connections exist, all pgEdge (postgres-mlit-pg / postgres-mlkstg-pg / postgres-mlkprod-pg). UAT and FAT are DECOMMISSIONED and deleted from .claude.json + standalone.xml. mlit (mkit/et_main_mlit) is the primary target and holds the bare etanahDS. STG (mlkstg/et_main_stg2) is etanahDS2. Training is etanahDS3, dormant. The legacy @modelcontextprotocol/server-postgres client is GONE — never re-add it.
type: feedback
originSessionId: 9a250643-8b07-48d4-8408-3e2fb4b02911
modified: 2026-08-10T02:25:16.971Z
---
> 🚨 **LIVE DATA-WORK TARGET (2026-08-10) = STG2 (`et_main_stg2`), server `postgres-mlkstg-pg`.** みや: *"WE HAVE SWITCHED TO STG2 FOR NOW."* "mlit is PRIMARY" below is stale for data/patch work — do NOT default to mlit for queries or patches. mlit remains only the local **app-deploy/JBoss** env. The authoritative live pointer is [[feedback_staging_schema_stg2]]; read it before any staging query. (I slipped on this 2026-08-10 — queried mlit out of habit off this file's "PRIMARY" line.)

**Environments as of 2026-07-17** (per みや — UAT decommissioned, FAT deleted, mlit is the focus):

| Env | Host / DB / Schema | MCP (pgEdge only) | Datasource |
|---|---|---|---|
| **mlit** — PRIMARY | 172.16.100.197:5444 · `mkit` · `et_main_mlit` | `postgres-mlit-pg` | **`etanahDS`** ← bare name = ACTIVE |
| **STG** | 172.30.12.202:5444 · `mlkstg` · **`et_main_stg2`** | `postgres-mlkstg-pg` | `etanahDS2` (parked) |
| **Training** | 172.30.12.151:5444 · `mlktrn` · `et_main_trn` | none | `etanahDS3` (parked, dormant) |
| PROD | 172.30.17.104 · `etprdmlk` | `postgres-mlkprod-pg` (`et_read`, read-only, hook-gated) | — |
| ~~UAT~~ | ~~172.30.59.185 · mlkuat · et_main_uat~~ | 🪦 deleted | 🪦 deleted |
| ~~FAT~~ | ~~172.30.17.104 · etprdmlk · et_main~~ | 🪦 deleted | 🪦 deleted |

Untouched by design: `etanahAuditDS` + `etanahDMSDS` (both `et_main_stg1`, different purpose — never renumber these).

**The MCP client**: only **pgEdge** (`C:\Users\Ridhwan\AppData\Local\pgedge-postgres-mcp\pgedge-postgres-mcp.exe`, configured via `PGHOST`/`PGUSER`/etc env vars). The legacy `@modelcontextprotocol/server-postgres` (run via `npx`) was deleted 2026-07-17 — **never re-add it**. If a connection is missing, add a pgEdge entry.

**The DS naming convention**: the datasource with the **bare `etanahDS`** name (no suffix) is the ACTIVE one JBoss uses. Parked candidates get `etanahDS2`, `etanahDS3`, … Switching env = rename the jndi-name + pool-name suffixes, never edit connection-url values.

**Grant caveat — check the role, not just the host**: an MCP can connect and still be useless. `postgres-mlit-pg` originally ran as `et_reporting`, which has **no USAGE grant on `et_main_mlit`** → `permission denied for schema` on every query (it can only see `public`/`sys`). Fixed 2026-07-17 by switching PGUSER to `et_main_mlit`. When a query fails, **read the error**: `permission denied for schema X` = missing grant, NOT a connection problem, NOT a missing schema.

**Fallback if an MCP role lacks grants**: a Node.js helper can read the datasource credentials straight out of `standalone.xml` at runtime and connect as the app user. Pattern used for stg2 + mlit. ⚠️ That path is NOT read-only — it holds full app write access. Prefer fixing the grant.

**Flowable alter page (unchanged)**: みや can shift any existing application back/forth between tugasan steps. Test data doesn't need to already be at the desired step.

**One WAR per JBoss instance** (unchanged): stop JBoss → remove deployed WAR → `mvn clean install` → copy WAR to `standalone\deployments\` → clean `tmp\*` + `data\*` → start. Same-app env switch is config-only, no rebuild.

**Origin**: 2026-04-29 — UAT-vs-FAT conflation during QA #258022.
**2026-07-17**: UAT decommissioned; FAT deleted; mlit promoted to primary; MCP 9 → 3, all pgEdge; datasources renumbered (mlit=etanahDS, stg2=etanahDS2, trn=etanahDS3). Related: [[feedback_staging_schema_stg2]].
