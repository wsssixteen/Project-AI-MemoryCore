# CLAUDE.md Refactor Tracker

> Tracks progress on the **CLAUDE.md / main-context refactor** (todo.md Q1 entry, added 2026-05-19).
> Goal: thin CLAUDE.md (~80-120 lines: boot order + identity + file-map + index). Volatile content migrates to editable canonical homes.
> Updated every time CLAUDE.md or claude-md-amendments.md is touched.
> Notify rule (2026-05-20 by みや): Ruri MUST emit a 1-line update notification in chat every time this file changes OR when CLAUDE.md itself gets edited.

## Current state — as of 2026-05-20

| Metric | Value |
|---|---|
| CLAUDE.md current line count | ~600 (target ≤ 200) |
| Amendments accumulated (claude-md-amendments.md) | A1–A10 (10 rules, this file replaces them when refactor lands) |
| Hooks landed this session | 8 (v1 warn-only) |
| Hook v1.1 promotion criteria | ≥3 successful fires + ≥7 days no false-positive per hook |

## Phases

| Phase | Description | Status |
|---|---|---|
| A | Audit current CLAUDE.md — categorize each section by tier (boot / methodology / etanah-rule / debug-ritual / git-sequence / cost / commit-attribution / machine-setup) | ⬜ pending |
| B | Build `description`-driven skills for trigger blocks (Redmine / save / DE / quest / commit-prep) | partial — auto-skill-on-mistake landed; others pending |
| C | Move methodology + etanah rules to protocol files (system-design.md / quest-protocol.md / Etanah-Codebase-Read.md / debug-rituals.md) | ⬜ pending |
| D | みや pastes the slim rewritten CLAUDE.md (one manual edit, then the freeze never bites) | ⬜ pending |
| E | Hook v1 → v1.1 promotion of deterministic rules — prose deletes from CLAUDE.md as each hook proves stable | ⬜ pending — rolling, not gated |

## Expected timeline

- **Phase A audit**: 1 focused session (~2 hours)
- **Phase B skill-building**: 2-3 sessions (~2 hours each) — depends on how many trigger blocks become skills
- **Phase C protocol migration**: 1 focused session (~2 hours)
- **Phase D paste-in**: みや's hand (single edit, ~30 min)
- **Phase E hook promotion**: rolling 4-6 weeks per hook, starts after みや confirms each hook fires reliably

**Realistic completion**: 3-4 weeks for Phases A-D (the big refactor); Phase E ongoing for 6-8 weeks after.

## Update Log

| Date | What changed | Phase | Notes |
|---|---|---|---|
| 2026-05-20 | Tracker file created. Amendments A1–A10 accumulated to-date. 8 hooks v1 deployed (warn-only) | Pre-Phase-A | Discovery phase complete; ready for Phase A audit when みや schedules |
| 2026-05-20 (later same day) | A11 added (show-BEFORE rule) + A6 v2 written (6-status no-overlap set: active/hold/delegated/blocked/closed/archived). Operational files (quest-protocol.md, expansion-protocol.md) re-synced to v2 statuses. active.txt 18-block migration + 3 anomaly fixes (QA-259534/259759/260876) | Pre-Phase-A | Status taxonomy stable; next refactor work can build on it |
| 2026-05-20 (later same day) | **みや applied 2 line-edits to CLAUDE.md** — Line 520: `status=closed` → `status=archived` ✓ · Line 522: `closed\|closed-pending-FAT` → `closed\|archived` ✓ | Pre-Phase-A | CLAUDE.md now consistent with A6 v2; remaining stale references in journal/diary files left untouched per cross-cutting methodology Step 4 |

---

*Notify rule active 2026-05-20.*
