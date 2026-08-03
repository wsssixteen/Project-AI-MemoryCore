# 🪦 DETACHED 2026-05-31 — Canonical home is system/slip-log.md (per Q2 prune-not-delete audit). Historical entries below kept for archival; new entries route to system/slip-log.md via auto-skill-on-mistake Step 5. Re-attach: remove this header + restore the source file's boot/INDEX wiring.

# Debug Ritual Violations Log

> **🪦 TOMBSTONE (2026-05-24, Task #20):** This file is no longer the canonical home for NEW debug-ritual violations. The new home is **`system/slip-log.md`** under the system-layer's INDEX (root_category: pre-action-check-skip or stop-instead-of-action depending on violation type). Historical entries below remain for reference. For NEW debug-ritual violations → append to `system/slip-log.md` with appropriate root_category.
>
> ---
>
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