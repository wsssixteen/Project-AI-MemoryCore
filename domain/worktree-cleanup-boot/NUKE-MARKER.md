# NUKE-MARKER — worktree-cleanup-boot

| Field | Value |
|---|---|
| Created  | 2026-10-04 (INSTALLED from `.claude/hooks/worktree-cleanup-boot.js`, not newly built) |
| Session  | Session worktrees and their branches piled up (213 folders, 15 GB on 2026-09), stranded quest work sat unmerged for days (QA-267382), and a worktree session had no project knowledge until it was copied in. |
| Files    | domain/worktree-cleanup-boot/worktree-cleanup-boot.hook.js · domain/worktree-cleanup-boot/worktree-cleanup-boot.eval.js · README.md · 1 settings.json entry |
| Rollback | move `domain/worktree-cleanup-boot/worktree-cleanup-boot.hook.js` back to `.claude/hooks/worktree-cleanup-boot.js` · re-point the settings.json command(s) at the old path · `rm -rf domain/worktree-cleanup-boot` · or `git revert <install-SHA>` |
| Retire   | 2026-11-03 — remove this file if the Feature fired >=1x since install AND no rollback |
