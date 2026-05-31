# 📊 KPI Tracker — Value-Added Log

> Per Phase 2 closure protocol. Captures per-ticket: time, side-issues solved, business logic learned, skills/patterns built, audit-log entries spawned.
>
> みや uses this for upward KPI reporting. Reviewed weekly.

## Format per entry

```
### <date> — QA-<num> — <one-line title>
- **Time**: <accept → close duration>
- **Extras beyond ticket scope**: <side-issues solved / refactors / etc.>
- **Business logic learned**: <domain knowledge gained>
- **Skills / patterns built**: <new skill, hook, protocol refinement>
- **Audit-log / slip entries**: <forge or slip-log refs>
```

## Entries

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
