---
name: feedback_data_question_db_first
description: "Confirmed-etanah DATA question (\"is X in the list\", \"does id Y exist\", \"check the value\") → hit the DB FIRST + prepare a script-check, using etanah DATABASE.md for table clues; don't code-trace first"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 798ac8d3-7c79-4a74-88b3-8a714e7fe88a
  modified: 2026-08-26T03:08:11.823Z
---

🚨 When a question is a **data question** AND confirmed etanah-related — "boleh check tak id ni ada tak dalam list", "does X exist", "check the value of Y", "is Z in the table" — **go straight to the DB and prepare a script-check FIRST.** Refer to etanah `DATABASE.md` (+ `entity_table_map.json` / etanah-knowledge) for the table/column clues, then query with the MCP (I hold mlit/stg/prod access — I run it, never hand a SELECT per [[feedback_never_hand_miya_a_query]]).

**Why:** み 2026-08-26 (jabatan-teknikal-list bug, BA asked "boleh check tak id ni JKR tu ada tak dalam list Jabatan Teknikal dia?"). A data question has a data answer — the DB settles it in one query. Long code-archaeology before touching the DB burns み's time when the row was one SELECT away.

**How to apply:**
1. Classify the ask: is the answer a ROW / VALUE / EXISTENCE fact? → data question → DB-first.
2. Resolve the table from DATABASE.md / entity_table_map (not by grepping @Table names — they're prefix-split), then query immediately.
3. Code-trace ONLY as far as needed to learn the exact FILTER when the "list" isn't a plain table (e.g. here: the list = `rjk_organisasi` where `jns_organisasi_id` = SAK `JNS_AGNSI_KRJAAN` with a linked `rjk_agensi`). One targeted read for the filter, then back to the DB — don't trace the whole render path first.
4. Answer per env in separate tables ([[feedback_per_env_separate_tables]]); agensi_id is schema-specific ([[feedback_never_delete_ind_tables]] neighbour — see PROD vs stg2 name mismatch on agensi_id 8/22).

Pairs with [[feedback_show_evidence_script_or_code]] (show the runnable SQL) and the `script-check` skill.
