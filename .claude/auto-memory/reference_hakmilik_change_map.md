---
name: reference_hakmilik_change_map
description: "Table map for changing hakmilik data on the et_main application side — id_hkmlk → hkmlk_pelbagai_id (shared 1:1 key) → ind_hkmlk / ind_hkmlk_pelbagai / ind_mklmt_hkmlk; LUAS + unit live in ind_mklmt_hkmlk, NOT ind_hkmlk(_pelbagai). Registry-side luas is fatmk.hakmilik.luas + kod_uom."
metadata: 
  node_type: memory
  type: reference
  originSessionId: eaeeb227-8b8d-4629-b405-dbe349542930
  modified: 2026-08-10T02:25:53.956Z
---

Changing hakmilik-related data is a **common occurrence** (みや 2026-08-10). This is the linkage map so the next lookup is cheap. Verified on `et_main_stg2` (STG2) 2026-08-10.

## The shared key (1:1 across three tables)
`ind_hkmlk.hkmlk_pelbagai_id` **=** `ind_hkmlk_pelbagai.hkmlk_pelbagai_id` **=** `ind_mklmt_hkmlk.mklmt_hkmlk_id`

- `ind_hkmlk` — entry point. Holds the human `id_hkmlk` (e.g. `040140PM00000100`) + `hkmlk_pelbagai_id`. **No luas here.**
- `ind_hkmlk_pelbagai` — "extras": flags, dates, addresses, pembetulan notes, `id_hkmlk_sebenar`. **No luas here.**
- `ind_mklmt_hkmlk` — **the master info row; this is where `luas` + `unit_luas_id` live.** PK = `mklmt_hkmlk_id` (same number as `hkmlk_pelbagai_id`).

## Where LUAS actually lives
| Side | Table | luas column | unit column |
|---|---|---|---|
| Application (et_main) | `ind_mklmt_hkmlk` | `luas` | `unit_luas_id` → `rjk_senarai_ahli_kumpulan.senarai_ahli_kumpulan_id` |
| Registry / source (mkit) | `fatmk.hakmilik` | `luas` (+ `luas_alternatif`, `luas_lama`) | `kod_uom` → `fatmk.kod_uom` |

**unit_luas_id codes are per-schema — re-verify per env.** On STG2: `2531`=Hektar (`UNIKELH`), `2532`=Meter Persegi (`UNIKELMP`).
**kod_uom codes** (`fatmk.kod_uom`, kump='Luas'): `H`=Hektar, `M`=Meter Persegi, `P`=Ekar, `K`/`F`=Kaki Persegi, `A`=Ekar, `E`/`D`/`R`=compound units. These are the source-registry values; they do NOT match the application `unit_luas_id` numbers.

## Lookups
**みや's legit linkage query** (returns the pelbagai row per hakmilik — confirmed valid, but note it does NOT show luas):
```sql
select * from ind_hkmlk_pelbagai ihp
where ihp.hkmlk_pelbagai_id in
(select ih.hkmlk_pelbagai_id from ind_hkmlk ih where ih.id_hkmlk in ('<id_hkmlk>', ...));
```
**To see/change luas** (application side), swap to the mklmt table on the same key:
```sql
select mhk.mklmt_hkmlk_id, mhk.luas, mhk.unit_luas_id
from ind_mklmt_hkmlk mhk
where mhk.mklmt_hkmlk_id in
(select ih.hkmlk_pelbagai_id from ind_hkmlk ih where ih.id_hkmlk in ('<id_hkmlk>', ...));
```

## Patch notes
- Before any UPDATE to `ind_mklmt_hkmlk`, check its `version` + audit columns (`last_modified_by`/`last_modified_date`) and follow the patch discipline (only update what's required; audit columns mirror a sibling / the app standard, nothing identifiable).
- Increasing "luas in hektar" = only rows whose `unit_luas_id` = the Hektar code (2531 on STG2). Rows in Meter Persegi are a different unit — surface the mismatch, don't silently convert.
- Environment target follows [[feedback_staging_schema_stg2]] live pointer (STG2 as of 2026-08-10), not [[feedback_uat_fat_environments]]'s "mlit is PRIMARY".

Related: [[feedback_never_hand_miya_a_query]] · [[feedback_staging_schema_stg2]]
