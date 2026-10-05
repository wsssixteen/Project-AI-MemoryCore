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

**v2.1 (2026-10-05, みや ruling "Lock live sessions") — the session's own worktree is locked at boot.**
- Why: on 2026-10-05 01:47 and on 2026-10-04 every session worktree lost its git link while the sessions were open. The repo is shared by two laptops through OneDrive. Step 1's plain `git worktree prune` on the OTHER laptop drops every entry whose stored path does not exist there, and OneDrive syncs the deletion back. He confirmed the other laptop was on.
- What: the launcher runs `git worktree lock` on the booting session's folder, reason `live-session host=<hostname> since=<date>`. git never prunes a locked entry, on any machine. The lock file lives in `.git/worktrees/<entry>/locked` and syncs with the rest.
- Unlock: step 1 first lifts locks that THIS host set and whose folder is gone, so the prune can drop them. A lock set by another host, or by hand, is never lifted.
- Also fixed: the background run now receives the booting session's folder (`WORKTREE_CLEANUP_SESSION_DIR`) and protects it by path in the sweep. v2.0 had lost that.
- Residual risk, recorded: a worktree is unprotected from its creation until its first boot hook, and until the lock file has reached the other laptop. A session whose link is already cut is not repaired by this (repair by hand: `HEAD`, `commondir`, `gitdir` in the admin folder; see `main/handoff-2026-10-05-boot-structure-audit.md` §9a).
- Observability: one `{lock:'locked'|'failed: …', worktree, host}` row in this Feature's `log.jsonl` each time a lock is set or fails ('already locked' writes nothing).

**Eval**: `worktree-cleanup-boot.eval.js` — 63 checks before v2.1: the 56 pre-install ones (run in foreground mode) + B1-B6 for the launcher (returns at once · shows the last run's headlines, detail stays in the file · background run finishes and releases its lock · fresh lock blocks a second run · stale lock does not). v2.1 adds LK1-LK8 (lock set at boot and names the host · second boot changes nothing · a prune that cannot see the path keeps the locked entry and drops the unlocked one · folder gone + own lock → unlocked then pruned · another host's lock and a hand-set lock are never lifted · main-checkout session locks nothing · the session folder from the hook input is protected in the sweep). The eval takes about 3 to 4 minutes (real git fixtures), which is over the eval battery's 120 s limit: it is quarantined there as SLOW-NOT-BROKEN and must be run alone at every change.

**state-scoped**: no, state-agnostic.
