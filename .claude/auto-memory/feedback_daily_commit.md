---
name: Auto-commit daily, push manually
description: Commit memory files to git daily at save all; never auto-push — みや pushes manually
type: feedback
originSessionId: b5e3014e-db08-4002-8c94-e8072c165ae9
---
At every `save all` / Domain Expansion, automatically commit changed files to git. Push behavior depends on context (see below).

**Why:** Daily commits keep the memory repo history clean and trackable.

**How to apply:**
- **Ticket commits** (etanah-pelupusan, etanah-awam): never auto-push. みや pushes manually when ready (visibility-to-remote stays gated).
- **MemoryCore commits at Domain Expansion** (refined 2026-05-13 by みや): auto-push BOTH `git push origin HEAD` (worktree branch) AND `git push origin HEAD:main` (FF main) silently. Permission rule `Bash(git push origin HEAD:main:*)` in `.claude/settings.local.json` allows harness-silent execution. The DE auto-push prevents cross-worktree drift (next session's worktree branches from a fresh `origin/main`).
- **Save / mid-session commits** (non-DE): auto-commit OK; push only if みや explicitly asks.
