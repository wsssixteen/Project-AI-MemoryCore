# Current Session

## 2026-08-21 — QA-276549 PRBB Perserahan Kaunter doc-mandatory: Scout→Rubric→Apply→handoff + module-boundary rule banked

**Recap**: `/quest 276549` (PRBB, "Tidak boleh seterusnya kerana Dokumen Mandatori"). BA: "Salinan Resit Cukai Tahunan" + "Sijil Carian Rasmi" mandatori for ALL Taraf Tanah; should be non-mandatory except Tanah Milik. Twin of AWAM #270297. Test data `PTMLK/01/L/PRBB/2026/39` (apl 3433001, Rizab) login SaffuanH@melaka.gov.my, MLKSTG/et_main_stg2.

**Root cause (VERIFIED, DB-proven)**: SKM "Dokumen Disertakan" screen (skrin `PLPS_SMKN`) = common `CommonSenaraiSemakanForm` → `CommonSemakanPanelForm.updateFlagWajibSenaraiSemakPelupusan():748` decides wajib — already forces Tanah-Milik→mandatory, has NO non-Milik release. `flag_wajib=Y` persisted in `umm_a_dok_kmskn`. Taraf Tanah source: counter→`umm_aplikasi.mklmt_tmbhn` "tarafTanah"; staff/online→`umm_a_permohonan_tnh.kelas_tnh_id`.

**Fix-site journey (3 corrections, all this session)**: (1) first placed at `etanah-spoc-hasil PerserahanService.populateAppDokumenKemasukan:5343` — WRONG (payment path; DB `created_by`+timestamp proved counter rows written at perserahan not payment). (2) moved to `etanah-spoc-hasil PopulateDataUtil.populateAppDokumenKemasukanBySemakanDokumen:965` — correct counter generator, but SPOC = off-limits per miya's new rule. (3) FINAL = `etanah-common CommonSemakanPanelForm:748` (the read/validate gate) = STRONGER: fixes online + counter + already-stuck apps.

**New rule banked**: `feedback_module_edit_boundary.md` — edit only awam/pelupusan; common = pass/handoff; spoc = NEVER edit, cater from our side (place fix where our tugasan reads/validates). miya 2026-08-21.

