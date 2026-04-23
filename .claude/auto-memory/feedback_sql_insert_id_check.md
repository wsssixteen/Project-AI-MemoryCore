---
name: feedback_sql_insert_id_check
description: When reviewing SQL INSERTs with hardcoded primary key IDs, verify whether the column is sequence-managed before accepting the value
type: feedback
originSessionId: e3d9c67e-5925-45bd-9469-654f7593dfb2
---
When a SQL INSERT includes a hardcoded primary key ID, the first check must be: is this column sequence-managed?

**Why:** Missed this during a SQL double-check for QA #257569. Caught that the hardcoded IDs might be stale (wrong MAX), but never questioned whether manual ID assignment was valid at all. The column used `@GeneratedValue(strategy = GenerationType.SEQUENCE)` — inserting a hardcoded ID bypasses the sequence and risks collision.

**How to apply:** Any time a SQL INSERT includes a literal primary key value:
1. Find the entity class (search `my.gov.etanah.domain.*` or the domain sources JAR)
2. Check `@GeneratedValue` on the ID field
3. If sequence-managed → replace hardcoded ID with `nextval('SEQUENCE_NAME')`
4. Update any corresponding rollback DELETE to use business key (`kod`, `nama`, etc.) instead of the ID
