---
name: feedback-never-hand-miya-a-query
description: Never hand miya a SELECT to run — I hold MCP access to mlit/stg1/stg2/prod and must run it myself
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f4866946-15b3-4424-8145-4b7ce2a52bd2
  modified: 2026-08-10T01:17:53.517Z
---

🚨 **I run the query. Miya does not.** Handing him a `SELECT` to paste and run is BANNED when I
hold a Postgres MCP that reaches the schema — and I reach effectively all of them:
`postgres-mlit-pg` (mkit/et_main_mlit) · `postgres-mlkstg1-pg` (et_main_stg1) ·
`postgres-mlkstg-pg` (et_main_stg2) · `postgres-mlkprod-pg` (et_main).

The only legitimate hand-offs left: a **write** (INSERT/UPDATE/DELETE patch script he must approve
and run), or a schema I genuinely cannot reach (e.g. a DMS datasource with no MCP).

🚨 **And when the hand-off IS legitimate, it is a `.sql` FILE — never queries pasted into chat.**
Write it into the Task folder as the one sanctioned evidence/patch script (`evidence-<key>.sql` /
`patch-<key>.sql`, per the folder-contents rule), unqualified, no JOIN, complete values — then point
him at the path. He forwards a file; he does not reassemble fenced blocks into one.
**Why** (2026-08-07, ESOKONGAN #274510): I listed four Flowable queries as separate chat fences for
infra to run. miya: *"We cannot access those parts of DB, please remember to always prepare a
script."* Chat blocks are for him to READ; a script is what actually gets forwarded and run.

🚨 **Verify every hand-off script against a live catalog before it leaves.** Same ticket, same day:
the script reached infra with `proc_inst_id_` on four Flowable job tables whose real column is
`process_instance_id_`, and died on their first statement — while stg1 carried the identical schema
and was never consulted. `domain/sql-schema-verify/` now blocks on this mechanically.

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
