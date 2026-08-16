# DATABASE.md

# Etanah Melaka — Database Schema Knowledge Base

> **SCOPE**: PostgreSQL schema knowledge — `et_main` / `et_flowable` / `et_sistem` / `et_dms`, table+column names from SQL exports, `_p_`/`_a_` layer semantics, authoritative pemohon/hakmilik/permit references, verified SQL patterns.
> **NOT FOR**: Java repository class internals, SQL performance tuning, DB migrations.

*Source: TDD SQL exports at `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\Database\Melaka\` — three environments: `MLIT/`, `MLKFAT/`, `MLKUAT/`. FAT is authoritative for FAT-phase tickets.*
*FAT schema files: `et_main.sql`, `et_flowable17.sql`, `et_sistem.sql`, `et_dms.sql` (no `_mlit` suffix in FAT).*
*Environment: PostgreSQL.*
*Last updated: 2026-04-20 (PLP full table list confirmed via DB query; ind_* table names from JRXML scan; `_a_` ≠ approved clarification added; pemohon table = `umm_a_pihak_bkptg`)*

> **How to use this file**
> 
> - Paste into Claude context at the start of any DB investigation session
> - `[VERIFY]` = not yet confirmed against live data
> - Column names here are sourced directly from SQL exports — trust these over assumptions

---

## 1. Database Overview

The Etanah system uses **four separate PostgreSQL schemas/databases**:
| Schema | Purpose | Key Prefix |
|---|---|---|
| `et_main` | Core application domain — all land transactions, applications, workflow | `umm_`, `ind_`, `rjk_`, `dft_`, `plp_`, `str_`, `hsl_`, `pcp_` |
| `et_flowable` | Flowable workflow engine — process instances, tasks, history | `act_*` |
| `et_sistem` | System/platform layer — audit, monitoring, BPM callbacks, Spring Batch | `pt_*`, `batch_*` |
| `et_dms` | Document management — templates, documents, revisions | `ind_templat`, `dokumen`, `folder`, `pengguna` |
**For PLU (Pelupusan) work, you mostly touch `et_main`.**

---

## 2. Application Flow — `_p_` vs `_a_` layers

> **This is a system-wide convention — applies to ALL module prefixes, not just `umm_*`.**

| Layer | Indicator | Belongs to | Examples |
|---|---|---|---|
| Pre-application / AWAM submission | `_p_` | etanah-awam (public portal) | `umm_p_hkmlk`, `plp_p_pelupusan`, `str_p_strata` |
| Processed / PLU internal | `_a_` | etanah-pelupusan (internal officers) | `umm_a_hkmlk`, `plp_a_pelupusan`, `str_a_strata` |

```
Applicant (etanah-awam)          PLU Officer (etanah-pelupusan)
────────────────────────         ──────────────────────────────
umm_p_aplikasi                   umm_aplikasi  (promoted)
umm_p_hkmlk        ──submit──►  umm_a_hkmlk
umm_p_permohonan_tnh             umm_a_permohonan_tnh
umm_p_rizab                      umm_a_rizab
plp_p_pelupusan                  plp_a_pelupusan
```

> **⚠️ `_a_` ≠ "approved/final"**: `_a_` means the application was received by the PLU internal module — it can still be rejected inside PLU. `AppPelupusan` Java class = entity for PLU-received application (maps to `plp_a_pelupusan`). Do not equate the AWAM→PLU handoff with final approval.

**Promotion mechanism — SPOC Integration [VERIFY with seniors]:**
When an application is submitted from AWAM, a Flowable service task (`SpocIntegrationServiceTask`) is believed to trigger automatically and copy `_p_` data into `_a_` tables. Confirmed classes exist in etanah-pelupusan:
- `SpocIntegrationServiceTask.java` — base
- `MlkSpocIntegrationServiceTask.java` — Melaka-specific
- `MlkPelupusanSpocIntegrationServiceTask.java` — Melaka PLU
- `PelupusanSpocService.java`

If this is the mechanism, the promotion bug (data in `_p_` but not `_a_`) would be fixed in the SPOC service task, not in AWAM form code.

**Investigation order — always follow this:**
1. Check `_p_` layer — was data submitted correctly from AWAM?
2. Check `_a_` layer — was it promoted/copied correctly via SPOC?
3. Then check code — confirm where the fix belongs (AWAM form vs SPOC task vs both)

| `_p_` result | `_a_` result | Conclusion |
|---|---|---|
| Empty | Empty | AWAM form gap — field never captured at submission |
| Has data | Empty | Promotion bug — copy step from `_p_` → `_a_` is missing |
| No row (old record) | Empty | Data migration gap — record predates AWAM; no fix needed in code |

**Data migration note:** Some records were migrated from a previous system and never went through AWAM submission. These will have no `_p_` row at all. Empty `_a_` in this case is expected — not a bug.

---

## 2b. Anti-Fabrication Facts — things Ruri will wrongly assume if she doesn't read this

> **Header renamed 2026-04-15** from *"Critical Schema Facts (Corrections from Past Mistakes)"* to *"Anti-Fabrication Facts"* — makes the purpose loud without ⚠️ banners. Entries here exist because Ruri has *already been wrong* on these. Read before writing SQL.
>
> **Verification rule**: before using any `umm_a_*` / `umm_p_*` / `plp_*` table in a query, confirm it exists by grepping the FAT dump: `Grep "CREATE TABLE <name>" C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\Database\Melaka\MLKFAT\et_main.sql`. Pattern-symmetry from another bestiary entry is NOT evidence.

These were confirmed from the SQL exports. Never assume otherwise:
| Fact | Correct | Wrong Assumption to Avoid |
|---|---|---|
| Urusan code on `umm_aplikasi` | **No `urusan_kod` column** — join to `ind_ursn` via `ursn_id` | `umm_aplikasi.urusan_kod` does not exist |
| Parent application link | `hubungan_aplikasi_id` | ~~`hubungan_id`~~ |
| FK from `umm_a_rizab` to permohonan tanah | `a_permohonan_tnh_id` references `umm_a_permohonan_tnh(a_permohonan_tnh_id)` | ~~`app_permohonan_tanah_id`~~ |
| Urusan lookup pattern | Always JOIN `umm_aplikasi` → `ind_ursn` on `ursn_id` | Never filter by urusan_kod on umm_aplikasi directly |
| `umm_aplikasi` FK to self (parent) | `hubungan_aplikasi_id` references `umm_aplikasi(aplikasi_id)` | |
| **Pemohon data location** (2026-04-15 — QA #255773 resolved) | **Pemohon = `umm_a_pihak_bkptg` with `flag_pemohon='Y'`**. Portal side is `umm_p_pihak_bkptg`. PLU officer view (`MlkMaklumatPemohonForm` → `PelupusanMaklumatPemohonHelper.initPemohon()` at `etanah-pelupusan/.../helper/PelupusanMaklumatPemohonHelper.java:1790`) calls `findAppPihakBerkepentinganByAplikasi(aplikasiPelupusan)` — reads `_a_` layer keyed on internal `aplikasi_id`. AWAM public view uses `PelupusanMaklumatPemohonHelperForm` in etanah-awam (reads `_p_` via PraAplikasi) — **do not confuse the two classes, they have near-identical names**. | ~~`umm_a_pemohon`~~ / ~~`umm_p_pemohon`~~ fabricated by pattern-symmetry from `umm_a_rizab` in BUG-BESTIARY Pattern 001. Confirmed non-existent via grep against `MLKFAT/et_main.sql`. |

---

## 2c. Entity ↔ Table ↔ JSON Column Quick-Lookup (added 2026-06-02 after QA-260508 wrong-entity-read slip)

> **Why this section exists**: Java variable names like `apt` (AppPermohonanTanah) and `aplp` (AppPelupusan) look similar in code but resolve to **different entities, different tables, different JSON columns**. Both expose `getMaklumatTambahan()`, but the call hits a different `mklmt_tmbhn` / `maklumat_tambahan` column depending on which entity it's on. The slip class this prevents: writing `apt.setMaklumatTambahan(...)` on save and `aplp.getMaklumatTambahan(...)` on read, then wondering why the saved value never shows up.
>
> **Verification rule**: before editing any populator/save code that touches a `.getMaklumatTambahan()` / `.set*(...)` chain, look up the variable's declared TYPE (not the variable name), find it in this table, and confirm the table + JSON column actually match between the save site and the read site.

### Entity ↔ table map (verified entries only)

| Java entity class | DB table | JSON column on it | Notes |
|---|---|---|---|
| `Aplikasi` | `umm_aplikasi` | (none — spine table) | PK `aplikasi_id`. Holds `id_pengenalan`, `ursn_id`, `pejabat_id`. Join everything via this |
| `AppPelupusan` | `plp_a_pelupusan` | `maklumat_tambahan` (TEXT, JSON-as-string) | PLU-internal pelupusan-level metadata. One row per aplikasi. Common var names: `aplp`, `appPelupusan`, `aPlp` |
| `AppPermohonanTanah` | `umm_a_permohonan_tnh` | `mklmt_tmbhn` (TEXT, JSON-as-string, mapped to `getMaklumatTambahan()` in Java) | Per-permohonan-tanah row. Multiple per aplikasi (one per plot/kawasan). Common var names: `apt`, `eachAppMohonTnh`, `appMohontnh`. **This is where `pengkelasanTnh` lives** (QA-260508 save target) |
| `AppHakmilik` | `umm_a_hkmlk` | `mklmt_tmbhn` (TEXT, JSON-as-string) | Per-hakmilik row linked to aplikasi. Common var names: `ahm`, `ahmTerlibat`, `appHakmilik` |
| `AppLaporanTanah` | `tkl_a_laporan_tnh` | `kedudukan_tanah` (TEXT, JSON-as-string) + `maklumat_tambahan` (TEXT, JSON-as-string) | **etanah-teknikal module owns** writes; pelupusan reads via `etanah-common/.../repository/teknikal/AppLaporanTanahRepository.findByAplikasi`. Holds Zone, Jalan, Landmark, Dun, PBT, koordinat GIS — all in `kedudukan_tanah` JSON |
| `MaklumatHakmilik` | `umm_maklumat_hkmlk` (verify) | (read-only snapshot — verify before writing) | Historic hakmilik snapshot at decision time. Common var name: `maklumatHakmilik` |
| `AppPermitLesen` | `umm_a_permit_lesen` (verify) | `syaratTambahan` (verify) | Used by `populateSyaratKelulusan` chain via `retrieveAppPermitLesen4Aor4B("4A", aplikasi)` |
| `AppMaklumatPremium` | `umm_a_mklmt_premium` (**NOT** `umm_a_maklumat_premium`) | — (typed cols only, no JSON) | MCL cukai panel typed values. Cols: `bayaran_premium`, `bayaran_hkmlk_tetap`, `bayaran_hkmlk_smtr`, `cukai_tnh_baru`. FK `aplikasi_id`. Written by `saveMaklumatMCL(aplikasi, premium, tetap, sementara, denda)` (PelupusanService ~:22065-22105). |

### Name-similarity trap table (the QA-260508 slip in particular)

| Code pattern | What it touches | Common confusion |
|---|---|---|
| `apt.getMaklumatTambahan()` | `umm_a_permohonan_tnh.mklmt_tmbhn` | Looks like `aplp.getMaklumatTambahan()` but is a DIFFERENT table |
| `aplp.getMaklumatTambahan()` | `plp_a_pelupusan.maklumat_tambahan` | Looks like `apt.getMaklumatTambahan()` but is a DIFFERENT table |
| `ahm.getMaklumatTambahan()` | `umm_a_hkmlk.mklmt_tmbhn` | Different from both above |
| `altForZone.getKedudukanTanah()` | `tkl_a_laporan_tnh.kedudukan_tanah` | etanah-teknikal-owned column; only read-accessible from pelupusan via `AppLaporanTanahRepository` |

### Discipline rule that pairs with this table

At every populator/save edit involving any `*.getMaklumatTambahan()`, `*.setMaklumatTambahan()`, or any `*.get*JSON-column*()` call:

1. **Name the entity TYPE explicitly** in chat prose before the edit — not just the variable name. `apt` ≠ `AppPermohonanTanah` as evidence of understanding; the Read or Grep showing `AppPermohonanTanah apt = ...` IS the evidence.
2. **Cross-reference save↔read tables**. If the save block writes to `apt.setMaklumatTambahan(...)` (`umm_a_permohonan_tnh.mklmt_tmbhn`), the read block on the same field must also pull from `apt` or from a VO populated from `apt` — NOT from a different entity that has a similarly-named column.
3. **Cascade fallback patterns** (like `kelasTanah` in `populateMaklumatPendaftaranHakmilikList`): one of the fallback rungs typically dereferences the in-memory VO that WAS populated from the save target. When adding a new field's cascade, mirror this — first try the primary source (often `aplp` or `ahm`), then fall through to the VO populated from `apt`, then EMPTY. Missing the VO rung is the silent-blank-on-read slip.

> **⚠️ MCL dual-sink drift (QA-260508 cycle-4b, 2026-06-12)**: for MCL, two separate save methods write overlapping data for the same permohonan:
> - `saveMaklumatPremiumCukai(aplikasi, vo)` (PelupusanService ~:16543-16726) writes `umm_a_hkmlk.mklmt_tmbhn` + `umm_a_permohonan_tnh` (scalar cols + JSON key `cukaiTanahBaru`). Source: ExcelReaderHelper VO.
> - `saveMaklumatMCL(aplikasi, premium, tetap, sementara, denda)` (~:22065-22105) writes `umm_a_mklmt_premium` typed cols + `umm_a_permohonan_tnh` JSON key `cukaiTanahBaru`. Source: bean fields.
>
> Different in-memory sources can drift: observed `cukai_tnh_baru=1130` in `umm_a_mklmt_premium` vs `cukaiTanahBaru=25` in `umm_a_permohonan_tnh.mklmt_tmbhn` on the same row. **Hibernate no-change UPDATE skip**: when save runs with values identical to the stored row, `last_modified_date` does NOT bump — a non-bumping timestamp after a "successful" save is NOT a failed save.

> **Slip class fixed by this section** (QA-260508 2026-06-02): I added Pengkelasan read in `populateMaklumatPendaftaranHakmilikList` reading only from `aplp.getMaklumatTambahan()`. The save block wrote to `apt.getMaklumatTambahan()`. Read source ≠ save target → saved value never displayed in Langkah 4 Senarai Semakan. Fix was adding the `premiumCukaiVO.getPengkelasanTanah()` fallback rung (which IS populated from `apt`).

---

## 3. Table Prefix Legend (et_main)

| Prefix           | Meaning                                                | Example                                   |
| ---------------- | ------------------------------------------------------ | ----------------------------------------- |
| `umm_a_*`        | Application-level data — PLU processed/internal (etanah-pelupusan) | `umm_a_rizab`, `umm_a_hkmlk`              |
| `umm_p_*`        | Pre-application / portal submission data — AWAM public side (etanah-awam) | `umm_p_rizab`, `umm_p_aplikasi`, `umm_p_hkmlk`           |
| `umm_*` (no a/p) | Common shared tables                                   | `umm_aplikasi`, `umm_aliran_kerja`        |
| `ind_*`          | Index/reference tables — land, pejabat, urusan, mukim, title | `ind_ursn`, `ind_hkmlk`, `ind_pejabat`, `ind_daerah`, `ind_bandar_pekan_mukim`, `ind_modul`, `ind_tgsn`, `ind_versi_dhd`, `ind_mklmt_hkmlk` |
| `rjk_*`          | Lookup/reference data                                  | `rjk_senarai_ahli_kumpulan`, `rjk_agensi` |
| `dft_*`          | DFT module (Registration/Daftar)                       | `dft_a_mohon_hkmlk`, `dft_a_nota`         |
| `plp_*`          | PLP module (Alienation/Permit/Reservation)             | `plp_a_pelupusan`, `plp_p_pelupusan`      |
| `str_*`          | Strata/Building module                                 | `str_a_strata`, `str_p_strata`            |
| `hsl_*`          | Revenue/Hasil (fees, payments)                         | `hsl_akaun_cukai`, `hsl_bayaran`          |
| `pcp_*`          | User access/permissions                                | `pcp_pengguna`, `pcp_capaian_modul`       |
| `tkl_*`          | Survey/land report (Teknik)                            | `tkl_a_laporan_tnh`                       |
| `tkr_*`          | Physical title book tracking                           | `tkr_buku_hakmilik`                       |
| `llg_*`          | Auction module (Lelong)                                | `llg_a_prnth_jualan`                      |
| `amb_*`          | Compulsory acquisition (Ambil Balik)                   | `amb_a_pengambilan`                       |
| `con_*`          | Consent/consent application                            | `con_a_kebenaran_hkmlk`                   |
| `pks_*`          | Enforcement module                                     | `pks_a_aduan`                             |
| `skg_*`          | Document storage (Simpan/Keluar)                       | `skg_dok`                                 |
| `spc_*`          | Counter/public counter operations                      | `spc_kutipan_dok`                         |
| `sis_*`          | System configuration                                   | `sis_log_emel`, `sis_menu`                |
| `sws_*`          | SWS payment integration                                | `sws_bayaran`                             |
| `dm_*`           | Dashboard/materialized view data                       | `dm_rizab`, `dm_aplikasi`                 |

---

## 4. Core Application Flow Tables

### 4.1 `umm_aplikasi` — The Central Application Table

Every transaction in the system has a row here.

```sql
CREATE TABLE umm_aplikasi (
 aplikasi_id numeric(19) PK,
 ursn_id numeric(19) NOT NULL, -- FK → ind_ursn(ursn_id)
 pejabat_id numeric(19) NOT NULL, -- FK → ind_pejabat
 hubungan_aplikasi_id numeric(19) NULL, -- FK → umm_aplikasi(aplikasi_id) — PARENT application
 hubungan_notis_id numeric(19) NULL, -- FK → umm_aplikasi(aplikasi_id)
 no_fail varchar(100) NULL,
 no_rujukan_fail varchar(150) NULL,
 id_pengenalan varchar(50) NULL, -- Application reference number
 status_keputusan varchar(150) NOT NULL,
 status_proses varchar(150) NOT NULL,
 status_awam varchar(255) NULL,
 trkh_serahan timestamp NOT NULL,
 trkh_keputusan timestamp NULL,
 rangkaian_id numeric(19) NULL,
 organisasi_id numeric(19) NULL,
 ...
);
```

**Key join to get urusan code:**

```sql
SELECT a.aplikasi_id, u.kod AS urusan_kod, u.nama AS urusan_nama
FROM umm_aplikasi a
JOIN ind_ursn u ON u.ursn_id = a.ursn_id
WHERE u.kod = 'BPRZ';
```

### 4.2 `ind_ursn` — Urusan/Transaction Type Master

```sql
CREATE TABLE ind_ursn (
 ursn_id numeric(19) PK,
 kod varchar(30) NOT NULL, -- e.g. 'BPRZ', 'PRZ', 'PT'
 nama varchar(255) NOT NULL,
 modul_id numeric(19), -- FK → ind_modul
 jns_ursn_id numeric(19), -- FK → rjk_jns_ursn
 fi_pejabat_id numeric(19),
 ...
);
```

**PLU urusan codes (Melaka):** `BPRZ, MCL, MLPS, PLPS, PLTP, PPJK, PPTPB, PRBB, PRU, PRZ, PSBS, PT, RPPLP`
**AWAM urusan codes (Melaka):** `PCR` (Permohonan Carian Rasmi — creates receipts used by PLU forms as proof of prior search)

### 4.x Carian Rasmi Payment Chain (verified 2026-04-16)

Used by PLTP/PLPS `CarianRasmiHakmilikForm.xhtml` → `PembangunanSearchService.carianRasmiByHakmilik()` to validate "No Resit Carian Rasmi" field.

```
ind_hkmlk (master title)
  ↔ umm_a_hkmlk.id_hkmlk (varchar FK, not numeric — matches on hakmilik number string)
  ↔ umm_aplikasi.aplikasi_id (the Carian Rasmi application's own row, urusan=PCR)
  ↔ hsl_bayaran_fi.aplikasi_id
  ↔ hsl_btrn_bayaran.bayaran_fi_id
  ↔ hsl_bayaran.bayaran_id      ← no_resit varchar(40) lives here
```

**Verified table names** (all from `MLKFAT/et_main.sql` CREATE TABLE):

| Java QClass | Real table | PK | Key FK columns |
|---|---|---|---|
| `QHakmilik` | `ind_hkmlk` | `hkmlk_id` | (master) |
| `QAppHakmilik` | `umm_a_hkmlk` | `a_hkmlk_id` | `aplikasi_id`, `id_hkmlk` (varchar) |
| `QAplikasi` | `umm_aplikasi` | `aplikasi_id` | `ursn_id` |
| `QBayaranFi` | `hsl_bayaran_fi` | `bayaran_fi_id` | `aplikasi_id` |
| `QButiranBayaran` | `hsl_btrn_bayaran` | `btrn_bayaran_id` | `bayaran_id`, `bayaran_fi_id` |
| `QBayaran` | `hsl_bayaran` | `bayaran_id` | `no_resit` (the user-entered value) |

**Anti-fabrication note**: `hsl_butiran_bayaran` does NOT exist — the real name is `hsl_btrn_bayaran`. `umm_a_app_hakmilik` does NOT exist — the real name is `umm_a_hkmlk`. `umm_a_hakmilik` does NOT exist as a standalone table.

### 4.3 `rjk_senarai_ahli_kumpulan` — Lookup Values (Reference Data)

This is the universal lookup table. Almost all `*_id` FKs pointing to enum-like values resolve here.

```sql
CREATE TABLE rjk_senarai_ahli_kumpulan (
 senarai_ahli_kumpulan_id numeric(19) PK,
 kod varchar(50) NOT NULL,
 nama varchar(500) NOT NULL,
 senarai_kumpulan_id numeric(19), -- FK → rjk_senarai_kumpulan (the category/group)
 induk_id numeric(19), -- self-ref parent
 pejabat_id numeric(19),
 nilai_decimal numeric(19,2),
 nilai_string varchar(255),
 ...
);
```

---

## 5. PLU Module — Key Tables

### 5.0 `umm_a_hkmlk` — Hakmilik linked to Application

FK: `aplikasi_id` → `umm_aplikasi`. Lookup by `id_hkmlk` (varchar, e.g. `040102GRN00019085`).

> **Column naming rule:** no `_id` suffix = plain varchar (no join). `_id` suffix = FK.

Key columns: `kegunaan_tnh` (varchar, often empty in migrated data), `kat_id` (FK — kategori, [VERIFY] target table), `jns_tnh_id` (FK — jenis tanah), `mklmt_tmbhn` (JSON dynamic fields).

**MCL `mklmt_tmbhn` keys** (confirmed QA-260508 2026-06-12 via `populatePremiumCukaiSelangor` PelupusanService ~:7697-7731): `premiumString`, `premiumDenda`, `jkklJenisHakmilikTanah`, `premiumNilaianPasaran`. This is where the MCL "Maklumat Hakmilik Baru" panel values live for read-back on init — `PelupusanExcelReaderHelper` reads these keys to populate `premiumVO` at `onKemaskiniTanah()` time.

### 5.0b `umm_p_hkmlk` — Pra-Hakmilik (AWAM Submission Layer)

AWAM-side counterpart of `umm_a_hkmlk`. Linked to `umm_p_aplikasi` via `p_aplikasi_id`. PK: `p_hkmlk_id`.

**Confirmed columns (2026-04-02, QA-253419 investigation):**
`p_hkmlk_id`, `p_aplikasi_id`, `versi_dhd_id`, `hkmlk_id`, `kat_id`, `lokasi`, `no_lot`, `luas`, `mklmt_tmbhn`, `tujuan_berimilik_id`, `created_by`, `created_date`, `last_modified_by`, `last_modified_date`, `version`

> ⚠️ **`kegunaan_tnh` does NOT exist in `umm_p_hkmlk`** — confirmed via `information_schema.columns`.
> This is a schema-level gap: kegunaan tanah was never part of the AWAM submission schema.
> The 182 filled records in `umm_a_hkmlk.kegunaan_tnh` came from PLU officer entry or old system migration, not from AWAM.
> Compare with `umm_a_hkmlk` which has `kegunaan_tnh` (varchar, often empty for migrated/AWAM-submitted records).

> **Column naming rule:** no `_id` suffix = plain varchar (no join). `_id` suffix = FK.

---

### 5.1 `umm_a_permohonan_tnh` — Land Application Details

Used by PRZ, BPRZ, PT, PLMS, etc. Contains pegawai fields for reservation transactions.

```sql
CREATE TABLE umm_a_permohonan_tnh (
 a_permohonan_tnh_id numeric(19) PK,
 aplikasi_id numeric(19), -- FK → umm_aplikasi
 bandar_pekan_mukim_id numeric(19),
 daerah_id numeric(19),
 seksyen_id numeric(19),
 jns_pegangan_id numeric(19),
 jns_tnh_id numeric(19),
 kat_hkmlk_id numeric(19),
 kelas_tnh_id numeric(19),
 luas_dipohon numeric(19,4),
 unit_luas_dipohon_id numeric(19),
 tujuan_permohonan varchar(500),
 tujuan_permohonan_id numeric(19),
 pegawai_pengawal_rizab_id numeric(19), -- ← BPRZ bug field
 pegawai_penyelenggara_rizab_id numeric(19), -- ← BPRZ bug field
 alamat_pegawai_pengawal varchar(4000),
 alamat_pegawai_penyelenggara varchar(4000),
 flag_tanah_haram bpchar(1),
 sekatan_kepentingan_dipohon sys."clob",
 syarat_nyata_dipohon sys."clob",
 harga_jualan numeric(19,2),
 ...
);
```

> ⚠️ `pegawai_pengawal_rizab_id` and `pegawai_penyelenggara_rizab_id` are the fields blank in QA Ticket #252456.

### 5.2 `umm_a_rizab` — Reservation Application Data

Linked to `umm_a_permohonan_tnh`. Used for PRZ (new reservation) and BPRZ (cancellation of reservation).

```sql
CREATE TABLE umm_a_rizab (
 a_rizab_id numeric(19) PK,
 a_permohonan_tnh_id numeric(19), -- FK → umm_a_permohonan_tnh(a_permohonan_tnh_id)
 bahagian_pembatalan_id numeric(19), -- FK → rjk_senarai_ahli_kumpulan
 jns_rizab_id numeric(19), -- FK → rjk_senarai_ahli_kumpulan
 pegawai_pengawal_rizab_id numeric(19), -- FK → rjk_senarai_ahli_kumpulan
 pegawai_penyelenggara_rizab_id numeric(19), -- FK → rjk_senarai_ahli_kumpulan
 -- NOTE: FK is a_permohonan_tnh_id → NOT app_permohonan_tanah_id
);
```

### 5.3 `umm_p_permohonan_tnh` — Portal Land Application Details

Portal (public) equivalent of `umm_a_permohonan_tnh`. Has same pegawai fields.

```sql
CREATE TABLE umm_p_permohonan_tnh (
 p_permohonan_tnh_id numeric(19) PK,
 p_aplikasi_id numeric(19), -- FK → umm_p_aplikasi
 pegawai_pengawal_rizab_id numeric(19),
 pegawai_penyelenggara_rizab_id numeric(19),
 alamat_pegawai_pengawal varchar(4000),
 alamat_pegawai_penyelenggara varchar(4000),
 daerah_id numeric(19),
 seksyen_id numeric(19),
 bandar_pekan_mukim_id numeric(19),
 ...
);
```

### 5.4 `umm_p_rizab` — Portal Reservation Submission

```sql
CREATE TABLE umm_p_rizab (
 p_rizab_id numeric(19) PK,
 p_permohonan_tnh_id numeric(19), -- FK → umm_p_permohonan_tnh
 bahagian_pembatalan_id numeric(19),
 no_warta_asal varchar(50),
 trkh_warta_asal timestamp,
 flag_rumah_ibadat bpchar(1),
 flag_sama_alamat_pegawai bpchar(1),
 pegawai_pengawal_rizab_id numeric(19),
 nama_pegawai_pengawal_rizab varchar(4000),
 jawatan_pegawai_pengawal_rizab varchar(100),
 pegawai_penyelenggara_rizab_id numeric(19),
 alamat_pegawai_pengawal varchar(4000),
 alamat_pegawai_penyelenggara varchar(4000),
 jns_rizab_id numeric(19),
);
```

### 5.5 `umm_p_aplikasi` — Portal Application Header

```sql
CREATE TABLE umm_p_aplikasi (
 p_aplikasi_id numeric(19) PK,
 aplikasi_id numeric(19) UNIQUE, -- FK → umm_aplikasi (1:1 link)
 ursn_id numeric(19) NOT NULL,
 cara_mohon_id numeric(19) NOT NULL,
 status_id numeric(19) NOT NULL,
 id_transaksi varchar(30),
 no_rujukan_permohonan varchar(150),
 trkh_serahan timestamp,
 pejabat_id numeric(19),
 ...
);
```

### 5.6 `plp_a_pelupusan` — PLU Disposal Application (Internal)

```sql
CREATE TABLE plp_a_pelupusan (
 -- PK and standard audit columns
 aplikasi_id numeric(19), -- FK → umm_aplikasi
 tujuan_permohonan_id numeric(19), -- FK → rjk_senarai_ahli_kumpulan
);
```

### 5.7 `plp_p_pelupusan` — PLU Disposal (Portal)

```sql
CREATE TABLE plp_p_pelupusan (
 -- PK and standard audit columns
 p_aplikasi_id numeric(19), -- FK → umm_p_aplikasi
 tujuan_permohonan_id numeric(19),
);
```

### 5.8 Full PLP Module Table List (confirmed via DB query 2026-04-20)

> `p_` = citizen draft on AWAM portal (not yet submitted to PLU). `a_` = received by PLU internal module (can still be rejected). No infix = standalone/reference.

| Table | Infix | Purpose |
|---|---|---|
| `plp_p_pelupusan` | `p_` | Pra — citizen draft on AWAM portal |
| `plp_p_jns_bgn_atas_tnh` | `p_` | Pra — building types on land (AWAM) |
| `plp_p_jns_tnmn_atas_tnh` | `p_` | Pra — plant types on land (AWAM) |
| `plp_a_pelupusan` | `a_` | Received by PLU module (`AppPelupusan` Java entity) |
| `plp_a_jns_bgn_atas_tnh` | `a_` | Internal — building types on land |
| `plp_a_jns_tnmn_atas_tnh` | `a_` | Internal — plant types on land |
| `plp_a_buku_doket` | `a_` | Internal — docket book |
| `plp_a_butiran_buku_doket` | `a_` | Internal — docket book details |
| `plp_a_pembelian_buku_doket` | `a_` | Internal — docket book purchase |
| `plp_pemohon_rtb` | *(none)* | Standalone — pemohon RTB reference |

---

## 6. Workflow Tables

### 6.0 🗝️ Screen Routing Tables — `ind_langkah` + `ind_skrin` (THE SOURCE-OF-TRUTH for which tugasan mounts which XHTML, added 2026-05-14 by みや)

> **WHY THIS EXISTS HERE**: The JSF view-resolver queries these at runtime to find which XHTML to render for a given tugasan. There's no obvious JPA entity exposing them, so they get missed when only doing entity-first SQL. ALWAYS check these tables when the question is "which tugasan / langkah mounts which XHTML / panel".

**`ind_skrin`** — Screen ↔ XHTML mapping (the JSF view registry):

```sql
ind_skrin (
  skrin_id      numeric PK,
  kod_skrin     text,     -- e.g. 'PLP_JT_TLBT', 'PLP_JBT_TEK_TLT'
  jsf_view      text,     -- e.g. '/protected/mlk/common/MlkJabatanTeknikalTerlibatForm.xhtml'
  nama_aplikasi text      -- e.g. 'etanah-pelupusan'
)
```

Each row = one mountable screen. Multiple `skrin_id` rows can point to the SAME `jsf_view` (e.g. `1145` AND `374` both → `MlkJabatanTeknikalTerlibatForm.xhtml`).

**`ind_langkah`** — Langkah ↔ Screen ↔ Tugasan mapping (the sub-page registry):

```sql
ind_langkah (
  langkah_id  numeric PK,
  kod         text,    -- e.g. 'PJTLT_5', 'SJTLT_5', 'PLBP_PJTLT_5' — usually <tugasan_kod>_<turutan>
  nama        text,    -- e.g. 'Jabatan Teknikal Terlibat'
  perihal     text,
  skrin_id    numeric, -- FK → ind_skrin (which XHTML this langkah renders)
  tgsn_id     numeric, -- FK → ind_tgsn (which tugasan this langkah belongs to)
  turutan     numeric, -- sequence/order within the tugasan
  flag_aktif  char(1)
)
```

Each row = one (tugasan × langkah) binding. Same langkah `nama` can appear under multiple tugasans (e.g. "Jabatan Teknikal Terlibat" appears under PJTLT, SJTLT, PSLTPM, PLBP_PJTLT, PLBP_SJTLT).

**Canonical "which tugasan shows X langkah" query**:

```sql
SELECT DISTINCT it.kod AS tugasan_kod, it.nama AS tugasan_nama,
       l.kod AS langkah_kod, s.jsf_view
FROM et_main.ind_langkah l
JOIN et_main.ind_tgsn it ON l.tgsn_id = it.tgsn_id
JOIN et_main.ind_skrin s ON l.skrin_id = s.skrin_id
WHERE l.nama ILIKE '%<langkah_name>%'
  AND l.flag_aktif = 'Y'
ORDER BY it.kod;
```

**Canonical "which tugasans mount X xhtml" query**:

```sql
SELECT DISTINCT it.kod AS tugasan_kod, it.nama AS tugasan_nama, l.nama AS langkah_nama
FROM et_main.ind_skrin s
JOIN et_main.ind_langkah l ON s.skrin_id = l.skrin_id
JOIN et_main.ind_tgsn it ON l.tgsn_id = it.tgsn_id
WHERE s.jsf_view ILIKE '%<xhtml_filename>%'
  AND l.flag_aktif = 'Y'
ORDER BY it.kod;
```

**Hard rule** (added 2026-05-14 by みや after QA-260302 slip where I exhausted tugasan-name guessing instead of querying these tables): when Phase 0 needs "which tugasan corresponds to BA's screenshot / which XHTML maps where", FIRST query `ind_langkah` + `ind_skrin`. みや 2026-05-14: *"these 2 tables is a gold mine for our etanah-knowledge. I wonder why you missed it."* Honest answer: no JPA entity surface → didn't enter my entity-first lookup → never queried information_schema for `*skrin*` or `*langkah*` tables. Adding here so future-Ruri (and the Recon ritual) checks these BEFORE name-guessing.

### 6.1 `umm_a_tgsn` — Application Task (Tugasan)

```sql
CREATE TABLE umm_a_tgsn (
 a_tgsn_id numeric(19) PK,
 tgsn_id numeric(19), -- FK → ind_tgsn (task definition)
 aliran_kerja_id numeric(19), -- FK → umm_aliran_kerja
 pejabat_id numeric(19),
 a_tgsn_sblm_id numeric(19), -- FK → umm_a_tgsn (previous task)
 status_pertanyaan_id numeric(19),
 ...
);
```

### 6.2 `umm_aliran_kerja` — Workflow Instance

```sql
CREATE TABLE umm_aliran_kerja (
 aliran_kerja_id numeric(19) PK,
 ursn_id numeric(19), -- FK → ind_ursn
 pejabat_id numeric(19),
 hubungan_aliran_kerja_id numeric(19), -- FK → umm_aliran_kerja (self-ref parent)
 ...
);
```

### 6.3 `umm_tgsn_semasa` — Current/Active Task

This is what the worklist UI reads. Links domain data to workflow.

```sql
CREATE TABLE umm_tgsn_semasa (
 tgsn_semasa_id numeric(19) PK,
 aplikasi_id numeric(19), -- FK → umm_aplikasi
 a_tgsn_id numeric(19), -- FK → umm_a_tgsn
 p_aplikasi_id numeric(19), -- FK → umm_p_aplikasi
 modul varchar(255),
 kod_tgsn varchar(255), -- Flowable task key
 id_tgsn varchar(255), -- Flowable task instance ID
 tgsn_perihal varchar(255),
 nama_pengguna varchar(255),
 peranan varchar(255),
 flag_tgsn_sistem bpchar(1),
 trkh_kpi timestamp,
 pejabat_id numeric(19),
 ...
);
```

### 6.4 `ind_tgsn` — Task Definition

```sql
CREATE TABLE ind_tgsn (
 tgsn_id numeric(19) PK,
 ursn_id numeric(19), -- FK → ind_ursn
 kod varchar(50), -- Task code (maps to Flowable user task key)
 nama varchar(255),
 komponen_bisnes_id numeric(19),
 skrin_id numeric(19),
 ...
);
```

---

## 7. Flowable Tables (et_flowable schema)

Flowable manages workflow state separately from domain data. **Never join these with et_main tables directly in domain code** — use the `applicationId` process variable as the bridge.

### Key Flowable Tables

| Table              | Purpose                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------- |
| `act_ru_task`      | Running (active) human tasks                                                            |
| `act_ru_execution` | Running process executions                                                              |
| `act_ru_variable`  | Process variables — contains `applicationId` linking back to `umm_aplikasi.aplikasi_id` |
| `act_hi_procinst`  | Historical process instances                                                            |
| `act_hi_actinst`   | Historical activity instances (task completion audit trail)                             |
| `act_hi_taskinst`  | Historical task instances                                                               |
| `act_hi_varinst`   | Historical variable instances                                                           |
| `act_re_procdef`   | Process definitions (deployed BPMN)                                                     |
| `act_ge_bytearray` | Binary storage (BPMN XML, etc.)                                                         |

### Linking Flowable ↔ Domain

```sql
-- Find the Flowable process instance for a given aplikasi_id
SELECT rv.proc_inst_id_, rv.text_ AS application_id
FROM act_ru_variable rv
WHERE rv.name_ = 'applicationId'
AND rv.text_ = '12345'; -- your aplikasi_id
-- Then find active tasks for that process
SELECT rt.id_, rt.name_, rt.assignee_, rt.create_time_
FROM act_ru_task rt
WHERE rt.proc_inst_id_ = '<proc_inst_id from above>';
```

---

## 8. System Tables (et_sistem schema)

| Table                     | Purpose                              |
| ------------------------- | ------------------------------------ |
| `pt_application`          | Application registry (app name)      |
| `pt_application_instance` | Running app instance (server health) |
| `pt_audit_entity`         | Audit log for entity changes         |
| `pt_audit_field`          | Field-level change tracking          |
| `pt_monitoring_entity`    | Entities being monitored for audit   |
| `pt_bpm_callback`         | BPM callback configuration           |
| `pt_bpm_callback_log`     | BPM callback execution log           |
| `pt_gbl_config_prm`       | Global configuration parameters      |
| `batch_job_instance`      | Spring Batch jobs                    |
| `batch_step_execution`    | Spring Batch step execution details  |

---

## 9. DMS Tables (et_dms schema)

| Table                   | Purpose                                   |
| ----------------------- | ----------------------------------------- |
| `dokumen`               | Document records                          |
| `dokumen_revision`      | Document version/revision history         |
| `folder`                | Document folders (hierarchical, self-ref) |
| `ind_templat`           | Document templates                        |
| `pengguna`              | DMS users (separate from pcp_pengguna)    |
| `senarai_kumpulan`      | DMS lookup groups                         |
| `senarai_ahli_kumpulan` | DMS lookup values                         |
| `tag`                   | Document tags                             |

### 9.1 Finding a document's PHYSICAL FILE PATH on the server

The question "where is the actual file for this document?" crosses **two schemas**: `et_main`
holds the application-side pointer, `et_dms` holds the storage record. The path itself lives in
**`dokumen_revision.lokasi_fail`** — nowhere else.

```
umm_aplikasi.aplikasi_id
        │
        ▼  (aplikasi_id)
umm_a_dok_keluaran          ← generated/output docs   (umm_a_dok_kmskn = uploaded/input docs)
        │
        ▼  (its PK lands in skg_dok.medan_pk_id)
et_main.skg_dok             ← storage bridge; carries the human-readable id_dok
        │  id_dok = 'LAIN-36645957'
        ▼
et_dms.dokumen              ← id_dokumen = that same string  →  dokumen_id
        │
        ▼  (dokumen_id)
et_dms.dokumen_revision     ← lokasi_fail = THE PATH, one row per versi
```

**Ready queries** (run connected to the target schema):

```sql
SELECT * FROM umm_a_dok_keluaran WHERE aplikasi_id = 3400577;

SELECT * FROM skg_dok WHERE medan_pk_id = 8520809 ORDER BY dok_id DESC;

SELECT * FROM et_dms_stg1.dokumen WHERE id_dokumen = 'LAIN-36645957';

SELECT * FROM et_dms_stg1.dokumen_revision WHERE dokumen_id = 40963183;
```

**Key columns** (DDL-verified — `et_main_mlit.sql:17751`, `et_dms_mlit.sql:207` / `:237`):

| Table | Column | Meaning |
|---|---|---|
| `skg_dok` | `medan_pk_id` | PK of the OWNING row; `medan_id` says which table it points at (polymorphic pair — indexed together as `idx_sd_medanid_medanpkid`) |
| `skg_dok` | `a_dok_keluaran_id` / `a_dok_kmskn_id` | direct FKs to the output / input doc row — either may be NULL |
| `skg_dok` | `id_dok` | the `LAIN-nnnnnnnn` string · UNIQUE (`uk_sd_doc_id`) · **the join key into DMS** |
| `skg_dok` | `versi_dok`, `flag_aktif`, `flag_draf` | version + active/draft flags (see the `versi_dok=0` duplicate trap, quest MIGRATOR-DUP-V0) |
| `dokumen` | `id_dokumen` | matches `skg_dok.id_dok` · UNIQUE (`uk_dok_id_dokumen`) |
| `dokumen` | `versi_terkini` | current version number — pair with `dokumen_revision.versi` to pick the live row |
| `dokumen_revision` | **`lokasi_fail`** | **the server file path** |
| `dokumen_revision` | `lokasi_fail_pdf`, `lokasi_fail_png` | rendered derivatives, nullable |
| `dokumen_revision` | `versi`, `saiz_fail_byte`, `mime_type`, `hash_code` | version · size · type · integrity |

**Path shape on the server** — `/home/app/etanah/files/dms/SISTEM-FAIL/<KELUARAN|KEMASUKAN>/<kategori>/<YYYY>/<MM>/<id_dokumen>_<versi>.main`

Verified examples (ESOKONGAN #272096, stg1):

| Permohonan | Path |
|---|---|
| PTMLK/03/L/PT/2026/10 | `/home/app/etanah/files/dms/SISTEM-FAIL/KELUARAN/LAIN-LAIN/2026/07/LAIN-36645957_1.main` |
| PTMLK/03/L/PT/2026/6 | `…/2026/07/LAIN-36646097_1.main` |
| PTMLK/03/L/PT/2026/4 | `…/2026/07/LAIN-36649014_1.main` |

**Notes**
- `_1` in the filename is the **`versi`**, not a sequence — a re-saved doc gets `_2`, and the old
  `_1` file stays on disk. When a ticket says "wrong/old document shown", compare revisions.
- `.main` is the raw stored artifact (the .docx bytes); the `_pdf`/`_png` columns hold the
  converted views.
- The DMS schema is a **separate datasource** from `et_main` — a query joining across the two in
  one statement will not run from the app's connection. Query them separately.
- Schema suffix follows the environment: `et_dms_stg1` / `et_dms_stg2` / `et_dms_mlit`.

*Source: ESOKONGAN #272096, 2026-07-24 — chain + live paths supplied by みや; column names
cross-verified against the DDL archive.*

---

## 10. Common Joins Reference

### Get application + urusan code + pejabat

```sql
SELECT a.aplikasi_id, u.kod AS urusan_kod, u.nama AS urusan_nama,
 p.kod AS pejabat_kod, p.nama AS pejabat_nama
FROM umm_aplikasi a
JOIN ind_ursn u ON u.ursn_id = a.ursn_id
JOIN ind_pejabat p ON p.pejabat_id = a.pejabat_id
WHERE u.kod = 'BPRZ'
AND a.pejabat_id = <melaka_pejabat_id>;
```

### Get BPRZ application with its parent PRZ

```sql
SELECT bprz.aplikasi_id AS bprz_id,
 prz.aplikasi_id AS prz_id,
 u_bprz.kod AS bprz_urusan,
 u_prz.kod AS prz_urusan
FROM umm_aplikasi bprz
JOIN ind_ursn u_bprz ON u_bprz.ursn_id = bprz.ursn_id AND u_bprz.kod = 'BPRZ'
JOIN umm_aplikasi prz ON prz.aplikasi_id = bprz.hubungan_aplikasi_id
JOIN ind_ursn u_prz ON u_prz.ursn_id = prz.ursn_id;
```

### Get AppRizab + pegawai for a given BPRZ aplikasi_id

```sql
SELECT ar.a_rizab_id,
 ar.pegawai_pengawal_rizab_id,
 ar.pegawai_penyelenggara_rizab_id,
 apt.pegawai_pengawal_rizab_id AS apt_pengawal_id,
 apt.pegawai_penyelenggara_rizab_id AS apt_penyelenggara_id
FROM umm_aplikasi a
JOIN umm_a_permohonan_tnh apt ON apt.aplikasi_id = a.aplikasi_id
JOIN umm_a_rizab ar ON ar.a_permohonan_tnh_id = apt.a_permohonan_tnh_id
WHERE a.aplikasi_id = <your_bprz_aplikasi_id>;
```

### Get portal (umm_p_*) data for a submitted application

```sql
SELECT pa.p_aplikasi_id, pa.aplikasi_id,
 pt.p_permohonan_tnh_id,
 pt.pegawai_pengawal_rizab_id,
 pt.pegawai_penyelenggara_rizab_id,
 pr.p_rizab_id
FROM umm_p_aplikasi pa
JOIN umm_p_permohonan_tnh pt ON pt.p_aplikasi_id = pa.p_aplikasi_id
LEFT JOIN umm_p_rizab pr ON pr.p_permohonan_tnh_id = pt.p_permohonan_tnh_id
WHERE pa.aplikasi_id = <your_aplikasi_id>;
```

### Check pra-hakmilik (umm_p_hkmlk) for a PSBS application

Use this BEFORE concluding data is absent — check if it was submitted from AWAM side.

```sql
-- Step 1: Find p_aplikasi_id from the known aplikasi_id
SELECT pa.p_aplikasi_id, pa.aplikasi_id, u.kod AS urusan
FROM umm_p_aplikasi pa
JOIN ind_ursn u ON u.ursn_id = pa.ursn_id
WHERE pa.aplikasi_id = <your_aplikasi_id>;

-- Step 2: Check pra-hakmilik data (umm_p_hkmlk) — AWAM submission layer
SELECT *
FROM umm_p_hkmlk
WHERE p_aplikasi_id = <p_aplikasi_id_from_step1>;

-- Step 3: Compare against processed hakmilik (umm_a_hkmlk) — PLU layer
SELECT *
FROM umm_a_hkmlk
WHERE aplikasi_id = <your_aplikasi_id>;

-- Step 4: Check kegunaan_tnh on the PLU layer only
-- NOTE: umm_p_hkmlk does NOT have a kegunaan_tnh column (confirmed QA-253419).
-- kegunaan_tnh only exists on umm_a_hkmlk.
SELECT
    ah.id_hkmlk,
    ah.kegunaan_tnh,
    ah.kat_id
FROM umm_a_hkmlk ah
WHERE ah.aplikasi_id = <aplikasi_id>;
```

> If `umm_a_hkmlk.kegunaan_tnh` is empty → AWAM form gap (column doesn't exist in `umm_p_hkmlk` at all) or migrated from old system.
> AWAM fix would require: (1) add `kegunaan_tnh` to `umm_p_hkmlk` schema, (2) add field to AWAM form, (3) SPOC promotion step. Non-trivial — requires senior sign-off.

### Get active tasks for an application

```sql
SELECT ts.tgsn_semasa_id, ts.kod_tgsn, ts.id_tgsn,
 ts.nama_pengguna, ts.peranan, ts.trkh_kpi
FROM umm_tgsn_semasa ts
WHERE ts.aplikasi_id = <your_aplikasi_id>;
```

---

## 11. Standard Column Patterns

All domain tables follow these audit columns:
| Column | Type | Purpose |
|---|---|---|
| `<table>_id` | `numeric(19) PK` | Primary key |
| `created_by` | `varchar(80/255)` | Username who created |
| `created_date` | `timestamp` | Creation timestamp |
| `last_modified_by` | `varchar(80/255)` | Last modifier |
| `last_modified_date` | `timestamp` | Last modification timestamp |
| `"version"` | `numeric(19)` | Optimistic lock version |
Flag columns are `bpchar(1)` with values `'Y'`/`'N'` (or `'y'`/`'n'` — case varies).

---

## 12. Environment Connection Strings

| Env                                           | Host:Port            | DB         | Schema                  |
| --------------------------------------------- | -------------------- | ---------- | ----------------------- |
| FAT                                           | `172.30.17.104:5444` | `etprdmlk` | `et_main`               |
| UAT                                           | `172.30.59.185:5444` | `mlkuat`   | (check `currentSchema`) |
| **DBeaver connection string format for MCP:** |                      |            |                         |

```
options=-csearch_path%3Det_main
```

**MCP config location:** `E:\Dev\claude-tools\.mcp.json`
Launch Claude Code from `E:\Dev\claude-tools\` for MCP to load.

---

## 13. BPRZ Bug #252456 — Reference Queries

Active investigation: pegawai fields blank on BPRZ at Step 3.0 SKM.

```sql
-- Check if BPRZ AppRizab has pegawai data
SELECT ar.a_rizab_id,
 ar.pegawai_pengawal_rizab_id,
 ar.pegawai_penyelenggara_rizab_id
FROM umm_aplikasi a
JOIN ind_ursn u ON u.ursn_id = a.ursn_id AND u.kod = 'BPRZ'
JOIN umm_a_permohonan_tnh apt ON apt.aplikasi_id = a.aplikasi_id
JOIN umm_a_rizab ar ON ar.a_permohonan_tnh_id = apt.a_permohonan_tnh_id
WHERE a.aplikasi_id = <bprz_aplikasi_id>;
-- Check parent PRZ AppRizab pegawai data
SELECT ar.a_rizab_id,
 ar.pegawai_pengawal_rizab_id,
 ar.pegawai_penyelenggara_rizab_id
FROM umm_aplikasi bprz
JOIN umm_aplikasi prz ON prz.aplikasi_id = bprz.hubungan_aplikasi_id
JOIN umm_a_permohonan_tnh apt ON apt.aplikasi_id = prz.aplikasi_id
JOIN umm_a_rizab ar ON ar.a_permohonan_tnh_id = apt.a_permohonan_tnh_id
WHERE bprz.aplikasi_id = <bprz_aplikasi_id>;
```

---

## 14. Jabatan Teknikal Tables

### 14.1 `umm_a_jabatan_teknikal` — Technical Department linked to Application

```sql
CREATE TABLE umm_a_jabatan_teknikal (
 a_jabatan_teknikal_id numeric(19) PK,
 aplikasi_id numeric(19),      -- FK → umm_aplikasi
 agensi_id numeric(19),        -- FK → rjk_agensi
 mklmt_tmbhn varchar(4000),    -- JSON dynamic fields
 -- standard audit columns
);
```

> Used by Surat Jabatan Teknikal (SRTJK) flow. Each row = one JT agency associated with the application.
> Java entity: `AppJabatanTeknikal`, repository: `findAppJabatanTeknikalListByAplikasi(aplikasi)`

### 14.2 `rjk_agensi` — Agency Reference (alamat columns)

```sql
CREATE TABLE rjk_agensi (
 agensi_id numeric(19) PK,
 nama_agensi varchar(500),
 alamat varchar(500),          -- Address line 1
 alamat2 varchar(500),
 alamat3 varchar(500),
 alamat4 varchar(500),
 poskod varchar(10),
 bandar_id numeric(19),        -- FK → rjk_senarai_ahli_kumpulan
 negeri_id numeric(19),        -- FK → rjk_senarai_ahli_kumpulan
 -- standard audit columns
);
```

> **Note**: `bandar_id` and `negeri_id` both FK to `rjk_senarai_ahli_kumpulan` (the universal lookup table).
> Java entity: `Agensi`, accessed via `ajt.getAgensi().getAlamat()` in template population code.

### Common Join: Get JT agencies + addresses for an application

```sql
SELECT ajt.a_jabatan_teknikal_id, a.nama_agensi,
       a.alamat, a.alamat2, a.alamat3, a.alamat4, a.poskod,
       bandar.nama AS bandar, negeri.nama AS negeri
FROM umm_a_jabatan_teknikal ajt
JOIN rjk_agensi a ON a.agensi_id = ajt.agensi_id
LEFT JOIN rjk_senarai_ahli_kumpulan bandar ON bandar.senarai_ahli_kumpulan_id = a.bandar_id
LEFT JOIN rjk_senarai_ahli_kumpulan negeri ON negeri.senarai_ahli_kumpulan_id = a.negeri_id
WHERE ajt.aplikasi_id = <your_aplikasi_id>;
```

---

*Source: TDD SQL exports — et_main_mlit.sql (30,325 lines), et_flowable_mlit.sql, et_sistem_mlit.sql (553 lines), et_dms_mlit.sql*
*Generated March 2026. Update this file when new schema facts are confirmed.*

---

## 15. Capaian Pengguna — "capaian penuh" vs per-urusan rows (2026-07-27, PRU Agihan Kepada blank)

**Access can be stored in TWO shapes, and most readers only understand one.**

| Shape | `pcp_capaian_modul.flag_capaian_penuh` | `pcp_capaian_ursn` rows | Seen by Agihan Kepada? |
|---|---|---|---|
| A — per-urusan ticked | `N` | one per urusan (typ. 29) | ✅ yes |
| B — "capaian penuh" ticked | `Y` | **0** | ❌ no |

Chain: `pcp_capaian_pengguna` → `pcp_peranan_modul` (peranan + pejabat + modul) → `pcp_capaian_modul` → `pcp_capaian_jns_ursn` → `pcp_capaian_ursn` → `ind_ursn`.

**Symptom**: an officer who plainly has the role shows nowhere in an Agihan Kepada / next-user dropdown.
**Cause**: `PlpCapaianPenggunaRepository.findCapaianPenggunaByPerananKodListAndModulIdAndFlagAktifAndUrusanAndFlagCapaianPenuh():27-36`
(`etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\repository\PlpCapaianPenggunaRepository.java`) INNER JOINs through
`CapaianJenisUrusan → CapaianUrusan → Urusan` and **never reads `CapaianModul.adalahCapaianPenuh`** — Shape B has no rows to join.

**Immediate fix (no deploy)**: in the UAM capaian screen, untick "Capaian Penuh" on the Modul row → save → tick the urusan one by one → save. Verified working 2026-07-27 on `amira@melaka.gov.my`.

**Ready check** (run connected to the target schema):
```sql
SELECT * FROM pcp_capaian_modul WHERE capaian_pengguna_id IN (SELECT capaian_pengguna_id FROM pcp_capaian_pengguna WHERE pengguna_id = (SELECT pengguna_id FROM pcp_pengguna WHERE nama_pengguna = '<login>'));
```
`flag_capaian_penuh = 'Y'` with no `pcp_capaian_ursn` rows underneath = the invisible shape.

**Gotchas**
- `pcp_pengguna.flag_aktif` is `'Y'`/`'N'` **char**, not boolean — `= true` returns 0 rows and looks like "no active users".
- Jenis-urusan-level `pcp_capaian_jns_ursn.flag_capaian_penuh` exists but is `'N'` on all 965 PLP rows (stg1) — only the modul-level flag matters in practice.
- stg1 exposure when found: 26 active PLP users across 12 peranan in Shape B.
- The auto-assignment engine uses a **looser** check — `CapaianPenggunaRepository.findByModulUrusanPejabatPengguna():158-160`
  (`etanah-common\src\main\java\my\gov\etanah\common\repository\pengguna\CapaianPenggunaRepository.java`), modul+peranan+pejabat only —
  so a Shape-B officer can be auto-assigned a task yet cannot be picked manually. That asymmetry is the argument the strict read is the defect.

---

## 16. AWAM → pelupusan land data: the `mklmt_tmbhn` JSON spine (2026-07-31, ADHOC PT sempadan)

**Scope**: how Portal Awam land data reaches the officer side, and why the dedicated sempadan tables are a trap.

### 16.1 The two sides

| Side | Table | Written by |
|---|---|---|
| AWAM (pra) | `umm_p_hkmlk` · `umm_p_permohonan_tnh` | the applicant's own login (gmail etc.) |
| Officer (app) | `umm_a_hkmlk` · `umm_a_permohonan_tnh` | `SYSTEM` when the intake service task inserts it; the officer's login when the counter path creates it first |

Spine: `umm_aplikasi.aplikasi_id` ↔ `umm_p_aplikasi.aplikasi_id` → `umm_p_hkmlk.p_aplikasi_id`.
`umm_aplikasi.id_pengenalan` holds the `PTMLK/...` string (there is **no** `no_permohonan` column).

### 16.2 🚨 `umm_a_hkmlk_sempadan` / `umm_p_hkmlk_sempadan` are DEAD tables

**0 rows schema-wide on PROD `et_main` and on `et_main_stg1`.** They look like the obvious home for
Utara/Selatan/Timur/Barat and they are not. Sempadan lives in the **`mklmt_tmbhn` JSON**:

```
{"refData":true,"sempadanList":"[{\"Utara\":\"13093\"},{\"Selatan\":\"13154\"},{\"Timur\":\"13103\"},{\"Barat\":\"13101\"}]"}
```

Sibling keys in the same column: `jarakDari`, `totalLuas`, `appHakmilikID`, `pilihanPremium`,
`formulaPremium`, `premiumString`, `premiumDenda`, `premiumNilaianPasaran`, `jkklJenisHakmilikTanah`.
Constant is `PelupusanConstant.KEY_SEMPADAN_LIST` (`= "sempadanList"`, `PelupusanConstant.java:444`).

### 16.3 The transfer happens on ONE line, behind a gate

`etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\service\impl\PelupusanSpocService.java:241`
`BeanUtil.copyProperties(phm, ahm, "id")` — the only **pra→app** carrier of `maklumatTambahan`.
Gated at `:235` on `praAplikasi != null && CollectionUtils.isEmpty(ahmList)`, reached from
`SpocIntegrationServiceTask.process():70` (Flowable service task ⇒ `created_by = SYSTEM`).

> **Corrected 2026-08-06** (#273455, two independent passes). Two fixes to the original wording:
> the gate is at `:235`, not `:234`; and *"the only code that moves maklumatTambahan"* is true only
> of the pra→app direction. **Four app-side writers also touch `umm_a_hkmlk.mklmt_tmbhn`**:
> `PelupusanService.java:4514` (appends `refData`), `:4951`, **`:4997`**, `:6615`.
>
> `:4997` is destructive — see §16.3b.

### 16.3b The second defect: the app-side clobber (added 2026-08-06)

`PelupusanService.saveMaklumatPlotIntoPermohonanTanah()` builds a JSON object that is emptied at
`:4836` (`jsonObject.entrySet().clear()`, reached because `:4835 isBlank(apt.getMaklumatTambahan())`
is always true for the freshly-constructed `AppPermohonanTanah` at `:4771`), then overwrites the
whole column at `:4997`. Any `sempadanList` / `jarakDari` already present is destroyed. `luas`
survives because it is a separate column, which is what produces the *partial*-loss shape
(keluasan present, sempadan blank).

Reachable for PT — callers `PelupusanExcelReaderHelper.onUploadJadualPlot():1889` (explicit `URS_PT`
handling at `:1882`) and `onSaveMaklumatPlot():2642`; no guard excludes PT.

**Scope it correctly before fixing it.** On PROD, of the PT applications whose AWAM row carries
`sempadanList`:

| `umm_a_hkmlk` written by | kept | lost |
|---|---|---|
| `SYSTEM` (service task ran) | 32 | 11 ← the clobber |
| human session (counter created the row first) | 3 | **36** ← the gate |

The clobber explains **11 of 47** losses. The gate explains 36. `PTMLK/02/L/PT/2026/14` — the ticket's
own row — is `created_by = zeety@melaka.gov.my`, i.e. **human**: the clobber did run on it, but there
was never a copied `sempadanList` for it to destroy. A fix that only repairs `:4997` misses the
reported case and 77% of the population.

`com.puncaktanah.utils.BeanUtil.copyProperties()` ignores only `id` / `createdBy` / `version` /
`createdDate` / `lastModifiedBy` / `lastModifiedDate` + `Collection` fields — so `maklumatTambahan`
IS in scope whenever it runs. Source: `E:\Dev\.m2_etanah\com\puncaktanah\puncak-tanah\2.1.27\puncak-tanah-2.1.27-sources.jar`.

### 16.4 Payment channel decides whether the copy runs

`hsl_bayaran_fi.created_by` is the discriminator — an `@melaka.gov.my` creator means counter payment.
Counter payment creates `umm_a_hkmlk` in the officer's session **before** the workflow exists, so the
gate is false and the copy never runs. PROD census over PT applications whose AWAM row carries sempadan:

| Paid | has sempadan | missing |
|---|---|---|
| Online | 27 | 10 |
| At SPOC counter | 4 | 36 |

Ordering probe — compare `umm_a_hkmlk.created_date` against `min(umm_aliran_kerja.created_date)` for the
same `aplikasi_id`; a row that predates the workflow was written by a human session, not the service task.

### 16.5 Reports read the AWAM side directly

`PlpLaporanJadual1P2_Sub01.jrxml:119-126` (and `Sub03`) do
`JSON_VALUE(JSON_VALUE(PH.MKLMT_TMBHN,'$.sempadanList'),'$.Utara')` — straight off the pra table. **A
report showing a value proves nothing about the officer-side row**; that asymmetry is exactly what made
the 2026-07-31 ticket look impossible ("Jadual 1 ada, skrin tiada").

### 16.6 Screen-writer signature (useful for provenance)

`PelupusanService.populateSempadanTanahListIntoJson():4692` returns `StringUtils.EMPTY`, never null — so
an officer screen-save always leaves `"sempadanList":""` plus a `jarakDari` sibling. On PROD both counts
are **0**, i.e. the pelupusan Maklumat Tanah screen has never written this field. Use the presence of
`""`-vs-array, and of `jarakDari`, to tell which writer produced any given row.

### 16.7 🚨 `umm_p_hkmlk` is NOT the only sempadan home — two tables, two urusan families (2026-08-07)

§16.1–16.6 describe the **hakmilik** spine. That is only half the picture, and counting sempadan on
`umm_p_hkmlk` alone under-reports it. The AWAM save forks by urusan at
`etanah-awam\src\main\java\my\gov\etanah\awam\pelupusan\web\form\PelupusanPermohonanTanahTab.java:686`
(`NEGERI_MLK` branch):

| Urusan | Writer | Table |
|---|---|---|
| `URSN_PT` · `URSN_PSBS` | `PelupusanService.saveMaklumatTanahVOIntoPraHakmilik():3639` → write `:3745` | `umm_p_hkmlk.mklmt_tmbhn` |
| `default` (PLPS · MCL · PPTPB · PRZ · …) | `PelupusanService.saveMaklumatTanahVOIntoPermohonanTanah():9880` → writes `:9953` / `:10011` | `umm_p_permohonan_tnh.mklmt_tmbhn` |

Both writers are in `etanah-awam\src\main\java\my\gov\etanah\awam\pelupusan\service\impl\PelupusanService.java`.
The sempadan write inside `saveMaklumatTanahVOIntoPraHakmilik` is **unconditional** — no urusan gate
there; the gating is entirely in the tab's switch.

**PROD census 2026-08-07** — pra rows carrying real (non-`""`) `sempadanList`:

| Table | Urusan | Rows | Officer side lost |
|---|---|---|---|
| `umm_p_hkmlk` | PT | 93 | 47 of 47 apps affected per §16.4 |
| `umm_p_permohonan_tnh` | PLPS 47 · MCL 37 · PPTPB 16 · PRZ 2 | 102 | **0 of 102** |

**Consequence for #273455's fix**: the `URS_PT` gate on
`etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\service\impl\PelupusanService.java`
`PelupusanService.populateMaklumatTanahVOListFromAppHakmilik():5093` is correct — but *not* because
other urusan lack sempadan. They have it, in the other table, and it transfers cleanly (0/102 lost).
**PSBS is the only other urusan on the hakmilik path**; it has 0 public records on Melaka PROD today,
so the exposure is latent, not live.

⚠️ **Unread**: *why* the `umm_p_permohonan_tnh` copy survives the counter-payment gate that
`umm_p_hkmlk` fails. Outcome measured, mechanism not traced. Do not assert one without reading it.

### 16.8 The counter-payment gate loses EIGHT fields, not just sempadan (2026-08-07, #273455 cycle 2)

`PelupusanSpocService.populateAppHakmilikList():241` copies the whole bean, so when the `:235` gate is
false **nothing** transfers — sempadan was simply the first field a BA happened to report.

PROD census, PT+PSBS, counter arm (47 apps). **The online arm loses 0 of 44 on every field**, which
makes payment channel the clean discriminator for the entire set, not just for sempadan:

| Column | Screen label (`mlkMaklumatTanahV3.xhtml`) | Filled in Awam | Lost |
|---|---|---|---|
| `mklmt_tmbhn` → `sempadanList` | Sempadan | 49 | **46** |
| `tujuan_berimilik_id` | Tujuan Permohonan | 49 | **38** |
| `unit_luas_id` | Keluasan Tanah — unit | 49 | **38** |
| `luas` | Keluasan Tanah | 46 | **36** |
| `tujuan_berimilik_lain` | Perincian Tujuan Permohonan | 30 | **23** |
| `lokasi` | Tempat / Wilayah / Lokasi | 19 | **17** |
| `jns_rujukan_lokasi_id` | No. Lot Bersebelahan — jenis | 15 | **14** |
| `no_rujukan_lokasi` | No. Lot Bersebelahan — no | 14 | **13** |
| `no_lot` · `unit_lot_id` | No. Lot/PT | 47 | 5 each |
| `bandar_dipohon_id` | Bandar/Pekan/Mukim | 49 | **0** |

**Never filled in Awam — do not "fix" these**: `seksyen_id` · `no_pelan` · `keterangan_lain` ·
`flag_tanah_haram` · JSON keys `dun` and `jarakDari` (all 0). `jarakDari` is written *only* by the
officer's save, which corroborates the writer signature in §16.6.

🚨 **`luas` lives in TWO pra tables and they disagree.** `umm_p_hkmlk.luas` vs
`umm_p_permohonan_tnh.luas_dipohon` differ on **3 of 96** PT applications. The officer column is
`umm_a_hkmlk.luas`, so **hakmilik → hakmilik is the correct mapping**. Commit `d17d708282` read the
permohonan-tanah row and was corrected in `2af86aa5e2`.

### 16.9 Self-heal CONFIRMED — the fallback persists on the officer's next save (2026-08-07)

Recorded in §16.3 / #273455 cycle 1 as a hypothesis; now **observed**. On mlit, `umm_a_hkmlk` row
5906364 (`PTMLK/02/L/PT/2026/12`, aplikasi 3408031) reached `version = 2` at `2026-08-07T08:43:42Z`
under `sitihanum@melaka.gov.my`, carrying a `sempadanList` the pra→app copy never wrote.

**Why that proves it**: `luas` was still NULL on the same row. `BeanUtil.copyProperties` would have
carried `luas` if it had run, so the copy did not run — leaving the read-side fallback plus
`PelupusanService.saveMaklumatTanahVOIntoAppHakmilik():4434` as the only path those values could have
taken. A read-side display fix therefore repairs the stored row too, on first Simpan; no data patch
is needed for this defect class.

**Full case**: `projects/coding-projects/active/PENDING-TICKET-pt-sempadan-awam/FINDINGS.md` ·
register `ADHOC-REGISTER.md` A8.

## 16.0 Direct postgres access without MCP (added 2026-08-03, DE gap-sweep)

- The pgEdge MCP server DEFINITIONS in `C:\Users\Ridhwan\.claude.json` carry full env creds (PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD) for all 4 envs (mlit / mlkstg stg2-user / mlkstg stg1-user / prod et_read). When the MCP tools are not loaded in a session, `psycopg2` (installed) + a stdin-SQL runner reads them directly — see session scratchpad pattern `pg_query.py` (read-only session, echoes `current_schema()` per the stg1/stg2 rule).
- Column truths verified live: the PTMLK permohonan id lives in **`umm_aplikasi.id_pengenalan`** (there is NO `id_permohonan` on umm_aplikasi) · `umm_a_tgsn` PK = `a_tgsn_id`, actor = `tdkn_oleh`, office = `pejabat_id` · selecting `status` on `rjk_senarai_ahli_kumpulan` can throw `schema "sptb05" does not exist` (view/trigger quirk) — omit that column.
- PROD: `et_read` default schema is `public` — qualify `et_main.` on every table (staging users default to their own schema; みや-handed scripts stay unqualified as always).

---

## 17. Surat Keputusan lifecycle — document status vs tugasan (added 2026-08-05, QA-273300)

Three wrong gates were built on guesses about this before it was measured. Do not re-derive it.

### 17.1 The ladder

`PYSK` (penyediaan) → `SSK` (semakan) → `PSSK` (peraku) → `PTBUT2` (pengagihan/hand-over) → `CT_BSC_PLP` (cetakan)

Per-urusan variants of the same three-step head — kods taken from `template.config.json` tugasanList,
NOT from name resemblance:

| Ladder | Penyediaan | Semakan | **Peraku** | Urusan |
|---|---|---|---|---|
| Lulus | `PYSK` | `SSK` | **`PSSK`** | PRZ · RPPLP · PPTPB · PPJK · PRBB · PLPS |
| Lulus (N5A) | `PYSKN5A` | `SSKN5A` | **`PSKN5A`** | PT · PLTP · MCL · PSBS |
| Tolak | `PYSTP` | `SSTP` | **`PSTP`** | PLPS · PRU · PRBB · PPJK · BPRZ · RPPLP · PT · PLTP · PRZ · MCL · PPTPB · PSBS |

**Cetakan is ONE universal kod for all of them: `CT_BSC_PLP`** (`PelupusanTugasanConstant.java:330`),
reached via `<callActivity calledElement="MLK_PLP_SUB_UPN">`.

### 17.2 🚨 `CT_BSC_PLP` is SHARED and runs MANY times per application

It is not "the Cetakan for this letter" — a flow calls the same sub-process from several points
(PPJK 5× · PRZ 4× · PLPS/PRBB/PRU/PPTPB 3×). Real rows: mlit `PTMLK/02/L/PLPS/2026/2` printed
**2026-07-01 and 2026-07-09**; `PTMLK/02/L/BPRZ/2026/1` printed **07-22 and 08-03**.

**Consequence**: "does a completed `CT_BSC_PLP` exist" is TRUE weeks before the Surat Keputusan is
even written. To mean "printed *this* letter", require a completed `CT_BSC_PLP` whose `trkh_mula`
is **after** the latest completed peraku tugasan.

### 17.3 `umm_a_dok_keluaran.status_id` — when each value is actually written

| Status | Written at | Note |
|---|---|---|
| `STATUS_PENYEDIAAN_BARU` | ADK creation, during penyediaan | |
| `STATUS_PENYEDIAAN_SEDIA` / `_SEMAK` | penyediaan / semakan | |
| `STATUS_PENYEDIAAN_PERAKU` | when the officer clicks Peraku — **tugasan still open** | not "peraku finished" |
| **`NULL`** | when the peraku tugasan **completes** — **BEFORE cetakan** | ⚠️ NOT "released". mlit `8507340` last_modified `01:54:14` inside the PSSK window `01:53:41–01:54:27`; `CT_BSC_PLP` only started `01:54:47`. `NULL` is also the status of never-status-managed legacy rows |
| `STATUS_PENYEDIAAN_CETAK` / `_SELESAI` | **zero rows ever** in Melaka PROD for `SRT_KPTSN_PLP` · `SRT_KPTSN_TLK` · `S_TLK` · `S_TLK_RGKS` · `SRT_KPTSN_LLS` | `BasePenyediaanDokumenForm.onCetakSemua():436-438` writes CETAK but not for these kinds |

**So the status column alone can never express "after cetakan".** It tops out at peraku.

### 17.4 `A_TGSN_ID` exists in the table and is NOT mapped in the entity

`umm_a_dok_keluaran.a_tgsn_id` holds the owning tugasan (NULL while in penyediaan; set to the
semak/peraku tugasan afterwards) — a genuine per-document link, verified 25/25 rows on stg1.
**But `AppDokumenKeluaran` in `etanah-domain 1.0.4-MLK` does not map it** (it maps `STATUS_ID`,
`JNS_DOK_ID`, `DOK_ID` + 11 other joins; no `A_TGSN_ID`, no `getAppTugasan()`). Any Java fix needing
it requires an `etanah-domain` change — another team's artifact. Read entities from the sources jar:
`E:\Dev\.m2_etanah\my\gov\etanah\etanah-domain\<ver>\etanah-domain-<ver>-sources.jar`.

### 17.5 `AppTugasan` fields that DO exist

`tarikhMula` ← `@Column("TRKH_MULA")` · `adalahAktif` · `getTugasan().getKod()`.
⚠️ **`a_tgsn_id` order does NOT match `trkh_mula` order** — 3 stg1 applications have tasks whose row
ids run out of chronological sequence. Never use the id as a time proxy; use `tarikhMula`.

### 17.6 Which urusan even reach cetakan

22 of 34 modul-PLP urusan define `CT_BSC_PLP` in `ind_tgsn`. The 12 without are utilities and
JKKT-rayuan variants (`UPL` · `UPP` · `UPS_PLP` · `USP` · `UKBA` · `PS` · `PPDB` · `RHHLL` · `RKPJL`
· `RLKJL` · `RMTJL` · `RMTL`) — and **none of them carries a governed Surat Keputusan document** on
mlit, stg1 or PROD. Cetakan-less letters that DO exist (PTS, TMAMG) belong to modules **BGN** and
**DFT**, which never enter the AWAM `MODUL_PELUPUSAN` branch. So a cetakan-completed gate does not
strand anyone — checked, not assumed.

---

## §16 — There is NO application→DMS foreign key (verified 2026-08-05, PROD)

Finding a generated document's DMS row **cannot be done by joining from the application**. All four
candidate links are empty on PROD:

| Candidate | State |
|---|---|
| `et_main.umm_a_dok_keluaran.dok_id` | NULL on every row checked (aplikasi 3396320, 3427027) |
| `et_main.skg_dok.a_dok_keluaran_id` | NULL for the rows that matter — 15.1M rows total, 5.95M carry an ADK id, but not these |
| `et_dms.dokumen.folder_id` | NULL |
| `et_dms.dokumen_tag` | zero rows for the documents checked |

**What works instead** — get the DMS id from OUTSIDE the DB, then query forwards:

1. The BA's `executor.log` in `0. Brief/` carries it — `grep -oE "LAIN-[0-9]+"` (274046: 24 hits of
   `LAIN-36832946`).
2. Then: `et_dms.dokumen` (`id_dokumen` = `LAIN-…`) → `et_dms.dokumen_revision` for
   `nama_fail` · `saiz_fail_byte` · `versi` · `lokasi_fail` · `lokasi_fail_pdf`.

**File path shape** (identical on PROD and stg1):
`/home/app/etanah/files/dms/SISTEM-FAIL/KELUARAN/LAIN-LAIN/<YYYY>/<MM>/LAIN-<id>_1.main`
(the `.pdf` sibling is the same path + `.pdf`).

**Consequence for infra requests**: a PROD→staging file load can name the PROD path exactly, but the
STAGING target id is only obtainable after the document exists on staging — i.e. have the officer
regenerate there first, then overwrite that file.

## §17 — 🚨 CORRECTED — the permohonan ID **is** stored: `umm_aplikasi.id_pengenalan`

> An earlier version of this section claimed no permohonan-ID column exists. **That was WRONG**,
> written 2026-08-05 and refuted the same night. The error: the column list was read,
> `id_pengenalan` was seen, and the NAME was assumed to mean IC/passport. It was never opened.
> Name-vs-contract — the same failure class as 2026-08-04.

```sql
SELECT id_pengenalan FROM et_main.umm_aplikasi WHERE aplikasi_id = 3398208;
--> PTMLK/02/L/PT/2026/3
```

Join straight through it — no timestamp matching, no inference:

```sql
-- permohonan ID -> application
SELECT * FROM et_main.umm_aplikasi WHERE id_pengenalan = 'PTMLK/02/L/PT/2026/3';

-- sejarah pengagihan -> application
--   umm_sejarah_pengagihan.id_permohonan = umm_aplikasi.id_pengenalan
--   written by CommonPengagihanTugasanHelper.java:119
--     setIdPermohonan(aplikasi.getIdPengenalan())
--   and PengagihanTugasanService.java:2547 (abbreviated to 30 chars)
```

**Every urusan has one**, including utilities and carian — only the format differs:

| Urusan kind | Example |
|---|---|
| Pelupusan / PT / utilities | `PTMLK/02/L/PT/2026/3` · `PTMLK/02/L/UPP/2026/2` |
| Carian rasmi (CRHM) | `02CR2659/2026` |

**Running number source**: `et_main.sis_no_turutan.no_turutan`, keyed
`kodPejabat+kodUnit+kodUrusan+year` (e.g. `02LPT2026`). Incremented under pessimistic lock in
`etanah-pelupusan\...\util\PelupusanUtil.java:301-323` (`runningNumberPessimisticLock`),
formatted at `PelupusanUtil.java:325-343` (`populateIdPermohonan`).

**Not the link** — empty on real rows: `no_rujukan_fail`, `no_fail`, `turutan`.

## §17b — stg1 is a PROD refresh

`PTMLK/02/L/PPTPB/2026/1` is **not stored** — `umm_aplikasi` has no `id_permohonan`, and `turutan`
is NULL. The string appears only in `umm_notifikasi.id_permohonan`,
`umm_sejarah_pengagihan.id_permohonan` and the `dok_kutipan_*` tables — none of which carry
`aplikasi_id`, so neither is a usable bridge.

**The shortcut**: `aplikasi_id` is IDENTICAL between PROD and stg1 (stg1 is a refresh). Verified
2026-08-05 — `3396320` on both, same `ursn`, same `pejabat`, same `created_date` to the second. So
resolve the id on PROD (where the document trail leads), then query stg1 with the same number.

⚠️ An application created AFTER the refresh exists on PROD only — `3427027` (274046, created
2026-08-04) has zero `umm_a_tgsn` rows on stg1.
---

## 18. Flowable (BPMN) — which schema, and which version is deployed

*Added 2026-08-05 (Baseline 1.3.1). Three queries failed before this was written down; all three
were WRONG QUERIES, not a broken DB.*

### 18.1 Flowable lives in its OWN schema — and the name is not env-suffixed everywhere

| Env | Main schema | **Flowable schema** |
|---|---|---|
| mlit | `et_main_mlit` | `et_flowable_mlit` |
| staging (stg1) | `et_main_stg1` | **`et_flowable17`** ← NOT `et_flowable_stg1` |
| PROD | `et_main` | *(unrecorded — fill on first use)* |

🚨 `et_main_<env>.act_re_procdef` **does not exist** anywhere. The `relation does not exist` error
means wrong schema, never a connection fault. When in doubt:

```sql
SELECT table_schema FROM information_schema.tables WHERE table_name = 'act_re_procdef';
```

### 18.2 Canonical query — which BPMN version is live, and does it contain marker X

```sql
SELECT p.version_, d.deploy_time_, octet_length(b.bytes_) AS bytes,
       position('<marker string>' in convert_from(b.bytes_, 'UTF8')) AS marker_pos
FROM   <flowable_schema>.act_re_procdef p,
       <flowable_schema>.act_re_deployment d,
       <flowable_schema>.act_ge_bytearray b
WHERE  p.deployment_id_ = d.id_
  AND  b.deployment_id_ = p.deployment_id_
  AND  b.name_          = p.resource_name_
  AND  p.key_           = 'MLK_PLP_<URUSAN>'
ORDER  BY p.version_ DESC;
```

Two traps this closes:

| Trap | Detail |
|---|---|
| `deployment_id_` ≠ the UUID inside `procdef.id_` | `id_` reads `MLK_PLP_PLPS:6:48485f8c-…` — that suffix is the **procdef's own** uuid. Joining on it returns 0 rows. Use the `deployment_id_` column. |
| `b.name_` filter | join on `p.resource_name_`, not a `LIKE '%URUSAN%'` guess — the bytearray row carries other resources too. |
| `deploy_time_` | already a `timestamp`. `to_timestamp(deploy_time_/1000)` throws — it is not epoch millis. |

`octet_length(bytes_)` matches the on-disk file size **byte for byte**, so it identifies which local
copy is deployed without reading the XML.

### 18.3 A deployed version is not a released version

Flowable deployments are additive and versioned: deploying vN+1 leaves running instances on their
old definition and routes only new ones to the new. So **the newest version on an env says nothing
about what belongs in a release.** MLIT in particular carries unreleased work.

The release deliverable is `(the ticket's own BPMN attachment)` ∩ `(what the BA-tested env ran)` —
never "newest on any env". **2026-08-05 proof**: `MLK_PLP_PLPS` v6 (452,783 B, loop-back to PJTLT,
comment citing Requirement #242553 which has `fixed_version = NONE`) was live on mlit at 14:31,
while the #272574 attachment and stg1 both carried v5 (451,836 B, terminal `endEvent "Tamat"`) —
and BA's PASS was recorded against v5.

---

## §18 — `rjk_agensi` has DUPLICATE names — never `= (SELECT agensi_id … WHERE nama = …)`

Verified 2026-08-06 on PROD, the hard way: a patch failed with
`ERROR 21000: more than one row returned by a subquery used as an expression`.

```
agensi_id  nama_agensi                     alamat        organisasi_id
    6      MAJLIS PERBANDARAN ALOR GAJAH   Lebuh AMJ,        1104
    8      MAJLIS PERBANDARAN ALOR GAJAH   Lebuh AMJ,        1106
```

Identical name AND identical address; only `organisasi_id` differs.

**Rules**
1. Resolve an agency by the row already on the application, not by name:
   `WHERE a_jabatan_teknikal_id = (SELECT … FROM umm_a_jabatan_teknikal WHERE aplikasi_id = … AND agensi_id IN (…))`
2. If you must go by name, use `IN`, never `=`.
3. `count(*)` EVERY scalar subquery against a reference table before shipping — checking only the
   ones that look risky is how this one shipped.

**Near-duplicates that are NOT the same row** (name differs, so exact-match is safe but
easy to pick wrong — resolve by ADDRESS against the BA's document):

| id | nama_agensi | note |
|---|---|---|
| 24 | `JABATAN PERANCANGAN BANDAR DAN DESA, MELAKA` | the real one for PDT Jasin work |
| 9 | `JABATAN PERANCANGAN BANDAR DAN DESA NEGERI MELAKA` | decoy |
| 53 | `JABATAN PERANCANGAN BANDAR ` | decoy, trailing space |

⚠️ **Trailing spaces are common**: `PEGAWAI PENYELARAS ` and `JABATAN PERANCANGAN BANDAR ` both carry
one. Always `trim(nama_agensi)`.

## §19 — `umm_a_jabatan_teknikal`: what a restored row needs

Table has **no unique constraint** on `(aplikasi_id, agensi_id)` — a re-run silently duplicates.
Always guard an INSERT with `AND NOT EXISTS (…)`.

| Column | Value for a restored row | Why |
|---|---|---|
| `a_jabatan_teknikal_id` | `nextval('seq_a_jabatan_teknikal')` | sequence is in sync with `max(id)` — verified 2026-08-06 (6716 = 6716). Never hardcode |
| `created_by` / `last_modified_by` | the application owner's login | mirror a sibling row; never a session/ticket fingerprint |
| `version` | `0` | new row; siblings sit at 38/39 from repeated edits |
| `flag_perlu_perakuan` | `'N'` | column default, matches siblings |
| `a_dok_keluaran_id` | the Surat Pentadbiran JT ADK on that application | all JT rows on one application share it |
| `mklmt_tmbhn` | copy a sibling's JSON verbatim | see the flag notes below |
| `keputusan_id`, `no_rujukan`, `trkh_ulasan`, `ulasan` | **leave NULL** | 97% of the table's 6,333 rows are null here — they fill only when the agency submits its ulasan |

**The `mklmt_tmbhn` flags** —
`{"flagSurat":"true","appTugasan":"SKM","generateSurat":"TIDAK","flagBolehMasukkanUlasan":"true","flagKemasukanDari":"DARI_UTILITI"}`

- `generateSurat` — 🚨 **display gate**. `PelupusanHelper.java:210-214` sets `generatedJT` when the
  value is `TIDAK`, then **removes the row from the list** if the current tugasan is in
  `TGSN_JBTN_TEKNIKAL_DAN_YB_LIST` (`PelupusanTugasanConstant.java:502-503` = PSJT + PGSJT).
  Blank defaults to `TIDAK` at `PelupusanSearchService.java:1349`. Population: 564 TIDAK · 142 YA ·
  355 unflagged. On any other tugasan it does not bite.
- `appTugasan` — `SKM` makes the row view-only at SJTLT/PJTLT (`PelupusanSearchService.java:1352-1358`).
- `flagKemasukanDari` — `DARI_UTILITI` is the default written by
  `JabatanTeknikalHelper.java:323-328` when blank.

## §20 — Permit/Lesen tables: 99.6% of PROD rows are MIGRATED, not generated (2026-08-06, #273461)

Any query shaped "applications holding a No Lesen" is dominated by the June-2026 migration. Counting
before scripting is the difference between a 3-row patch and erasing the historical TOL register.

| Group | `created_by` | PLPS rows w/ number | Format |
|---|---|---|---|
| Migrated register | `MIGRATOR_KTPN_LMS` · `_JASIN` · `_ALOR_GAJAH` · `MIGRATOR_PERMIT` · `MIGRATOR_MOHON_PLP` · `MIGRATOR_WARTA` | **746** | `M 003` · `192055` · `00000001` · `102812/1` |
| Generated by the app | `SYSTEM` or the officer's login | **3** | `A<pejabat>/<year>/<n>` |

**Discriminators that hold** — generated: `no_permit_lesen LIKE 'A%'`; never issued:
`trkh_mula IS NULL AND trkh_akhir IS NULL`.
**Discriminator that does NOT hold** — `created_by='SYSTEM'`. The same code path stamps the officer's
login when a person drives it (OPLPS rows carry `nizalarif@`, `nurulazura@`). Incidental, not semantic.

### Reference graph — exactly 4 tables, zero declared FKs

```
umm_a_permit_lesen.versi_permit_lesen_id ──► ind_versi_permit_lesen.versi_permit_lesen_id
                                                        │ permit_lesen_id
                                                        ▼
umm_a_permit_lesen.no_permit_lesen ──(by value)──► ind_permit_lesen.permit_lesen_id
                                                        ▲ permit_lesen_id
                                            ind_mklmt_tnh_permit_lesen
```

`information_schema` returns **0 foreign keys** for `ind_permit_lesen` / `ind_versi_permit_lesen` —
find referencing tables by COLUMN NAME (`permit_lesen_id`, `versi_permit_lesen_id`), never by FK.
Safe clear order: NULL the app row's number+versi first, then delete children, then the induk row.

### The running number is shared across FOUR urusan

`PelupusanPermitLesenNumberService.retrieveRunningNumberCode():335-341` — `PLPS`, `OPLPS`, `MLPS`,
`OMLPS` share one counter keyed `<kodPejabat>4AE<year>`, so the licence number never tracks the
permohonan running number. BA Anis confirmed this is CORRECT, 2026-08-05 on #273461.

### Where each urusan allocates

| Urusan | Screen | Tugasan |
|---|---|---|
| OPLPS / OMLPS | `MlkPenyediaanBorang4AeL1eForm.initRunningNumber():226` | `PB` |
| PLPS / MLPS | `MlkBorang4AeForm.initRunningNumber():313-331` (skrin 1150) | `PYB4AE` |

⚠️ `PYB4AE` has **never occurred in PROD** — 0 of 38 PLPS tugasan ever recorded; the deepest PLPS
reaches is `PRMMKNPDT`. Skrin 338 `PLP_BYRN_LSN` (Pengiraan Bayaran Lesen) mounts on **44 langkah /
4 urusan**: PLPS 21 · PPTPB 17 · PPJK 3 · PSBS 3 — and never on PYB4AE/PB4AE.

---

## Locating a PLU app by its permohonan reference (`PTMLK/01/L/PT/2026/13`) — the ref is NOT stored

🚨 **The human-readable No. Permohonan is RUNTIME-GENERATED, not persisted as one string.** Searching
for it as a column value returns 0 rows by design → do NOT conclude "the app isn't on PROD" from that.
(2026-08-10, #273707 — a familiar searched `umm_p_aplikasi.no_rujukan_permohonan` for the reference,
got 0, and falsely reported the app absent from PROD. The app was there.)

**Two traps that produce the false negative:**
- `umm_aplikasi` (the spine) has **no reference-string column** at all (checked all 43 cols).
- `umm_p_aplikasi.no_rujukan_permohonan` exists BUT that table is **SPOC/awam pra-aplikasi only** —
  staff-submitted PT/PLU apps are not in it (0 PT/2026 rows on PROD).

**Decode the reference** `PTMLK / 01 / L / PT / 2026 / 13`:
`<pejabat kod>` / `<daerah kod>` / L / `<urusan kod>` / `<year>` / `<running no>`.
- pejabat `01` = `ind_pejabat.kod='01'` → pejabat_id 2 (Pejabat Daerah Dan Tanah Melaka Tengah)
- urusan `PT` = `ind_ursn.kod='PT'` → ursn_id 51
- running-no `13` is generated per (pejabat, urusan, year); not reliably stored as a queryable literal.

**How to actually locate the app on PROD** — by stored components or by the defect signature, never by
the reference string:
```sql
-- by defect signature (best when the ticket describes a data anomaly):
SELECT pt.aplikasi_id, pt.bandar_pekan_mukim_id, pt.daerah_id, a.pejabat_id, a.status_proses
FROM et_main.umm_a_permohonan_tnh pt
JOIN et_main.umm_aplikasi a ON a.aplikasi_id = pt.aplikasi_id
WHERE a.ursn_id = 51 AND pt.daerah_id IS NULL AND pt.bandar_pekan_mukim_id IS NOT NULL;
```
Staging (`et_main_stg1/2`) is a **prod clone**, so an aplikasi_id found on staging usually exists on
PROD with the same id — confirm on PROD rather than labelling a staging find "staging-only".

---

## Back-harvest corrections 2026-08-16 (QA-273956)

### §17.3 SCOPE CORRECTION (owed since the quest, delivered now)
§17.3's "zero rows ever" for STATUS_PENYEDIAAN_CETAK/_SELESAI holds ONLY for the Surat Keputusan family — do NOT generalise: PLP_SRT_YB (aplikasi 3424732) carried 1979=STATUS_PENYEDIAAN_CETAK at 273956 Phase 0. NULL status_id is also the resting state of a ROLLED-BACK penyediaan document, not only "peraku completed".

### §19 confirming case — the generateSurat display-gate caused a real 4-day reopen
273956's Phase-0 verdict quoted generateSurat:"TIDAK" on all 6 JT rows as proof "nothing to patch" while the tugasan was PSJT — exactly the §19 gate (PelupusanHelper.java:210-214 hides TIDAK rows on PSJT/PGSJT). Redmine reopened 2026-08-10; patch widened to flip the 6 flags. The §19 fact was banked ~90 min BEFORE the wrong verdict (commit 88b925f) and never cross-checked.

### Penyediaan-doc AUTO-REGEN on screen open (previously undocumented)
BasePenyediaanDokumenForm.java:2399-2418 — findBaruOrSediaOrPembetulanStatusDokumenByAplikasi(...) then: empty → initNewDokumenList() (regenerates NOW); non-empty → refreshDokumenList (serves the EXISTING copy). There is NO "Jana semula" button — opening the screen IS the regen. Consequence: fix the DATA FIRST, open the screen AFTER; opening first locks stale content in (status flips BARU, later opens hit the else-branch and serve the stale copy).
