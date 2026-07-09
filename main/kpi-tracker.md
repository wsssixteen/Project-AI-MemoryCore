# 📊 KPI Tracker — Highlights Log

> Simplified 2026-06-08 per みや. Two parts:
> 1. **Counts (derived, not logged)** — from `quest/active-archive.txt`: tickets closed = count(status ∈ closed/archived), EXCLUDING `delegated` + `archived-shipped-by-other`; rework = of those, `rework=cycle≥2`, split by `rework_cause=our_miss|scope_change`.
> 2. **Highlights (this file)** — ONLY framework / cross-ticket-impact fixes that changed a lot (e.g. the docx4j Content-Control-inside-Text-Box fix). Routine ticket-scope work is NOT logged here — it's just a count.

## Format per highlight
`### <date> — QA-<num> — <one line: the standout that changed a lot beyond this ticket>`

## Highlights

### 2026-07-09 — QA-269437 — OPRBB Borang 4Ce — Papar tarikh salah + cross-urusan orphan-dokumen fix
- **Time**: accept 2026-07-08 → close 2026-07-09 12:43 (~2 sessions, overnight)
- **Extras beyond ticket scope**: **cross-urusan orphan-dokumen fix** at `PelupusanReportUtil.processReport():288-291` — nullify `appDokumenKeluaran` when `getDocument()==null` so `updateCurrentActionIfNotAvailable` reclassifies to CREATE → regen fires with populators. Fixes the "status=PERAKU + dok_id=NULL" orphan blocking Papar regen for ALL 20 urusans-with-CREATE (per 25-entry `report.config.json` audit); SIGN-only urusans (5 entries) unchanged. Bidirectional tempoh↔tarikh_akhir auto-recompute listener added as bundled bonus after みや caught the deferral slip
- **Business logic learned**: OPRBB Borang 4Ce dual-branch on `jenisBahanBatuan.kod` — JB_TNH = editable inputDateTime, non-JB_TNH = readonly compute; `PLP_PRBB_TEMPOH_HARI`/`_BULAN` kods shared between PRBB + OPRBB; `PelupusanReportUtil` fork (`processReport():292-311`) served stale Jasper cache for orphans; pg-node returns `null` for Oracle-style timestamp strings unless cast to `::text`
- **Skills / patterns built**: `feedback_bundling_before_defer.md` — Rubric row (g) BA-ask deferrals must emit BUNDLING QUESTION for みや upfront; boot-loaded via MEMORY.md
- **Audit-log / slip entries**: v1 orphan-fix regressed (currentAction=PERAKU into regen → empty params → blank borang) because I stopped tracing at the fork instead of following into `processInputParameter():412`; second slip = unilateral deferral of auto-recompute-tempoh forced testing in two rounds instead of one

### 2026-05-31 — QA-259702 — PRU Ringkasan Risalat + Risalat MMKN template corrections
- **Time**: accept 2026-05-30 → close 2026-05-31 (multi-session)
- **Extras beyond ticket scope**: traced all 12 CC-tag populators to source (proved data-driven, zero code bugs) — reusable map saved in QA-259702.md; noRujukanSuratJT + tanahTek diagnosed (fixed by みや in Word UI)
- **Business logic learned**: PRU Ringkasan/MMKN populator sources (kedudukan_tanah JSON vs mklmt_tmbhn flags vs YB-flagged JT-row vs plp_a_pelupusan KeputusanSyorPDT); keputusan_id resolves via rjk_senarai_ahli_kumpulan; raw-placeholder vs hyphen distinguishes "control skipped" from "data empty"
- **Skills / patterns built**: CLAUDE.md:149 "check convention inside the file / extend existing method" hard rule; parked phase-emit-gate restoration (Scout→Recon→Rubric forced gates)
- **Audit-log / slip entries**: 5 process slips this cycle (freelanced-past-Recon, stalling-on-proceed, over-claimed-ready ×2, wrong-table scripts, wrong SHA) — drove the CLAUDE.md rule

### 2026-05-31 — QA-253053 — PLTP Risalat MMKN — Jabatan Teknikal not shown on paper
- **Time**: accept → close same session (2026-05-31 PM)
- **Extras beyond ticket scope**: caught stale brief test-IDs (/2026/1, /9 don't exist in live FAT) + resolved the real app /2026/12 (4 JT rows); surfaced that the existing `deleteExistingRisalatDocuments` helper is dead in Melaka (Jana unused) — reusable insight; flagged Perakuan status-guard follow-up
- **Business logic learned**: risalat doc lifecycle — generated-once-stored, regenerated only via onJana (unused in Melaka) or now Simpan; `TGS_TO_JNS_DOK_MAP` = tugasan→doc-kod; `isFirstEntry` gate at `refreshDokumenList` skips populators on entry → stale stored doc served
- **Skills / patterns built**: CLAUDE.md v1.40 (Phase 2 Archive Hygiene) + v1.41 (table-first hard pre-send gate)
- **Audit-log / slip entries**: traced-display-path-not-save-path-first (working-analog miss); cluttered prose-wall hand-back (table-default violation) — both → CLAUDE.md gates + slip-log
