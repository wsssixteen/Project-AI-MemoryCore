---
name: hooks-run-from-main
description: In a worktree session the registered hooks may execute from the MAIN checkout, not the worktree; probe which copy is live before calling a hook edit live
metadata:
  type: reference
---

Which copy of `.claude/hooks/*` runs is NOT fixed. It follows `CLAUDE_PROJECT_DIR`, and that differed between sessions.

- 2026-10-03 (worktree `quest-audit-275043-244600-7954c0`): hooks ran from MAIN. A probe write in the worktree copy of `grep-rubric-gate.js` never fired; the fix went live only after main was fast-forwarded to `8122785d`.
- 2026-08-06 (slip `edited-wrong-copy-main-vs-worktree`): the opposite. The worktree copy was live and a fix made in main did nothing.

**Probe (no edit needed):** compare the last write time of `system/telemetry/hook-fires.jsonl` in main and in the worktree. The copy whose file moves on every tool call is the live one.

**How to apply:** test a hook change by running the file directly with a fixture (`... | node .claude/hooks/<hook>.js`). Then run the probe. If main is live, commit, `git push origin HEAD:main`, `git -C <main> merge --ff-only origin/main`, and re-check the behaviour live. Never call a hook fix "live" from the edit alone.

`quest/active.txt` is untracked and exists only in main. `quest/active-cli.js`, `quest/archive-quest.js` and `lib/states.js` strip the worktree suffix to reach it. A hook run by hand from the worktree needs its env override (e.g. `TICKET_GATE_ACTIVE_TXT`).

Related: [[project-onedrive-worktrees]] · [[worktree-cleanup-after-merge]]
