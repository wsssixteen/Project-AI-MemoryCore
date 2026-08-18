---
name: feedback_per_env_separate_tables
description: "Multi-environment / multi-source findings → ONE separate table per env, env named up-front; never merge into one table or prose"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 894bdc10-5066-4f20-ad22-04e375c0e186
  modified: 2026-08-18T01:00:21.861Z
---

🚨 When a finding or comparison spans MORE THAN ONE environment (STG / IT-mlit / FAT / PROD / stg1 vs stg2), present it as **one separate table per environment**, with the environment named in the table heading — and **state up-front which env each conclusion is drawn from** BEFORE the tables.

**Why:** miya reads per-env. Lumping envs into a single table with an "env" column, or blurring them in prose, forces him to untangle which fact came from where. He set the separation rule in CLAUDE.md (one register per container, tables carry the load) and had to correct me repeatedly on ticket 265414 (2026-08-18) — first I gave prose, then too-few tables, then a merged table.

**How to apply:**
- 3 envs checked → 3 tables (or exactly the ones checked), each headed with the env name (`**STG (et_main_stg2)**`, `**IT (mlit)**`, `**PROD**`).
- First line names WHERE the conclusion comes from ("Conclusion from STG + IT; not FAT/PROD").
- Use TABLES generously — they are the default carrier for any comparison, not a last resort. Under-using tables when data is tabular is itself the violation.
- Same discipline for any multi-source split (per-urusan, per-scope, per-schema), not only envs.

Related: [[feedback_staging_schema_stg2]] (stg1 vs stg2 are distinct — echo which), [[feedback_show_diagram_for_issues]], [[feedback_two_sentence_default]].
