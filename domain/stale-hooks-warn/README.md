# stale-hooks-warn

symptom: 2026-10-30 miya (287186): "I already asked you to fix this behaviour yesterday"; the fix (redmine-write-gate v1.8, lib/his-words.js) had been on main since 2026-10-29, but this session folder was 26 commits behind and ran the old v1.7 gate
goal: a session never runs a gate older than main's; a fix landed on main reaches every open session at its next prompt
goal_signal: after the advisory the same turn shows a merge of origin/main, and redmine-write-gate shows no repeat-block from a gate version older than main
retention: rotate monthly
footprint: per-prompt: 1 git process ~40 ms inside the upsm-mode bundle, skipped for 30 min after it fires, ~0 MB resident
self_audit: each run reads the real ref count (git rev-list HEAD..origin/main on gate paths) and fires only on a count above 0; every run is a row in system/telemetry/hook-fires.jsonl
diagram: domain/stale-hooks-warn/diagram.png
state-scoped: no, state-agnostic

**What fires when**: UserPromptSubmit, inside the `upsm-mode` bundle, only in a session folder (`.claude/worktrees/<x>`). It counts commits on `origin/main` that this folder's HEAD lacks, limited to `.claude/hooks`, `.claude/settings.json`, `.claude/skills`, `domain`, `lib`, `core`. No fetch: every session shares one `.git`, so `origin/main` moves whenever any session fetches or pushes.

**Contract**: ADVISORY. Names the count and says: sync now (`mcp__ccd_host__sync_with_base_branch`, else `git merge --no-edit origin/main`) before any gated write. Quiet for 30 min after it fires (stamp file in the temp folder, one per session folder).

**Layer choice (system-design Rule 7)**: hook-only, advisory. A block would stop his unrelated work; the sync is one call.

**Trigger moment (Rule 8)**: the prompt, so the sync lands before the next gated write of that turn. SessionStart alone missed today's case: the session started before the fix landed.

**Eval**: `node domain/stale-hooks-warn/stale-hooks-warn.eval.js` → 8/8 (a real bare origin + a session clone under `.claude/worktrees/`).

## Adversarial scenarios (Rule 12 — 20)

| # | Scenario | Verdict |
|---|---|---|
| 1 | session folder level with main | fixture-added (S1) |
| 2 | behind main on lib/ (today) | fixture-added (F2) |
| 3 | second prompt within 30 min | fixture-added (S2) |
| 4 | behind main on a doc only | fixture-added (S3) |
| 5 | the main folder itself | fixture-added (S4) |
| 6 | worktree path that is not a git repo | fixture-added (S5) |
| 7 | registered in the bundle | fixture-added (S6) |
| 8 | malformed stdin | fixture-added (F1) |
| 9 | origin/main ref missing (never fetched) | handled: git errors → silent |
| 10 | git not on PATH | handled: execFileSync throws → silent |
| 11 | git slow (network drive, OneDrive) | handled: 5 s timeout → silent |
| 12 | temp folder not writable | handled: advisory still shown, stamp skipped |
| 13 | two sessions in one folder | handled: one stamp per folder name |
| 14 | session AHEAD of main only | handled: HEAD..origin/main counts only main's side |
| 15 | main changed a skill (not a hook) | handled: .claude/skills is in the path list |
| 16 | main changed a bundle manifest | handled: under domain/ |
| 17 | the worktree is mid-merge | accepted-risk: the count still reads; the advisory says sync, the merge in progress decides |
| 18 | origin/main rewound (force push) | accepted-risk: count 0 → silent; force push on main is banned in this repo |
| 19 | his own uncommitted edits in the folder | handled: advisory only; the sync tool refuses over uncommitted changes and says so |
| 20 | a cloud session (no shared .git) | accepted-risk: its origin/main is as fresh as its last fetch; the advisory is best-effort there |
