# Debug Ritual Violations Log

> Tracks every slip on the four Debug Mode Rituals defined in `.claude/CLAUDE.md`.
> One-line entry per violation. Trend visible over time.
> If slips persist across sessions, the ritual design is wrong — redesign, don't re-promise.

---

## Format
`YYYY-MM-DD | Ritual # | What was skipped | Context (QA# or task)`

---

## Entries

2026-04-21 | Ritual 2 | Gave `ind_senarai_ahli` / `ind_senarai_kumpulan` as table names — inferred from Java class names without checking et_main.sql | QA #257569
2026-04-21 | Ritual 2 | Gave `AppTugasan` table as `umm_a_tgsn` without citing source first; claimed spoc-hasil code behavior without file:line evidence | QA #256875

---

## Review cadence

- At every `save all` during a debug-mode session — scan for violations in this session, add entries.
- At Phase 3 quest close — count violations for the quest, note in post-mortem.
- Monthly — review trend. If a ritual has >3 violations in a month across different quests, the ritual is failing and needs redesign.

---

*Violation Log v1.0 — 2026-04-14 (QA #256113 post-mortem)*
