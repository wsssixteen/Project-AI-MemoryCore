# Current Session

**Last Activity**: 2026-10-01 17:55 — QA-282587 (PSBS Maklumat Tanah wrong screen) BA confirmed, junior handover drafted · no-overload rule · DE.

## Session Recap (2026-10-01, worktree quest-282587-guide-be4171)
- **Ask**: junior guide for #282587 (root cause first, steps, screen-load chain); then a BA confirmation note; then hint-style handover for Farah (Siti Farhanih).
- **Root cause (verified PROD/STG2/MLIT)**: 6 PSBS Maklumat Tanah langkah (PYMB/SMB/PMB + PTG Tangguh risalat trio) on skrin 1878 PLMS_MT instead of 1140 PLP_MT. #261516 KP fix was verified on MLKSTG in June but STG data was rebuilt after, never reached PROD.
- **Fix**: D1 6-row `ind_langkah.skrin_id` → PLP_MT (`2. Fix\282587.sql` + `-check.sql`, answer key) · R1 Minit Bebas into PSBS no-extra-panel list (`PelupusanExcelReaderHelper.java:1658-1671`) · R2 Tangguh Formula Premium via `TGS_RISALAT_MMKN_PTG_TANGGUH_LIST` (:1675), found on miya's "verify" push.
- **Redmine**: BA note posted (miya-edited, In Progress, assigned Amirah); BA replied "Yes like this, can proceed fixing". Farah hint handover drafted, NOT posted.
- **Built**: CLAUDE.md v1.75 NO INFORMATION OVERLOAD + reply-shape-spec §3c (f78ae0d8) · memories browser-edge-default, junior-handover-hints (statements, no quiz) · FLOWABLE-WORKFLOWS.md Maklumat Tanah screen/panel routing.
- **Slips (miya)**: built-in browser instead of Edge · asked BA which env #261516 used (ticket answered it) · 2 BA questions answerable from evidence · overloaded guide/note (4 trim rounds) · scripts given to junior · quiz-style hints · R2 gap missed until "verify".
- **Carry forward**: post Farah handover · KP SBTM (shared PSBS+MCL) undecided · sql-schema-verify gate vs unqualified scripts (task chip spawned).
**Last Activity**: 2026-10-01 17:10 — all-day adhoc session (ADHOC-PRBB-2026-7 + -8 on HOLD) · adhoc-save ProTime title + daily-session rules · DE.

## Session Recap (2026-10-01, worktree permit-c02-2026-3-portal-362d6d — the all-day adhoc session)
- **Adhoc 1 — ADHOC-PRBB-2026-7** (Title: PRBB Ganti Hari bayaran royalti): PDTJ public on AWAM Ganti Hari C02/2026/3 → "Bayaran royalti/fi permit asal belum dijelaskan". Check = `AwamMaklumatLesenTabForm.validateGantiHariPermitRules():1143-1156` (any N `hsl_bayaran_fi` row on the original PRBB app blocks). PROD apl 3408435: 4 N rows — royalti 2165137 (paid at counter by ID hakmilik as NEW row 2166364, so the prepared row never settled) + Deposit Jalan / Deposit Bahan Batuan / Doket (RM5,000, no resit). miya replied to BA Mira with the check SQL screenshot. HOLD → PDTJ answer, then PROD patch.
- **Adhoc 2 — ADHOC-PRBB-2026-8** (Title: PRBB jenis permohonan SK): no SK. AWAM `PelupusanConstant` hardcodes 1 Baru / 6 Ganti Hari / 8 Tambah Kuantiti / 7 Langkau Tahun → saved as `integerJenisPermohonan` in `umm_a_permit_lesen.mklmt_tmbhn` → compared against the same constants (screen panels, Ganti Hari rules, `isLangkauTahun` BPMN gateway, template.config Minit Bebas / Surat Keputusan choice). Senarai kumpulan checked: closest `RPT_JNS_PERMOHONAN2` = old labels, report-only. HOLD → miya sends the BA answer. Side: LATENT-BUGS L19 (`== "2"`).
- **Built**: adhoc-save ProTime `title` (block + qa_doc + audit ≤6 words/40 chars, 69128809) · daily adhoc session rules (route to open adhoc, Title first, answer first, size gate → spawn_task, end-of-day DE save; skill + intake hook, 261ec2d8).
- **Slips (miya)**: SK answer handed over before checking senarai kumpulan + the code path ("have you verified it 100%", "trace the code", "did you check senarai kumpulan") · offered "log it / leave" for the L19 bug instead of logging it.
- **Carry forward**: -7 PDTJ answer → PROD patch · -8 BA send → close · push of 69128809 failed earlier (GitHub unreachable) — retried at DE.

**Last Activity**: 2026-10-01 17:05 — ADHOC-UPS-2026-1 (UPS_PLP common templates) saved + audit 28/28 · DE.

## Session Recap (2026-10-01, worktree pelupusan-template-verify-fe1bef)
- **Ask**: reload the 21 Sep template-usage audit; verify the 3 templates that go through etanah-common (miya thought "ulangan"); give urusan + tugasan for BA to test.
- **Found**: the 21 Sep session (archived "Etanah Melaka template usage audit") was never saved — found via transcript search. Re-verified: 3 common = SN_JPPH surat-SuratNilaianJPPH · CON_SRT_JT surat-SuratJabatanTeknikal · SMPG surat-SuratMaklumanKepadaPemegangGadaian, only via UPS_PLP / UPS_PS (MlkPelupusanPenyediaanSuratStrategy.java:62 → CommonPLPandBGNSuratStrategy.java:92). Ulangan JT is NOT common in Melaka (pelupusan own TemplateSuratUlanganJabatanTeknikal.docx). PROD: SN_JPPH 4 · CON_SRT_JT 1 · SMPG 0. 4th option BGN_UTILSM has no MLK surat_makluman.docx.
- **Test data (STG)**: PTMLK/02/L/UPS_PLP/2026/7 nazli · /03/.../2026/4 asikin · /02/.../2026/6 faridmajid, all at Penyediaan Surat.
- **Slips**: first adhoc-save writes landed in the worktree (no cd to main) — moved; notes.js --reset wiped the 2 extra test rows — re-added.
- **Carry forward**: send BA message; BGN_UTILSM check if BA picks it; 10 ukur/permit templates need etanah-teknikal locally.
**Last Activity**: 2026-09-30 18:05 — ADHOC-PDBB-2026-1 (MLIT PDBB Perakuan slow) closed + archived (dropped by miya) · attempt-before-blocked-gate widened · DE.
