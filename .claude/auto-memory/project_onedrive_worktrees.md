---
name: project-onedrive-worktrees
description: 🚨 Git worktrees must NOT live inside the OneDrive-synced MemoryCore repo — 213 de-registered folders / 15.10 GB piled up (2026-09-04); worktree-cleanup-boot v1.6 sweeps the DIRECTORY at boot; salvage/ad-hoc worktrees go to a SHORT non-OneDrive path (%TEMP%\claude\<name>)
metadata: 
  node_type: memory
  type: project
  originSessionId: 6e2f7830-916e-4545-ae29-7e0c7f2bb184
  modified: 2026-09-04T09:20:43.748Z
---

**What happened (2026-09-04)**: `.claude/worktrees/` inside the OneDrive repo held 213 folders / 15.10 GB while `git worktree list` showed 2. OneDrive syncs `.git/` across two laptops; the other machine's `worktree prune` drops admin entries for folders it cannot see, so folders survive here de-registered — invisible to every cleanup that keys off git's list. The boot hook then deleted their branches as "merged" (D2), leaving folders with no branch and, in 5 cases, whole never-committed Features (etanah-intake-gate, rootcause-format, patch-close-shape, agih, staging-schema-tracker).

**Standing rules**:
- `worktree-cleanup-boot.js` v1.6 reads the directory every boot, deletes only folders whose every non-ignored file is **reachable from a ref** or byte-identical to main's working copy, keeps + lists the rest, logs to `.claude/state/worktree-cleanup-log.jsonl`. A boot line `worktrees: … kept N` means never-committed work exists — salvage it, never `rm`.
- A worktree for salvage/rebase work goes to a SHORT path OUTSIDE OneDrive, e.g. `C:\Users\Ridhwan\AppData\Local\Temp\claude\mc-<name>` — the session scratchpad path is ~200 chars and blew MAX_PATH on `git worktree add` (967 files).
- Start sessions with the worktree box UNTICKED until worktree creation is pointed outside OneDrive.
- Blob-in-object-DB ≠ committed: a blob staged in ANY worktree's index (shared `.git`) passes `cat-file -e` yet is reachable from no commit — never use bare blob existence as a "safe to delete" test.

Pairs with [[project-onedrive-branch-refs]] (same OneDrive `.git` sync mechanism, ref side).
