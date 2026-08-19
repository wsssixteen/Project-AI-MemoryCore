# Current Session

## 2026-08-19 — QA-275505+276181 bundled Apply (template + populators) · 2 forge features · QA-275501 Phase 2

**Session shape: morning briefing/plan → /quest resume 275505 + Phase 0 276181 (bundle, release under 275505) → 2 Java fixes applied compile-green → template edits BLOCKED by miya's open Word → feature ask → forge-birthed template-cc-preflight + feature-creation (evals 5/5+5/5) → 275501 Phase 1+2 close+archive → DE. Worktree claude/todays-tickets-planning-938f04.**

### QA-275505 (+QA-276181 bundled — BA Nurhafizah: "prolly can fix in 1 ticket"; release under 275505)
- Same doc: `TemplateKertasPertimbanganPentadbirTanah_PPTPB.docx` (PKPPT). Test: PTMLK/02/L/PPTPB/2026/2 (3399008) @ norlina@melaka.gov.my, stg2 (local etanahDS→et_main_stg2), app LIVE at PKPPT.
- **Applied (uncommitted, mlk/master, compile BUILD SUCCESS via jdk17 toolchains)**: `PelupusanWordCCMethodConstant.java:3174` populateKeadaanTanah (empty-key bug → delegates populateTanahTek + "tanah " prefix) · `:15210` populateLuasSyor `.toUpperCase()` → captializeOnlyAllFirstLetter ("Meter Persegi").
- **⚠️ 3 template edits QUEUED — file locked by miya's open Word (PID 26144)**: move 4 status<Arah> CCs to Jenis Tanah cell (mirror sibling) · styles docDefaults Times→Arial 11 (mixed-font root: populated runs carry no rPr) · remove dead `<ID PERMOHONAN>`. Script dry-run-verified: re-run scratchpad `fix_template.py` after Word closes.
- CC-PREFLIGHT (new discipline): 49 tags · 0 unmapped · fix-relevant data VERIFIED present (tkl_a_laporan_tnh 47 flags · 4× "Tanah Rizab" taraf_tnh 4259); YB/jabatan ulasan empty = screen-fillable, no patch needed.
- NEXT: miya closes Word → I apply template → rebuild → Jana Semula check (2.2.3 sentence · Tanah Rizab column · Meter Persegi · Arial 11 · no placeholder) → commit `mlk/esokongan/275505` (Ref both tickets).

### Features born (forge, per miya "create this feature")
- `domain/template-cc-preflight/` — preflight.js CLI (tag→populator map, dependency-free zip read) + Stop advisory hook + quest-skill Pre-emit row. Eval 5/5. First run caught its own parser gap (literal-key puts :935-945).
- `domain/feature-creation/` — "create/update/refine feature" keyword → injects the 9-step birth pipeline. Eval 5/5.

### QA-275501 (Phase 1+2 CLOSED+ARCHIVED per miya — patch passed back to client on Redmine)
- = ad-hoc A12/ADHOC-PRBB-2026-1 ticket form (same NPE MlkBorang4CeForm:367, ID Rujukan 254883). Data-patch route, no git. Register A12 → TICKETED->CLOSED. Bestiary entry: manual-pemohon missing-address NPE family. **Code null-guard leg stays OPEN with ADHOC-PRBB-2026-1.**

### System health
- awam-no-resit-gate errored 2× ("No stderr output") — recurring hook-runtime error class.
- compile-gate EXISTS on main (merged in at DE 0b) — the earlier "missing" read was pre-merge; memory reference_compile_gate_local_build is VALID again.

## 2026-08-19 — ADHOC-OPRBB-2026-1 OPRBB Kuantiti Diluluskan tak papar (Carian Pintas + AWAM) → diagnosed + patch handed + archived (under another ticket)

**Session shape: adhoc from screenshots (OPRBB permit qty display) → DB spine (mlit) → root cause pinned inline (Agent tool blocked by erroring hook) → data patch handed → miya: under another ticket → Phase 2 archive + DE. Worktree claude/oprbb-quantity-display-issue-95483d.**

### The issue
- OPRBB permit C02/2026/5 (PTMLK/02/L/OPRBB/2026/5, aplikasi 3408554, mlit, "Ganti Hari"): "Kuantiti Diluluskan" = 0.00 in Carian Pintas grid + blank in AWAM "Maklumat Permohonan" popup; shows 55000 Ketul correctly in permit "Maklumat Jadual" + Borang 4Ce.

