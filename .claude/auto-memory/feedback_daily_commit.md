---
name: Auto-commit daily, push manually
description: Commit memory files to git daily at save all; never auto-push — みや pushes manually
type: feedback
originSessionId: b5e3014e-db08-4002-8c94-e8072c165ae9
---
At every `save all`, automatically commit changed files to git. Do NOT push — みや will push manually when ready.

**Why:** Daily commits keep the memory repo history clean and trackable without risking unwanted pushes.

**How to apply:** After completing all save-all file writes, run `git add` + `git commit` for changed MemoryCore files. Never `git push` unless みや explicitly asks.
