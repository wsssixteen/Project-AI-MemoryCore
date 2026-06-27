---
name: project-onedrive-branch-refs
description: Deleted claude/* git branches can reappear in this OneDrive-backed repo — OneDrive re-syncs .git/refs files; a branch delete may not persist. Not a failure; the stranded-worktree surfacer flags it.
metadata: 
  node_type: memory
  type: project
  originSessionId: 13ec2dfe-0eb6-4508-9fab-3334312bcd3b
---

This MemoryCore repo lives under OneDrive, which syncs the `.git/refs/` files. A `git branch -D claude/<x>` can therefore **reappear** in a later command (OneDrive restored the ref file from another machine's view), sometimes at a slightly different SHA.

**Why noted:** 2026-06-27 — during worktree-retrieval I deleted `claude/great-cori-ed3532` twice; it came back (once at `0e3d7ea`, once at `89c1c03`). The deletions were correct; OneDrive re-synced the ref.

**How to apply:** don't treat a reappeared deleted branch as a mistake or a ghost. The `worktree-cleanup-boot.js` v1.4 stranded-worktree surfacer will flag it at boot if it has unmerged commits — verify (via `git cherry`) it's still superseded, then re-delete. If a deletion must stick, deleting on every machine / pausing OneDrive during the prune is the only hard guarantee. Pairs with [[project-onedrive-migration]].
