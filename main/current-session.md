# Current Session

## 2026-08-21→24 — Board Redmine-reconcile (20→9) + de-close-gate C4 + codemap v6 FEATURES revamp + knowledge bake

**Arc**: boot briefing → miya raged at 20 stale "open" quests → reconciled vs live Redmine (0 assigned-open; archived 274740/274914/275009/275456/275500/275501/275587-MLPS/276182/276654 + adhocs A12/A13 via adhoc-lifecycle Doors) → built the permanent fix: `quest/redmine-reconcile.js` + **de-close-gate C4** (DE close BLOCKS unless reconcile ran ≤12h; eval 14/14). Root causes: DE had NO Redmine step + main↔worktree active.txt divergence (unioned, synced both). Rule 12 floor RAISED 10→20 scenarios per miya (SKILL.md v2.7) + scenario TABLE must be displayed.

**Codemap v6 (miya's 8-point /goal)**: revamped `etanah-codemap` site — Features spine (12 grep-verified groups + class chains, 0 unresolved), Roles tab (9,132 files, 6 sources incl. spoc + bpmn), Entity↔Table tab (596 entities). KEY DISCOVERY: entities live in `etanah-domain-1.0.4-MLK` JAR (`my.gov.etanah.domain.*`), @Table names prefix-SPLIT via `TablePrefixConstant` — baked into `MODULE-ARCHITECTURE.md` §Where-entities-live + index.md quick-links. ⚠ MAX_PATH: long extract path silently skipped 751/1265 files. Pipeline: `scan_classes.py` → `features_build.py` → `build_site_v2.py` (wired into refresh-codemap.bat). All 5 tabs/buttons verified (real clicks + geometry, 0 console errors; pixel screenshot blocked — Browser pane hidden). Proposal #1 SHIPPED: codemap-recon-consult now surfaces `entity_table_map.json` + `features.json` (eval 7/7).

**Handover written**: `etanah-codemap\HANDOVER-db-feature-split.md` — other session assigns ~734 et_main tables to the 12 feature groups, DB-verified. (Sibling session's `etanah_atlas` server appeared on main during DE-sync — possibly that work already started.)

**Open residuals (miya answers pending)**: #276349 + QA-276584 fixes UNCOMMITTED while Redmine shows Verified/Resolved — commit or drop? · A12 PRBB null-guard `MlkBorang4CeForm:367/:369` still wanted? · 274740's owed patch verified MOOT (PROD 6/6 generateSurat=YA). Slips: assume-not-verify (board rot) + reask/redundant (asked adhoc archive when rules existed; 10-vs-20 scenarios under-write). 3 proposals logged (#1 shipped; #2 codegraph domain index; #3 codemap freshness automation).

**Resume point**: DE 2026-08-24 closes this arc. Next: miya's 2 uncommitted-fix answers → then normal quest work; other session runs the DB-feature handover.

**Recap**: resumed `/quest 276436` (PPTPB Perserahan Kaunter: Kategori Tanah + Tujuan Permohonan + Keluasan Tanah Dipohon filled at counter, blank at SKM). First verified miya's question — is this a lost 1.3.5-vs-1.3.4 fix? **NO** (git-proven: `1.3.5..1.3.4` empty, writer byte-identical through master → standing omission, not regression).

**Split resolution (3 fields, 2 owners)**: (a) **Keluasan** = OUR fix — counter writes `umm_a_hkmlk.mklmt_tmbhn.luasDimohon` (per-hakmilik, reachable); added PPTPB-gated block in `etanah-pelupusan PelupusanSpocService.java` kaunter else-branch reading that key. Commit `01be3f8dad` on `mlk/276436` → merged `mlk/int-env` `f79e9393f1`, compiled green. (b) **Tujuan + Kategori** = SPOC handoff — counter save `PelupusanSpocModuleStrategy.saveMaklumatPerserahanTab:655/:684` writes `tujuanPermohonan` only for urusans in its list; PRBB & PRU in, PPTPB NOT (DB-proven). Our reader `PelupusanSpocService.java:715` already reads it un-gated → SPOC fix alone closes Tujuan; Kategori reverse-engineers from Tujuan.

**Rough session — corrections banked**: (1) never traced the screenshot's actual xhtml — grepped a keyword, matched the wrong SPOC tab, concluded wrong module twice (flip-flopped SPOC→pelupusan→SPOC before DB settled it). (2) handoff comments were AI-babble + CAPS — miya rewrote to bare statements ("PPTPB missing this inside DB"). (3) tried to BUILD the SPOC fix + compile — miya: "we're HANDING it off, build the WORDING". (4) put the evidence query in the Task folder — belongs in chat (not a data patch). Slips: `didnt-trace-ui-screenshot`, `wrong-module-from-keyword-grep`, `cross-module-unverified-analog`, `handoff-babble-not-statement`, `evidence-query-in-task-folder`.

**New memory**: `feedback_ticket_writing_style.md` — miya's plain ticket voice (short human sentences, no technicals/CAPS/AI-words) with his verbatim #276436 example as the target. **Updated**: `feedback_cross_module_handoff_artifact.md` (+4: verify-in-target-module before proposing · 4-deliverable set · comments-are-statements · evidence-query-in-chat).

**New Feature — `domain/ticket-close-block/`** (per miya, built via system-design/system-rules): deterministic git commit-reference `<pre>` block generator, module-aware (AWAM=branch only; pelupusan=branch+int-env). `--repo --ticket --module [--branch --intenv-sha --cherrypick]`, logs to log.jsonl. README (12 adversarial scenarios), NUKE-MARKER, wired into `feedback_ticket_writing_style`. Smoke-tested both module paths. **New knowledge**: `etanah-knowledge/melaka/SPOC-COUNTER.md` (SPOC counter mechanism + PPTPB gap + 2-part fix).

**Redmine reconcile (this DE, per miya "check all our tickets")**: board = 0 assigned-open mine. Closed 7 stale active.txt blocks matching Redmine terminal state (274740·275501·276654·276182·276584·276504 + 276436 our-part-done), archived 6. active.txt 17→14 open (7 ADHOCs + 276549/276181 ours + 274914 Idris's).

**Resume point**: 276436 off our plate — miya sends SPOC handoff + builds int-env for BA to test Keluasan. Nothing more our-side.

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

- 2026-08-24 post-DE hotfix: miya-reported bug — Tables view visible on EVERY main tab. Root: `#view-search{display:flex}` (ID specificity) beat `.view.hidden` (class-only; its !important twin lived only in @media print). Fix: `.view.hidden` added to the hard-override !important list (src/style.css:356) — the one selector missing from the 2026-08-22 overlay-lesson list. Mechanism: ship_check now renders all 4 tabs headless with a ?shipcheck=1 pixel barcode (green=visible/red=hidden, PIL-sampled) — dump-dom emits nothing in this Edge build; negative fixture proven (broken CSS -> RRGG FAIL). build.py non-ASCII prints fixed (cp1252 crash). Ship-check PASS; 4 clean tab screenshots delivered.
