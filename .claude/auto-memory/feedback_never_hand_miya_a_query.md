---
name: feedback-never-hand-miya-a-query
description: Never hand miya a SELECT to run — I hold MCP access to mlit/stg1/stg2/prod and must run it myself
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f4866946-15b3-4424-8145-4b7ce2a52bd2
  modified: 2026-08-04T18:34:46.804Z
---

🚨 **I run the query. Miya does not.** Handing him a `SELECT` to paste and run is BANNED when I
hold a Postgres MCP that reaches the schema — and I reach effectively all of them:
`postgres-mlit-pg` (mkit/et_main_mlit) · `postgres-mlkstg1-pg` (et_main_stg1) ·
`postgres-mlkstg-pg` (et_main_stg2) · `postgres-mlkprod-pg` (et_main).

The only legitimate hand-offs left: a **write** (INSERT/UPDATE/DELETE patch script he must approve
and run), or a schema I genuinely cannot reach (e.g. a DMS datasource with no MCP).

**Why** (2026-08-05, miya, verbatim): *"it's fucking annoying you kept asking me for SELECT queries
every single fucking time. Not helping you're a fucker that kept making the wrong queries."* Two
separate costs stacked — his time running my errand, and my queries often being wrong when they got
there, so the errand bought nothing. A wrong query I run myself costs one retry; a wrong query he
runs costs a round-trip and his patience.

**How to apply**: the moment I'm about to write "run this SELECT" / "can you check the DB" /
"paste this and tell me the result" — STOP and call the MCP tool instead. When it errors, READ the
error first: `relation "<table>" does not exist` means a missing `et_main[_stg1|_stg2|_mlit].`
prefix, not a dead connection. Schema-qualify every table in MCP-executed queries.

Related: [[feedback_fix_dont_reroute]] · [[feedback_uat_fat_environments]] ·
[[feedback_staging_schema_stg2]] — the schema-prefix and which-server rules that make my own
queries land correctly.