**Deliverables** (Task `2. Fix\`): miya's renamed `2. CommonSemakanPanelForm.java.java` (Fix A common, BEFORE/AFTER, canonical — to common team) + `FIX-B-SPOC (alternative, new apps only).java`. Fix = non-Milik PRBB → `docsToSetNotMandatory` SCR + PLP_RESITCUKAI; PRBB-guarded (safe for other urusan). Control verified: `PTMLK/02/L/PRBB/2026/11` (apl 3431038) = Tanah Milik → mandatory correct.

**Branch**: `mlk/esokongan/276549` pushed in etanah-spoc-hasil (now unused; fix is common) — left in place per miya.

**Resume point**: common team merges Fix A → build → test (Case 1 non-Milik passes · Case 2 Tanah Milik stays mandatory). Fix NOT applied to any repo (handoff artifact). Bounty pending: QA-275501 (parked).

## 2026-08-20 (night-2) — #276504 root-cause + OUR fill-only fix on top of Alex → int-env (deploy re-run pending)

**Recap**: miya asked me to root-cause #276504 (HASIL "Error during generate receipt", Critical PERMANENT FIX). Full context loaded (Description stack trace + 9 journal entries + rework video `276504_REWORK - MLIT.mp4` + DB).

**Root cause (VERIFIED)**: PPTPB stores maklumat tanah in `umm_p_permohonan_tnh`; `umm_p_hkmlk` is a title-link row whose `bandar_dipohon_id` was never populated → HASIL `PerserahanService.populateAplikasi():6605` reads `PraHakmilik.getBandarPekanMukim().getKod()` → NPE. DB timeline: pre-08-20 PPTPB apps `bandar_dipohon_id`=NULL (v1); 08-20 apps set (v2). Regression Anis saw (maklumat hilang on re-save) = eMohon PPTPB reload reads bandar/daerah from title, seksyen/luasDipohon not from ppt — display/round-trip, data intact in `umm_p_permohonan_tnh`.

**OUR fix (better than Alex's, built ON TOP — his kept)**: new `fillPraHakmilikBandarFromHakmilik` in `etanah-awam PelupusanService.java` — fill-only (never overwrites/creates orphan; all title rows; sourced from title `getHakmilik().getBandar()`), called from `saveMaklumatLesenPLPS` (eMohon path Alex's call misses). Alex's `syncBandarPekanMukimIntoPraHakmilik` untouched. Fill-only ⇒ structurally cannot cause the disappearing-data regression. Compiled green (branch + int-env).

**Git**: base `mlk/internal/276504` off Alex commit `5351a7c31f` → our commit `7c01808ae2` → pushed. Cherry-picked our commit onto `mlk/int-env` → `e4eeafedd6` (full merge dragged master↔int-env divergence into conflict; cherry-pick clean). Deploy script → `1. Tasks\Melaka\164…\2. Fix\deploy-276504-internal.txt`. **Deploy attempt hit the transient `index-pack` clone failure (deploy skill §7) — re-run pending; NOT our change (build never compiled, 0.040s no-POM).**

**Rough session — 3 corrections banked**: (1) branch naming — INTERNAL ISSUE → `mlk/internal/<num>`, NEVER invent a suffix (`-permfix`) or abbreviation; (2) do NOT replace a colleague's fix — build on his commit; (3) commit-gate/compile-gate read the WORKTREE's stale `active.txt`/`.claude/state`, not the main-repo live one → resolved to wrong ticket (QA-274740). Improvement proposal logged.

**Resume point**: after miya re-runs the deploy on MLIT, do a fresh eMohon PPTPB save → I verify `umm_p_hkmlk.bandar_dipohon_id` non-null (I hold mlit MCP). Then Redmine planned-release list (int-env never reaches master).

## 2026-08-20 (night) — Upload-flow research (Pelupusan+Awam→DMS) + built `de-knowledge-gate` + banked FLOW-TRACES

**Session shape**: miya asked for extensive verified research on the file-upload flow across pelupusan + awam (UI→DMS, path creation, common hops) → delivered story diagram + separate file:line tables (audited) → 2 more asks: a friend-facing `.md` handover + an HTML **Artifact** logic diagram (published `https://claude.ai/code/artifact/3ebdbe52-a09b-417b-9dd7-59da0b351c6f`). No etanah repo code changed (read-only trace). Worktree `oprbb-quantity-display-issue-95483d`, on `main`.

**The research (banked → FLOW-TRACES.md)**: upload = two-click two-phase. CLICK1 pick file → `uploadTempDocument(byte[])` → temp doc in separate `etanah-dms` app (HTTP-invoker remoting), only `tempDocumentId` in RAM. CLICK2 Save → slot row (`AppDokumenKemasukan` PLP / `PraSemakan` AWAM portal) + permanent DMS doc + `Document` pointer row (`medan/medanPk`). Module diff: PLP finalizes `create(fileBytes)`; AWAM finalizes `saveTempDocument(tempDocumentId)`. Listener: PLP shared `BaseFileUploadVO:110` (common); AWAM per-form. Physical path lives in `etanah-dms` (out of workspace). Full file:line map in FLOW-TRACES.md §File upload → DMS.

**System work (the main deliverable)**: miya flagged a real design hole — DE Step 7 (etanah-knowledge sweep) was model-judgment, silently skippable → session knowledge lost → next session re-derives = wasted usage. Built **`domain/de-knowledge-gate/`** (hook-only Feature, via forge): Stop hook fires on DE-close banner, BLOCKS when knowledge-worthy signals present (≥3 file:line · research .md/.html deliverable · DB MCP query · trace intent) but no `## Knowledge candidates` list/sentinel emitted. Non-auto-write (miya approves each bake). Eval 11/11 (10 verdict + 1 real-process effect exit-2). Registered in settings.json Stop; NUKE-MARKER + README present; expansion-protocol Step 7 pointer added.

**Resume point**: de-knowledge-gate is live — retire 2026-09-19 if fired ≥1× + no rollback. If it misfires, NUKE-MARKER has the rollback recipe. Bounty pending: QA-275501 (parked, unrelated).