### Root cause (VERIFIED code + DB)
- OPRBB save writes approved qty to `kuantiti_pengeluaran` only, never `kuantiti_dilulus`: `etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\service\impl\PelupusanLiteService.java:1080` (URS_OPRBB branch, `setKuantitiPengeluaran(kuantitiAmbil)`, no `setKuantitiDilulus`).
- Broken surfaces read `kuantiti_dilulus` (AWAM `PenguatkuasaanService.java:1747`; staff `PelupusanMaklumatPermitLesenHelper.java:1110`). Working analog PRBB fills `kuantiti_dilulus` (`PelupusanService.java:2810`).
- DB: all 5 OPRBB permits have `kuantiti_dilulus` null, `kuantiti_pengeluaran` filled. Systematic, not one-off.

### Delivered
- Data patch `projects/coding-projects/archive/ADHOC-OPRBB-2026-1/patch-oprbb-kuantiti-dilulus.sql` (aplikasi 3408554; self-column copy pengeluaran->dilulus + unit; idempotent `IS NULL` guard; before/after SELECT).
- Code fix (add `setKuantitiDilulus` in OPRBB branch) + backfill of remaining 4 rows deferred to owning ticket.

### ▶▶ NEXT (ADHOC-OPRBB-2026-1)
- Under another Redmine ticket (number TBD by miya). When numbered: link + do the code fix at PelupusanLiteService.java:1080 + backfill 4 remaining OPRBB rows. Archived 2026-08-19.

---

## 2026-08-18 — QA-275475 PLPS "Tiada Rekod Bayaran/Resit" (flowable StaleObjectStateException) → fixed + int-env + Phase 1 closed

**Session shape: /quest resume 275475 (fresh retrieve — not drafted, absent from active.txt) → Scout+Recon+Rubric → fix applied + build-verified → commit + int-env deploy → miya ran fresh PLPS submit (works) → 100% data-loss verification → Phase 1 close → DE. Worktree claude/quest-275475-resume-5aa23e.**

### The issue (issue #2 ONLY — Anis routed to miya)
- ESOKONGAN #275475: PLPS `PTMLK/02/L/PLPS/2026/17` "Tidak Papar No Resit" in Carian Dokumen. Dev Hasil (Nor Sakinah) traced: data saved until BayaranFi only, flowable submit failed with `StaleObjectStateException` on `Aplikasi#3433478`. **Issue #1 (batal /17) = Hasil team, NOT ours.**

### Root cause (VERIFIED code)
- Flowable serviceTask `mlkPelupusanPermohonanService` (`MLK_PLP_PLPS.bpmn20.xml:102`, targets etanah-pelupusan) → `MlkPelupusanPermohonanServiceTask.process():28` → `PelupusanService.populatePejabatPermohonanAplikasi():8651` did `crudService.save(aplikasi)` at `:8672` — an UNNECESSARY write of the derived key `pjbtPermohonan` into `mklmt_tmbhn`. A concurrent tx bumped the Aplikasi version → `StaleObjectStateException` → flowable submit rollback → no receipt row → "Tiada Rekod Bayaran". **NOT AWAM code** (miya asked — the AWAM handoff is the separate `:6` `mlkSpocIntegrationService` serviceTask).

### Fix (commit `9b2d222` → int-env `ddca103`)
- Removed dead-write block `etanah-pelupusan\...\PelupusanService.java:8663-8672` (−11 lines). Method now computes+returns pejabat only. `mvn compile` = BUILD SUCCESS (pom needs a **JDK17** toolchain, not JDK8 — the `E:\Java\java8` error was a stale global toolchains ref). Branch `mlk/esokongan/275475` → merged `mlk/int-env` `ddca103` (delta = only PelupusanService.java).

### Verification (miya /goal, 100%)
- miya ran fresh PLPS `PTMLK/01/L/PLPS/2026/40` (3408548), receipt `260818BSAT00020` — **No. Resit shows**. Data-loss: `2026/40` `mklmt_tmbhn={"adalahe2e":true}` vs siblings `{"adalahe2e":true,"pjbtPermohonan":"PDT"}` — differs by EXACTLY the one derived key. `pjbtPermohonan` = **0 readers** across 4 repos (grep: 2 constant defs only, both write-only; the write is a recomputable cache of office PTG/PDT). **No PLPS data lost.**

### ▶▶ NEXT (275475)
- Phase 2 (later): Redmine #275475 → Resolved + planned-release list (int-env only, NOT master); archive folder+block. Redmine still In Progress (our code side done; BA verification pending). Root-cause comment for user (miya-approved shape): "two system processes update the same record at the same instant → DB lock clash (race condition) → submission fails; fix removes the redundant update."
