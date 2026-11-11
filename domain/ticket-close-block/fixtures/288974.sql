-- Ticket: Internal Issue (PROD) #288974
-- Env: Melaka PROD (etprdmlk) — schema et_main
-- Permohonan: PTMLK/02/L/UPS_PLP/2026/15 (3474343), linked to PTMLK/02/L/PPTPB/2026/9 (3444436, not touched)
-- Fix: Tamatkan the UPS_PLP (surat pembatalan done manually), same shape as #283980. Closes the active
--      Penyediaan Surat tugasan and removes the dashboard row so it leaves Senarai Tugasan.

SELECT aplikasi_id, id_pengenalan, status_proses, status_keputusan, status_awam, hubungan_aplikasi_id, trkh_tamat
FROM et_main.umm_aplikasi
WHERE id_pengenalan = 'PTMLK/02/L/UPS_PLP/2026/15';

SELECT conrelid::regclass AS child_table
FROM pg_constraint
WHERE contype = 'f' AND confrelid = 'et_main.umm_tgsn_semasa'::regclass;
-- 0 rows

UPDATE et_main.umm_aplikasi
SET status_keputusan = 'Batal', hubungan_aplikasi_id = NULL, status_proses = 'Tamat', trkh_tamat = SYSDATE, status_awam = 'Tamat'
WHERE id_pengenalan = 'PTMLK/02/L/UPS_PLP/2026/15';
-- 1 row updated

UPDATE et_main.umm_a_tgsn
SET flag_aktif = 'N', status_tugasan = 'Selesai', trkh_tetap = SYSDATE
WHERE flag_aktif = 'Y'
  AND aplikasi_id = (SELECT aplikasi_id FROM et_main.umm_aplikasi WHERE id_pengenalan = 'PTMLK/02/L/UPS_PLP/2026/15');
-- 1 row updated

DELETE FROM et_main.umm_tgsn_semasa
WHERE aplikasi_id = (SELECT aplikasi_id FROM et_main.umm_aplikasi WHERE id_pengenalan = 'PTMLK/02/L/UPS_PLP/2026/15');
-- 1 row deleted
