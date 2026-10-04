# worktree-cleanup-boot

symptom: Session worktrees and their branches piled up (213 folders, 15 GB on 2026-09), stranded quest work sat unmerged for days (QA-267382), and a worktree session had no project knowledge until it was copied in.
goal: merged session worktrees do not pile up, a worktree session gets the project knowledge it needs, and unmerged or uncommitted work is named instead of lost
goal_signal: each run writes one sweep row and the 'worktrees: N registered, M orphan folder(s)' line
retention: keep
footprint: per-session: a launcher (1 node, measured 0.34–0.40 s on 2026-10-05) that starts ONE detached node with git and robocopy, which runs to its end in the background; one run per checkout at a time. Before: ~30 s at every boot, killed by the 30 s hook limit on 168 of 190 runs.
registration: 1 settings.json entry
telemetry_name: worktree-cleanup-boot

**Installed** 2026-10-04 via `core/forge.js install hook` — moved unchanged from `.claude/hooks/worktree-cleanup-boot.js`. The telemetry name `worktree-cleanup-boot` is kept, so its fire history before and after the install is one series.

**v2.0 (2026-10-05, boot audit) — background run.** The hook entry is a LAUNCHER: it prints the report of the last finished run (with its age), starts the real work as a detached process (`--run`) and returns. The work itself is the unchanged v1.9 body. What changed for the reader: the boot line now shows the PREVIOUS run's report; the first boot of a brand-new checkout shows none. `WORKTREE_CLEANUP_FOREGROUND=1` restores wait-for-it (the eval uses it). State files (all under MAIN `.claude/state/`): `worktree-cleanup-last.json` (last report) · `worktree-cleanup-<hash>.lock` (per checkout, stale after 15 min) · `worktree-cleanup-log.jsonl` (the sweep log, unchanged — `lib/observatory.js` reads its last row).

**Observability**: central telemetry rows `"hook":"worktree-cleanup-boot"` now time only the launcher (expect < 1 s; a 30 s row means the launcher regressed). The real work is timed in this Feature's `log.jsonl`: one `{run:'finished', dur_ms, checkout, lines}` row per background run — a run that never finishes leaves no row and a lock older than 15 min.

**Boot prints HEADLINES only** (the ⚠️ lines and the `worktrees:` count line) plus a pointer to `worktree-cleanup-last.json`. Measured 2026-10-05: a run that finishes takes 221 s and prints 79 lines (~13,000 chars) — every stranded branch and every kept folder. That detail stays in the file; `/worktree-retrieve` is the way to act on it.

**Eval**: `worktree-cleanup-boot.eval.js` — 63 checks: the 56 pre-install ones (run in foreground mode) + B1-B6 for the launcher (returns at once · shows the last run's headlines, detail stays in the file · background run finishes and releases its lock · fresh lock blocks a second run · stale lock does not).

**state-scoped**: no, state-agnostic.
