# Retrieval Tracker

> Per-run log of `Read Redmine` / "Retrieve quests from the Redmine" runs.
> Counts toward the "**3 consecutive ✅ perfect runs**" gate for scheduling the daily routine via `schedule` skill / `mcp__scheduled-tasks`.

## What "perfect" means

A run is ✅ perfect when ALL of these hold:

- Every NEW ticket got a Task folder under `1. Tasks\Melaka\` (via `redmine-sync.js --create`).
- Every NEW ticket got a `projects/coding-projects/active/QA-NNNN/QA-NNNN.md` with Issue Checklist enumerated from PRIMARY sources (BA Description + History + attachments — NOT copied from Scout).
- Cross-ref agent fired ONLY when Description had a BA-mentioned reference (one-hop, scope-filtered, sidebars ignored).
- Sidebar auto-relations (`Parent Ticket`, `Subtasks`, `Related Issues`, `Copied to/from`) — all ignored.
- Scout familiars spawned for each new ticket (background, non-blocking) and returned a complete Phase 0 — Scout section.
- `active.txt` updated with new entries (`phase=0`, `status=hold`, scope_anchor).
- Zero unexpected errors; zero manual corrections required from みや.

## Runs

| # | Date | Run by | Tickets retrieved | Scouts spawned | Cross-refs chased | Checklists created | Anomalies | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-05-20 09:46 | Ruri (manual test of the refined system) | 2 NEW (QA-262233 PRZ, QA-261613 PSBS) + 4 journal-updated existing (262004 / 261986 / 260876→Rework / 259339) | 2/2 returned clean ✅ — QA-261613: single-flag omission at `MlkMuatNaikCabutanMinitForm.java:806-814`, ~20 min · QA-262233: 4-8h (Issue #2 gap ≈ 1-2h with 18-populator blast-radius warning; Issue #1 Kemaskini load ≈ 3-6h, composite in jar dependency needs deeper trace at Recon) | 0 — neither Description contained BA-mentioned cross-refs (sidebars `relates: 224344` and `relates: 223325` correctly ignored) | 2 from primary sources (Description + History + PNG attachments enumerated into `QA-262233.md` + `QA-261613.md`) | none observed at retrieval; Scouts both PROCEED-TO-RUBRIC verdicts | ✅ **PERFECT (Run 1/3)** — every step fired clean; refined structure (one `QA-NNNN.md` per quest, Phase 0 — Scout section written directly into it) held end-to-end |
| 2 | 2026-05-20 10:22 | Ruri (last test before DE — rework path) | 0 NEW; **1 rework status transition caught: QA-260876 PLTP** (reopened by Nurhafizah at MLKUAT 2026-05-20 01:36, reassigned with 2 new attachments) | n/a (rework — Phase 0 cycle-2 deferred to next session) | n/a — Description hasn't changed since cycle 1 | 1 — created `QA-260876.md` retroactively with Rework Cycle 2 section + Phase 0 cycle-2 checklist | ⚠️ **`redmine-sync.js` did NOT re-download the 2 new BA attachments** (`ulasan.png` + `2026-05-20_093455.png`); the `3. Rework/` subfolder was created but is EMPTY. Without these, Phase 0 cycle-2 cannot see what the BA flagged | ⚠️ **NOT PERFECT (Run 2/3) — anomaly**: sync's attachment-download path doesn't cover rework-cycle attachments. Improvement candidate for `redmine-sync.js`. みや to decide: reset counter, or treat as separate sub-flow (rework vs new-ticket) |

---

## Bonus live tests

| When | What | Result |
|---|---|---|
| 2026-05-20 ~11:00 | **Cross-ref agent — first live test** on previously-retrieved QA-262004 (BA Description named `Requirement #237880`) | ✅ clean end-to-end. Navigated `http://172.16.90.169/redmine/issues/237880` via browser MCP. ONE hop held. Sidebars ("Related Issues" 7 entries, "Copied to" 1 entry) correctly ignored. Scope-filtered to QA-262004 relevance. NO raw `.docx`/PDF downloads (per みや's rule). Appended `## Related Ticket — Requirement #237880 (BA-referenced)` section to `QA-262004.md`. Validated full retrieval system including cross-ref chase. |

---

*Created 2026-05-20. Goal: 3 consecutive ✅ → daily routine via `schedule` skill. Update each run's verdict row when Scouts complete.*
