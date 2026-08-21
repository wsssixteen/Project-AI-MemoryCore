---
name: reference_hakmilik_change_map
description: "Table map for changing hakmilik data on the et_main application side — id_hkmlk → hkmlk_pelbagai_id (shared 1:1 key) → ind_hkmlk / ind_hkmlk_pelbagai / ind_mklmt_hkmlk; LUAS + unit live in ind_mklmt_hkmlk, NOT ind_hkmlk(_pelbagai). Registry-side luas is fatmk.hakmilik.luas + kod_uom."
metadata: 
  node_type: memory
  type: reference
  originSessionId: eaeeb227-8b8d-4629-b405-dbe349542930
  modified: 2026-08-21T07:20:30.911Z
---

Changing hakmilik-related data is a **common occurrence** (みや 2026-08-10). This is the linkage map so the next lookup is cheap. Verified on `et_main_stg2` (STG2) 2026-08-10.

## 🚨 CORRECTED 2026-08-21 — `mklmt_hkmlk_id` is NOT `hkmlk_pelbagai_id`

The earlier "1:1 shared key across three tables" claim was **WRONG** and produced a patch against the
wrong rows. Verified on STG2/STG1/mlit 2026-08-21 via `pg_constraint`:

**The real path from `id_hkmlk` to `luas` goes through `ind_versi_dhd`.**

```
ind_hkmlk.hkmlk_id ──fk_ivd_hkmlk_id──► ind_versi_dhd.hkmlk_id
                                        ind_versi_dhd.mklmt_hkmlk_id ──► ind_mklmt_hkmlk.mklmt_hkmlk_id
                                        (flag_aktif = 'Y' picks the CURRENT version)
```

- `mklmt_hkmlk_id` exists in exactly **two** tables: `ind_mklmt_hkmlk` (its PK) and `ind_versi_dhd`.
- **No FK anywhere points at `ind_mklmt_hkmlk`** — the `ind_versi_dhd.mklmt_hkmlk_id` link is undeclared but real.
- `ind_hkmlk.hkmlk_pelbagai_id`'s FK (`fk_ih_hkmlk_pelbagai_id`) targets **`ind_hkmlk_pelbagai`**, which holds
  flags/dates/addresses and **no luas**. Following it to `ind_mklmt_hkmlk` lands on unrelated rows.
- A hakmilik has **many** versi_dhd rows (7 for `040202PM00000298`); only `flag_aktif='Y'` is live.

Proof of divergence (STG2):

| id_hkmlk | hkmlk_pelbagai_id (WRONG) | active mklmt_hkmlk_id (RIGHT) |
|---|---|---|
| 040140PM00000100 | 532090 | 399065 |
| 040202PM00000298 | 80121 | 561020 |
| 040327HSM00001293 | 496931 | 463231 |

Cross-check that proves the right path: the active-version `luas` matches `fatmk.hakmilik.luas` exactly
(86 M² / 1.1914 H / 396 M²); the `hkmlk_pelbagai_id` rows did not.

- `ind_hkmlk` — entry point. Holds the human `id_hkmlk` (e.g. `040140PM00000100`) + `hkmlk_id` (the PK to join on). **No luas here.**
- `ind_hkmlk_pelbagai` — "extras": flags, dates, addresses, pembetulan notes, `id_hkmlk_sebenar`. **No luas here.**
- `ind_versi_dhd` — **the junction**: `hkmlk_id` → `mklmt_hkmlk_id`, versioned, `flag_aktif='Y'` = current.
- `ind_mklmt_hkmlk` — where `luas` + `unit_luas_id` live. PK = `mklmt_hkmlk_id`.

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
**To see/change luas** (application side) — go through `ind_versi_dhd`, NOT `hkmlk_pelbagai_id`:
```sql
select mklmt_hkmlk_id, luas, unit_luas_id
from ind_mklmt_hkmlk
where mklmt_hkmlk_id in (
        select mklmt_hkmlk_id from ind_versi_dhd
        where flag_aktif = 'Y'
          and hkmlk_id in (select hkmlk_id from ind_hkmlk
                           where id_hkmlk in ('<id_hkmlk>', ...)));
```
Set the unit by kod, never by hardcoded number (codes are per-schema):
`unit_luas_id = (select senarai_ahli_kumpulan_id from rjk_senarai_ahli_kumpulan where kod = 'UNIKELH')`

## Patch notes
- Before any UPDATE to `ind_mklmt_hkmlk`, check its `version` + audit columns (`last_modified_by`/`last_modified_date`) and follow the patch discipline (only update what's required; audit columns mirror a sibling / the app standard, nothing identifiable).
- Increasing "luas in hektar" = only rows whose `unit_luas_id` = the Hektar code (2531 on STG2). Rows in Meter Persegi are a different unit — surface the mismatch, don't silently convert.
- Environment target follows [[feedback_staging_schema_stg2]] live pointer (STG2 as of 2026-08-10), not [[feedback_uat_fat_environments]]'s "mlit is PRIMARY".

Related: [[feedback_never_hand_miya_a_query]] · [[feedback_staging_schema_stg2]]
