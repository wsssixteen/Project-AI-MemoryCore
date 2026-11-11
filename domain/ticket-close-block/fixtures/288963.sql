-- Ticket: Data Patching (PROD) #288963
-- Env: Melaka PROD (etprdmlk) — schema et_main
-- Permohonan: PTMLK/02/L/MLPS/2026/12 (3486837) · lesen A02/2026/27 (asal M 059, PDTJ.600-2/9/65)
-- Fix: Tempat 'PT 2' to 'SEK II' on the permohonan row and on the source lesen row, same shape as #279793.

SELECT a_permohonan_tnh_id, tempat, nama_kawasan_terlibat, no_lot
FROM et_main.umm_a_permohonan_tnh
WHERE aplikasi_id = (SELECT aplikasi_id FROM et_main.umm_aplikasi WHERE id_pengenalan = 'PTMLK/02/L/MLPS/2026/12');

SELECT mklmt_tnh_permit_lesen_id, tempat, no_lot
FROM et_main.ind_mklmt_tnh_permit_lesen
WHERE permit_lesen_id = (SELECT permit_lesen_id FROM et_main.ind_permit_lesen WHERE no_permit_lesen = 'A02/2026/27');

UPDATE et_main.umm_a_permohonan_tnh
SET tempat = 'SEK II', nama_kawasan_terlibat = 'SEK II'
WHERE tempat = 'PT 2'
  AND aplikasi_id = (SELECT aplikasi_id FROM et_main.umm_aplikasi WHERE id_pengenalan = 'PTMLK/02/L/MLPS/2026/12');
-- 1 row updated

UPDATE et_main.ind_mklmt_tnh_permit_lesen
SET tempat = 'SEK II'
WHERE tempat = 'PT 2'
  AND permit_lesen_id = (SELECT permit_lesen_id FROM et_main.ind_permit_lesen WHERE no_permit_lesen = 'A02/2026/27');
-- 1 row updated
