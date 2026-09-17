---
name: kadar-cukai-duplicate-maintenance
description: PT plot "Kadar Cukai Tanah" pulls the OLDEST of duplicate maintenance rate rows (same keys, different value) — 2026-09-17 adhoc, DATA/maintenance side, future ticket possible
metadata:
  type: reference
---

PT "Penyediaan Risalat MMKN - PDT" plot dialog "Maklumat Plot Untuk Dikeluarkan Hakmilik" → field "Kadar Cukai Tanah" is LIVE-COMPUTED, not stored. It pulled RM10 when BA expected RM29 because maintenance holds TWO rate rows with identical lookup keys and the code takes the earliest-created one.

**Root cause (DATA, not code)** — MLKSTG et_main_stg2, Mukim Ayer Panas:
- `ind_kadar_cukai_bpm` has two rows, same keys, different value:
  - bpm 6143 = RM10.00 (created admin 2026-05-24 22:43:57)
  - bpm 6226 = RM29.00 (created admin 2026-05-24 22:45:29)
- Identical keys on both: bandar_pekan_mukim_id=41, jns_tnh_id=9957 (Tanah Desa), kegunaan_tnh_id=38426 (BANGUNAN), btrn_kegunaan_tnh_id=38456 (TUJUAN KEDIAMAN), warta_id=1, flag_kadar_awal=N, kadar_cukai_sebelum=null.
- User ADDED a second row (RM29) instead of EDITing the existing RM10. Screen allowed the duplicate.

**Why RM10 wins** — lookup at `E:\Projects\Melaka\etanah-common\src\main\java\my\gov\etanah\common\service\cukai\CukaiCalculationService.java:207`: `.where(mukim, jenisTanah, kegunaanTanah, butiranKegunaanTanah, adalahKadarAwal=FALSE [, warta if set] [, kadarCukaiSebelum if set]).orderBy(kadar_cukai_bpm_id ASC).limit(1)` → duplicate keys → 2 rows → picks lowest id (6143, RM10). Context built at `E:\Projects\Melaka\etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\service\impl\PelupusanService.java:10908` (onCalculateCukaiTanah); PT does NOT set warta and sets adalahMCL=false.

**Amount formula** — for unit "per 100 meter persegi": nilai = ceil(luas ÷ 100) × kadar, then floored to Melaka minimum RM50 (non-MCL) / RM25 (MCL) at CukaiCalculationService.java:505. "Pengkelasan Tanah" (DESA II) is NOT a lookup key and does not affect the amount.

**The two original screens (why they did not tally)** — different luas, not different setting:
- PROD lot 13102, apl 3422294, luas 967 m² → RM100.00 (`umm_a_permohonan_tnh.jumlah_cukai_tnh`).
- STAGING PTMLK/02/L/PT/2026/29, apl 3433210, luas 100 m² → RM50.00 (floored).

**Data map**: `umm_aplikasi.id_pengenalan` = the PTMLK/.../PT/YEAR/N id. Plot rows in `umm_a_permohonan_tnh` (no_lot, luas_dipohon, kadar_cukai_tnh, jumlah_cukai_tnh, aplikasi_id).

**Fix / handback**: BA removes or edits the duplicate so ONE kadar row per (mukim + jenis + kelas + butiran + warta). Verdict = maintenance-data cleanup, no code change. PROD not yet checked for the same duplicate. If ticketed, start here (already root-caused + DB-proven on stg2).
