# Current Session

## 2026-09-18 (continues worktree `esokongan-tracker-tickets-save-3ddcc8`) — /goal S2: VERIFY sweep on the 4 eSOKONGAN tickets (expected-behaviour-with-evidence)

**Arc**: /goal — re-sweep the 4 (280132/166/176/191) to VERIFY the fixes, pin the EXPECTED behaviour WITH EVIDENCE, re-score confidence; then /quest save + audit + improve sweep + DE. 4 opus verify2 familiars (one/ticket) each read the sweep-1 qa_doc + wave3 + audit and re-derived independently.

**Verify2 verdicts (all CONFIRM root cause; one fix revised)**:
- **#280132** CONFIRM 95% (unchanged). Analog corrected: real proof = `onCariPermohonanBertindih():209-212` (NOT TamatAplikasiServiceTask). Expected display DB-proven: PROD /7 → {/16,/18} each once; stg2 /7 → {/6}. New flag: IF/ELSE is either-or, not union.
- **#280176** CONFIRM 85→93% (+8). Closed residual: reconciler `!found` → `createNewVersiPermitLesenDataEntry` writes fresh 2026 versi; 6506 preserved (pulled before delete `:2593`); no secondary NPE. Code-only; W3's data-patch REFUTED.
- **#280191** CONFIRM 90→95% (+5). Save path traced: kemaskini `:19189` re-fetches + preserves `no_lot=223`; Tambah-Tanah INSERT `:19373` null-safe. Silent guard right, validator wrong.
- **#280166** CONFIRM root 98%, 🚨 FIX REVISED. Missing-branch REFUTED (gateway warta+default-End complete). Flat "TP" UNSAFE (kills Warta branch) → DERIVE `perluWT ? "warta" : "TP"`. Module etanah-common → likely **etanah-uam**. Still gated on #267621 diff.

**Improved the sweep**: W4 wave now requires EXPECTED-behaviour-WITH-EVIDENCE + verify-fix-produces-it (`.claude/skills/sweep/SKILL.md`, eval 13/13 green). The `--verify` pass = re-run W4-with-expected-behaviour on diagnosed tickets. Proposal logged (A5).

**Save**: 4 `QA-<n>-verify2.md` + a `## 0b. VERIFY2` addendum per qa_doc; synced worktree→main; active.txt phases bumped. Audit: 16 artifacts present in main.

**Resume**: unchanged from S1 — Apply each in its own session. #280166 now carries the REVISED fix (derived value + etanah-uam) + the #267621 gate.

## 2026-09-17 (Thu ~18:50–19:55, worktree `esokongan-tracker-tickets-save-3ddcc8`) — /goal: retrieve 4 eSOKONGAN tickets → full sweep (W1–W4) → save → audit → DE

**Arc**: /goal — retrieve the 4 eSOKONGAN tickets in a photo, full sweep, save all quests, DE, "so I can continue them in another session; audit the save before DE commit/push". Retrieved via `redmine-sync.js --create`: **#280166 · #280176 · #280191 · #280132** (folders 212–215) + bonus **#280099** (folder 216, PROD PT alter, NOT in photo, held not swept). Ran `/sweep` full 4-wave ladder — 16 familiars (sonnet W1–W3, opus W4), orchestration-mode flag on→off, 61 orch-suppressed rows, ledger `domain/sweep/log.jsonl`.

**4 verdicts (all CONFIRMED, Phase-0, NOT applied — each Apply in its OWN session)**:
- **#280132** PT bertindih dup — **95%**. `etanah-pelupusan MlkLaporanTanahDanPelanMesyuaratForm.initPermohonanBertindih():142-162` reverse-finder + `getAplikasiBertindih()` renders current app as its own bertindih; PROD apps /16+/18 declare /7 → 2 identical rows (DB-proven). Fix = W3's 3-swap to forward `findAppPermohonanByAplikasi`/`getAplikasi` (analog `TamatAplikasiServiceTask.java:70`). W4 caught W2's ELSE-getter error. Test on PROD (stg2 forward-only).
- **#280176** OMLPS Simpan NPE — **85%**. `PelupusanLiteService.populateVersiPermitLesen:2537` `removeIf(versiDok!=0)` leaves null-tarikh orphan `ind_versi_permit_lesen` 6506 → NPE :2553. Fix = CODE-ONLY additive `removeIf(getTarikhTamat()==null)`; NO data patch (6506 hollow orphan 0 links; real data on 6505 which #279882 patched PROD). Same M081 as #279882/#279709.
- **#280191** PLPS Maklumat Tanah Simpan NumberFormatException — **90%**. `PelupusanMaklumatPermitLesenHelper.onSimpanTanah:3603` unguarded `Integer.valueOf(getNomborLot())`; No Lot optional/null. Fix = `isNotBlank` guard. NOT the BA-suspected Butir-butir lanjut (that is `keteranganLain`). Long-standing latent (since 2025-08-08).
- **#280166** PLPS Hantar PropertyNotFoundException — root **96%** (DB-proven ACT_RU_VARIABLE), **fix-layer 70% GATED**. `caraPenghantaran` bpm var never set → gateway `sid-AAB04183` NPE. Fix = Java setter etanah-common `CommonPenerimaanBuktiPenyampaianForm.onSubmit` value "TP" (analog `BaseTindakanBuktiPenyampaianForm.java:1085`). 🚨 Cross-module (etanah-common/etanah-uam, NOT pelupusan), NOT locally testable, GATED on #267621 pull (redmine-write-gate blocked my read GET → needs みや/bypass) + module-ownership decision.

