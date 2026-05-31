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
