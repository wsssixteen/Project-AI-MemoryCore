-- Ticket: Internal Issue (PROD) #283980
-- Env: Melaka PROD (etprdmlk) — schema et_main
-- Permohonan: PTMLK/02/L/UPS_PLP/2026/12 (3451182) · PTMLK/02/L/UPS_PLP/2026/13 (3455576)
-- Fix: Batal two UPS_PLP created by mistake, same shape as #283532. Also close the still-active
--      Penyediaan Surat tugasan and remove the dashboard rows so they leave Senarai Tugasan.

SELECT aplikasi_id, id_pengenalan, status_proses, status_keputusan, status_awam, hubungan_aplikasi_id, trkh_tamat
FROM et_main.umm_aplikasi
WHERE id_pengenalan IN ('PTMLK/02/L/UPS_PLP/2026/12', 'PTMLK/02/L/UPS_PLP/2026/13');

UPDATE et_main.umm_aplikasi
SET status_keputusan = 'Batal', hubungan_aplikasi_id = NULL, status_proses = 'Tamat', trkh_tamat = SYSDATE, status_awam = 'Tamat'
WHERE id_pengenalan IN ('PTMLK/02/L/UPS_PLP/2026/12', 'PTMLK/02/L/UPS_PLP/2026/13');
-- 2 rows updated

UPDATE et_main.umm_a_tgsn
SET flag_aktif = 'N', status_tugasan = 'Selesai', trkh_tetap = SYSDATE
WHERE flag_aktif = 'Y'
  AND aplikasi_id IN (SELECT aplikasi_id FROM et_main.umm_aplikasi WHERE id_pengenalan IN ('PTMLK/02/L/UPS_PLP/2026/12', 'PTMLK/02/L/UPS_PLP/2026/13'));
-- 2 rows updated

DELETE FROM et_main.umm_tgsn_semasa
WHERE aplikasi_id IN (SELECT aplikasi_id FROM et_main.umm_aplikasi WHERE id_pengenalan IN ('PTMLK/02/L/UPS_PLP/2026/12', 'PTMLK/02/L/UPS_PLP/2026/13'));
-- 2 rows deleted
