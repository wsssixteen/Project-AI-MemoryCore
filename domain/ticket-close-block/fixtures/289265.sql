-- Ticket: #289265
-- Env: PROD (172.30.17.104) — schema et_main
-- Permohonan: PTMLK/02/L/MLPS/2026/8 (3455000) · /11 (3468148) · /13 (3490590) · /14 (3490604)
-- Fix: Tempat to "-" on /11 /13 /14; Maksud Pendudukan /13 to LAIN-LAIN - TANAMAN SIRIH and /8 to LAIN-LAIN - TANAMAN JAGUNG MUTIARA

SELECT a_permohonan_tnh_id, aplikasi_id, tempat FROM et_main.umm_a_permohonan_tnh WHERE aplikasi_id IN (SELECT aplikasi_id FROM et_main.umm_aplikasi WHERE id_pengenalan IN ('PTMLK/02/L/MLPS/2026/11', 'PTMLK/02/L/MLPS/2026/13', 'PTMLK/02/L/MLPS/2026/14'));
-- 3 rows, tempat = PT 53 / PT 8122 / PT 1684

UPDATE et_main.umm_a_permohonan_tnh SET tempat = '-' WHERE aplikasi_id IN (SELECT aplikasi_id FROM et_main.umm_aplikasi WHERE id_pengenalan IN ('PTMLK/02/L/MLPS/2026/11', 'PTMLK/02/L/MLPS/2026/13', 'PTMLK/02/L/MLPS/2026/14'));
-- 3 rows updated

SELECT a_permit_lesen_id, aplikasi_id, tujuan_permohonan FROM et_main.umm_a_permit_lesen WHERE aplikasi_id = (SELECT aplikasi_id FROM et_main.umm_aplikasi WHERE id_pengenalan = 'PTMLK/02/L/MLPS/2026/13');
-- 1 row, tujuan_permohonan = Pertanian (Tanaman Sirih)

UPDATE et_main.umm_a_permit_lesen SET tujuan_permohonan = 'Tanaman Sirih' WHERE aplikasi_id = (SELECT aplikasi_id FROM et_main.umm_aplikasi WHERE id_pengenalan = 'PTMLK/02/L/MLPS/2026/13');
-- 1 row updated

SELECT a_permohonan_tnh_id, aplikasi_id, tujuan_permohonan, tujuan_permohonan_id FROM et_main.umm_a_permohonan_tnh WHERE aplikasi_id = (SELECT aplikasi_id FROM et_main.umm_aplikasi WHERE id_pengenalan = 'PTMLK/02/L/MLPS/2026/8');
-- 1 row, tujuan_permohonan = GERAI SEMENTARA, tujuan_permohonan_id = 37423

UPDATE et_main.umm_a_permohonan_tnh SET tujuan_permohonan = NULL, tujuan_permohonan_id = NULL WHERE aplikasi_id = (SELECT aplikasi_id FROM et_main.umm_aplikasi WHERE id_pengenalan = 'PTMLK/02/L/MLPS/2026/8');
-- 1 row updated

SELECT a_permit_lesen_id, aplikasi_id, tujuan_permohonan, kegunaan_id, kegunaan FROM et_main.umm_a_permit_lesen WHERE aplikasi_id = (SELECT aplikasi_id FROM et_main.umm_aplikasi WHERE id_pengenalan = 'PTMLK/02/L/MLPS/2026/8');
-- 1 row, tujuan_permohonan = GERAI SEMENTARA, kegunaan_id = 37423, kegunaan = GERAI SEMENTARA

UPDATE et_main.umm_a_permit_lesen SET tujuan_permohonan = 'Tanaman Jagung Mutiara', kegunaan_id = NULL, kegunaan = NULL WHERE aplikasi_id = (SELECT aplikasi_id FROM et_main.umm_aplikasi WHERE id_pengenalan = 'PTMLK/02/L/MLPS/2026/8');
-- 1 row updated
