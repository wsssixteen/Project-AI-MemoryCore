# DATABASE.md

# Etanah Melaka — Database Schema Knowledge Base

*Source: TDD SQL exports at `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\Database\Melaka\` — three environments: `MLIT/`, `MLKFAT/`, `MLKUAT/`. FAT is authoritative for FAT-phase tickets.*
*FAT schema files: `et_main.sql`, `et_flowable17.sql`, `et_sistem.sql`, `et_dms.sql` (no `_mlit` suffix in FAT).*
*Environment: PostgreSQL.*
*Last updated: 2026-04-15 PM (pemohon table resolved to `umm_a_pihak_bkptg`; QA #255773 SPOC copy failure confirmed)*

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

## 3. Table Prefix Legend (et_main)

| Prefix           | Meaning                                                | Example                                   |
| ---------------- | ------------------------------------------------------ | ----------------------------------------- |
| `umm_a_*`        | Application-level data — PLU processed/internal (etanah-pelupusan) | `umm_a_rizab`, `umm_a_hkmlk`              |
| `umm_p_*`        | Pre-application / portal submission data — AWAM public side (etanah-awam) | `umm_p_rizab`, `umm_p_aplikasi`, `umm_p_hkmlk`           |
| `umm_*` (no a/p) | Common shared tables                                   | `umm_aplikasi`, `umm_aliran_kerja`        |
| `ind_*`          | Index/reference tables                                 | `ind_ursn`, `ind_hkmlk`, `ind_pejabat`    |
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

---

## 6. Workflow Tables

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
