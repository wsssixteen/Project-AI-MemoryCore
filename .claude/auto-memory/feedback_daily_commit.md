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
- **MemoryCore commits — ANY save / mid-session / wrap (not just DE)**: **commit + push (`HEAD` + `HEAD:main`) + merge is the DEFAULT — do it AUTOMATICALLY, NEVER make みや re-authorize it** (updated 2026-06-20 by みや: *"it gets kinda tiring to repeat this; this should be by default since we can always refer back to our git history"*). Git history IS the undo, so a wrong commit costs ~nothing while asking every time is real friction. If the auto-mode classifier denies a push, surface that ONE line and move on — do NOT reinterpret it as "ask permission next time". Etanah TICKET commits stay gated (the quest pre-commit stop above) — that distinction is unchanged.
- **🚨 A change to the system core = a security update: commit + push + land on main IN THE SAME TURN** (2026-10-28 per みや, Baseline 1.9.0: *"Updating anything related to the core of the system is like a security update that requires an immediate commit and push"*). Core = CLAUDE.md, reply-shape-spec, any skill, hook, `domain/` feature, `lib/` tool or memory file. Land it with `node lib/land-on-main.js <commit>` from the session folder, never at the end of the session. **Why**: that day the release skill was edited three times and the Brief rule dropped while every change sat uncommitted in a worktree; the live skill runs from main, so none of it was in force. No gate enforces this yet.
