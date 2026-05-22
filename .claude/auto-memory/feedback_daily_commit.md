---
name: Auto-commit at save; push is context-dependent
description: Commit changed files to git at save all / Domain Expansion; push behaviour is context-dependent — see body
type: feedback
originSessionId: b5e3014e-db08-4002-8c94-e8072c165ae9
---
At every `save all` / Domain Expansion, automatically commit changed files to git. Push behavior depends on context (see below).

**Why:** Daily commits keep the memory repo history clean and trackable.

**How to apply:**
- **Ticket commits** (etanah-pelupusan, etanah-awam): after みや confirms the proposed commit message and asks Ruri to commit, Ruri runs `git commit` then auto-runs `git push` (updated 2026-05-22 — per CLAUDE.md Phase 1 Closure / `quest-protocol.md` Commit + Push hard rule, 2026-05-19; supersedes the prior "never auto-push" for ticket commits). Hold the push only if みや says "commit only" / "don't push".
- **MemoryCore commits at Domain Expansion** (refined 2026-05-13 by みや): auto-push BOTH `git push origin HEAD` (worktree branch) AND `git push origin HEAD:main` (FF main) silently. Permission rule `Bash(git push origin HEAD:main:*)` in `.claude/settings.local.json` allows harness-silent execution. The DE auto-push prevents cross-worktree drift (next session's worktree branches from a fresh `origin/main`).
- **Save / mid-session commits** (non-DE): auto-commit OK; push only if みや explicitly asks.