**Save**: each qa_doc got `## 0. RESUME POINT` (verdict · exact fix · banked proof · test data · residuals). 12 artifacts (4 doc + 4 wave3 + 4 audit). active.txt 4 blocks phase=Rubric-done. 🚨 **Untracked-strand catch**: `projects/` + `quest/active.txt` gitignored (untracked-confidential) → qa_docs were worktree-only; COPIED to main so next boot sees them (worktree is 0-ahead → auto-reaped). git-history probe clean (no existing fix / no regression) on all 4.

**Resume**: 4 tickets Rubric-done — resume each from its qa_doc `## 0. RESUME POINT`. #280166 blocked on #267621 pull + fix-layer nod. #280099 retrieved not swept (folder 216).

## 2026-09-15 (S1) — OMLPS "tujuan/tanah tiada pilihan": adhoc → 2 tickets (#279709 dropdown bug, #279882 date patch) · premature-root-cause slip cluster

**Arc** (worktree `omlps-tujuan-permohonan-dropdown-344bd1`): adhoc from PDTJ (nurulazura) — OMLPS Membaharui Lesen, "Kategori Tujuan Permohonan + Maklumat Tanah papar tiada pilihan", No LPS M081. I gave THREE premature root causes before running the quest, each refuted by miya's next screenshot: (1) "migration didn't carry data" → refuted (registry `ind_mklmt_tnh_permit_lesen` 4832 had it); (2) "key PDTJ.600-2/9/79 not 0402DIS2024000574" → live test threw errors; (3) "pick Kategori first (cascade)" → photo showed the Kategori parent itself intermittently empty. miya: "run full /quest ... stop bullshit". **Fix**: `feedback_adhoc_full_quest.md` (adhoc with real investigation → full quest; verify before claim; live test = ground truth) + MEMORY.md pointer + slip `reask/hallucination`.

**Findings (staging et_main_stg2, verified)**: M081 = permit_lesen_id 6253, lives on aplikasi 3412358 (`PDTJ.600-2/9/79`, urusan DMMLMS migrated), NOT 0402DIS2024000574 (aplikasi 3371287, PLPS migrated stub, created_by `MIGRATOR_MOHON_PLP`). Two migrated records, unlinked. OMLPS Cari gate = `onCheckPelan` requires a SIGNED PELAN (`MlkUtilitiPengeluaranLesenPermitForm.java:2485`→`:2570`); no pelan → "Pelan tidak dijumpai" + cascade "semua tahun sudah dikeluarkan" (one cause, two messages). Reference groups populated (PLP_KTGR_PRMHNN 5 · PLP_TJN_PMH_PLMS 18). Kategori list loads via `PelupusanMaklumatPermitLesenHelper.java:753`; intermittent empty = helper-build path (`MlkUtilitiPengeluaranLesenPermitForm.java:966`, `aplikasiNew!=null`) skipped on some Cari — runtime/lifecycle, not static; duplicate-app REFUTED (only one PDTJ.600-2/9/79 at Jasin).

**Tickets**:
- **#279709** (dropdown bug) — Internal Issue PROD, In Progress. Phase 0 done (Scout+Recon, all static causes eliminated). OPEN. Next = runtime logger probe on `retrieveAplikasi():349` + `initMaklumatTanah():966` to pin the intermittent `aplikasiNew`-null. Doc `projects/coding-projects/active/279709/279709.md` · task folder `205. II #279709`.
- **#279882** (date patch) — Data Patching PROD. **Phase 1 CLOSED**. M081 versi 0 (`ind_versi_permit_lesen` 6505) trkh_mula/tamat wrongly 2026 → patch to 2025 (1/1/2025–31/12/2025). Script `2. Fix\279882.sql` (schema-qualified et_main, kod-subquery, BEFORE+AFTER, PROD-catalog schema-verified). Infra handoff generated + given to miya. Awaiting infra PROD run + AFTER-SELECT → Phase 2. Doc `projects/coding-projects/active/279882/279882.md` · task folder `209. DP #279882`.

**Resume**: #279882 awaits infra confirm (AFTER-SELECT = 2025/2025) → Phase 2 archive. #279709 OPEN — on miya's go, build the runtime logger probe on `mlk/master`, deploy staging, re-Cari as nurulazura, read `server.log`. Everything on staging until root cause found (miya's directive).
